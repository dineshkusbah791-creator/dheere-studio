// ============================================================
// AUTH ROUTES
// ============================================================

const express =
    require(
        "express"
    );


const bcrypt =
    require(
        "bcryptjs"
    );


const crypto =
    require(
        "crypto"
    );


const jwt =
    require(
        "jsonwebtoken"
    );


const rateLimit =
    require(
        "express-rate-limit"
    );



const {
    USERNAME_REGEX,

    MAX_NAME_LENGTH,

    normalizeUsername,

    normalizeEmail,

    cleanNameValue

} =
    require(
        "../utils/validators"
    );



const {
    sendPasswordResetEmail

} =
    require(
        "../services/email-service"
    );



// ============================================================
// CONSTANTS
// ============================================================

const RESET_TOKEN_EXPIRY_MINUTES =
    15;


const BCRYPT_SALT_ROUNDS =
    12;


const MAX_EMAIL_LENGTH =
    254;


const MIN_PASSWORD_LENGTH =
    8;


const MAX_PASSWORD_LENGTH =
    128;


const JWT_EXPIRES_IN =
    "7d";



// ============================================================
// DUMMY PASSWORD HASH
//
// This is generated from a dummy password and is used when
// an account does not exist.
//
// It ensures bcrypt.compare() still runs, reducing timing
// differences that could help attackers enumerate accounts.
// ============================================================

const DUMMY_PASSWORD_HASH =
    bcrypt.hashSync(

        crypto.randomBytes(
            32
        ).toString(
            "hex"
        ),

        BCRYPT_SALT_ROUNDS

    );



// ============================================================
// JWT HELPER
// ============================================================

function createAuthToken(
    userId
) {

    if (
        !process.env.JWT_SECRET
    ) {

        throw new Error(
            "JWT_SECRET is missing"
        );

    }



    return jwt.sign(

        {

            userId:
                String(
                    userId
                )

        },

        process.env.JWT_SECRET,

        {

            expiresIn:
                JWT_EXPIRES_IN

        }

    );

}



// ============================================================
// RATE LIMITER CONFIG
// ============================================================

function createLimiter(
    {
        windowMs,
        max,
        message
    }
) {

    return rateLimit({

        windowMs:
            windowMs,


        max:
            max,


        standardHeaders:
            true,


        legacyHeaders:
            false,


        message: {

            success:
                false,


            error:
                message

        }

    });

}



// ============================================================
// RATE LIMITERS
// ============================================================

const registerLimiter =
    createLimiter({

        windowMs:
            60 *
            60 *
            1000,


        max:
            10,


        message:
            "Too many registration attempts. Please try again later."

    });



const loginLimiter =
    createLimiter({

        windowMs:
            15 *
            60 *
            1000,


        max:
            10,


        message:
            "Too many login attempts. Please try again later."

    });



const forgotPasswordLimiter =
    createLimiter({

        windowMs:
            60 *
            60 *
            1000,


        max:
            5,


        message:
            "Too many password reset requests. Please try again later."

    });



const resetPasswordLimiter =
    createLimiter({

        windowMs:
            15 *
            60 *
            1000,


        max:
            10,


        message:
            "Too many password reset attempts. Please try again later."

    });



// ============================================================
// PASSWORD VALIDATION
// ============================================================

function isValidPassword(
    password
) {

    return (

        typeof password ===
        "string"

        &&

        password.length >=
        MIN_PASSWORD_LENGTH

        &&

        password.length <=
        MAX_PASSWORD_LENGTH

    );

}



// ============================================================
// VALIDATE EMAIL
// ============================================================

function isValidEmail(
    email
) {

    if (

        typeof email !==
        "string"

        ||

        !email

        ||

        email.length >
        MAX_EMAIL_LENGTH

    ) {

        return false;

    }



    /*
     * Basic structural validation.
     *
     * This is intentionally not an overly complex RFC regex.
     */

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



    return emailRegex.test(
        email
    );

}



// ============================================================
// CREATE RESET TOKEN HASH
// ============================================================

