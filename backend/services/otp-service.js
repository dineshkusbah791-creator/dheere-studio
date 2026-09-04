/* ============================================================
   DHEERE STUDIO — MSG91 OTP SERVICE
   Server-side OTP Widget API integration

   Required environment variables:
   - MSG91_AUTH_KEY
   - MSG91_WIDGET_ID

   Optional environment variables:
   - MSG91_WIDGET_API_BASE_URL
     Defaults to https://api.msg91.com/api/v5/widget

   Supported flow:
   - sendOtp(identifier) -> reqId
   - retryOtp(reqId, retryChannel) -> response
   - verifyOtp(reqId, otp) -> access-token
   - verifyAccessToken(accessToken) -> verified identifier

   IMPORTANT:
   - MSG91_AUTH_KEY stays server-side only.
   - Do not expose MSG91_AUTH_KEY to frontend code.
   ============================================================ */

"use strict";

/* ============================================================
   1. CONFIGURATION
   ============================================================ */

const MSG91_WIDGET_API_BASE_URL =
    (
        process.env.MSG91_WIDGET_API_BASE_URL ||
        "https://api.msg91.com/api/v5/widget"
    )
        .trim()
        .replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 10000;

/* ============================================================
   2. ENVIRONMENT
   ============================================================ */

function getAuthKey() {
    const authKey =
        String(
            process.env.MSG91_AUTH_KEY || ""
        ).trim();

    if (!authKey) {
        const error =
            new Error(
                "MSG91_AUTH_KEY is not configured."
            );

        error.code =
            "MSG91_AUTH_KEY_MISSING";

        throw error;
    }

    return authKey;
}

function getWidgetId() {
    const widgetId =
        String(
            process.env.MSG91_WIDGET_ID || ""
        ).trim();

    if (!widgetId) {
        const error =
            new Error(
                "MSG91_WIDGET_ID is not configured."
            );

        error.code =
            "MSG91_WIDGET_ID_MISSING";

        throw error;
    }

    return widgetId;
}

/* ============================================================
   3. INPUT HELPERS
   ============================================================ */

function cleanString(value) {
    return typeof value === "string"
        ? value.trim()
        : "";
}

function normalizeIdentifier(value) {
    const identifier =
        cleanString(value);

    if (!identifier) {
        return "";
    }

    /*
     * MSG91 Widget expects a mobile identifier with country
     * code and no "+" sign. Email identifiers are preserved.
     */
    if (/^[0-9]{10}$/.test(identifier)) {
        return `91${identifier}`;
    }

    return identifier.replace(
        /^\+/,
        ""
    );
}

function isValidIdentifier(value) {
    const identifier =
        normalizeIdentifier(value);

    return (
        /^[0-9]{11,15}$/.test(identifier) ||
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
    );
}

function normalizeReqId(value) {
    return cleanString(value);
}

function isValidOtp(value) {
    return /^[0-9]{4,8}$/.test(
        cleanString(value)
    );
}

/* ============================================================
   4. RESPONSE HELPERS
   ============================================================ */

function findNestedValue(
    value,
    keys,
    maxDepth = 6,
    seen = new WeakSet()
) {
    if (
        value === null ||
        value === undefined ||
        maxDepth < 0 ||
        typeof value !== "object"
    ) {
        return "";
    }

    if (seen.has(value)) {
        return "";
    }

    seen.add(value);

    for (const key of keys) {
        const candidate =
            value?.[key];

        if (
            typeof candidate === "string" &&
            candidate.trim()
        ) {
            return candidate.trim();
        }

        if (
            typeof candidate === "number" &&
            Number.isFinite(candidate)
        ) {
            return String(candidate);
        }
    }

    if (maxDepth === 0) {
        return "";
    }

    for (const nested of Object.values(value)) {
        const found =
            findNestedValue(
                nested,
                keys,
                maxDepth - 1,
                seen
            );

        if (found) {
            return found;
        }
    }

    return "";
}

function extractReqId(data) {
    return findNestedValue(
        data,
        [
            "reqId",
            "req_id",
            "requestId",
            "request_id"
        ]
    );
}

function extractAccessToken(data) {
    return findNestedValue(
        data,
        [
            "accessToken",
            "access-token",
            "access_token",
            "token"
        ]
    );
}

function extractVerifiedIdentifier(
    result
) {
    return findNestedValue(
        result,
        [
            "identifier",
            "mobile",
            "phone",
            "email"
        ]
    );
}

function getProviderMessage(
    data,
    fallback
) {
    return (
        data?.message ||
        data?.error ||
        data?.details ||
        data?.reason ||
        data?.msg ||
        fallback
    );
}

/* ============================================================
   5. HTTP REQUEST
   ============================================================ */

async function requestWidgetApi(
    path,
    {
        method = "POST",
        body
    } = {}
) {
    const authKey =
        getAuthKey();

    const controller =
        new AbortController();

    const timeoutId =
        setTimeout(
            () =>
                controller.abort(),
            REQUEST_TIMEOUT_MS
        );

    let response;

    try {
        response =
            await fetch(
                `${MSG91_WIDGET_API_BASE_URL}${path}`,
                {
                    method,

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",

                        authkey:
                            authKey
                    },

                    body:
                        body === undefined
                            ? undefined
                            : JSON.stringify(
                                body
                            ),

                    signal:
                        controller.signal
                }
            );
    } catch (error) {
        const requestError =
            new Error(
                error?.name ===
                    "AbortError"
                    ? "MSG91 request timed out."
                    : "Unable to reach MSG91 right now."
            );

        requestError.code =
            error?.name ===
            "AbortError"
                ? "MSG91_TIMEOUT"
                : "MSG91_NETWORK_ERROR";

        throw requestError;
    } finally {
        clearTimeout(
            timeoutId
        );
    }

    let data = null;

    try {
        data =
            await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        const providerError =
            new Error(
                getProviderMessage(
                    data,
                    `MSG91 request failed (${response.status}).`
                )
            );

        providerError.code =
            "MSG91_API_ERROR";

        providerError.status =
            response.status;

        providerError.data =
            data;

        throw providerError;
    }

    return data;
}

