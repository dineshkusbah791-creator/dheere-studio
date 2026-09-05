// ============================================================
// DHEERE STUDIO — GOOGLE OAUTH ROUTES
// ------------------------------------------------------------
// Google flow:
//
// 1. /auth/google
// 2. Google consent
// 3. /auth/google/callback
//
// Existing Google/email user:
//     -> create normal Dheere JWT
//     -> redirect directly to the safe frontend destination
//        with an auth fragment (no login-page bounce)
//
// New Google user:
//     -> DO NOT create account yet
//     -> create short-lived signed setup token
//     -> redirect to google-user.html
//     -> user chooses username + password
//     -> POST /auth/google/complete
//     -> create account + normal Dheere JWT
//
// Security:
// - GOOGLE_CLIENT_SECRET stays server-side.
// - JWT_SECRET stays server-side.
// - New-user setup token expires quickly.
// - Google email must be verified.
// - Username/email uniqueness is rechecked server-side.
// ============================================================

"use strict";

const express =
    require("express");

const crypto =
    require("crypto");

const bcrypt =
    require("bcryptjs");

const jwt =
    require("jsonwebtoken");

const rateLimit =
    require("express-rate-limit");

const { google } =
    require("googleapis");

/* ============================================================
   1. CONSTANTS
   ============================================================ */

const GOOGLE_SCOPES = [
    "openid",
    "email",
    "profile"
];

const GOOGLE_STATE_EXPIRY =
    "10m";

const GOOGLE_SETUP_EXPIRY =
    "10m";

const JWT_EXPIRES_IN =
    "7d";

const GOOGLE_PROVIDER =
    "google";

const MIN_PASSWORD_LENGTH =
    8;

const MAX_PASSWORD_LENGTH =
    128;

const USERNAME_REGEX =
    /^[a-z0-9_]{3,20}$/;

/* ============================================================
   2. ENVIRONMENT HELPERS
   ============================================================ */

function requiredEnv(
    name
) {
    const value =
        String(
            process.env[name] || ""
        ).trim();

    if (!value) {
        throw new Error(
            `${name} is missing`
        );
    }

    return value;
}

function safeFrontendUrl() {
    const value =
        String(
            process.env.APP_BASE_URL ||
            process.env.FRONTEND_URL ||
            ""
        )
            .trim()
            .replace(
                /\/$/,
                ""
            );

    if (!value) {
        throw new Error(
            "APP_BASE_URL or FRONTEND_URL is missing"
        );
    }

    return value;
}

/* ============================================================
   3. NORMALIZATION
   ============================================================ */

function normalizeEmail(
    value
) {
    return String(
        value || ""
    )
        .trim()
        .toLowerCase();
}

function cleanName(
    value
) {
    return String(
        value || ""
    )
        .trim()
        .replace(
            /\s+/g,
            " "
        )
        .slice(
            0,
            80
        );
}

function cleanUsername(
    value
) {
    return String(
        value || ""
    )
        .trim()
        .toLowerCase();
}

/* ============================================================
   4. GOOGLE CLIENT
   ============================================================ */

function createOAuthClient() {
    return new google.auth.OAuth2(
        requiredEnv(
            "GOOGLE_CLIENT_ID"
        ),

        requiredEnv(
            "GOOGLE_CLIENT_SECRET"
        ),

        requiredEnv(
            "GOOGLE_REDIRECT_URI"
        )
    );
}

/* ============================================================
   5. STATE TOKEN
   ============================================================ */

function createStateToken(
    flow,
    returnTo
) {
    return jwt.sign(
        {
            type:
                "google-oauth-state",

            nonce:
                crypto
                    .randomBytes(
                        24
                    )
                    .toString(
                        "hex"
                    ),

            flow:
                flow === "register"
                    ? "register"
                    : "login",

            returnTo:
                safeReturnTo(
                    returnTo
                )
        },

        requiredEnv(
            "JWT_SECRET"
        ),

        {
            expiresIn:
                GOOGLE_STATE_EXPIRY
        }
    );
}

