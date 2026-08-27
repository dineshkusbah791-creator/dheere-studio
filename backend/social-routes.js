// ============================================================
// SOCIAL ROUTES
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
        "./middleware/auth-middleware"
    );


const jwt =
    require(
        "jsonwebtoken"
    );



// ============================================================
// RULES
// ============================================================

const USERNAME_REGEX =
    /^[a-z0-9_]{3,20}$/;


const MAX_POST_LENGTH =
    2000;


const MAX_COMMENT_LENGTH =
    1000;


const MAX_NOTIFICATIONS =
    100;


const MAX_SEARCH_QUERY_LENGTH =
    50;


const MAX_POSTS_PER_REQUEST =
    100;


const MAX_USERS_PER_SEARCH =
    20;



// ============================================================
// RATE LIMITERS
// ============================================================

const socialWriteLimiter =
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



const socialReadLimiter =
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
// HELPERS
// ============================================================

function normalizeUsername(
    value
) {

    if (
        typeof value !==
        "string"
    ) {

        return "";

    }


    return value
        .trim()
        .toLowerCase();

}



// ============================================================
// VALIDATE OBJECT ID
// ============================================================

function isValidObjectId(
    value
) {

    return (

        typeof value ===
        "string"

        &&

        ObjectId.isValid(
            value
        )

    );

}



// ============================================================
// ESCAPE REGEX
// ============================================================

function escapeRegex(
    value
) {

    return value.replace(

        /[.*+?^${}()|[\]\\]/g,

        "\\$&"

    );

}



// ============================================================
// OPTIONAL AUTHENTICATION
// ============================================================

function optionalAuthenticateToken(
    req,
    res,
    next
) {

    try {

        const authorizationHeader =
            req.headers.authorization;


        if (

            !authorizationHeader

            ||

            typeof authorizationHeader !==
            "string"

        ) {

            return next();

        }


        if (

            !authorizationHeader.startsWith(
                "Bearer "
            )

        ) {

            return next();

        }


        const token =
            authorizationHeader
                .slice(
                    7
                )
                .trim();


        if (
            !token
        ) {

            return next();

        }


        if (
            !process.env.JWT_SECRET
        ) {

            return next();

        }


        const decoded =
            jwt.verify(

                token,

                process.env.JWT_SECRET

            );


        if (

            decoded

            &&

            decoded.userId

            &&

            isValidObjectId(
                String(
                    decoded.userId
                )
            )

        ) {

            req.user = {

                userId:
                    String(
                        decoded.userId
                    )

            };

        }


        return next();


    } catch (
        error
    ) {

        return next();

    }

}



// ============================================================
// GET AUTHENTICATED USER ID
// ============================================================

function getAuthenticatedUserId(
    req
) {

    const userId =
        req.user?.userId;


    if (

        !isValidObjectId(
            userId
        )

    ) {

        return "";

    }


    return userId;

}



// ============================================================
// FORMAT POST
// ============================================================

function formatPost(
    post,
    currentUserId = ""
) {

    const likedBy =
        Array.isArray(
            post.likedBy
        )

            ? post.likedBy

            : [];


    const comments =
        Array.isArray(
            post.comments
        )

            ? post.comments

            : [];


    const likedByCurrentUser =

        currentUserId

        &&

        isValidObjectId(
            currentUserId
        )

            ? likedBy.some(

                (
                    id
                ) =>

                    id

                    &&

                    id.toString() ===
                    currentUserId

            )

            : false;


    return {

        id:
            post._id.toString(),


        authorId:
            post.authorId
                ? post.authorId.toString()
                : "",


        username:
            post.username ||
            "",


        content:
            post.content ||
            "",


        createdAt:
            post.createdAt,


        likes:
            likedBy.length,


        comments:
            comments.length,


        liked:
            Boolean(
                likedByCurrentUser
            )

    };

}



// ============================================================
// FORMAT COMMENT
// ============================================================

function formatComment(
    comment
) {

    return {

        id:

            comment.id

            ||

            comment._id?.toString()

            ||

            "",


        userId:

            comment.userId

                ? comment
                    .userId
                    .toString()

                : "",


        username:

            comment.username

            ||

            "Dheere User",


        content:

            comment.content

            ||

            "",


        createdAt:

            comment.createdAt

    };

}