function hashResetToken(
    token
) {

    return crypto
        .createHash(
            "sha256"
        )
        .update(
            token
        )
        .digest(
            "hex"
        );

}



// ============================================================
// CREATE AUTH ROUTER
// ============================================================

function createAuthRouter(
    {
        usersCollection
    }
) {


    const router =
        express.Router();



    // ========================================================
    // REGISTER
    // ========================================================

    router.post(

        "/register",

        registerLimiter,

        async (
            req,
            res
        ) => {


            try {


                const {
                    name,
                    username,
                    email,
                    password
                } =
                    req.body ||
                    {};



                // ============================================
                // TYPE VALIDATION
                // ============================================

                if (

                    typeof name !==
                    "string"

                    ||

                    typeof username !==
                    "string"

                    ||

                    typeof email !==
                    "string"

                    ||

                    typeof password !==
                    "string"

                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            "Invalid registration data"

                    });

                }



                // ============================================
                // CLEAN VALUES
                // ============================================

                const cleanedName =
                    cleanNameValue(
                        name
                    );


                const cleanUsername =
                    normalizeUsername(
                        username
                    );


                const cleanEmail =
                    normalizeEmail(
                        email
                    );



                // ============================================
                // NAME VALIDATION
                // ============================================

                if (
                    !cleanedName
                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            "Name is required"

                    });

                }



                if (

                    cleanedName.length >

                    MAX_NAME_LENGTH

                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            `Name cannot exceed ${MAX_NAME_LENGTH} characters`

                    });

                }



                // ============================================
                // USERNAME VALIDATION
                // ============================================

                if (

                    !USERNAME_REGEX.test(
                        cleanUsername
                    )

                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            "Username must be 3-20 characters and contain only letters, numbers, and underscores."

                    });

                }



                // ============================================
                // EMAIL VALIDATION
                // ============================================

                if (

                    !isValidEmail(
                        cleanEmail
                    )

                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            "Invalid email"

                    });

                }



                // ============================================
                // PASSWORD VALIDATION
                // ============================================

                if (

                    !isValidPassword(
                        password
                    )

                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters long`

                    });

                }



                // ============================================
                // HASH PASSWORD
                // ============================================

                const hashedPassword =
                    await bcrypt.hash(

                        password,

                        BCRYPT_SALT_ROUNDS

                    );



                // ============================================
                // CREATE USER
                // ============================================

                const newUser = {

                    name:
                        cleanedName,


                    username:
                        cleanUsername,


                    email:
                        cleanEmail,


                    password:
                        hashedPassword,


                    bio:
                        "",


                    avatarUrl:
                        "",


                    createdAt:
                        new Date()

                };



                // ============================================
                // SAVE USER
                // ============================================

                const result =
                    await usersCollection.insertOne(
                        newUser
                    );



                // ============================================
                // GENERATE AUTH TOKEN
                // ============================================

                const token =
                    createAuthToken(

                        result
                            .insertedId

                    );



                // ============================================
                // SUCCESS
                // ============================================

                return res.status(201).json({

                    success:
                        true,


                    message:
                        "Registration successful",


                    token:
                        token,


                    user: {

                        id:
                            result
                                .insertedId
                                .toString(),


                        name:
                            newUser.name,


                        username:
                            newUser.username,


                        email:
                            newUser.email,


                        bio:
                            newUser.bio,


                        avatarUrl:
                            newUser.avatarUrl

                    }

                });


            } catch (
                error
            ) {


                // ============================================
                // DUPLICATE KEY
                // ============================================

                if (

                    error &&
                    error.code ===
                    11000

                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            "Email or username is already registered"

                    });

                }



                console.error(

                    "Registration error:",

                    error

                );



                return res.status(500).json({

                    success:
                        false,


                    error:
                        "Could not register user"

                });

            }


        }

    );



    // ========================================================
    // LOGIN
    // ========================================================

    router.post(

        "/login",

        loginLimiter,

        async (
            req,
            res
        ) => {


            try {


                const {
                    email,
                    password
                } =
                    req.body ||
                    {};



                // ============================================
                // TYPE VALIDATION
                // ============================================

                if (

                    typeof email !==
                    "string"

                    ||

                    typeof password !==
                    "string"

                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            "Email and password are required"

                    });

                }



                // ============================================
                // PASSWORD LENGTH PROTECTION
                // ============================================

                if (

                    password.length ===
                    0

                    ||

                    password.length >
                    MAX_PASSWORD_LENGTH

                ) {

                    return res.status(401).json({

                        success:
                            false,


                        error:
                            "Invalid email or password"

                    });

                }



                const cleanEmail =
                    normalizeEmail(
                        email
                    );



                // ============================================
                // FIND USER
                // ============================================

                const user =
                    isValidEmail(
                        cleanEmail
                    )

                        ? await usersCollection.findOne(

                            {

                                email:
                                    cleanEmail

                            }

                        )

                        : null;



                // ============================================
                // PASSWORD CHECK
                // ============================================

                const passwordHash =
                    user?.password ||
                    DUMMY_PASSWORD_HASH;



                const passwordMatch =
                    await bcrypt.compare(

                        password,

                        passwordHash

                    );



                // ============================================
                // GENERIC FAILURE
                // ============================================

                if (

                    !user

                    ||

                    !passwordMatch

                ) {

                    return res.status(401).json({

                        success:
                            false,


                        error:
                            "Invalid email or password"

                    });

                }



                // ============================================
                // GENERATE AUTH TOKEN
                // ============================================

                const token =
                    createAuthToken(

                        user._id

                    );



                // ============================================
                // SUCCESS
                // ============================================

                return res.json({

                    success:
                        true,


                    message:
                        "Login successful",


                    token:
                        token,


                    user: {

                        id:
                            user
                                ._id
                                .toString(),


                        name:
                            user.name,


                        username:
                            user.username,


                        email:
                            user.email,


                        bio:
                            user.bio ||
                            "",


                        avatarUrl:
                            user.avatarUrl ||
                            ""

                    }

                });


            } catch (
                error
            ) {


                console.error(

                    "Login error:",

                    error

                );



                return res.status(500).json({

                    success:
                        false,


                    error:
                        "Could not login"

                });

            }


        }

    );



    // ========================================================
    // FORGOT PASSWORD
    // ========================================================

    router.post(

        "/forgot-password",

        forgotPasswordLimiter,

        async (
            req,
            res
        ) => {


            const genericMessage =
                "If an account exists for this email, a password reset link has been sent.";



            try {


                const {
                    email
                } =
                    req.body ||
                    {};



                if (

                    typeof email !==
                    "string"

                ) {

                    return res.json({

                        success:
                            true,


                        message:
                            genericMessage

                    });

                }



                const cleanEmail =
                    normalizeEmail(
                        email
                    );



                if (

                    !isValidEmail(
                        cleanEmail
                    )

                ) {

                    return res.json({

                        success:
                            true,


                        message:
                            genericMessage

                    });

                }



                // ============================================
                // FIND USER
                // ============================================

                const user =
                    await usersCollection.findOne(

                        {

                            email:
                                cleanEmail

                        },

                        {

                            projection: {

                                _id:
                                    1

                            }

                        }

                    );



                // ============================================
                // DO NOT REVEAL ACCOUNT EXISTENCE
                // ============================================

                if (
                    !user
                ) {

                    return res.json({

                        success:
                            true,


                        message:
                            genericMessage

                    });

                }



                // ============================================
                // CREATE SECURE RESET TOKEN
                // ============================================

                const rawToken =
                    crypto
                        .randomBytes(
                            32
                        )
                        .toString(
                            "hex"
                        );



                const tokenHash =
                    hashResetToken(
                        rawToken
                    );



                const tokenExpiresAt =
                    new Date(

                        Date.now()

                        +

                        RESET_TOKEN_EXPIRY_MINUTES *
                        60 *
                        1000

                    );



                // ============================================
                // SAVE HASHED TOKEN
                // ============================================

                await usersCollection.updateOne(

                    {

                        _id:
                            user._id

                    },

                    {

                        $set: {

                            resetTokenHash:
                                tokenHash,


                            resetTokenExpiresAt:
                                tokenExpiresAt

                        }

                    }

                );



                // ============================================
                // CREATE RESET URL
                // ============================================

                const baseUrl =
                    (

                        process.env.APP_BASE_URL ||

                        "http://localhost:3000"

                    )
                        .replace(
                            /\/+$/,
                            ""
                        );



                const resetUrl =
                    `${baseUrl}/reset-password.html?token=${encodeURIComponent(rawToken)}`;



                // ============================================
                // SEND EMAIL
                // ============================================

                await sendPasswordResetEmail({

                    email:
                        cleanEmail,


                    resetUrl:
                        resetUrl,


                    expiryMinutes:
                        RESET_TOKEN_EXPIRY_MINUTES

                });



                return res.json({

                    success:
                        true,


                    message:
                        genericMessage

                });


            } catch (
                error
            ) {


                console.error(

                    "Forgot password error:",

                    error

                );



                return res.json({

                    success:
                        true,


                    message:
                        genericMessage

                });

            }


        }

    );



    // ========================================================
    // RESET PASSWORD
    // ========================================================

    router.post(

        "/reset-password",

        resetPasswordLimiter,

        async (
            req,
            res
        ) => {


            try {


                const {
                    token,
                    password
                } =
                    req.body ||
                    {};



                // ============================================
                // TOKEN VALIDATION
                // ============================================

                if (

                    typeof token !==
                    "string"

                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            "Invalid reset token"

                    });

                }



                const cleanToken =
                    token.trim();



                if (

                    !cleanToken

                    ||

                    cleanToken.length >
                    256

                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            "Invalid reset token"

                    });

                }



                // ============================================
                // PASSWORD VALIDATION
                // ============================================

                if (

                    !isValidPassword(
                        password
                    )

                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters long`

                    });

                }



                // ============================================
                // HASH TOKEN
                // ============================================

                const tokenHash =
                    hashResetToken(
                        cleanToken
                    );



                // ============================================
                // FIND VALID TOKEN
                // ============================================

                const now =
                    new Date();



                const user =
                    await usersCollection.findOne(

                        {

                            resetTokenHash:
                                tokenHash,


                            resetTokenExpiresAt: {

                                $gt:
                                    now

                            }

                        },

                        {

                            projection: {

                                _id:
                                    1

                            }

                        }

                    );



                if (
                    !user
                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            "This password reset link is invalid or has expired."

                    });

                }



                // ============================================
                // HASH NEW PASSWORD
                // ============================================

                const hashedPassword =
                    await bcrypt.hash(

                        password,

                        BCRYPT_SALT_ROUNDS

                    );



                // ============================================
                // ATOMIC PASSWORD UPDATE
                // ============================================

                const updateResult =
                    await usersCollection.updateOne(

                        {

                            _id:
                                user._id,


                            resetTokenHash:
                                tokenHash,


                            resetTokenExpiresAt: {

                                $gt:
                                    new Date()

                            }

                        },

                        {

                            $set: {

                                password:
                                    hashedPassword

                            },


                            $unset: {

                                resetTokenHash:
                                    "",


                                resetTokenExpiresAt:
                                    ""

                            }

                        }

                    );



                if (

                    updateResult.modifiedCount !==
                    1

                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            "This password reset link is invalid or has expired."

                    });

                }



                return res.json({

                    success:
                        true,


                    message:
                        "Password updated successfully"

                });


            } catch (
                error
            ) {


                console.error(

                    "Reset password error:",

                    error

                );



                return res.status(500).json({

                    success:
                        false,


                    error:
                        "Could not reset password"

                });

            }


        }

    );



    // ========================================================
    // RETURN ROUTER
    // ========================================================

    return router;


}



// ============================================================
// MODULE EXPORT
// ============================================================

module.exports =
    createAuthRouter;