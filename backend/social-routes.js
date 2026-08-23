const express = require("express");
const { ObjectId } = require("mongodb");


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


// ============================================================
// HELPERS
// ============================================================

function normalizeUsername(value) {

    if (typeof value !== "string") {
        return "";
    }

    return value
        .trim()
        .toLowerCase();

}


function isValidObjectId(value) {

    return (
        typeof value === "string" &&
        ObjectId.isValid(value)
    );

}


/*
 * Converts a MongoDB post into the format
 * expected by the frontend.
 */

function formatPost(
    post,
    currentUserId = ""
) {

    const likedBy =
        Array.isArray(post.likedBy)
            ? post.likedBy
            : [];


    const comments =
        Array.isArray(post.comments)
            ? post.comments
            : [];


    let likedByCurrentUser =
        false;


    if (
        currentUserId &&
        isValidObjectId(currentUserId)
    ) {

        likedByCurrentUser =
            likedBy.some(
                (id) =>
                    id &&
                    id.toString() === currentUserId
            );

    }


    return {

        id:
            post._id.toString(),

        authorId:
            post.authorId
                ? post.authorId.toString()
                : "",

        username:
            post.username || "",

        content:
            post.content || "",

        createdAt:
            post.createdAt,

        likes:
            typeof post.likes === "number"
                ? post.likes
                : likedBy.length,

        comments:
            comments.length,

        liked:
            likedByCurrentUser

    };

}


// ============================================================
// NOTIFICATION HELPER
// ============================================================

async function createNotification({
    notificationsCollection,
    recipientId,
    actorId,
    actorName,
    actorUsername,
    type,
    postId,
    commentId = null,
    message
}) {

    if (!notificationsCollection) {

        console.warn(
            "Notifications collection is not connected."
        );

        return null;

    }


    if (
        !isValidObjectId(recipientId) ||
        !isValidObjectId(actorId)
    ) {

        return null;

    }


    /*
     * Never notify a user about their own action.
     */

    if (
        recipientId === actorId
    ) {

        return null;

    }


    const filter = {

        recipientId:
            new ObjectId(recipientId),

        actorId:
            new ObjectId(actorId),

        type:
            type,

        postId:
            new ObjectId(postId)

    };


    /*
     * Prevent duplicate like notifications.
     */

    if (
        type === "like"
    ) {

        const existing =
            await notificationsCollection.findOne(
                filter
            );


        if (existing) {

            await notificationsCollection.updateOne(

                {
                    _id:
                        existing._id
                },

                {
                    $set: {

                        read:
                            false,

                        createdAt:
                            new Date(),

                        message:
                            message

                    }

                }

            );


            return existing._id;

        }

    }


    const notification = {

        recipientId:
            new ObjectId(recipientId),

        actorId:
            new ObjectId(actorId),

        actorName:
            actorName || "Dheere User",

        actorUsername:
            actorUsername || "",

        type:
            type,

        postId:
            new ObjectId(postId),

        commentId:
            commentId
                ? commentId
                : null,

        message:
            message || "",

        read:
            false,

        createdAt:
            new Date()

    };


    const result =
        await notificationsCollection.insertOne(
            notification
        );


    console.log(
        "Notification created:",
        result.insertedId.toString()
    );


    return result.insertedId;

}


// ============================================================
// SOCIAL ROUTES FACTORY
// ============================================================

