// ============================================================
// SOCIAL UTILITIES
// Shared helpers for social routes
// ============================================================


// ============================================================
// DEPENDENCIES
// ============================================================

const {
    ObjectId
} =
    require(
        "mongodb"
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



// ============================================================
// NORMALIZE USERNAME
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

    if (
        typeof value !==
        "string"
    ) {

        return "";

    }


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

        /*
         * Optional authentication must never block
         * a public request just because the token is
         * invalid, expired, or missing.
         */

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
            post?.likedBy
        )

            ? post.likedBy

            : [];


    const comments =
        Array.isArray(
            post?.comments
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

            post?._id

                ? post._id.toString()

                : "",


        authorId:

            post?.authorId

                ? post.authorId.toString()

                : "",


        username:

            post?.username ||

            "",


        content:

            post?.content ||

            "",


        createdAt:

            post?.createdAt,


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

            comment?.id

            ||

            comment?._id?.toString()

            ||

            "",


        userId:

            comment?.userId

                ? comment.userId.toString()

                : "",


        username:

            comment?.username

            ||

            "Dheere User",


        content:

            comment?.content

            ||

            "",


        createdAt:

            comment?.createdAt

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


    /*
     * Never create self-notifications.
     */

    if (
        String(
            recipientId
        ) ===

        String(
            actorId
        )
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
            type ||


            "activity",


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


    /*
     * Prevent duplicate like notifications.
     */

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
// Notification failure must never break the
// primary social action.
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
// MODULE EXPORTS
// ============================================================

module.exports = {

    USERNAME_REGEX,

    normalizeUsername,

    isValidObjectId,

    escapeRegex,

    optionalAuthenticateToken,

    getAuthenticatedUserId,

    formatPost,

    formatComment,

    createNotification,

    safelyCreateNotification

};