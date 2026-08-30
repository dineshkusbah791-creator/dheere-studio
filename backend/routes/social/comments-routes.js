// ============================================================
// COMMENT ROUTES
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
    isValidObjectId,

    getAuthenticatedUserId,

    formatComment,

    safelyCreateNotification

} =
    require(
        "../../utils/social-utils"
    );



// ============================================================
// RULES
// ============================================================

const MAX_COMMENT_LENGTH =
    1000;



// ============================================================
// RATE LIMITERS
// ============================================================

const commentWriteLimiter =
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



const commentReadLimiter =
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
// COMMENTS ROUTER FACTORY
// ============================================================

module.exports =
    function createCommentsRouter(
        {

            postsCollection,

            usersCollection,

            notificationsCollection

        }
    ) {


        const router =
            express.Router();



        // ====================================================
        // GET POST COMMENTS
        // ====================================================

        router.get(

            "/posts/:postId/comments",

            commentReadLimiter,

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


                    // =========================================
                    // VALIDATE POST ID
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
                    // FIND POST
                    // =========================================

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


                    // =========================================
                    // NORMALIZE COMMENTS
                    // =========================================

                    const comments =
                        Array.isArray(
                            post.comments
                        )

                            ? post.comments

                            : [];


                    // =========================================
                    // RESPONSE
                    // =========================================

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

            commentWriteLimiter,

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


                    // =========================================
                    // VALIDATE POST ID
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


                    // =========================================
                    // CLEAN CONTENT
                    // =========================================

                    const cleanContent =

                        typeof content ===
                        "string"

                            ? content.trim()

                            : "";


                    // =========================================
                    // EMPTY COMMENT
                    // =========================================

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


                    // =========================================
                    // COMMENT LENGTH
                    // =========================================

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
                    // CREATE COMMENT
                    // =========================================

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
                            new Date(),


                        updatedAt:
                            null

                    };


                    // =========================================
                    // APPEND COMMENT
                    // =========================================

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


                    // =========================================
                    // GET POST AUTHOR
                    // =========================================

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


                    // =========================================
                    // COMMENT NOTIFICATION
                    // =========================================

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


                    // =========================================
                    // RESPONSE
                    // =========================================

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
        // EDIT COMMENT
        // ====================================================

        router.patch(

            "/posts/:postId/comments/:commentId",

            commentWriteLimiter,

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


                    const commentId =
                        typeof req.params.commentId ===
                        "string"

                            ? req.params.commentId.trim()

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


                    // =========================================
                    // VALIDATE POST ID
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
                    // VALIDATE COMMENT ID
                    // =========================================

                    if (!commentId) {

                        return res.status(400).json({

                            success:
                                false,


                            error:
                                "Invalid comment ID"

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


                    // =========================================
                    // CLEAN CONTENT
                    // =========================================

                    const cleanContent =

                        typeof content ===
                        "string"

                            ? content.trim()

                            : "";


                    if (!cleanContent) {

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


                    const postObjectId =
                        new ObjectId(
                            postId
                        );


                    const userObjectId =
                        new ObjectId(
                            authenticatedUserId
                        );


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


                    const comments =
                        Array.isArray(
                            post.comments
                        )

                            ? post.comments

                            : [];


                    // =========================================
                    // FIND COMMENT
                    // =========================================

                    const existingComment =
                        comments.find(

                            comment =>

                                String(
                                    comment?.id ||
                                    comment?._id ||
                                    ""
                                ) ===
                                commentId

                        );


                    if (
                        !existingComment
                    ) {

                        return res.status(404).json({

                            success:
                                false,


                            error:
                                "Comment not found"

                        });

                    }


                    // =========================================
                    // OWNERSHIP CHECK
                    // =========================================

                    const commentUserId =
                        existingComment?.userId

                            ? existingComment
                                .userId
                                .toString()

                            : "";


                    if (
                        commentUserId !==
                        authenticatedUserId
                    ) {

                        return res.status(403).json({

                            success:
                                false,


                            error:
                                "You can only edit your own comments"

                        });

                    }


                    // =========================================
                    // UPDATE COMMENT
                    // =========================================

                    const updatedAt =
                        new Date();


                    const updateResult =
                        await postsCollection.updateOne(

                            {

                                _id:
                                    postObjectId

                            },

                            {

                                $set: {

                                    "comments.$[comment].content":
                                        cleanContent,


                                    "comments.$[comment].updatedAt":
                                        updatedAt

                                }

                            },

                            {

                                arrayFilters: [

                                    {

                                        "comment.id":
                                            commentId,


                                        "comment.userId":
                                            userObjectId

                                    }

                                ]

                            }

                        );


                    if (

                        updateResult.matchedCount ===
                        0

                    ) {

                        return res.status(404).json({

                            success:
                                false,


                            error:
                                "Post not found"

                        });

                    }


                    if (

                        updateResult.modifiedCount ===
                        0

                    ) {

                        return res.status(409).json({

                            success:
                                false,


                            error:
                                "Comment was not updated"

                        });

                    }


                    // =========================================
                    // RESPONSE COMMENT
                    // =========================================

                    const updatedComment = {

                        ...existingComment,


                        content:
                            cleanContent,


                        updatedAt:
                            updatedAt

                    };


                    return res.json({

                        success:
                            true,


                        message:
                            "Comment updated successfully",


                        comment:
                            formatComment(
                                updatedComment
                            )

                    });


                } catch (
                    error
                ) {

                    console.error(
                        "Edit comment error:",
                        error
                    );


                    return res.status(500).json({

                        success:
                            false,


                        error:
                            "Could not update comment"

                    });

                }

            }

        );



        // ====================================================
        // DELETE COMMENT
        // ====================================================

        router.delete(

            "/posts/:postId/comments/:commentId",

            commentWriteLimiter,

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


                    const commentId =
                        typeof req.params.commentId ===
                        "string"

                            ? req.params.commentId.trim()

                            : "";


                    const authenticatedUserId =
                        getAuthenticatedUserId(
                            req
                        );


                    // =========================================
                    // VALIDATE POST ID
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
                    // VALIDATE COMMENT ID
                    // =========================================

                    if (!commentId) {

                        return res.status(400).json({

                            success:
                                false,


                            error:
                                "Invalid comment ID"

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


                    const comments =
                        Array.isArray(
                            post.comments
                        )

                            ? post.comments

                            : [];


                    // =========================================
                    // FIND COMMENT
                    // =========================================

                    const existingCommentIndex =
                        comments.findIndex(

                            comment =>

                                String(
                                    comment?.id ||
                                    comment?._id ||
                                    ""
                                ) ===
                                commentId

                        );


                    if (
                        existingCommentIndex ===
                        -1
                    ) {

                        return res.status(404).json({

                            success:
                                false,


                            error:
                                "Comment not found"

                        });

                    }


                    const existingComment =
                        comments[
                            existingCommentIndex
                        ];


                    // =========================================
                    // OWNERSHIP CHECK
                    // =========================================

                    const commentUserId =
                        existingComment?.userId

                            ? existingComment
                                .userId
                                .toString()

                            : "";


                    if (
                        commentUserId !==
                        authenticatedUserId
                    ) {

                        return res.status(403).json({

                            success:
                                false,


                            error:
                                "You can only delete your own comments"

                        });

                    }


                    // =========================================
                    // DELETE COMMENT
                    // =========================================

                    const updateResult =
                        await postsCollection.updateOne(

                            {

                                _id:
                                    postObjectId

                            },

                            {

                                $pull: {

                                    comments: {

                                        id:
                                            commentId,


                                        userId:
                                            userObjectId

                                    }

                                }

                            }

                        );


                    if (

                        updateResult.matchedCount ===
                        0

                    ) {

                        return res.status(404).json({

                            success:
                                false,


                            error:
                                "Post not found"

                        });

                    }


                    if (

                        updateResult.modifiedCount ===
                        0

                    ) {

                        return res.status(409).json({

                            success:
                                false,


                            error:
                                "Comment was not deleted"

                        });

                    }


                    // =========================================
                    // REMOVE COMMENT NOTIFICATION
                    // =========================================

                    if (
                        notificationsCollection
                    ) {

                        try {

                            await notificationsCollection
                                .deleteMany({

                                    postId:
                                        postObjectId,


                                    commentId:
                                        commentId,


                                    actorId:
                                        userObjectId,


                                    type:
                                        "comment"

                                });

                        } catch (
                            error
                        ) {

                            console.error(

                                "Comment notification cleanup error:",

                                error

                            );

                        }

                    }


                    // =========================================
                    // RESPONSE
                    // =========================================

                    return res.json({

                        success:
                            true,


                        message:
                            "Comment deleted successfully"

                    });


                } catch (
                    error
                ) {

                    console.error(
                        "Delete comment error:",
                        error
                    );


                    return res.status(500).json({

                        success:
                            false,


                        error:
                            "Could not delete comment"

                    });

                }

            }

        );



        // ====================================================
        // RETURN ROUTER
        // ====================================================

        return router;

    };