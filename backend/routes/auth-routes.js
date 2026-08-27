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
        async (req, res) => {


            const {
                name,
                username,
                email,
                password
            } =
                req.body;



            try {


                // ============================================
                // REQUIRED FIELDS
                // ============================================

                if (
                    !name ||
                    !username ||
                    !email ||
                    !password
                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "All fields are required"

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
                            "Name cannot exceed 80 characters"

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
                // PASSWORD VALIDATION
                // ============================================

                if (
                    typeof password !==
                    "string"
                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Invalid password"

                    });

                }



                if (
                    password.length <
                    8
                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Password must be at least 8 characters long"

                    });

                }



                // ============================================
                // CHECK EXISTING EMAIL
                // ============================================

                const existingEmail =
                    await usersCollection.findOne({

                        email:
                            cleanEmail

                    });



                if (
                    existingEmail
                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Email already registered"

                    });

                }



                // ============================================
                // CHECK EXISTING USERNAME
                // ============================================

                const existingUsername =
                    await usersCollection.findOne({

                        username:
                            cleanUsername

                    });



                if (
                    existingUsername
                ) {

                    return res.status(409).json({

                        success:
                            false,

                        error:
                            "Username already taken"

                    });

                }



                // ============================================
                // HASH PASSWORD
                // ============================================

                const hashedPassword =
                    await bcrypt.hash(

                        password,

                        10

                    );



                // ============================================
                // CREATE USER
                // ============================================

                const user = {

                    name:
                        cleanedName,

                    username:
                        cleanUsername,

                    email:
                        cleanEmail,

                    bio:
                        "",

                    avatarUrl:
                        "",

                    avatarPublicId:
                        "",

                    password:
                        hashedPassword,

                    createdAt:
                        new Date()

                };



                // ============================================
                // SAVE USER
                // ============================================

                const result =
                    await usersCollection.insertOne(
                        user
                    );



                console.log(
                    "New user registered:",
                    cleanUsername
                );



                // ============================================
                // SUCCESS RESPONSE
                // ============================================

                return res.status(201).json({

                    success:
                        true,

                    message:
                        "Registration successful",

                    user: {

                        id:
                            result
                                .insertedId
                                .toString(),

                        name:
                            user.name,

                        username:
                            user.username,

                        email:
                            user.email,

                        bio:
                            user.bio,

                        avatarUrl:
                            user.avatarUrl

                    }

                });



            } catch (error) {


                // ============================================
                // DUPLICATE KEY ERROR
                // ============================================

                if (
                    error &&
                    error.code === 11000
                ) {

                    return res.status(409).json({

                        success:
                            false,

                        error:
                            "Username or email already exists"

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
        async (req, res) => {


            const {
                email,
                password
            } =
                req.body;



            try {


                // ============================================
                // VALIDATION
                // ============================================

                if (
                    !email ||
                    !password
                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Email and password are required"

                    });

                }



                if (
                    typeof password !==
                    "string"
                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Invalid password"

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
                    await usersCollection.findOne({

                        email:
                            cleanEmail

                    });



                if (
                    !user
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "Account not found. Please register first."

                    });

                }



                // ============================================
                // CHECK PASSWORD
                // ============================================

                const passwordMatch =
                    await bcrypt.compare(

                        password,

                        user.password

                    );



                if (
                    !passwordMatch
                ) {

                    return res.status(401).json({

                        success:
                            false,

                        error:
                            "Incorrect password."

                    });

                }



                console.log(
                    "User logged in:",
                    user.username
                );



                // ============================================
                // SUCCESS RESPONSE
                // ============================================

                return res.json({

                    success:
                        true,

                    message:
                        "Login successful",

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



            } catch (error) {


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
        async (req, res) => {


            try {


                const {
                    email
                } =
                    req.body;



                const genericMessage =
                    "If an account exists for this email, a password reset link has been sent.";



                // ============================================
                // GENERIC RESPONSE
                // ============================================

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
                    !cleanEmail
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
                    await usersCollection.findOne({

                        email:
                            cleanEmail

                    });



                // Do not reveal whether an account exists.

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
                // CREATE RESET TOKEN
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
                    crypto
                        .createHash(
                            "sha256"
                        )
                        .update(
                            rawToken
                        )
                        .digest(
                            "hex"
                        );



                const tokenExpiresAt =
                    new Date(

                        Date.now() +

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



            } catch (error) {


                console.error(
                    "Forgot password error:",
                    error
                );



                return res.status(500).json({

                    success:
                        false,

                    error:
                        "Could not process password reset request"

                });

            }


        }
    );



    // ========================================================
    // RESET PASSWORD
    // ========================================================

    router.post(
        "/reset-password",
        async (req, res) => {


            try {


                const {
                    token,
                    password
                } =
                    req.body;



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
                    typeof password !==
                    "string"
                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Invalid password"

                    });

                }



                if (
                    password.length <
                    8
                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Password must be at least 8 characters long"

                    });

                }



                // ============================================
                // HASH TOKEN
                // ============================================

                const tokenHash =
                    crypto
                        .createHash(
                            "sha256"
                        )
                        .update(
                            cleanToken
                        )
                        .digest(
                            "hex"
                        );



                // ============================================
                // FIND VALID TOKEN
                // ============================================

                const user =
                    await usersCollection.findOne({

                        resetTokenHash:
                            tokenHash,

                        resetTokenExpiresAt: {

                            $gt:
                                new Date()

                        }

                    });



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

                        10

                    );



                // ============================================
                // UPDATE PASSWORD
                // ============================================

                await usersCollection.updateOne(

                    {

                        _id:
                            user._id,

                        resetTokenHash:
                            tokenHash

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



                console.log(
                    "Password reset successfully for:",
                    user.email
                );



                return res.json({

                    success:
                        true,

                    message:
                        "Password updated successfully"

                });



            } catch (error) {


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