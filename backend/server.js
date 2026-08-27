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
        "./social-routes"
    );



// ============================================================
// EXPRESS APP
// ============================================================

const app =
    express();



// ============================================================
// CORS
// ============================================================

app.use(
    cors()
);



// ============================================================
// JSON BODY PARSER
// ============================================================

/*
 * Profile photos are sent as base64 Data URIs.
 *
 * 6 MB JSON limit gives enough room for
 * a 3 MB image after base64 expansion.
 */

app.use(

    express.json({

        limit:
            "6mb"

    })

);



// ============================================================
// HOME
// ============================================================

app.get(

    "/",

    (req, res) => {

        return res.send(

            "Dheere Studio backend is running"

        );

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
        // PORT
        // ====================================================

        const PORT =

            process.env.PORT ||

            3000;



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