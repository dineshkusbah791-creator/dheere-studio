/* ============================================================
   DHEERE STUDIO — MSG91 OTP ROUTES
   Server-side endpoints for MSG91 OTP Widget API

   Routes:
   - POST /auth/otp/send
   - POST /auth/otp/retry
   - POST /auth/otp/verify

   The MSG91 AuthKey never reaches the browser.
   ============================================================ */

"use strict";

const express =
    require("express");

const rateLimit =
    require("express-rate-limit");

const {
    sendOtp,
    retryOtp,
    verifyOtp
} =
    require("../services/otp-service");

/* ============================================================
   HELPERS
   ============================================================ */

function cleanString(value) {
    return typeof value === "string"
        ? value.trim()
        : "";
}

function normalizeMobile(value) {
    const clean =
        cleanString(value);

    const digits =
        clean.replace(/\D/g, "");

    if (/^[0-9]{10}$/.test(digits)) {
        return `91${digits}`;
    }

    return digits;
}

function normalizeIdentifier(value) {
    const clean =
        cleanString(value);

    if (!clean) {
        return "";
    }

    if (/^[0-9]{10}$/.test(clean)) {
        return `91${clean}`;
    }

    return clean.replace(/^\+/, "");
}

function isValidIdentifier(value) {
    const identifier =
        normalizeIdentifier(value);

    return (
        /^[0-9]{11,15}$/.test(identifier) ||
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
    );
}

function getErrorStatus(error) {
    if (
        Number.isInteger(error?.status) &&
        error.status >= 400 &&
        error.status < 500
    ) {
        return error.status;
    }

    if (
        error?.code ===
        "MSG91_IDENTIFIER_INVALID" ||
        error?.code ===
        "MSG91_REQ_ID_MISSING" ||
        error?.code ===
        "MSG91_OTP_INVALID"
    ) {
        return 400;
    }

    return 502;
}

function getErrorMessage(
    error,
    fallback
) {
    return (
        error?.message ||
        fallback
    );
}

/* ============================================================
   RATE LIMITERS

   These are application-level protections. MSG91's own
   throttle remains authoritative on the provider side.
   ============================================================ */

const sendOtpLimiter =
    rateLimit({
        windowMs:
            5 * 60 * 1000,

        max:
            5,

        standardHeaders:
            true,

        legacyHeaders:
            false,

        message: {
            success:
                false,

            error:
                "Too many OTP requests. Please wait before requesting another OTP."
        }
    });

const retryOtpLimiter =
    rateLimit({
        windowMs:
            5 * 60 * 1000,

        max:
            3,

        standardHeaders:
            true,

        legacyHeaders:
            false,

        message: {
            success:
                false,

            error:
                "Too many OTP resend attempts. Please wait before trying again."
        }
    });

const verifyOtpLimiter =
    rateLimit({
        windowMs:
            5 * 60 * 1000,

        max:
            10,

        standardHeaders:
            true,

        legacyHeaders:
            false,

        message: {
            success:
                false,

            error:
                "Too many OTP verification attempts. Please wait and try again."
        }
    });

/* ============================================================
   ROUTER
   ============================================================ */

function createOtpRouter() {
    const router =
        express.Router();

    /* ========================================================
       SEND OTP
       ======================================================== */

    router.post(
        "/auth/otp/send",
        sendOtpLimiter,
        async (
            req,
            res
        ) => {
            try {
                const identifier =
                    normalizeIdentifier(
                        req.body?.identifier
                    );

                if (
                    !isValidIdentifier(
                        identifier
                    )
                ) {
                    return res
                        .status(400)
                        .json({
                            success:
                                false,

                            error:
                                "Enter a valid 10-digit mobile number or email address."
                        });
                }

                const result =
                    await sendOtp(
                        identifier
                    );

                return res.json({
                    success:
                        true,

                    message:
                        "OTP sent successfully.",

                    reqId:
                        result.reqId,

                    identifier:
                        result.identifier
                });
            } catch (error) {
                console.error(
                    "MSG91 send OTP route error:",
                    error
                );

                return res
                    .status(
                        getErrorStatus(
                            error
                        )
                    )
                    .json({
                        success:
                            false,

                        error:
                            getErrorMessage(
                                error,
                                "Unable to send OTP right now."
                            )
                    });
            }
        }
    );

    /* ========================================================
       RETRY / RESEND OTP
       ======================================================== */

    router.post(
        "/auth/otp/retry",
        retryOtpLimiter,
        async (
            req,
            res
        ) => {
            try {
                const reqId =
                    cleanString(
                        req.body?.reqId
                    );

                const retryChannel =
                    req.body?.retryChannel ??
                    null;

                if (!reqId) {
                    return res
                        .status(400)
                        .json({
                            success:
                                false,

                            error:
                                "A valid OTP request ID is required."
                        });
                }

                const result =
                    await retryOtp(
                        reqId,
                        retryChannel
                    );

                return res.json({
                    success:
                        true,

                    message:
                        "OTP resent successfully.",

                    reqId:
                        result.reqId
                });
            } catch (error) {
                console.error(
                    "MSG91 retry OTP route error:",
                    error
                );

                return res
                    .status(
                        getErrorStatus(
                            error
                        )
                    )
                    .json({
                        success:
                            false,

                        error:
                            getErrorMessage(
                                error,
                                "Unable to resend OTP right now."
                            )
                    });
            }
        }
    );

    /* ========================================================
       VERIFY OTP
       ======================================================== */

    router.post(
        "/auth/otp/verify",
        verifyOtpLimiter,
        async (
            req,
            res
        ) => {
            try {
                const reqId =
                    cleanString(
                        req.body?.reqId
                    );

                const otp =
                    cleanString(
                        req.body?.otp
                    );

                if (!reqId) {
                    return res
                        .status(400)
                        .json({
                            success:
                                false,

                            error:
                                "A valid OTP request ID is required."
                        });
                }

                if (
                    !/^[0-9]{4,8}$/.test(
                        otp
                    )
                ) {
                    return res
                        .status(400)
                        .json({
                            success:
                                false,

                            error:
                                "Enter the OTP sent to your mobile number."
                        });
                }

                const result =
                    await verifyOtp(
                        reqId,
                        otp
                    );

                /*
                 * Return only what the frontend needs.
                 * The access token is required for the existing
                 * backend registration/recovery trust boundary.
                 */
                return res.json({
                    success:
                        true,

                    message:
                        "OTP verified successfully.",

                    reqId:
                        result.reqId,

                    accessToken:
                        result.accessToken
                });
            } catch (error) {
                console.error(
                    "MSG91 verify OTP route error:",
                    error
                );

                return res
                    .status(
                        getErrorStatus(
                            error
                        )
                    )
                    .json({
                        success:
                            false,

                        error:
                            getErrorMessage(
                                error,
                                "Unable to verify OTP right now."
                            )
                    });
            }
        }
    );

    return router;
}

module.exports =
    createOtpRouter;