/* ============================================================
   6. SEND OTP
   ============================================================ */

async function sendOtp(
    identifier
) {
    const cleanIdentifier =
        normalizeIdentifier(
            identifier
        );

    if (
        !isValidIdentifier(
            cleanIdentifier
        )
    ) {
        const error =
            new Error(
                "Enter a valid mobile number or email address."
            );

        error.code =
            "MSG91_IDENTIFIER_INVALID";

        error.status =
            400;

        throw error;
    }

    const widgetId =
        getWidgetId();

    const data =
        await requestWidgetApi(
            "/sendOtp",
            {
                method:
                    "POST",

                body: {
                    widgetId,
                    identifier:
                        cleanIdentifier
                }
            }
        );

    const reqId =
        extractReqId(
            data
        );

    if (!reqId) {
        const error =
            new Error(
                "MSG91 accepted the OTP request but did not return a request ID."
            );

        error.code =
            "MSG91_REQ_ID_MISSING";

        error.data =
            data;

        throw error;
    }

    return {
        success:
            true,

        reqId,

        identifier:
            cleanIdentifier,

        data
    };
}

/* ============================================================
   7. RETRY OTP
   ============================================================ */

async function retryOtp(
    reqId,
    retryChannel = null
) {
    const cleanReqId =
        normalizeReqId(
            reqId
        );

    if (!cleanReqId) {
        const error =
            new Error(
                "A valid MSG91 request ID is required for retry."
            );

        error.code =
            "MSG91_REQ_ID_MISSING";

        error.status =
            400;

        throw error;
    }

    const widgetId =
        getWidgetId();

    const body = {
        widgetId,

        reqId:
            cleanReqId
    };

    /*
     * MSG91 documents retryChannel as optional when only one
     * retry method is configured. We send it only when supplied.
     */
    if (
        retryChannel !== null &&
        retryChannel !== undefined &&
        cleanString(
            String(retryChannel)
        )
    ) {
        body.retryChannel =
            Number.isFinite(
                Number(
                    retryChannel
                )
            )
                ? Number(
                    retryChannel
                )
                : cleanString(
                    String(
                        retryChannel
                    )
                );
    }

    const data =
        await requestWidgetApi(
            "/retryOtp",
            {
                method:
                    "POST",

                body
            }
        );

    return {
        success:
            true,

        reqId:
            cleanReqId,

        data
    };
}

/* ============================================================
   8. VERIFY OTP
   ============================================================ */

async function verifyOtp(
    reqId,
    otp
) {
    const cleanReqId =
        normalizeReqId(
            reqId
        );

    const cleanOtp =
        cleanString(
            otp
        );

    if (!cleanReqId) {
        const error =
            new Error(
                "A valid MSG91 request ID is required for verification."
            );

        error.code =
            "MSG91_REQ_ID_MISSING";

        error.status =
            400;

        throw error;
    }

    if (!isValidOtp(cleanOtp)) {
        const error =
            new Error(
                "Enter the OTP sent to your mobile number."
            );

        error.code =
            "MSG91_OTP_INVALID";

        error.status =
            400;

        throw error;
    }

    const widgetId =
        getWidgetId();

    const data =
        await requestWidgetApi(
            "/verifyOtp",
            {
                method:
                    "POST",

                body: {
                    widgetId,

                    reqId:
                        cleanReqId,

                    otp:
                        cleanOtp
                }
            }
        );

    const accessToken =
        extractAccessToken(
            data
        );

    if (!accessToken) {
        const error =
            new Error(
                "MSG91 verified the OTP but did not return an access token."
            );

        error.code =
            "MSG91_ACCESS_TOKEN_MISSING";

        error.data =
            data;

        throw error;
    }

    return {
        success:
            true,

        reqId:
            cleanReqId,

        accessToken,

        data
    };
}

/* ============================================================
   9. VERIFY ACCESS TOKEN
   ------------------------------------------------------------
   Keeps the existing Dheere server trust boundary.
   ============================================================ */

async function verifyAccessToken(
    accessToken
) {
    const cleanAccessToken =
        cleanString(
            accessToken
        );

    if (!cleanAccessToken) {
        const error =
            new Error(
                "A valid MSG91 access token is required."
            );

        error.code =
            "MSG91_ACCESS_TOKEN_MISSING";

        error.status =
            400;

        throw error;
    }

    const data =
        await requestWidgetApi(
            "/verifyAccessToken",
            {
                method:
                    "POST",

                body: {
                    "access-token":
                        cleanAccessToken
                }
            }
        );

    return {
        success:
            true,

        data
    };
}

/* ============================================================
   10. EXPORTS
   ============================================================ */

module.exports = {
    sendOtp,
    retryOtp,
    verifyOtp,
    verifyAccessToken,
    extractVerifiedIdentifier
};