// ============================================================
// CREATE NOTIFICATION
// ============================================================

async function createNotification(
    {

        notificationsCollection,

        recipientId,

        actorId,

        actorName,

        actorUsername,

        type,

        postId,

        commentId =
            null,

        message

    }
) {

    if (
        !notificationsCollection
    ) {

        return null;

    }


    if (

        !isValidObjectId(
            recipientId
        )

        ||

        !isValidObjectId(
            actorId
        )

        ||

        !isValidObjectId(
            postId
        )

    ) {

        return null;

    }


    if (
        recipientId ===
        actorId
    ) {

        return null;

    }


    const notification = {

        recipientId:
            new ObjectId(
                recipientId
            ),


        actorId:
            new ObjectId(
                actorId
            ),


        actorName:
            actorName ||
            "Dheere User",


        actorUsername:
            actorUsername ||
            "",


        type:
            type,


        postId:
            new ObjectId(
                postId
            ),


        commentId:
            commentId ||
            null,


        message:
            message ||
            "",


        read:
            false,


        createdAt:
            new Date()

    };


    if (
        type ===
        "like"
    ) {

        const existing =
            await notificationsCollection.findOne({

                recipientId:
                    notification.recipientId,


                actorId:
                    notification.actorId,


                type:
                    "like",


                postId:
                    notification.postId

            });


        if (
            existing
        ) {

            return existing._id;

        }

    }


    const result =
        await notificationsCollection.insertOne(
            notification
        );


    return result.insertedId;

}



// ============================================================
// SAFE NOTIFICATION
//
// Notification failure must not break the main action.
// ============================================================

async function safelyCreateNotification(
    data
) {

    try {

        return await createNotification(
            data
        );

    } catch (
        error
    ) {

        console.error(

            "Notification creation error:",

            error

        );


        return null;

    }

}



// ============================================================
// SOCIAL ROUTES FACTORY
// ============================================================

