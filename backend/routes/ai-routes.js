// ============================================================
// AI ROUTES
// ============================================================

const express =
    require(
        "express"
    );


const {
    GoogleGenAI
} =
    require(
        "@google/genai"
    );



const router =
    express.Router();



// ============================================================
// CONFIG
// ============================================================

const MAX_AI_MESSAGE_LENGTH =
    500;



// ============================================================
// GEMINI CLIENT
// ============================================================

const ai =
    new GoogleGenAI({

        apiKey:
            process.env.GEMINI_API_KEY

    });



// ============================================================
// DHEERE AI SYSTEM INSTRUCTION
// ============================================================

const DHEERE_AI_SYSTEM_INSTRUCTION = `

You are Dheere AI, the small AI assistant for Dheere Studio.

Your job is to answer visitor questions about Dheere Studio accurately,
clearly, and concisely.

ABOUT DHEERE STUDIO:

Dheere Studio is an independent creative studio focused on original
stories, fictional worlds, worldbuilding, and interactive experiences
across different forms of media such as animation and games.

FEATURED PROJECT:

Shunyavas is an original fantasy universe created by Dheere Studio.
It is currently in development.

WEBSITE FEATURES:

- Projects: showcases Dheere Studio projects.
- Articles: studio writing, ideas, and development-related articles.
- Community: a space where users can share posts.
- User accounts: visitors can register and log in.
- Unique usernames: each username must be unique.
- Profiles: users have their own profile.
- Posts: users can publish posts.
- Profile posts: a user's profile shows that user's own posts.
- Community feed: the community can show posts from multiple users.
- Feedback: visitors can send feedback to the studio.

IMPORTANT BEHAVIOR:

1. Be positive and welcoming, but never invent achievements.

2. Do not claim Dheere Studio is bigger, more successful, or more
   established than the information provided here supports.

3. If you do not know something about Dheere Studio,
   clearly say that the information is not available.

4. Do not make up details about Shunyavas, its characters,
   story, world, release date, or development progress.

5. Keep answers reasonably concise.

6. If the user asks something unrelated to Dheere Studio,
   you can still answer briefly, but do not pretend to be
   an authority on private information.

`;



// ============================================================
// AI CHAT
// ============================================================

router.post(
    "/ai-chat",
    async (req, res) => {

        try {

            // =================================================
            // GET MESSAGE
            // =================================================

            const {
                message
            } =
                req.body;



            // =================================================
            // VALIDATE TYPE
            // =================================================

            if (
                typeof message !==
                "string"
            ) {

                return res.status(400).json({

                    success:
                        false,

                    error:
                        "Message is required"

                });

            }



            // =================================================
            // CLEAN MESSAGE
            // =================================================

            const cleanMessage =
                message.trim();



            // =================================================
            // EMPTY MESSAGE
            // =================================================

            if (
                !cleanMessage
            ) {

                return res.status(400).json({

                    success:
                        false,

                    error:
                        "Message cannot be empty"

                });

            }



            // =================================================
            // MESSAGE LENGTH
            // =================================================

            if (
                cleanMessage.length >
                MAX_AI_MESSAGE_LENGTH
            ) {

                return res.status(400).json({

                    success:
                        false,

                    error:
                        "Message is too long"

                });

            }



            // =================================================
            // API KEY CHECK
            // =================================================

            if (
                !process.env.GEMINI_API_KEY
            ) {

                console.error(
                    "GEMINI_API_KEY is missing"
                );


                return res.status(500).json({

                    success:
                        false,

                    error:
                        "Dheere AI is not configured"

                });

            }



            // =================================================
            // GENERATE RESPONSE
            // =================================================

            const response =
                await ai.models.generateContent({

                    model:
                        "gemini-3.6-flash",


                    contents:
                        cleanMessage,


                    config: {

                        systemInstruction:
                            DHEERE_AI_SYSTEM_INSTRUCTION,


                        maxOutputTokens:
                            300

                    }

                });



            // =================================================
            // GET ANSWER
            // =================================================

            const answer =
                response.text?.trim();



            // =================================================
            // EMPTY RESPONSE
            // =================================================

            if (
                !answer
            ) {

                return res.status(502).json({

                    success:
                        false,

                    error:
                        "Dheere AI could not generate a response"

                });

            }



            // =================================================
            // SUCCESS
            // =================================================

            return res.json({

                success:
                    true,


                answer:
                    answer

            });


        } catch (error) {

            // =================================================
            // ERROR
            // =================================================

            console.error(
                "Dheere AI error:",
                error
            );



            return res.status(500).json({

                success:
                    false,

                error:
                    "Dheere AI is temporarily unavailable"

            });

        }

    }
);



// ============================================================
// MODULE EXPORTS
// ============================================================

module.exports =
    router;