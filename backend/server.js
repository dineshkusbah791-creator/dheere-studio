// ============================================================
// ENVIRONMENT
// ============================================================

require(
    "dotenv"
).config();



// ============================================================
// DEPENDENCIES
// ============================================================

const express =
    require(
        "express"
    );


const cors =
    require(
        "cors"
    );


const helmet =
    require(
        "helmet"
    );


const rateLimit =
    require(
        "express-rate-limit"
    );



// ============================================================
// DATABASE
// ============================================================

const {
    connectDatabase
} =
    require(
        "./config/database"
    );



// ============================================================
// ROUTES
// ============================================================

const createAuthRouter =
    require(
        "./routes/auth-routes"
    );


const createGoogleAuthRouter =
    require(
        "./routes/google-auth-routes"
    );


const createOtpRouter =
    require(
        "./routes/otp-routes"
    );


const createProfileRouter =
    require(
        "./routes/profile-routes"
    );


const aiRouter =
    require(
        "./routes/ai-routes"
    );


const createFeedbackRouter =
    require(
        "./routes/feedback-routes"
    );


const createSocialRouter =
    require(
        "./routes/social/social-routes"
    );



// ============================================================
// ENVIRONMENT CONFIGURATION
// ============================================================

const NODE_ENV =
    process.env.NODE_ENV ||
    "development";


const PORT =
    process.env.PORT ||
    3000;



// ============================================================
// REQUIRED ENVIRONMENT VARIABLES
// ============================================================

const REQUIRED_ENVIRONMENT_VARIABLES = [

    "MONGODB_URI",

    "JWT_SECRET"

];



for (

    const variableName
    of REQUIRED_ENVIRONMENT_VARIABLES

) {

    if (

        !process.env[
            variableName
        ]

    ) {

        console.error(

            `Missing required environment variable: ${variableName}`

        );


        process.exit(
            1
        );

    }

}



// ============================================================
// EXPRESS APP
// ============================================================

const app =
    express();



// ============================================================
// TRUST PROXY
// ============================================================

if (

    NODE_ENV ===
    "production"

) {

    app.set(

        "trust proxy",

        1

    );

}



// ============================================================
// SECURITY HEADERS
// ============================================================

app.use(

    helmet({

        crossOriginResourcePolicy: {

            policy:
                "cross-origin"

        }

    })

);



// ============================================================
// ALLOWED CORS ORIGINS
// ============================================================

const ALLOWED_ORIGINS =
    new Set(

        [

            // ------------------------------------------------
            // PRODUCTION DOMAIN
            // ------------------------------------------------

            "https://dheerestudio.com",

            "https://www.dheerestudio.com",


            // ------------------------------------------------
            // RENDER DOMAIN
            // ------------------------------------------------

            "https://dheere-studio.onrender.com"

        ]

    );



// ============================================================
// OPTIONAL FRONTEND URL FROM ENVIRONMENT
// ============================================================

if (

    process.env.FRONTEND_URL

) {

    const frontendUrl =
        process.env.FRONTEND_URL
            .trim()
            .replace(
                /\/$/,
                ""
            );


    if (

        frontendUrl

    ) {

        ALLOWED_ORIGINS.add(

            frontendUrl

        );

    }

}



// ============================================================
// ADDITIONAL CORS ORIGINS FROM ENVIRONMENT
// ============================================================

if (

    process.env.ALLOWED_ORIGINS

) {

    const additionalOrigins =
        process.env.ALLOWED_ORIGINS
            .split(
                ","
            )
            .map(

                origin =>
                    origin
                        .trim()
                        .replace(
                            /\/$/,
                            ""
                        )

            )
            .filter(
                Boolean
            );



    for (

        const origin
        of additionalOrigins

    ) {

        ALLOWED_ORIGINS.add(
            origin
        );

    }

}



// ============================================================
// LOCAL DEVELOPMENT ORIGINS
// ============================================================

const LOCAL_ORIGIN_REGEX =
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;



// ============================================================
// RENDER ORIGIN REGEX
// ============================================================

const RENDER_ORIGIN_REGEX =
    /^https:\/\/[a-z0-9-]+\.onrender\.com$/i;



// ============================================================
// NORMALIZE ORIGIN
// ============================================================

