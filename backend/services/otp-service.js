/* ============================================================
   DHEERE STUDIO — MSG91 OTP SERVICE
   Server-side verification for MSG91 OTP Widget

   Client-side OTP flow:
   - sendOtp()
   - retryOtp()
   - verifyOtp()

   Server-side trust boundary:
   - verifyAccessToken()

   Required environment variable:
   - MSG91_AUTH_KEY

   Optional:
   - MSG91_WIDGET_VERIFY_URL
     Defaults to MSG91's current widget access-token
     verification endpoint.
   ============================================================ */

"use strict";



/* ============================================================
   1. CONFIGURATION
   ============================================================ */

const MSG91_WIDGET_VERIFY_URL =
    (
        process.env.MSG91_WIDGET_VERIFY_URL ||
        "https://control.msg91.com/api/v5/widget/verifyAccessToken"
    ).trim();



const REQUEST_TIMEOUT_MS =
    10000;



/* ============================================================
   2. ENVIRONMENT VALIDATION
   ============================================================ */

function getAuthKey() {

    const authKey =
        String(
            process.env.MSG91_AUTH_KEY || ""
        ).trim();



    if (!authKey) {

        throw new Error(
            "MSG91_AUTH_KEY is not configured."
        );

    }



    return authKey;

}



/* ============================================================
   3. INPUT VALIDATION
   ============================================================ */

function normalizeAccessToken(
    accessToken
) {

    if (
        typeof accessToken !==
        "string"
    ) {

        return "";

    }



    return accessToken.trim();

}



/* ============================================================
   4. VERIFY MSG91 ACCESS TOKEN
   ------------------------------------------------------------
   MSG91's OTP Widget flow returns a JWT access-token after
   successful OTP verification. The server then validates that
   access-token against MSG91 using the account AuthKey.
   ============================================================ */

async function verifyAccessToken(
    accessToken
) {

    const cleanAccessToken =
        normalizeAccessToken(
            accessToken
        );



    if (!cleanAccessToken) {

        const error =
            new Error(
                "A valid MSG91 access token is required."
            );

        error.code =
            "MSG91_ACCESS_TOKEN_MISSING";

        throw error;

    }



    const authKey =
        getAuthKey();



    let response;



    try {

        const controller =
            new AbortController();



        const timeoutId =
            setTimeout(
                () => controller.abort(),
                REQUEST_TIMEOUT_MS
            );



        try {

            response =
                await fetch(
                    MSG91_WIDGET_VERIFY_URL,
                    {

                        method:
                            "POST",


                        headers: {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"

                        },


                        body:
                            JSON.stringify({

                                authkey:
                                    authKey,

                                "access-token":
                                    cleanAccessToken

                            }),


                        signal:
                            controller.signal

                    }
                );

        } finally {

            clearTimeout(
                timeoutId
            );

        }

    } catch (error) {

        console.error(
            "MSG91 access-token verification request failed:",
            error?.name === "AbortError"
                ? "request timeout"
                : error?.message || error
        );



        const requestError =
            new Error(
                "Unable to verify the OTP session with MSG91 right now."
            );

        requestError.code =
            error?.name === "AbortError"
                ? "MSG91_TIMEOUT"
                : "MSG91_NETWORK_ERROR";

        throw requestError;

    }



    let data =
        null;



    try {

        data =
            await response.json();

    } catch {

        data =
            null;

    }



    if (!response.ok) {

        const error =
            new Error(
                data?.message ||
                data?.error ||
                "MSG91 OTP verification failed."
            );

        error.code =
            "MSG91_VERIFY_FAILED";

        error.status =
            response.status;

        error.data =
            data;

        throw error;

    }



    return {

        success:
            true,

        data:
            data

    };

}



/* ============================================================
   5. VERIFIED IDENTIFIER HELPER
   ------------------------------------------------------------
   Checks common provider response locations without assuming
   one fixed payload shape.
   ============================================================ */

function extractVerifiedIdentifier(
    result
) {

    const data =
        result?.data || {};



    const candidates = [

        data?.identifier,

        data?.mobile,

        data?.phone,

        data?.email,

        data?.data?.identifier,

        data?.data?.mobile,

        data?.data?.phone,

        data?.data?.email

    ];



    const identifier =
        candidates.find(

            (
                value
            ) =>
                typeof value ===
                "string" &&
                value.trim()

        );



    return identifier
        ? identifier.trim()
        : "";

}



/* ============================================================
   6. MODULE EXPORTS
   ============================================================ */

module.exports = {

    verifyAccessToken,

    extractVerifiedIdentifier

};