module.exports = function createSocialRouter({

    postsCollection,
    usersCollection,
    notificationsCollection

}) {

    /*
     * IMPORTANT:
     * Create a fresh router for this factory call.
     */

    const router =
        express.Router();


    // ========================================================
    // CREATE POST
    // ========================================================

    router.post(
        "/posts",
        async (req, res) => {

            const {
                authorId,
                username,
                content
            } = req.body;


            try {

                if (
                    !authorId ||
                    !username ||
                    !content
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            "Author, username and content are required"

                    });

                }


                if (
                    !isValidObjectId(authorId)
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            "Invalid author ID"

                    });

                }


                const cleanContent =
                    typeof content === "string"
                        ? content.trim()
                        : "";


                const cleanUsername =
                    normalizeUsername(
                        username
                    );


                if (!cleanContent) {

                    return res.status(400).json({

                        success: false,

                        error:
                            "Post cannot be empty"

                    });

                }


                if (
                    cleanContent.length >
                    MAX_POST_LENGTH
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            "Post cannot exceed 2000 characters"

                    });

                }


                const user =
                    await usersCollection.findOne({

                        _id:
                            new ObjectId(authorId),

                        username:
                            cleanUsername

                    });


                if (!user) {

                    return res.status(401).json({

                        success: false,

                        error:
                            "Invalid user"

                    });

                }


                const post = {

                    authorId:
                        user._id,

                    username:
                        user.username,

                    content:
                        cleanContent,

                    createdAt:
                        new Date(),

                    likes:
                        0,

                    likedBy:
                        [],

                    comments:
                        []

                };


                const result =
                    await postsCollection.insertOne(
                        post
                    );


                console.log(
                    "New post created:",
                    result.insertedId.toString()
                );


                return res.status(201).json({

                    success: true,

                    message:
                        "Post published successfully",

                    post:
                        formatPost({

                            ...post,

                            _id:
                                result.insertedId

                        })

                });


            } catch (error) {

                console.error(
                    "Create post error:",
                    error
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "Could not create post"

                });

            }

        }
    );


    // ========================================================
    // GET ALL POSTS
    // ========================================================

    router.get(
        "/posts",
        async (req, res) => {

            try {

                const currentUserId =
                    typeof req.query.userId === "string"
                        ? req.query.userId.trim()
                        : "";


                const posts =
                    await postsCollection
                        .find({})
                        .sort({
                            createdAt: -1
                        })
                        .limit(100)
                        .toArray();


                const formattedPosts =
                    posts.map(
                        (post) =>
                            formatPost(
                                post,
                                currentUserId
                            )
                    );


                return res.json({

                    success: true,

                    posts:
                        formattedPosts

                });


            } catch (error) {

                console.error(
                    "Get posts error:",
                    error
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "Could not load posts"

                });

            }

        }
    );


    // ========================================================
    // GET POSTS BY USERNAME
    // ========================================================

    router.get(
        "/posts/user/:username",
        async (req, res) => {

            try {

                const username =
                    normalizeUsername(
                        req.params.username
                    );


                const currentUserId =
                    typeof req.query.userId === "string"
                        ? req.query.userId.trim()
                        : "";


                if (
                    !USERNAME_REGEX.test(username)
                ) {

                    return res.status(400).json({

                        success: false,

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
                            createdAt: -1
                        })
                        .limit(100)
                        .toArray();


                const formattedPosts =
                    posts.map(
                        (post) =>
                            formatPost(
                                post,
                                currentUserId
                            )
                    );


                return res.json({

                    success: true,

                    username:
                        username,

                    posts:
                        formattedPosts

                });


            } catch (error) {

                console.error(
                    "Get user posts error:",
                    error
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "Could not load user posts"

                });

            }

        }
    );


    // ========================================================
    // LIKE / UNLIKE POST
    // ========================================================

    router.post(
        "/posts/:postId/like",
        async (req, res) => {

            try {

                const postId =
                    typeof req.params.postId === "string"
                        ? req.params.postId.trim()
                        : "";


                const {
                    userId
                } = req.body;


                if (
                    !isValidObjectId(postId)
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            "Invalid post ID"

                    });

                }


                if (
                    !isValidObjectId(userId)
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            "Valid user ID is required"

                    });

                }


                const user =
                    await usersCollection.findOne(

                        {
                            _id:
                                new ObjectId(userId)
                        },

                        {
                            projection: {

                                _id: 1,

                                name: 1,

                                username: 1

                            }
                        }

                    );


                if (!user) {

                    return res.status(401).json({

                        success: false,

                        error:
                            "User not found"

                    });

                }


                const post =
                    await postsCollection.findOne({

                        _id:
                            new ObjectId(postId)

                    });


                if (!post) {

                    return res.status(404).json({

                        success: false,

                        error:
                            "Post not found"

                    });

                }


                const likedBy =
                    Array.isArray(post.likedBy)
                        ? post.likedBy
                        : [];


                const alreadyLiked =
                    likedBy.some(
                        (id) =>
                            id &&
                            id.toString() === userId
                    );


                // ------------------------------------------------
                // UNLIKE
                // ------------------------------------------------

                if (alreadyLiked) {

                    await postsCollection.updateOne(

                        {
                            _id:
                                post._id
                        },

                        {
                            $pull: {

                                likedBy:
                                    new ObjectId(userId)

                            },

                            $inc: {

                                likes:
                                    -1

                            }

                        }

                    );


                    await postsCollection.updateOne(

                        {
                            _id:
                                post._id,

                            likes: {
                                $lt:
                                    0
                            }

                        },

                        {
                            $set: {

                                likes:
                                    0

                            }

                        }

                    );


                    /*
                     * Remove the like notification.
                     */

                    if (
                        notificationsCollection &&
                        post.authorId
                    ) {

                        await notificationsCollection.deleteMany({

                            recipientId:
                                post.authorId,

                            actorId:
                                new ObjectId(userId),

                            type:
                                "like",

                            postId:
                                post._id

                        });

                    }


                    const updatedPost =
                        await postsCollection.findOne({

                            _id:
                                post._id

                        });


                    const count =
                        typeof updatedPost.likes === "number"
                            ? updatedPost.likes
                            : 0;


                    return res.json({

                        success: true,

                        liked: false,

                        likes:
                            count

                    });

                }


                // ------------------------------------------------
                // LIKE
                // ------------------------------------------------

                await postsCollection.updateOne(

                    {
                        _id:
                            post._id,

                        likedBy: {
                            $ne:
                                new ObjectId(userId)
                        }

                    },

                    {
                        $addToSet: {

                            likedBy:
                                new ObjectId(userId)

                        },

                        $inc: {

                            likes:
                                1

                        }

                    }

                );


                /*
                 * Create notification for post owner.
                 */

                if (
                    post.authorId &&
                    post.authorId.toString() !== userId
                ) {

                    const actorName =
                        user.name ||
                        user.username ||
                        "Dheere User";


                    const actorUsername =
                        user.username ||
                        "";


                    await createNotification({

                        notificationsCollection,

                        recipientId:
                            post.authorId.toString(),

                        actorId:
                            userId,

                        actorName,

                        actorUsername,

                        type:
                            "like",

                        postId,

                        message:
                            `${actorName} liked your post.`

                    });

                }


                const updatedPost =
                    await postsCollection.findOne({

                        _id:
                            post._id

                    });


                const count =
                    typeof updatedPost.likes === "number"
                        ? updatedPost.likes
                        : 0;


                return res.json({

                    success: true,

                    liked: true,

                    likes:
                        count

                });


            } catch (error) {

                console.error(
                    "Like post error:",
                    error
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "Could not update like"

                });

            }

        }
    );


    // ========================================================
    // GET POST COMMENTS
    // ========================================================

    router.get(
        "/posts/:postId/comments",
        async (req, res) => {

            try {

                const postId =
                    typeof req.params.postId === "string"
                        ? req.params.postId.trim()
                        : "";


                if (
                    !isValidObjectId(postId)
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            "Invalid post ID"

                    });

                }


                const post =
                    await postsCollection.findOne(

                        {
                            _id:
                                new ObjectId(postId)
                        },

                        {
                            projection: {
                                comments: 1
                            }
                        }

                    );


                if (!post) {

                    return res.status(404).json({

                        success: false,

                        error:
                            "Post not found"

                    });

                }


                const comments =
                    Array.isArray(post.comments)
                        ? post.comments
                        : [];


                return res.json({

                    success: true,

                    comments:
                        comments.map(
                            (comment) => ({

                                id:
                                    comment.id ||
                                    comment._id?.toString() ||
                                    "",

                                userId:
                                    comment.userId
                                        ? comment.userId.toString()
                                        : "",

                                username:
                                    comment.username ||
                                    "Dheere User",

                                content:
                                    comment.content ||
                                    "",

                                createdAt:
                                    comment.createdAt

                            })
                        )

                });


            } catch (error) {

                console.error(
                    "Get comments error:",
                    error
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "Could not load comments"

                });

            }

        }
    );


    // ========================================================
    // CREATE COMMENT
    // ========================================================

    router.post(
        "/posts/:postId/comments",
        async (req, res) => {

            try {

                const postId =
                    typeof req.params.postId === "string"
                        ? req.params.postId.trim()
                        : "";


                const {
                    userId,
                    content
                } = req.body;


                if (
                    !isValidObjectId(postId)
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            "Invalid post ID"

                    });

                }


                if (
                    !isValidObjectId(userId)
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            "Valid user ID is required"

                    });

                }


                const cleanContent =
                    typeof content === "string"
                        ? content.trim()
                        : "";


                if (!cleanContent) {

                    return res.status(400).json({

                        success: false,

                        error:
                            "Comment cannot be empty"

                    });

                }


                if (
                    cleanContent.length >
                    MAX_COMMENT_LENGTH
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters`

                    });

                }


                const user =
                    await usersCollection.findOne(

                        {
                            _id:
                                new ObjectId(userId)
                        },

                        {
                            projection: {

                                _id: 1,

                                name: 1,

                                username: 1

                            }

                        }

                    );


                if (!user) {

                    return res.status(401).json({

                        success: false,

                        error:
                            "User not found"

                    });

                }


                const post =
                    await postsCollection.findOne({

                        _id:
                            new ObjectId(postId)

                    });


                if (!post) {

                    return res.status(404).json({

                        success: false,

                        error:
                            "Post not found"

                    });

                }


                const comment = {

                    id:
                        new ObjectId().toString(),

                    userId:
                        user._id,

                    username:
                        user.username,

                    content:
                        cleanContent,

                    createdAt:
                        new Date()

                };


                await postsCollection.updateOne(

                    {
                        _id:
                            post._id
                    },

                    {
                        $push: {

                            comments:
                                comment

                        }

                    }

                );


                /*
                 * Create notification for post owner.
                 */

                if (
                    post.authorId &&
                    post.authorId.toString() !== userId
                ) {

                    const actorName =
                        user.name ||
                        user.username ||
                        "Dheere User";


                    const actorUsername =
                        user.username ||
                        "";


                    await createNotification({

                        notificationsCollection,

                        recipientId:
                            post.authorId.toString(),

                        actorId:
                            userId,

                        actorName,

                        actorUsername,

                        type:
                            "comment",

                        postId,

                        commentId:
                            comment.id,

                        message:
                            `${actorName} commented on your post.`

                    });

                }


                console.log(
                    "New comment created:",
                    comment.id
                );


                return res.status(201).json({

                    success: true,

                    message:
                        "Comment added successfully",

                    comment: {

                        id:
                            comment.id,

                        userId:
                            comment.userId.toString(),

                        username:
                            comment.username,

                        content:
                            comment.content,

                        createdAt:
                            comment.createdAt

                    }

                });


            } catch (error) {

                console.error(
                    "Create comment error:",
                    error
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "Could not add comment"

                });

            }

        }
    );


    // ========================================================
    // GET NOTIFICATIONS
    // ========================================================

    router.get(
        "/notifications",
        async (req, res) => {

            try {

                if (!notificationsCollection) {

                    return res.json({

                        success: true,

                        notifications: [],

                        unreadCount:
                            0

                    });

                }


                const userId =
                    typeof req.query.userId === "string"
                        ? req.query.userId.trim()
                        : "";


                if (
                    !isValidObjectId(userId)
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            "Valid user ID is required"

                    });

                }


                const notifications =
                    await notificationsCollection
                        .find({

                            recipientId:
                                new ObjectId(userId)

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
                    await notificationsCollection.countDocuments({

                        recipientId:
                            new ObjectId(userId),

                        read:
                            false

                    });


                const formattedNotifications =
                    notifications.map(
                        (notification) => ({

                            id:
                                notification._id.toString(),

                            actorId:
                                notification.actorId
                                    ? notification.actorId.toString()
                                    : "",

                            actorName:
                                notification.actorName ||
                                "Dheere User",

                            actorUsername:
                                notification.actorUsername ||
                                "",

                            type:
                                notification.type ||
                                "activity",

                            postId:
                                notification.postId
                                    ? notification.postId.toString()
                                    : "",

                            commentId:
                                notification.commentId ||
                                null,

                            message:
                                notification.message ||
                                "",

                            read:
                                notification.read === true,

                            createdAt:
                                notification.createdAt

                        })
                    );


                return res.json({

                    success: true,

                    notifications:
                        formattedNotifications,

                    unreadCount:
                        unreadCount

                });


            } catch (error) {

                console.error(
                    "Get notifications error:",
                    error
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "Could not load notifications"

                });

            }

        }
    );


    // ========================================================
    // MARK ONE NOTIFICATION AS READ
    // ========================================================

    router.patch(
        "/notifications/:notificationId/read",
        async (req, res) => {

            try {

                if (!notificationsCollection) {

                    return res.status(503).json({

                        success: false,

                        error:
                            "Notifications are not connected"

                    });

                }


                const notificationId =
                    typeof req.params.notificationId === "string"
                        ? req.params.notificationId.trim()
                        : "";


                const {
                    userId
                } = req.body;


                if (
                    !isValidObjectId(
                        notificationId
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            "Invalid notification ID"

                    });

                }


                if (
                    !isValidObjectId(userId)
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            "Valid user ID is required"

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
                                    userId
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
                    result.matchedCount === 0
                ) {

                    return res.status(404).json({

                        success: false,

                        error:
                            "Notification not found"

                    });

                }


                return res.json({

                    success: true,

                    message:
                        "Notification marked as read"

                });


            } catch (error) {

                console.error(
                    "Mark notification read error:",
                    error
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "Could not update notification"

                });

            }

        }
    );


    // ========================================================
    // MARK ALL NOTIFICATIONS AS READ
    // ========================================================

    router.patch(
        "/notifications/read-all",
        async (req, res) => {

            try {

                if (!notificationsCollection) {

                    return res.status(503).json({

                        success: false,

                        error:
                            "Notifications are not connected"

                    });

                }


                const {
                    userId
                } = req.body;


                if (
                    !isValidObjectId(userId)
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            "Valid user ID is required"

                    });

                }


                const result =
                    await notificationsCollection.updateMany(

                        {
                            recipientId:
                                new ObjectId(userId),

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

                    success: true,

                    message:
                        "All notifications marked as read",

                    modifiedCount:
                        result.modifiedCount

                });


            } catch (error) {

                console.error(
                    "Mark all notifications read error:",
                    error
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "Could not update notifications"

                });

            }

        }
    );


    // ========================================================
    // DELETE ONE NOTIFICATION
    // ========================================================

    router.delete(
        "/notifications/:notificationId",
        async (req, res) => {

            try {

                if (!notificationsCollection) {

                    return res.status(503).json({

                        success: false,

                        error:
                            "Notifications are not connected"

                    });

                }


                const notificationId =
                    typeof req.params.notificationId === "string"
                        ? req.params.notificationId.trim()
                        : "";


                const {
                    userId
                } = req.body;


                if (
                    !isValidObjectId(
                        notificationId
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            "Invalid notification ID"

                    });

                }


                if (
                    !isValidObjectId(userId)
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            "Valid user ID is required"

                    });

                }


                const result =
                    await notificationsCollection.deleteOne({

                        _id:
                            new ObjectId(
                                notificationId
                            ),

                        recipientId:
                            new ObjectId(
                                userId
                            )

                    });


                if (
                    result.deletedCount === 0
                ) {

                    return res.status(404).json({

                        success: false,

                        error:
                            "Notification not found"

                    });

                }


                return res.json({

                    success: true,

                    message:
                        "Notification deleted"

                });


            } catch (error) {

                console.error(
                    "Delete notification error:",
                    error
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "Could not delete notification"

                });

            }

        }
    );


    // ========================================================
    // SEARCH USERS
    // ========================================================

    router.get(
        "/search-users",
        async (req, res) => {

            try {

                const query =
                    typeof req.query.q === "string"
                        ? req.query.q.trim()
                        : "";


                if (!query) {

                    return res.json({

                        success: true,

                        users: []

                    });

                }


                const searchQuery =
                    query.toLowerCase();


                const users =
                    await usersCollection
                        .find(

                            {
                                $or: [

                                    {
                                        username: {
                                            $regex:
                                                searchQuery,

                                            $options:
                                                "i"
                                        }
                                    },

                                    {
                                        name: {
                                            $regex:
                                                searchQuery,

                                            $options:
                                                "i"
                                        }
                                    }

                                ]

                            },

                            {
                                projection: {

                                    name: 1,

                                    username: 1,

                                    bio: 1,

                                    avatarUrl: 1,

                                    createdAt: 1

                                }

                            }

                        )
                        .limit(20)
                        .toArray();


                const formattedUsers =
                    users.map(
                        (user) => ({

                            id:
                                user._id.toString(),

                            name:
                                user.name || "",

                            username:
                                user.username || "",

                            bio:
                                user.bio || "",

                            avatarUrl:
                                user.avatarUrl || "",

                            createdAt:
                                user.createdAt

                        })
                    );


                return res.json({

                    success: true,

                    users:
                        formattedUsers

                });


            } catch (error) {

                console.error(
                    "Search users error:",
                    error
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "Could not search users"

                });

            }

        }
    );


    // ========================================================
    // PUBLIC PROFILE
    // ========================================================

    router.get(
        "/public-profile/:username",
        async (req, res) => {

            try {

                const username =
                    normalizeUsername(
                        req.params.username
                    );


                if (
                    !USERNAME_REGEX.test(username)
                ) {

                    return res.status(400).json({

                        success: false,

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

                                name: 1,

                                username: 1,

                                bio: 1,

                                avatarUrl: 1,

                                createdAt: 1

                            }

                        }

                    );


                if (!user) {

                    return res.status(404).json({

                        success: false,

                        error:
                            "User not found"

                    });

                }


                const currentUserId =
                    typeof req.query.userId === "string"
                        ? req.query.userId.trim()
                        : "";


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
                        .limit(100)
                        .toArray();


                const formattedPosts =
                    posts.map(
                        (post) =>
                            formatPost(
                                post,
                                currentUserId
                            )
                    );


                return res.json({

                    success: true,

                    user: {

                        id:
                            user._id.toString(),

                        name:
                            user.name || "",

                        username:
                            user.username || "",

                        bio:
                            user.bio || "",

                        avatarUrl:
                            user.avatarUrl || "",

                        createdAt:
                            user.createdAt

                    },

                    posts:
                        formattedPosts

                });


            } catch (error) {

                console.error(
                    "Public profile error:",
                    error
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "Could not load public profile"

                });

            }

        }
    );


    return router;

};