function verifyStateToken(
    token
) {
    const payload =
        jwt.verify(
            token,
            requiredEnv(
                "JWT_SECRET"
            )
        );

    if (
        !payload ||
        payload.type !==
            "google-oauth-state" ||
        !payload.nonce
    ) {
        throw new Error(
            "Invalid Google OAuth state"
        );
    }

    return payload;
}

/* ============================================================
   6. GOOGLE SETUP TOKEN
   ------------------------------------------------------------
   Contains only verified Google identity data needed to finish
   account creation. It is short-lived and signed server-side.
   ============================================================ */

function createGoogleSetupToken({
    googleId,
    email,
    name
}) {
    return jwt.sign(
        {
            type:
                "google-registration-setup",

            nonce:
                crypto
                    .randomBytes(
                        24
                    )
                    .toString(
                        "hex"
                    ),

            googleId:
                String(
                    googleId
                ),

            email:
                normalizeEmail(
                    email
                ),

            name:
                cleanName(
                    name
                )
        },

        requiredEnv(
            "JWT_SECRET"
        ),

        {
            expiresIn:
                GOOGLE_SETUP_EXPIRY
        }
    );
}

function verifyGoogleSetupToken(
    token
) {
    const payload =
        jwt.verify(
            token,
            requiredEnv(
                "JWT_SECRET"
            )
        );

    if (
        !payload ||
        payload.type !==
            "google-registration-setup" ||
        !payload.nonce ||
        !payload.googleId ||
        !payload.email
    ) {
        throw new Error(
            "Invalid or expired Google registration session."
        );
    }

    return payload;
}

/* ============================================================
   7. AUTH JWT
   ============================================================ */

function createAuthToken(
    userId
) {
    return jwt.sign(
        {
            userId:
                String(
                    userId
                )
        },

        requiredEnv(
            "JWT_SECRET"
        ),

        {
            expiresIn:
                JWT_EXPIRES_IN
        }
    );
}

/* ============================================================
   8. SAFE REDIRECTS
   ============================================================ */

function safeReturnTo(
    value
) {
    if (
        typeof value !==
            "string" ||
        !value
    ) {
        return "/index.html";
    }

    if (
        !value.startsWith("/") ||
        value.startsWith("//") ||
        value.includes(
            "\r"
        ) ||
        value.includes(
            "\n"
        )
    ) {
        return "/index.html";
    }

    return value;
}

function redirectWithAuth(
    res,
    {
        frontendUrl,
        returnTo,
        token
    }
) {
    /*
     * Existing Google users are already authenticated by the
     * backend at this point. Do not bounce them through login.html
     * with a JWT fragment. Redirect directly to the requested safe
     * frontend path and hand the token to the frontend through a
     * short-lived fragment.
     *
     * The token is consumed by the homepage/auth bootstrap and then
     * removed from the URL. This avoids the previous:
     * Google -> login.html -> login page stuck
     * flow.
     */
    const safePath =
        safeReturnTo(
            returnTo
        );

    const target =
        new URL(
            safePath,
            `${frontendUrl}/`
        );

    target.hash =
        new URLSearchParams(
            {
                dheere_auth:
                    token
            }
        ).toString();

    return res.redirect(
        target.toString()
    );
}

function redirectWithGoogleSetup(
    res,
    {
        frontendUrl,
        returnTo,
        setupToken
    }
) {
    const target =
        new URL(
            "/auth/google-user.html",
            `${frontendUrl}/`
        );

    target.searchParams.set(
        "redirect",
        safeReturnTo(
            returnTo
        )
    );

    /*
     * Fragment is not sent as part of the HTTP request and therefore
     * is preferable here to putting the short-lived setup token in
     * the query string.
     */
    target.hash =
        new URLSearchParams(
            {
                google_setup:
                    setupToken
            }
        ).toString();

    return res.redirect(
        target.toString()
    );
}