function normalizeOrigin(
    origin
) {

    if (

        typeof origin !==
        "string"

    ) {

        return "";

    }



    return origin
        .trim()
        .replace(
            /\/$/,
            ""
        );

}



// ============================================================
// CHECK ALLOWED ORIGIN
// ============================================================

function isAllowedOrigin(
    origin
) {

    const normalizedOrigin =
        normalizeOrigin(
            origin
        );



    if (

        !normalizedOrigin

    ) {

        return true;

    }



    // --------------------------------------------------------
    // EXACT ALLOWED ORIGINS
    // --------------------------------------------------------

    if (

        ALLOWED_ORIGINS.has(
            normalizedOrigin
        )

    ) {

        return true;

    }



    // --------------------------------------------------------
    // LOCAL DEVELOPMENT
    // --------------------------------------------------------

    if (

        NODE_ENV !==
        "production" &&

        LOCAL_ORIGIN_REGEX.test(
            normalizedOrigin
        )

    ) {

        return true;

    }



    // --------------------------------------------------------
    // RENDER FRONTEND / PREVIEW
    // --------------------------------------------------------

    if (

        RENDER_ORIGIN_REGEX.test(
            normalizedOrigin
        )

    ) {

        return true;

    }



    return false;

}



// ============================================================
// CORS
// ============================================================

const corsOptions = {

    origin:

        function (

            origin,

            callback

        ) {

            // ------------------------------------------------
            // REQUEST WITHOUT ORIGIN
            // ------------------------------------------------
            //
            // Examples:
            //
            // - Render health checks
            // - curl
            // - server-to-server requests
            //

            if (

                !origin

            ) {

                return callback(

                    null,

                    true

                );

            }



            // ------------------------------------------------
            // ALLOWED ORIGIN
            // ------------------------------------------------

            if (

                isAllowedOrigin(
                    origin
                )

            ) {

                return callback(

                    null,

                    true

                );

            }



            // ------------------------------------------------
            // REJECTED ORIGIN LOG
            // ------------------------------------------------

            console.error(

                "CORS blocked origin:",

                {

                    origin,

                    normalizedOrigin:
                        normalizeOrigin(
                            origin
                        ),


                    allowedOrigins:

                        Array.from(
                            ALLOWED_ORIGINS
                        )

                }

            );



            return callback(

                new Error(
                    "Not allowed by CORS"
                )

            );

        },


    methods: [

        "GET",

        "POST",

        "PUT",

        "PATCH",

        "DELETE",

        "OPTIONS"

    ],


    allowedHeaders: [

        "Content-Type",

        "Authorization",

        "Accept"

    ],


    exposedHeaders: [

        "Content-Type"

    ],


    credentials:
        false,


    maxAge:
        86400,


    optionsSuccessStatus:
        204

};



// ============================================================
// ENABLE CORS
// ============================================================

app.use(

    cors(
        corsOptions
    )

);



// ============================================================
// JSON BODY PARSER
// ============================================================

app.use(

    express.json({

        limit:
            "6mb"

    })

);



// ============================================================
// GLOBAL RATE LIMIT
// ============================================================

const globalLimiter =
    rateLimit({

        windowMs:

            15 *
            60 *
            1000,


        max:

            NODE_ENV ===
            "production"

                ? 300

                : 1000,


        standardHeaders:
            true,


        legacyHeaders:
            false,


        message: {

            success:
                false,


            error:
                "Too many requests. Please try again later."

        }

    });



app.use(

    globalLimiter

);



// ============================================================
// HOME / HEALTH CHECK
// ============================================================

app.get(

    "/",

    (

        req,

        res

    ) => {

        return res.json({

            success:
                true,


            message:
                "Dheere Studio backend is running"

        });

    }

);



// ============================================================
// START SERVER
// ============================================================

