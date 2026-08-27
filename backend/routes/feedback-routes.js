// ============================================================
// DEPENDENCIES
// ============================================================

const express =
    require(
        "express"
    );


const rateLimit =
    require(
        "express-rate-limit"
    );


const {
    cleanName,
    normalizeEmail,
    MAX_NAME_LENGTH
} =
    require(
        "../utils/validators"
    );



// ============================================================
// ROUTER
// ============================================================

const router =
    express.Router();



// ============================================================
// CONFIG
// ============================================================

const MAX_FEEDBACK_MESSAGE_LENGTH =
    3000;



const EMAIL_REGEX =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



// ============================================================
// FEEDBACK RATE LIMIT
// ============================================================

const feedbackLimiter =
    rateLimit({

        windowMs:
            15 *
            60 *
            1000,


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
                "Too many feedback submissions. Please try again later."

        }

    });



// ============================================================
// CREATE ROUTER
// ============================================================

function createFeedbackRouter(
    feedbackCollection
) {


    // ========================================================
    // FEEDBACK
    // ========================================================

    router.post(

        "/feedback",

        feedbackLimiter,

        async (req, res) => {

            try {


                // =================================================
                // GET DATA
                // =================================================

                const {
                    name,
                    email,
                    message
                } =
                    req.body;



                // =================================================
                // VALIDATE TYPES
                // =================================================

                if (

                    typeof name !==
                    "string" ||

                    typeof email !==
                    "string" ||

                    typeof message !==
                    "string"

                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            "Invalid feedback data"

                    });

                }



                // =================================================
                // CLEAN DATA
                // =================================================

                const cleanFeedbackName =
                    cleanName(
                        name
                    );



                const cleanFeedbackEmail =
                    normalizeEmail(
                        email
                    );



                const cleanFeedbackMessage =
                    message.trim();



                // =================================================
                // REQUIRED FIELDS
                // =================================================

                if (

                    !cleanFeedbackName ||

                    !cleanFeedbackEmail ||

                    !cleanFeedbackMessage

                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            "All fields are required"

                    });

                }



                // =================================================
                // NAME LENGTH
                // =================================================

                if (

                    cleanFeedbackName.length >
                    MAX_NAME_LENGTH

                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            `Name must not exceed ${MAX_NAME_LENGTH} characters`

                    });

                }



                // =================================================
                // EMAIL LENGTH
                // =================================================

                if (

                    cleanFeedbackEmail.length >
                    254

                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            "Email address is too long"

                    });

                }



                // =================================================
                // EMAIL VALIDATION
                // =================================================

                if (

                    !EMAIL_REGEX.test(
                        cleanFeedbackEmail
                    )

                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            "Please provide a valid email address"

                    });

                }



                // =================================================
                // MESSAGE LENGTH
                // =================================================

                if (

                    cleanFeedbackMessage.length >
                    MAX_FEEDBACK_MESSAGE_LENGTH

                ) {

                    return res.status(400).json({

                        success:
                            false,


                        error:
                            `Feedback message must not exceed ${MAX_FEEDBACK_MESSAGE_LENGTH} characters`

                    });

                }



                // =================================================
                // CREATE FEEDBACK
                // =================================================

                const feedback = {

                    name:
                        cleanFeedbackName,


                    email:
                        cleanFeedbackEmail,


                    message:
                        cleanFeedbackMessage,


                    createdAt:
                        new Date()

                };



                // =================================================
                // SAVE FEEDBACK
                // =================================================

                await feedbackCollection.insertOne(
                    feedback
                );



                console.log(
                    "New feedback saved"
                );



                // =================================================
                // SUCCESS
                // =================================================

                return res.status(201).json({

                    success:
                        true,


                    message:
                        "Feedback received successfully"

                });


            } catch (error) {


                // =================================================
                // ERROR
                // =================================================

                console.error(
                    "Error saving feedback:",
                    error
                );



                return res.status(500).json({

                    success:
                        false,


                    error:
                        "Could not save feedback"

                });

            }

        }

    );



    return router;

}



// ============================================================
// MODULE EXPORTS
// ============================================================

module.exports =
    createFeedbackRouter;