// ============================================================
// POST ROUTES
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
    ObjectId
} =
    require(
        "mongodb"
    );


const {
    authenticateToken
} =
    require(
        "../../middleware/auth-middleware"
    );


const {
    USERNAME_REGEX,

    normalizeUsername,

    isValidObjectId,

    optionalAuthenticateToken,

    getAuthenticatedUserId,

    formatPost,

    safelyCreateNotification

} =
    require(
        "../../utils/social-utils"
    );



// ============================================================
// RULES
// ============================================================

const MAX_POST_LENGTH =
    2000;


const MAX_POSTS_PER_REQUEST =
    100;



// ============================================================
// RATE LIMITERS
// ============================================================

const postWriteLimiter =
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
                "Too many requests. Please try again later."

        }

    });



const postReadLimiter =
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



// ============================================================
// POSTS ROUTER FACTORY
// ============================================================

module.exports =
    function createPostsRouter(
        {

            postsCollection,

            usersCollection,

            notificationsCollection

        }
    ) {


        const router =
            express.Router();



        // ====================================================
        // CREATE POST
        // ====================================================

        router.post(

            "/posts",

            postWriteLimiter,

            authenticateToken,

            async (
                req,
                res
            ) => {

                try {

                    const authenticatedUserId =
                        getAuthenticatedUserId(
                            req
                        );


                    const {
                        content
                    } =
                        req.body ||
                        {};


                    // =========================================
                    // AUTHENTICATION
                    // =========================================

                    if (
                        !authenticatedUserId
                    ) {

                        return res.status(401).json({

                            success:
                                false,


                            error:
                                "Authentication required"

                        });

                    }


                    // =========================================
                    // CLEAN CONTENT
                    // =========================================

                    const cleanContent =

                        typeof content ===
                        "string"

                            ? content.trim()

                            : "";


                    // =========================================
                    // EMPTY CONTENT
                    // =========================================

                    if (
                        !cleanContent
                    ) {

                        return res.status(400).json({

                            success:
                                false,


                            error:
                                "Post cannot be empty"

                        });

                    }


                    // =========================================
                    // LENGTH
                    // =========================================

                    if (

                        cleanContent.length >
                        MAX_POST_LENGTH

                    ) {

                        return res.status(400).json({

                            success:
                                false,


                            error:
                                `Post cannot exceed ${MAX_POST_LENGTH} characters`

                        });

                    }


                    // =========================================
                    // LOAD USER
                    // =========================================

                    const user =
                        await usersCollection.findOne(

                            {

                                _id:
                                    new ObjectId(
                                        authenticatedUserId
                                    )

                            },

                            {

                                projection: {

                                    _id:
                                        1,


                                    username:
                                        1

                                }

                            }

                        );


                    if (
                        !user
                    ) {

                        return res.status(401).json({

                            success:
                                false,


                            error:
                                "User not found"

                        });

                    }


                    // =========================================
                    // CREATE POST DOCUMENT
                    // =========================================

                    const post = {

                        authorId:
                            user._id,


                        username:
                            user.username ||
                            "",


                        content:
                            cleanContent,


                        createdAt:
                            new Date(),


                        likedBy:
                            [],


                        comments:
                            []

                    };


                    // =========================================
                    // INSERT
                    // =========================================

                    const result =
                        await postsCollection.insertOne(
                            post
                        );


                    // =========================================
                    // RESPONSE
                    // =========================================

                    return res.status(201).json({

                        success:
                            true,


                        message:
                            "Post published successfully",


                        post:
                            formatPost(

                                {

                                    ...post,


                                    _id:
                                        result.insertedId

                                },

                                authenticatedUserId

                            )

                    });


                } catch (
                    error
                ) {

                    console.error(
                        "Create post error:",
                        error
                    );


                    return res.status(500).json({

                        success:
                            false,


                        error:
                            "Could not create post"

                    });

                }

            }

        );



        // ====================================================
        // GET ALL POSTS
        // ====================================================

        router.get(

            "/posts",

            postReadLimiter,

            optionalAuthenticateToken,

            async (
                req,
                res
            ) => {

                try {

                    const currentUserId =
                        getAuthenticatedUserId(
                            req
                        );


                    const posts =
                        await postsCollection
                            .find({})
                            .sort({

                                createdAt:
                                    -1

                            })
                            .limit(
                                MAX_POSTS_PER_REQUEST
                            )
                            .toArray();


                    return res.json({

                        success:
                            true,


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
                        "Get posts error:",
                        error
                    );


                    return res.status(500).json({

                        success:
                            false,


                        error:
                            "Could not load posts"

                    });

                }

            }

        );



        // ====================================================
        // GET POSTS BY USERNAME
        // ====================================================

        router.get(

            "/posts/user/:username",

            postReadLimiter,

            optionalAuthenticateToken,

            async (
                req,
                res
            ) => {

                try {

                    const username =
                        normalizeUsername(
                            req.params.username
                        );


                    const currentUserId =
                        getAuthenticatedUserId(
                            req
                        );


                    // =========================================
                    // USERNAME VALIDATION
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
                    // LOAD POSTS
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


                    return res.json({

                        success:
                            true,


                        username:
                            username,


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
                        "Get user posts error:",
                        error
                    );


                    return res.status(500).json({

                        success:
                            false,


                        error:
                            "Could not load user posts"

                    });

                }

            }

        );


        // ====================================================
// DELETE POST
// ====================================================

router.delete(

    "/posts/:postId",

    postWriteLimiter,

    authenticateToken,

    async (
        req,
        res
    ) => {

        try {

            // =============================================
            // POST ID
            // =============================================

            const postId =
                typeof req.params.postId ===
                "string"

                    ? req.params.postId.trim()

                    : "";


            // =============================================
            // AUTHENTICATED USER
            // =============================================

            const authenticatedUserId =
                getAuthenticatedUserId(
                    req
                );


            // =============================================
            // VALIDATE POST ID
            // =============================================

            if (
                !isValidObjectId(
                    postId
                )
            ) {

                return res.status(400).json({

                    success:
                        false,

                    error:
                        "Invalid post ID"

                });

            }


            // =============================================
            // AUTHENTICATION
            // =============================================

            if (
                !authenticatedUserId
            ) {

                return res.status(401).json({

                    success:
                        false,

                    error:
                        "Authentication required"

                });

            }


            const postObjectId =
                new ObjectId(
                    postId
                );


            const userObjectId =
                new ObjectId(
                    authenticatedUserId
                );


            // =============================================
            // LOAD POST
            // =============================================

            const post =
                await postsCollection.findOne(

                    {

                        _id:
                            postObjectId

                    },

                    {

                        projection: {

                            _id:
                                1,

                            authorId:
                                1

                        }

                    }

                );


            if (
                !post
            ) {

                return res.status(404).json({

                    success:
                        false,

                    error:
                        "Post not found"

                });

            }


            // =============================================
            // OWNERSHIP CHECK
            // =============================================

            if (

                !post.authorId

                ||

                post.authorId.toString() !==
                authenticatedUserId

            ) {

                return res.status(403).json({

                    success:
                        false,

                    error:
                        "You can only delete your own posts"

                });

            }


            // =============================================
            // DELETE POST
            // =============================================

            const deleteResult =
                await postsCollection.deleteOne(

                    {

                        _id:
                            postObjectId,

                        authorId:
                            userObjectId

                    }

                );


            if (
                deleteResult.deletedCount !==
                1
            ) {

                return res.status(404).json({

                    success:
                        false,

                    error:
                        "Post could not be deleted"

                });

            }


            // =============================================
            // CLEAN RELATED NOTIFICATIONS
            // =============================================

            if (
                notificationsCollection
            ) {

                try {

                    await notificationsCollection.deleteMany({

                        postId:
                            postObjectId

                    });

                } catch (
                    notificationError
                ) {

                    /*
                     * Notification cleanup must never make
                     * an already-successful post deletion fail.
                     */

                    console.error(

                        "Post notification cleanup error:",

                        notificationError

                    );

                }

            }


            // =============================================
            // RESPONSE
            // =============================================

            return res.json({

                success:
                    true,

                message:
                    "Post deleted successfully",

                postId:
                    postId

            });


        } catch (
            error
        ) {

            console.error(
                "Delete post error:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                error:
                    "Could not delete post"

            });

        }

    }

);
        // ====================================================
        // LIKE / UNLIKE POST
        // ====================================================

        router.post(

            "/posts/:postId/like",

            postWriteLimiter,

            authenticateToken,

            async (
                req,
                res
            ) => {

                try {

                    const postId =
                        typeof req.params.postId ===
                        "string"

                            ? req.params.postId.trim()

                            : "";


                    const authenticatedUserId =
                        getAuthenticatedUserId(
                            req
                        );


                    // =========================================
                    // POST ID
                    // =========================================

                    if (

                        !isValidObjectId(
                            postId
                        )

                    ) {

                        return res.status(400).json({

                            success:
                                false,


                            error:
                                "Invalid post ID"

                        });

                    }


                    // =========================================
                    // AUTHENTICATION
                    // =========================================

                    if (
                        !authenticatedUserId
                    ) {

                        return res.status(401).json({

                            success:
                                false,


                            error:
                                "Authentication required"

                        });

                    }


                    const postObjectId =
                        new ObjectId(
                            postId
                        );


                    const userObjectId =
                        new ObjectId(
                            authenticatedUserId
                        );


                    // =========================================
                    // LOAD USER
                    // =========================================

                    const user =
                        await usersCollection.findOne(

                            {

                                _id:
                                    userObjectId

                            },

                            {

                                projection: {

                                    _id:
                                        1,


                                    name:
                                        1,


                                    username:
                                        1

                                }

                            }

                        );


                    if (
                        !user
                    ) {

                        return res.status(401).json({

                            success:
                                false,


                            error:
                                "User not found"

                        });

                    }


                    // =========================================
                    // LOAD POST
                    // =========================================

                    const post =
                        await postsCollection.findOne({

                            _id:
                                postObjectId

                        });


                    if (
                        !post
                    ) {

                        return res.status(404).json({

                            success:
                                false,


                            error:
                                "Post not found"

                        });

                    }


                    const likedBy =
                        Array.isArray(
                            post.likedBy
                        )

                            ? post.likedBy

                            : [];


                    const alreadyLiked =
                        likedBy.some(

                            (
                                id
                            ) =>

                                id

                                &&

                                id.toString() ===
                                authenticatedUserId

                        );


                    // =================================================
                    // UNLIKE
                    // =================================================

                    if (
                        alreadyLiked
                    ) {

                        await postsCollection.updateOne(

                            {

                                _id:
                                    postObjectId,


                                likedBy:
                                    userObjectId

                            },

                            {

                                $pull: {

                                    likedBy:
                                        userObjectId

                                }

                            }

                        );


                        // =============================================
                        // REMOVE LIKE NOTIFICATION
                        // =============================================

                        if (

                            notificationsCollection

                            &&

                            post.authorId

                        ) {

                            try {

                                await notificationsCollection
                                    .deleteMany({

                                        recipientId:
                                            post.authorId,


                                        actorId:
                                            userObjectId,


                                        type:
                                            "like",


                                        postId:
                                            postObjectId

                                    });

                            } catch (
                                error
                            ) {

                                console.error(

                                    "Like notification cleanup error:",

                                    error

                                );

                            }

                        }


                        // =============================================
                        // GET UPDATED LIKE COUNT
                        // =============================================

                        const updatedPost =
                            await postsCollection.findOne(

                                {

                                    _id:
                                        postObjectId

                                },

                                {

                                    projection: {

                                        likedBy:
                                            1

                                    }

                                }

                            );


                        const likes =
                            Array.isArray(
                                updatedPost?.likedBy
                            )

                                ? updatedPost
                                    .likedBy
                                    .length

                                : 0;


                        return res.json({

                            success:
                                true,


                            liked:
                                false,


                            likes:
                                likes

                        });

                    }


                    // =================================================
                    // LIKE
                    // =================================================

                    const updateResult =
                        await postsCollection.updateOne(

                            {

                                _id:
                                    postObjectId,


                                likedBy: {

                                    $ne:
                                        userObjectId

                                }

                            },

                            {

                                $addToSet: {

                                    likedBy:
                                        userObjectId

                                }

                            }

                        );


                    // =================================================
                    // ALREADY LIKED BY RACE / DUPLICATE
                    // =================================================

                    if (

                        updateResult.modifiedCount ===
                        0

                    ) {

                        const latestPost =
                            await postsCollection.findOne(

                                {

                                    _id:
                                        postObjectId

                                },

                                {

                                    projection: {

                                        likedBy:
                                            1

                                    }

                                }

                            );


                        const latestLikedBy =
                            Array.isArray(
                                latestPost?.likedBy
                            )

                                ? latestPost.likedBy

                                : [];


                        const latestLiked =
                            latestLikedBy.some(

                                (
                                    id
                                ) =>

                                    id

                                    &&

                                    id.toString() ===
                                    authenticatedUserId

                            );


                        return res.json({

                            success:
                                true,


                            liked:
                                latestLiked,


                            likes:
                                latestLikedBy.length

                        });

                    }


                    // =================================================
                    // LIKE NOTIFICATION
                    // =================================================

                    if (

                        post.authorId

                        &&

                        post.authorId.toString() !==
                        authenticatedUserId

                    ) {

                        const actorName =
                            user.name ||
                            user.username ||
                            "Dheere User";


                        await safelyCreateNotification({

                            notificationsCollection,


                            recipientId:
                                post.authorId.toString(),


                            actorId:
                                authenticatedUserId,


                            actorName:
                                actorName,


                            actorUsername:
                                user.username ||
                                "",


                            type:
                                "like",


                            postId:
                                postId,


                            message:
                                `${actorName} liked your post.`

                        });

                    }


                    // =================================================
                    // GET UPDATED LIKE COUNT
                    // =================================================

                    const updatedPost =
                        await postsCollection.findOne(

                            {

                                _id:
                                    postObjectId

                            },

                            {

                                projection: {

                                    likedBy:
                                        1

                                }

                            }

                        );


                    const updatedLikes =
                        Array.isArray(
                            updatedPost?.likedBy
                        )

                            ? updatedPost.likedBy.length

                            : 0;


                    return res.json({

                        success:
                            true,


                        liked:
                            true,


                        likes:
                            updatedLikes

                    });


                } catch (
                    error
                ) {

                    console.error(
                        "Like post error:",
                        error
                    );


                    return res.status(500).json({

                        success:
                            false,


                        error:
                            "Could not update like"

                    });

                }

            }

        );



        // ====================================================
        // RETURN ROUTER
        // ====================================================

        return router;

    };