module.exports =
    function createSocialRouter(
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

            socialWriteLimiter,

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


                    const cleanContent =

                        typeof content ===
                        "string"

                            ? content.trim()

                            : "";


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


                    const result =
                        await postsCollection.insertOne(
                            post
                        );


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

            socialReadLimiter,

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

            socialReadLimiter,

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
        // LIKE / UNLIKE POST
        // ====================================================

        router.post(

            "/posts/:postId/like",

            socialWriteLimiter,

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


                    // ============================================
                    // UNLIKE
                    // ============================================

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


                    // ============================================
                    // LIKE
                    // ============================================

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

                            ? updatedPost
                                .likedBy
                                .length

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
        // GET POST COMMENTS
        // ====================================================

        router.get(

            "/posts/:postId/comments",

            socialReadLimiter,

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


                    const post =
                        await postsCollection.findOne(

                            {

                                _id:
                                    new ObjectId(
                                        postId
                                    )

                            },

                            {

                                projection: {

                                    comments:
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


                    const comments =
                        Array.isArray(
                            post.comments
                        )

                            ? post.comments

                            : [];


                    return res.json({

                        success:
                            true,


                        comments:

                            comments.map(
                                formatComment
                            )

                    });


                } catch (
                    error
                ) {

                    console.error(
                        "Get comments error:",
                        error
                    );


                    return res.status(500).json({

                        success:
                            false,


                        error:
                            "Could not load comments"

                    });

                }

            }

        );



        // ====================================================
        // CREATE COMMENT
        // ====================================================

        router.post(

            "/posts/:postId/comments",

            socialWriteLimiter,

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


                    const {
                        content
                    } =
                        req.body ||
                        {};


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


                    const cleanContent =

                        typeof content ===
                        "string"

                            ? content.trim()

                            : "";


                    if (
                        !cleanContent
                    ) {

                        return res.status(400).json({

                            success:
                                false,


                            error:
                                "Comment cannot be empty"

                        });

                    }


                    if (

                        cleanContent.length >
                        MAX_COMMENT_LENGTH

                    ) {

                        return res.status(400).json({

                            success:
                                false,


                            error:
                                `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters`

                        });

                    }


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


                    const comment = {

                        id:
                            new ObjectId()
                                .toString(),


                        userId:
                            user._id,


                        username:
                            user.username ||
                            "",


                        content:
                            cleanContent,


                        createdAt:
                            new Date()

                    };


                    const postUpdate =
                        await postsCollection.updateOne(

                            {

                                _id:
                                    new ObjectId(
                                        postId
                                    )

                            },

                            {

                                $push: {

                                    comments:
                                        comment

                                }

                            }

                        );


                    if (

                        postUpdate.matchedCount ===
                        0

                    ) {

                        return res.status(404).json({

                            success:
                                false,


                            error:
                                "Post not found"

                        });

                    }


                    // ============================================
                    // GET POST AUTHOR FOR NOTIFICATION
                    // ============================================

                    const post =
                        await postsCollection.findOne(

                            {

                                _id:
                                    new ObjectId(
                                        postId
                                    )

                            },

                            {

                                projection: {

                                    authorId:
                                        1

                                }

                            }

                        );


                    if (

                        post?.authorId

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
                                "comment",


                            postId:
                                postId,


                            commentId:
                                comment.id,


                            message:
                                `${actorName} commented on your post.`

                        });

                    }


                    return res.status(201).json({

                        success:
                            true,


                        message:
                            "Comment added successfully",


                        comment:
                            formatComment(
                                comment
                            )

                    });


                } catch (
                    error
                ) {

                    console.error(
                        "Create comment error:",
                        error
                    );


                    return res.status(500).json({

                        success:
                            false,


                        error:
                            "Could not add comment"

                    });

                }

            }

        );



        // ====================================================
        // GET NOTIFICATIONS
        // ====================================================

        router.get(

            "/notifications",

            socialReadLimiter,

            authenticateToken,

            async (
                req,
                res
            ) => {

                try {

                    if (
                        !notificationsCollection
                    ) {

                        return res.json({

                            success:
                                true,


                            notifications:
                                [],


                            unreadCount:
                                0

                        });

                    }


                    const authenticatedUserId =
                        getAuthenticatedUserId(
                            req
                        );


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


                    const recipientObjectId =
                        new ObjectId(
                            authenticatedUserId
                        );


                    const notifications =
                        await notificationsCollection
                            .find({

                                recipientId:
                                    recipientObjectId

                            })
                            .sort({

                                createdAt:
                                    -1

                            })
                            .limit(
                                MAX_NOTIFICATIONS
                            )
                            .toArray();


                    const unreadCount =
                        await notificationsCollection
                            .countDocuments({

                                recipientId:
                                    recipientObjectId,


                                read:
                                    false

                            });


                    const formattedNotifications =
                        notifications.map(

                            (
                                notification
                            ) => ({

                                id:
                                    notification
                                        ._id
                                        .toString(),


                                actorId:

                                    notification.actorId

                                        ? notification
                                            .actorId
                                            .toString()

                                        : "",


                                actorName:

                                    notification.actorName

                                    ||

                                    "Dheere User",


                                actorUsername:

                                    notification.actorUsername

                                    ||

                                    "",


                                type:

                                    notification.type

                                    ||

                                    "activity",


                                postId:

                                    notification.postId

                                        ? notification
                                            .postId
                                            .toString()

                                        : "",


                                commentId:

                                    notification.commentId

                                    ||

                                    null,


                                message:

                                    notification.message

                                    ||

                                    "",


                                read:

                                    notification.read ===
                                    true,


                                createdAt:

                                    notification.createdAt

                            })

                        );


                    return res.json({

                        success:
                            true,


                        notifications:
                            formattedNotifications,


                        unreadCount:
                            unreadCount

                    });


                } catch (
                    error
                ) {

                    console.error(
                        "Get notifications error:",
                        error
                    );


                    return res.status(500).json({

                        success:
                            false,


                        error:
                            "Could not load notifications"

                    });

                }

            }

        );



        // ====================================================
        // MARK ONE NOTIFICATION AS READ
        // ====================================================

        router.patch(

            "/notifications/:notificationId/read",

            socialWriteLimiter,

            authenticateToken,

            async (
                req,
                res
            ) => {

                try {

                    if (
                        !notificationsCollection
                    ) {

                        return res.status(503).json({

                            success:
                                false,


                            error:
                                "Notifications are not connected"

                        });

                    }


                    const notificationId =
                        typeof req.params.notificationId ===
                        "string"

                            ? req.params
                                .notificationId
                                .trim()

                            : "";


                    const authenticatedUserId =
                        getAuthenticatedUserId(
                            req
                        );


                    if (

                        !isValidObjectId(
                            notificationId
                        )

                    ) {

                        return res.status(400).json({

                            success:
                                false,


                            error:
                                "Invalid notification ID"

                        });

                    }


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


                    const result =
                        await notificationsCollection.updateOne(

                            {

                                _id:
                                    new ObjectId(
                                        notificationId
                                    ),


                                recipientId:
                                    new ObjectId(
                                        authenticatedUserId
                                    )

                            },

                            {

                                $set: {

                                    read:
                                        true

                                }

                            }

                        );


                    if (

                        result.matchedCount ===
                        0

                    ) {

                        return res.status(404).json({

                            success:
                                false,


                            error:
                                "Notification not found"

                        });

                    }


                    return res.json({

                        success:
                            true,


                        message:
                            "Notification marked as read"

                    });


                } catch (
                    error
                ) {

                    console.error(
                        "Mark notification read error:",
                        error
                    );


                    return res.status(500).json({

                        success:
                            false,


                        error:
                            "Could not update notification"

                    });

                }

            }

        );



        // ====================================================
        // MARK ALL NOTIFICATIONS AS READ
        // ====================================================

        router.patch(

            "/notifications/read-all",

            socialWriteLimiter,

            authenticateToken,

            async (
                req,
                res
            ) => {

                try {

                    if (
                        !notificationsCollection
                    ) {

                        return res.status(503).json({

                            success:
                                false,


                            error:
                                "Notifications are not connected"

                        });

                    }


                    const authenticatedUserId =
                        getAuthenticatedUserId(
                            req
                        );


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


                    const result =
                        await notificationsCollection.updateMany(

                            {

                                recipientId:
                                    new ObjectId(
                                        authenticatedUserId
                                    ),


                                read:
                                    false

                            },

                            {

                                $set: {

                                    read:
                                        true

                                }

                            }

                        );


                    return res.json({

                        success:
                            true,


                        message:
                            "All notifications marked as read",


                        modifiedCount:
                            result.modifiedCount

                    });


                } catch (
                    error
                ) {

                    console.error(
                        "Mark all notifications read error:",
                        error
                    );


                    return res.status(500).json({

                        success:
                            false,


                        error:
                            "Could not update notifications"

                    });

                }

            }

        );



        // ====================================================
        // DELETE ONE NOTIFICATION
        // ====================================================

        router.delete(

            "/notifications/:notificationId",

            socialWriteLimiter,

            authenticateToken,

            async (
                req,
                res
            ) => {

                try {

                    if (
                        !notificationsCollection
                    ) {

                        return res.status(503).json({

                            success:
                                false,


                            error:
                                "Notifications are not connected"

                        });

                    }


                    const notificationId =
                        typeof req.params.notificationId ===
                        "string"

                            ? req.params
                                .notificationId
                                .trim()

                            : "";


                    const authenticatedUserId =
                        getAuthenticatedUserId(
                            req
                        );


                    if (

                        !isValidObjectId(
                            notificationId
                        )

                    ) {

                        return res.status(400).json({

                            success:
                                false,


                            error:
                                "Invalid notification ID"

                        });

                    }


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


                    const result =
                        await notificationsCollection.deleteOne(

                            {

                                _id:
                                    new ObjectId(
                                        notificationId
                                    ),


                                recipientId:
                                    new ObjectId(
                                        authenticatedUserId
                                    )

                            }

                        );


                    if (

                        result.deletedCount ===
                        0

                    ) {

                        return res.status(404).json({

                            success:
                                false,


                            error:
                                "Notification not found"

                        });

                    }


                    return res.json({

                        success:
                            true,


                        message:
                            "Notification deleted"

                    });


                } catch (
                    error
                ) {

                    console.error(
                        "Delete notification error:",
                        error
                    );


                    return res.status(500).json({

                        success:
                            false,


                        error:
                            "Could not delete notification"

                    });

                }

            }

        );



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

                    const query =
                        typeof req.query.q ===
                        "string"

                            ? req.query.q.trim()

                            : "";


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


                    const safeQuery =
                        escapeRegex(
                            query
                        );


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

            socialReadLimiter,

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