// ============================================================
// USER / PUBLIC PROFILE ROUTES
// ============================================================


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
    USERNAME_REGEX,

    normalizeUsername,

    optionalAuthenticateToken,

    getAuthenticatedUserId,

    formatPost,

    escapeRegex

} =
    require(
        "../../utils/social-utils"
    );



// ============================================================
// RULES
// ============================================================

const MAX_SEARCH_QUERY_LENGTH =
    50;


const MAX_POSTS_PER_REQUEST =
    100;


const MAX_USERS_PER_SEARCH =
    20;



// ============================================================
// RATE LIMITERS
// ============================================================

const userReadLimiter =
    rateLimit({

        windowMs:
            15 *
            60 *
            1000,


        max:
            300,


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



const searchLimiter =
    rateLimit({

        windowMs:
            15 *
            60 *
            1000,


        max:
            60,


        standardHeaders:
            true,


        legacyHeaders:
            false,


        message: {

            success:
                false,


            error:
                "Too many search requests. Please try again later."

        }

    });



// ============================================================
// USER ROUTER FACTORY
// ============================================================

module.exports =
    function createUserRouter(
        {

            postsCollection,

            usersCollection

        }
    ) {


        const router =
            express.Router();



        // ====================================================
        // SEARCH USERS
        // ====================================================

        router.get(

            "/search-users",

            searchLimiter,

            async (
                req,
                res
            ) => {

                try {

                    // =========================================
                    // READ QUERY
                    // =========================================

                    const query =
                        typeof req.query.q ===
                        "string"

                            ? req.query.q.trim()

                            : "";


                    // =========================================
                    // EMPTY QUERY
                    // =========================================

                    if (
                        !query
                    ) {

                        return res.json({

                            success:
                                true,


                            users:
                                []

                        });

                    }


                    // =========================================
                    // QUERY LENGTH
                    // =========================================

                    if (

                        query.length >
                        MAX_SEARCH_QUERY_LENGTH

                    ) {

                        return res.status(400).json({

                            success:
                                false,


                            error:
                                `Search query cannot exceed ${MAX_SEARCH_QUERY_LENGTH} characters`

                        });

                    }


                    // =========================================
                    // ESCAPE REGEX
                    // =========================================

                    const safeQuery =
                        escapeRegex(
                            query
                        );


                    // =========================================
                    // SEARCH
                    // =========================================

                    const users =
                        await usersCollection
                            .find(

                                {

                                    $or: [

                                        {

                                            username: {

                                                $regex:
                                                    safeQuery,


                                                $options:
                                                    "i"

                                            }

                                        },

                                        {

                                            name: {

                                                $regex:
                                                    safeQuery,


                                                $options:
                                                    "i"

                                            }

                                        }

                                    ]

                                },

                                {

                                    projection: {

                                        name:
                                            1,


                                        username:
                                            1,


                                        bio:
                                            1,


                                        avatarUrl:
                                            1,


                                        createdAt:
                                            1

                                    }

                                }

                            )
                            .limit(
                                MAX_USERS_PER_SEARCH
                            )
                            .toArray();


                    // =========================================
                    // FORMAT USERS
                    // =========================================

                    const formattedUsers =
                        users.map(

                            (
                                user
                            ) => ({

                                id:

                                    user
                                        ._id
                                        .toString(),


                                name:

                                    user.name ||

                                    "",


                                username:

                                    user.username ||

                                    "",


                                bio:

                                    user.bio ||

                                    "",


                                avatarUrl:

                                    user.avatarUrl ||

                                    "",


                                createdAt:

                                    user.createdAt

                            })

                        );


                    // =========================================
                    // RESPONSE
                    // =========================================

                    return res.json({

                        success:
                            true,


                        users:
                            formattedUsers

                    });


                } catch (
                    error
                ) {

                    console.error(
                        "Search users error:",
                        error
                    );


                    return res.status(500).json({

                        success:
                            false,


                        error:
                            "Could not search users"

                    });

                }

            }

        );



        // ====================================================
        // PUBLIC PROFILE
        // ====================================================

        router.get(

            "/public-profile/:username",

            userReadLimiter,

            optionalAuthenticateToken,

            async (
                req,
                res
            ) => {

                try {

                    // =========================================
                    // NORMALIZE USERNAME
                    // =========================================

                    const username =
                        normalizeUsername(
                            req.params.username
                        );


                    // =========================================
                    // CURRENT USER
                    // =========================================

                    const currentUserId =
                        getAuthenticatedUserId(
                            req
                        );


                    // =========================================
                    // VALIDATE USERNAME
                    // =========================================

                    if (

                        !USERNAME_REGEX.test(
                            username
                        )

                    ) {

                        return res.status(400).json({

                            success:
                                false,


                            error:
                                "Invalid username"

                        });

                    }


                    // =========================================
                    // FIND USER
                    // =========================================

                    const user =
                        await usersCollection.findOne(

                            {

                                username:
                                    username

                            },

                            {

                                projection: {

                                    name:
                                        1,


                                    username:
                                        1,


                                    bio:
                                        1,


                                    avatarUrl:
                                        1,


                                    createdAt:
                                        1

                                }

                            }

                        );


                    if (
                        !user
                    ) {

                        return res.status(404).json({

                            success:
                                false,


                            error:
                                "User not found"

                        });

                    }


                    // =========================================
                    // FIND USER POSTS
                    // =========================================

                    const posts =
                        await postsCollection
                            .find({

                                username:
                                    username

                            })
                            .sort({

                                createdAt:
                                    -1

                            })
                            .limit(
                                MAX_POSTS_PER_REQUEST
                            )
                            .toArray();


                    // =========================================
                    // RESPONSE
                    // =========================================

                    return res.json({

                        success:
                            true,


                        user: {

                            id:

                                user
                                    ._id
                                    .toString(),


                            name:

                                user.name ||

                                "",


                            username:

                                user.username ||

                                "",


                            bio:

                                user.bio ||

                                "",


                            avatarUrl:

                                user.avatarUrl ||

                                "",


                            createdAt:

                                user.createdAt

                        },


                        posts:

                            posts.map(

                                (
                                    post
                                ) =>

                                    formatPost(

                                        post,

                                        currentUserId

                                    )

                            )

                    });


                } catch (
                    error
                ) {

                    console.error(
                        "Public profile error:",
                        error
                    );


                    return res.status(500).json({

                        success:
                            false,


                        error:
                            "Could not load public profile"

                    });

                }

            }

        );



        // ====================================================
        // RETURN ROUTER
        // ====================================================

        return router;

    };