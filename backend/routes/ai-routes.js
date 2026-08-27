// ============================================================
// AI ROUTES
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
    1000;


const MAX_AI_OUTPUT_TOKENS =
    800;



// ============================================================
// AI RATE LIMIT
// ============================================================

const aiLimiter =
    rateLimit({

        windowMs:
            15 *
            60 *
            1000,


        max:
            30,


        standardHeaders:
            true,


        legacyHeaders:
            false,


        message: {

            success:
                false,


            error:
                "Too many AI requests. Please wait a few minutes and try again."

        }

    });



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

You are Dheere AI, the AI assistant for Dheere Studio.

Your primary role is to help visitors understand Dheere Studio,
its projects, website features, and publicly available information.

ABOUT DHEERE STUDIO:

Dheere Studio is an independent creative studio focused on original
stories, fictional worlds, worldbuilding, and interactive experiences
across different forms of media, including animation and games.

FEATURED PROJECT:

Shunyavas is an original fantasy universe created by Dheere Studio.
It is currently in development.

WEBSITE FEATURES:

- Projects showcase Dheere Studio projects.
- Articles contain studio writing, ideas, and development-related content.
- Community allows users to share posts.
- Visitors can register and log in to user accounts.
- Each username must be unique.
- Users have their own profiles.
- Users can publish posts.
- Profiles can display a user's own posts.
- The community feed can display posts from multiple users.
- Visitors can send feedback to Dheere Studio.

ANSWER QUALITY:

1. Answer the actual question directly before adding extra information.

2. Match the length of your answer to the complexity of the question.

3. For a simple question, give a clear and complete short answer.

4. For a question that asks for an explanation, details, comparison,
   reasoning, or multiple points, provide a properly developed answer.

5. Do not give artificially short answers when more explanation is
   necessary.

6. Do not stop after a few words if the user's question clearly requires
   context or explanation.

7. Prefer clear paragraphs and bullet points when they improve readability.

8. Be concise when possible, but prioritize completeness and usefulness.

9. Do not repeat the same information unnecessarily.

ACCURACY RULES:

1. Never invent achievements, milestones, partnerships, releases,
   statistics, team members, or other facts about Dheere Studio.

2. Do not claim Dheere Studio is bigger, more successful, or more
   established than the available information supports.

3. If information about Dheere Studio is not available to you,
   clearly say that you do not have that information.

4. Do not invent details about Shunyavas, including its characters,
   story, world, lore, release date, development progress, or future plans.

5. Clearly distinguish between confirmed information and information
   that is not available.

UNRELATED QUESTIONS:

If the user asks something unrelated to Dheere Studio, you may still
answer normally and helpfully.

However, do not claim access to private Dheere Studio information,
internal documents, user data, passwords, accounts, or unpublished
project details.

STYLE:

Be natural, clear, intelligent, and helpful.

Avoid robotic answers.

Do not unnecessarily limit an answer to one sentence.

Do not be excessively verbose unless the user asks for detailed
information.

`;



// ============================================================
// AI CHAT
// ============================================================

router.post(

    "/ai-chat",

    aiLimiter,

    async (

        req,

        res

    ) => {

        try {

            // =============================================
            // GET MESSAGE
            // =============================================

            const {
                message
            } =
                req.body ||
                {};



            // =============================================
            // VALIDATE TYPE
            // =============================================

            if (

                typeof message !==
                "string"

            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,


                    error:
                        "Message must be a valid string"

                });

            }



            // =============================================
            // CLEAN MESSAGE
            // =============================================

            const cleanMessage =
                message.trim();



            // =============================================
            // EMPTY MESSAGE
            // =============================================

            if (

                !cleanMessage

            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,


                    error:
                        "Message cannot be empty"

                });

            }



            // =============================================
            // MESSAGE LENGTH
            // =============================================

            if (

                cleanMessage.length >
                MAX_AI_MESSAGE_LENGTH

            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,


                    error:

                        `Message must be ${MAX_AI_MESSAGE_LENGTH} characters or fewer`

                });

            }



            // =============================================
            // API KEY CHECK
            // =============================================

            if (

                !process.env.GEMINI_API_KEY

            ) {

                console.error(

                    "GEMINI_API_KEY is missing"

                );


                return res.status(
                    503
                ).json({

                    success:
                        false,


                    error:
                        "Dheere AI is temporarily unavailable"

                });

            }



            // =============================================
            // GENERATE RESPONSE
            // =============================================

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
                            MAX_AI_OUTPUT_TOKENS

                    }

                });



            // =============================================
            // GET ANSWER
            // =============================================

            const answer =
                response.text?.trim();



            // =============================================
            // EMPTY RESPONSE
            // =============================================

            if (

                !answer

            ) {

                console.error(

                    "Gemini returned an empty response"

                );


                return res.status(
                    502
                ).json({

                    success:
                        false,


                    error:

                        "Dheere AI could not generate a response. Please try again."

                });

            }



            // =============================================
            // SUCCESS
            // =============================================

            return res.json({

                success:
                    true,


                answer:
                    answer

            });


        } catch (error) {

            // =============================================
            // ERROR LOG
            // =============================================

            console.error(

                "Dheere AI error:",

                {

                    message:
                        error?.message,


                    status:
                        error?.status

                }

            );



            // =============================================
            // RATE / QUOTA ERROR
            // =============================================

            if (

                error?.status ===
                429

            ) {

                return res.status(
                    429
                ).json({

                    success:
                        false,


                    error:

                        "Dheere AI is receiving too many requests right now. Please try again shortly."

                });

            }



            // =============================================
            // SERVICE ERROR
            // =============================================

            return res.status(
                503
            ).json({

                success:
                    false,


                error:

                    "Dheere AI is temporarily unavailable. Please try again later."

            });

        }

    }

);



// ============================================================
// MODULE EXPORTS
// ============================================================

module.exports =
    router;