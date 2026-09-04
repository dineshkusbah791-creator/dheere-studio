// ============================================================
// DHEERE STUDIO — GOOGLE OAUTH ROUTES
// ============================================================

const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const { google } = require("googleapis");

const GOOGLE_SCOPES = [
    "openid",
    "email",
    "profile"
];

const GOOGLE_STATE_EXPIRY = "10m";
const JWT_EXPIRES_IN = "7d";
const GOOGLE_PROVIDER = "google";

function requiredEnv(name) {
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

function normalizeEmail(value) {
    return String(
        value || ""
    )
        .trim()
        .toLowerCase();
}

function cleanName(value) {
    return String(
        value || ""
    )
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 80);
}

function safeFrontendUrl() {
    const value =
        String(
            process.env.APP_BASE_URL ||
            process.env.FRONTEND_URL ||
            ""
        )
            .trim()
            .replace(/\/$/, "");

    if (!value) {
        throw new Error(
            "APP_BASE_URL or FRONTEND_URL is missing"
        );
    }

    return value;
}

function createOAuthClient() {
    return new google.auth.OAuth2(
        requiredEnv("GOOGLE_CLIENT_ID"),
        requiredEnv("GOOGLE_CLIENT_SECRET"),
        requiredEnv("GOOGLE_REDIRECT_URI")
    );
}

function createStateToken(flow, returnTo) {
    return jwt.sign(
        {
            type:
                "google-oauth-state",

            nonce:
                crypto
                    .randomBytes(24)
                    .toString("hex"),

            flow:
                flow === "register"
                    ? "register"
                    : "login",

            returnTo:
                typeof returnTo === "string"
                    ? returnTo
                    : "/index.html"
        },
        requiredEnv("JWT_SECRET"),
        {
            expiresIn:
                GOOGLE_STATE_EXPIRY
        }
    );
}

function verifyStateToken(token) {
    const payload =
        jwt.verify(
            token,
            requiredEnv("JWT_SECRET")
        );

    if (
        !payload ||
        payload.type !== "google-oauth-state" ||
        !payload.nonce
    ) {
        throw new Error(
            "Invalid Google OAuth state"
        );
    }

    return payload;
}

function createAuthToken(userId) {
    return jwt.sign(
        {
            userId:
                String(userId)
        },
        requiredEnv("JWT_SECRET"),
        {
            expiresIn:
                JWT_EXPIRES_IN
        }
    );
}

function safeReturnTo(value) {
    if (
        typeof value !== "string" ||
        !value
    ) {
        return "/index.html";
    }

    if (
        !value.startsWith("/") ||
        value.startsWith("//") ||
        value.includes("\r") ||
        value.includes("\n")
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
        token,
        flow
    }
) {
    const target =
        new URL(
            "/auth/login.html",
            `${frontendUrl}/`
        );

    const safe =
        safeReturnTo(returnTo);

    if (safe) {
        target.searchParams.set(
            "redirect",
            safe
        );
    }

    target.hash =
        new URLSearchParams({
            dheere_auth:
                token,

            flow:
                flow === "register"
                    ? "register"
                    : "login"
        }).toString();

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
        safeReturnTo(returnTo)
    );

    target.hash =
        new URLSearchParams({
            dheere_auth_error:
                error || "oauth_error",

            flow:
                flow === "register"
                    ? "register"
                    : "login"
        }).toString();

    return res.redirect(
        target.toString()
    );
}

async function generateUniqueUsername(
    usersCollection,
    email,
    displayName
) {
    const source =
        String(
            displayName ||
            email.split("@")[0] ||
            "user"
        )
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "")
            .slice(0, 14);

    const base =
        source || "user";

    for (
        let attempt = 0;
        attempt < 30;
        attempt += 1
    ) {
        const suffix =
            crypto
                .randomBytes(3)
                .toString("hex");

        const username =
            `${base}_${suffix}`.slice(
                0,
                20
            );

        const existing =
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

        if (!existing) {
            return username;
        }
    }

    throw new Error(
        "Could not generate a unique username"
    );
}

function createGoogleAuthRouter(
    {
        usersCollection
    }
) {
    const router =
        express.Router();

    const googleLimiter =
        rateLimit({
            windowMs:
                15 * 60 * 1000,

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

    router.get(
        "/auth/google",
        googleLimiter,
        (req, res) => {
            try {
                const flow =
                    req.query.flow === "register"
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
                    client.generateAuthUrl({
                        access_type:
                            "online",

                        scope:
                            GOOGLE_SCOPES,

                        state,

                        include_granted_scopes:
                            true,

                        prompt:
                            "select_account"
                    });

                return res.redirect(url);
            } catch (error) {
                console.error(
                    "Google OAuth start error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    error:
                        "Google sign-in is not configured correctly on the server."
                });
            }
        }
    );

    router.get(
        "/auth/google/callback",
        googleLimiter,
        async (req, res) => {
            const frontendUrl =
                safeFrontendUrl();

            let statePayload = {
                flow:
                    "login",

                returnTo:
                    "/index.html"
            };

            try {
                const state =
                    String(
                        req.query.state || ""
                    );

                if (state) {
                    statePayload =
                        verifyStateToken(
                            state
                        );
                }

                if (req.query.error) {
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
                        req.query.code || ""
                    );

                if (!code || !state) {
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

                const { tokens } =
                    await client.getToken(
                        code
                    );

                if (
                    !tokens ||
                    !tokens.access_token
                ) {
                    throw new Error(
                        "Google did not return an access token"
                    );
                }

                client.setCredentials(
                    tokens
                );

                const oauth2 =
                    google.oauth2({
                        auth:
                            client,

                        version:
                            "v2"
                    });

                const {
                    data: profile
                } =
                    await oauth2.userinfo.get();

                const email =
                    normalizeEmail(
                        profile.email
                    );

                if (
                    !email ||
                    profile.email_verified !== true
                ) {
                    throw new Error(
                        "Google account email is missing or not verified"
                    );
                }

                const googleId =
                    String(
                        profile.id || ""
                    ).trim();

                if (!googleId) {
                    throw new Error(
                        "Google account ID was not returned"
                    );
                }

                const name =
                    cleanName(
                        profile.name ||
                        profile.given_name ||
                        email.split("@")[0]
                    );

                let user =
                    await usersCollection.findOne({
                        email
                    });

                if (user) {
                    if (
                        user.googleId &&
                        String(user.googleId) !==
                            googleId
                    ) {
                        throw new Error(
                            "This email is already linked to another Google account."
                        );
                    }

                    await usersCollection.updateOne(
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

                    user =
                        await usersCollection.findOne({
                            _id:
                                user._id
                        });
                } else {
                    const username =
                        await generateUniqueUsername(
                            usersCollection,
                            email,
                            name
                        );

                    const randomPassword =
                        crypto
                            .randomBytes(48)
                            .toString("base64url");

                    const passwordHash =
                        await bcrypt.hash(
                            randomPassword,
                            12
                        );

                    const newUser = {
                        name,

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

                        createdAt:
                            new Date(),

                        updatedAt:
                            new Date()
                    };

                    const insertResult =
                        await usersCollection.insertOne(
                            newUser
                        );

                    user = {
                        ...newUser,

                        _id:
                            insertResult.insertedId
                    };
                }

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

                        token,

                        flow:
                            statePayload.flow
                    }
                );
            } catch (error) {
                console.error(
                    "Google OAuth callback error:",
                    error
                );

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

    return router;
}

module.exports =
    createGoogleAuthRouter;
