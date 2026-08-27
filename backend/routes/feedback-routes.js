// ============================================================
// FEEDBACK ROUTES
// ============================================================

const express =
    require(
        "express"
    );



const {
    cleanName,
    normalizeEmail
} =
    require(
        "../utils/validators"
    );



const router =
    express.Router();



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
                // REQUIRED FIELDS
                // =================================================

                if (
                    !name ||
                    !email ||
                    !message
                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "All fields are required"

                    });

                }



                // =================================================
                // CLEAN DATA
                // =================================================

                const feedback = {

                    name:
                        cleanName(
                            name
                        ),


                    email:
                        normalizeEmail(
                            email
                        ),


                    message:
                        typeof message ===
                        "string"

                            ? message.trim()

                            : "",


                    createdAt:
                        new Date()

                };



                // =================================================
                // VALIDATE CLEANED DATA
                // =================================================

                if (
                    !feedback.name ||
                    !feedback.email ||
                    !feedback.message
                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "All fields are required"

                    });

                }



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

                return res.json({

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