async function startServer() {

    try {


        // ====================================================
        // CONNECT DATABASE
        // ====================================================

        const {

            feedbackCollection,

            usersCollection,

            postsCollection,

            notificationsCollection

        } =
            await connectDatabase();



        // ====================================================
        // AUTH ROUTES
        // ====================================================

        app.use(

            "/",

            createAuthRouter({

                usersCollection

            })

        );



        // ====================================================
        // GOOGLE AUTH ROUTES
        // ====================================================

        app.use(

            "/",

            createGoogleAuthRouter({

                usersCollection

            })

        );



        // ====================================================
        // MSG91 OTP ROUTES
        // ====================================================

        app.use(

            "/",

            createOtpRouter()

        );



        // ====================================================
        // PROFILE ROUTES
        // ====================================================

        app.use(

            "/",

            createProfileRouter({

                usersCollection

            })

        );



        // ====================================================
        // AI ROUTES
        // ====================================================

        app.use(

            "/",

            aiRouter

        );



        // ====================================================
        // FEEDBACK ROUTES
        // ====================================================

        app.use(

            "/",

            createFeedbackRouter(

                feedbackCollection

            )

        );



        // ====================================================
        // SOCIAL ROUTES
        // ====================================================

        app.use(

            "/",

            createSocialRouter({

                postsCollection,

                usersCollection,

                notificationsCollection

            })

        );



        // ====================================================
        // 404 HANDLER
        // ====================================================

        app.use(

            (

                req,

                res

            ) => {

                return res.status(
                    404
                ).json({

                    success:
                        false,


                    error:
                        "Route not found"

                });

            }

        );



        // ====================================================
        // GLOBAL ERROR HANDLER
        // ====================================================

        app.use(

            (

                error,

                req,

                res,

                next

            ) => {

                console.error(

                    "Server error:",

                    {

                        message:
                            error.message,


                        path:
                            req.originalUrl,


                        method:
                            req.method,


                        origin:
                            req.headers.origin ||
                            null

                    }

                );



                // =============================================
                // CORS ERROR
                // =============================================

                if (

                    error.message ===
                    "Not allowed by CORS"

                ) {

                    return res.status(
                        403
                    ).json({

                        success:
                            false,


                        error:
                            "Request origin is not allowed"

                    });

                }



                // =============================================
                // JSON PARSE ERROR
                // =============================================

                if (

                    error instanceof
                    SyntaxError &&

                    error.status ===
                    400 &&

                    "body" in
                    error

                ) {

                    return res.status(
                        400
                    ).json({

                        success:
                            false,


                        error:
                            "Invalid JSON request body"

                    });

                }



                // =============================================
                // BODY TOO LARGE
                // =============================================

                if (

                    error.type ===
                    "entity.too.large"

                ) {

                    return res.status(
                        413
                    ).json({

                        success:
                            false,


                            error:
                                "Request body is too large"

                        });

                }



                // =============================================
                // GENERIC ERROR
                // =============================================

                return res.status(
                    500
                ).json({

                    success:
                        false,


                    error:

                        NODE_ENV ===
                        "production"

                            ? "Internal server error"

                            : error.message

                });

            }

        );



        // ====================================================
        // RESEND CHECK
        // ====================================================

        if (

            !process.env.RESEND_API_KEY

        ) {

            console.warn(

                "RESEND_API_KEY is missing"

            );

        } else {

            console.log(

                "Resend email system initialized"

            );

        }



        // ====================================================
        // GEMINI CHECK
        // ====================================================

        if (

            !process.env.GEMINI_API_KEY

        ) {

            console.warn(

                "GEMINI_API_KEY is missing"

            );

        } else {

            console.log(

                "Gemini AI system initialized"

            );

        }



        // ====================================================
        // CLOUDINARY CHECK
        // ====================================================

        if (

            !process.env.CLOUDINARY_CLOUD_NAME ||

            !process.env.CLOUDINARY_API_KEY ||

            !process.env.CLOUDINARY_API_SECRET

        ) {

            console.warn(

                "Cloudinary environment variables are incomplete"

            );

        } else {

            console.log(

                "Cloudinary system initialized"

            );

        }



        // ====================================================
        // CORS CONFIG LOG
        // ====================================================

        console.log(

            "CORS allowed origins:",

            Array.from(
                ALLOWED_ORIGINS
            )

        );



        // ====================================================
        // START LISTENING
        // ====================================================

        app.listen(

            PORT,

            "0.0.0.0",

            () => {

                console.log(

                    `Server running on port ${PORT}`

                );


                console.log(

                    `Environment: ${NODE_ENV}`

                );

            }

        );


    } catch (error) {


        // ====================================================
        // STARTUP ERROR
        // ====================================================

        console.error(

            "Server startup failed:",

            error

        );


        process.exit(
            1
        );

    }

}



// ============================================================
// START
// ============================================================

startServer();