function redirectWithError(
    res,
    {
        frontendUrl,
        returnTo,
        flow,
        error
    }
) {
    const target =
        new URL(
            "/auth/login.html",
            `${frontendUrl}/`
        );

    target.searchParams.set(
        "redirect",
        safeReturnTo(
            returnTo
        )
    );

    target.hash =
        new URLSearchParams(
            {
                dheere_auth_error:
                    error ||
                    "oauth_error",

                flow:
                    flow ===
                    "register"
                        ? "register"
                        : "login"
            }
        ).toString();

    return res.redirect(
        target.toString()
    );
}

/* ============================================================
   9. PASSWORD VALIDATION
   ============================================================ */

function isValidPassword(
    password
) {
    return (
        typeof password ===
            "string" &&
        password.length >=
            MIN_PASSWORD_LENGTH &&
        password.length <=
            MAX_PASSWORD_LENGTH
    );
}

/* ============================================================
   10. ROUTER
   ============================================================ */

function createGoogleAuthRouter({
    usersCollection
}) {
    const router =
        express.Router();

    const googleLimiter =
        rateLimit({
            windowMs:
                15 *
                60 *
                1000,

            max:
                20,

            standardHeaders:
                true,

            legacyHeaders:
                false,

            message: {
                success:
                    false,

                error:
                    "Too many Google authentication attempts. Please try again later."
            }
        });

    const completeRegistrationLimiter =
        rateLimit({
            windowMs:
                15 *
                60 *
                1000,

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
                    "Too many Google registration attempts. Please try again later."
            }
        });

    /* ========================================================
       10A. START GOOGLE AUTH
       ======================================================== */

    router.get(
        "/auth/google",
        googleLimiter,
        (
            req,
            res
        ) => {
            try {
                const flow =
                    req.query.flow ===
                        "register"
                        ? "register"
                        : "login";

                const returnTo =
                    safeReturnTo(
                        req.query.returnTo
                    );

                const state =
                    createStateToken(
                        flow,
                        returnTo
                    );

                const client =
                    createOAuthClient();

                const url =
                    client.generateAuthUrl(
                        {
                            access_type:
                                "online",

                            scope:
                                GOOGLE_SCOPES,

                            state,

                            include_granted_scopes:
                                true,

                            prompt:
                                "select_account"
                        }
                    );

                return res.redirect(
                    url
                );
            } catch (error) {
                console.error(
                    "Google OAuth start error:",
                    error
                );

                return res
                    .status(
                        500
                    )
                    .json({
                        success:
                            false,

                        error:
                            "Google sign-in is not configured correctly on the server."
                    });
            }
        }
    );

    /* ========================================================
       10B. GOOGLE CALLBACK
       ======================================================== */

    router.get(
        "/auth/google/callback",
        googleLimiter,
        async (
            req,
            res
        ) => {
            let frontendUrl = "";

            let statePayload = {
                flow:
                    "login",

                returnTo:
                    "/index.html"
            };

            try {
                frontendUrl =
                    safeFrontendUrl();

                const state =
                    String(
                        req.query.state ||
                        ""
                    );

                if (!state) {
                    return redirectWithError(
                        res,
                        {
                            frontendUrl,

                            returnTo:
                                "/index.html",

                            flow:
                                "login",

                            error:
                                "missing_oauth_state"
                        }
                    );
                }

                statePayload =
                    verifyStateToken(
                        state
                    );

                if (
                    req.query.error
                ) {
                    return redirectWithError(
                        res,
                        {
                            frontendUrl,

                            returnTo:
                                statePayload.returnTo,

                            flow:
                                statePayload.flow,

                            error:
                                String(
                                    req.query.error
                                )
                        }
                    );
                }

                const code =
                    String(
                        req.query.code ||
                        ""
                    );

                if (!code) {
                    return redirectWithError(
                        res,
                        {
                            frontendUrl,

                            returnTo:
                                statePayload.returnTo,

                            flow:
                                statePayload.flow,

                            error:
                                "missing_oauth_response"
                        }
                    );
                }

                const client =
                    createOAuthClient();

                const {
                    tokens
                } =
                    await client.getToken(
                        code
                    );

                if (
                    !tokens ||
                    !tokens.access_token
                ) {
                    throw new Error(
                        "Google did not return an access token."
                    );
                }

                client.setCredentials(
                    tokens
                );

                const oauth2 =
                    google.oauth2(
                        {
                            auth:
                                client,

                            version:
                                "v2"
                        }
                    );

                const {
                    data: profile
                } =
                    await oauth2
                        .userinfo
                        .get();

                const email =
                    normalizeEmail(
                        profile.email
                    );

                if (
                    !email ||
                    profile.email_verified !==
                        true
                ) {
                    throw new Error(
                        "Google account email is missing or not verified."
                    );
                }

                const googleId =
                    String(
                        profile.id ||
                        ""
                    ).trim();

                if (!googleId) {
                    throw new Error(
                        "Google account ID was not returned."
                    );
                }

                const name =
                    cleanName(
                        profile.name ||
                        profile.given_name ||
                        email.split(
                            "@"
                        )[0]
                    );

                const user =
                    await usersCollection
                        .findOne(
                            {
                                email
                            }
                        );

                /* ====================================================
                   EXISTING USER
                   ==================================================== */

                if (user) {
                    if (
                        user.googleId &&
                        String(
                            user.googleId
                        ) !==
                            googleId
                    ) {
                        throw new Error(
                            "This email is already linked to another Google account."
                        );
                    }

                    /*
                     * A pre-existing email/password account can be
                     * upgraded to Google sign-in by linking the
                     * verified Google identity to it.
                     */
                    await usersCollection
                        .updateOne(
                            {
                                _id:
                                    user._id
                            },
                            {
                                $set: {
                                    googleId,

                                    authProvider:
                                        GOOGLE_PROVIDER,

                                    googleEmail:
                                        email,

                                    googleEmailVerified:
                                        true,

                                    updatedAt:
                                        new Date()
                                }
                            }
                        );

                    const token =
                        createAuthToken(
                            user._id
                        );

                    return redirectWithAuth(
                        res,
                        {
                            frontendUrl,

                            returnTo:
                                statePayload.returnTo,

                            token
                        }
                    );
                }

                /* ====================================================
                   NEW USER — SETUP PAGE
                   ==================================================== */

                const setupToken =
                    createGoogleSetupToken(
                        {
                            googleId,

                            email,

                            name
                        }
                    );

                return redirectWithGoogleSetup(
                    res,
                    {
                        frontendUrl,

                        returnTo:
                            statePayload.returnTo,

                        setupToken
                    }
                );
            } catch (error) {
                console.error(
                    "Google OAuth callback error:",
                    error
                );

                /*
                 * If frontend URL itself cannot be resolved, return a
                 * plain server error rather than masking the root cause.
                 */
                if (!frontendUrl) {
                    return res
                        .status(
                            500
                        )
                        .json({
                            success:
                                false,

                            error:
                                "Google authentication could not be completed."
                        });
                }

                return redirectWithError(
                    res,
                    {
                        frontendUrl,

                        returnTo:
                            statePayload.returnTo,

                        flow:
                            statePayload.flow,

                        error:
                            "google_auth_failed"
                    }
                );
            }
        }
    );

    /* ========================================================
       10C. COMPLETE GOOGLE REGISTRATION
       ======================================================== */

    router.post(
        "/auth/google/complete",
        completeRegistrationLimiter,
        async (
            req,
            res
        ) => {
            try {
                const setupToken =
                    String(
                        req.body?.setupToken ||
                        ""
                    ).trim();

                const username =
                    cleanUsername(
                        req.body?.username
                    );

                const password =
                    typeof req.body?.password ===
                        "string"
                        ? req.body.password
                        : "";

                if (!setupToken) {
                    return res
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            error:
                                "Your Google registration session is missing or expired. Please start again with Google."
                        });
                }

                if (
                    !USERNAME_REGEX.test(
                        username
                    )
                ) {
                    return res
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            error:
                                "Username must be 3–20 characters and contain only lowercase letters, numbers, and underscores."
                        });
                }

                if (
                    !isValidPassword(
                        password
                    )
                ) {
                    return res
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            error:
                                `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters long.`
                        });
                }

                const setup =
                    verifyGoogleSetupToken(
                        setupToken
                    );

                const email =
                    normalizeEmail(
                        setup.email
                    );

                const googleId =
                    String(
                        setup.googleId ||
                        ""
                    ).trim();

                const name =
                    cleanName(
                        setup.name
                    );

                if (
                    !email ||
                    !googleId
                ) {
                    return res
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            error:
                                "Your Google registration session is invalid. Please start again."
                        });
                }

                /*
                 * Re-check both identities immediately before insertion.
                 * This handles accounts created after the setup page was
                 * opened and prevents duplicate registrations.
                 */
                const existingEmail =
                    await usersCollection.findOne(
                        {
                            email
                        },
                        {
                            projection: {
                                _id: 1
                            }
                        }
                    );

                if (existingEmail) {
                    return res
                        .status(
                            409
                        )
                        .json({
                            success:
                                false,

                            error:
                                "An account with this Google email already exists. Please sign in with Google."
                        });
                }

                const existingUsername =
                    await usersCollection.findOne(
                        {
                            username
                        },
                        {
                            projection: {
                                _id: 1
                            }
                        }
                    );

                if (existingUsername) {
                    return res
                        .status(
                            409
                        )
                        .json({
                            success:
                                false,

                            error:
                                "That username is already taken. Please choose another username."
                        });
                }

                const passwordHash =
                    await bcrypt.hash(
                        password,
                        12
                    );

                const newUser = {
                    name:
                        name ||
                        "Dheere User",

                    username,

                    email,

                    password:
                        passwordHash,

                    mobile:
                        "",

                    mobileVerified:
                        false,

                    googleId,

                    authProvider:
                        GOOGLE_PROVIDER,

                    googleEmail:
                        email,

                    googleEmailVerified:
                        true,

                    bio:
                        "",

                    avatarUrl:
                        "",

                    createdAt:
                        new Date(),

                    updatedAt:
                        new Date()
                };

                let insertResult;

                try {
                    insertResult =
                        await usersCollection
                            .insertOne(
                                newUser
                            );
                } catch (error) {
                    if (
                        error?.code ===
                        11000
                    ) {
                        return res
                            .status(
                                409
                            )
                            .json({
                                success:
                                    false,

                                error:
                                    "That email or username is already registered. Please try again."
                            });
                    }

                    throw error;
                }

                const token =
                    createAuthToken(
                        insertResult.insertedId
                    );

                return res
                    .status(
                        201
                    )
                    .json({
                        success:
                            true,

                        message:
                            "Google account registration completed.",

                        token,

                        user: {
                            id:
                                insertResult
                                    .insertedId
                                    .toString(),

                            name:
                                newUser.name,

                            username:
                                newUser.username,

                            email:
                                newUser.email,

                            mobile:
                                "",

                            bio:
                                newUser.bio,

                            avatarUrl:
                                newUser.avatarUrl
                        }
                    });
            } catch (error) {
                console.error(
                    "Google registration completion error:",
                    error
                );

                if (
                    error?.name ===
                    "JsonWebTokenError" ||
                    error?.name ===
                    "TokenExpiredError"
                ) {
                    return res
                        .status(
                            401
                        )
                        .json({
                            success:
                                false,

                            error:
                                "Your Google registration session has expired. Please start again with Google."
                        });
                }

                return res
                    .status(
                        500
                    )
                    .json({
                        success:
                            false,

                        error:
                            "Could not complete Google registration."
                    });
            }
        }
    );

    return router;
}

/* ============================================================
   11. EXPORT
   ============================================================ */

module.exports =
    createGoogleAuthRouter;
