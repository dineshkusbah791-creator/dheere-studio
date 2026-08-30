// ============================================================
// NOTIFICATION ROUTES
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

    getAuthenticatedUserId

} =
    require(
        "../../utils/social-utils"
    );



// ============================================================
// RATE LIMITERS
// ============================================================

const notificationWriteLimiter =
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



const notificationReadLimiter =
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
// NOTIFICATION ROUTER FACTORY
// ============================================================

module.exports =
    function createNotificationsRouter(
        {

            notificationsCollection

        }
    ) {


        const router =
            express.Router();



        // ====================================================
        // GET NOTIFICATIONS
        // ====================================================

        router.get(

            "/notifications",

            notificationReadLimiter,

            authenticateToken,

            async (
                req,
                res
            ) => {

                try {

                    // =========================================
                    // NOTIFICATIONS DISABLED / UNAVAILABLE
                    // =========================================

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


                    // =========================================
                    // AUTHENTICATION
                    // =========================================

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


                    // =========================================
                    // LOAD NOTIFICATIONS
                    // =========================================

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
                                100
                            )
                            .toArray();


                    // =========================================
                    // UNREAD COUNT
                    // =========================================

                    const unreadCount =
                        await notificationsCollection
                            .countDocuments({

                                recipientId:
                                    recipientObjectId,


                                read:
                                    false

                            });


                    // =========================================
                    // FORMAT
                    // =========================================

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

                                    notification
                                        .actorId

                                        ? notification
                                            .actorId
                                            .toString()

                                        : "",


                                actorName:

                                    notification
                                        .actorName

                                    ||

                                    "Dheere User",


                                actorUsername:

                                    notification
                                        .actorUsername

                                    ||

                                    "",


                                type:

                                    notification.type

                                    ||

                                    "activity",


                                postId:

                                    notification
                                        .postId

                                        ? notification
                                            .postId
                                            .toString()

                                        : "",


                                commentId:

                                    notification
                                        .commentId

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


                    // =========================================
                    // RESPONSE
                    // =========================================

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

            notificationWriteLimiter,

            authenticateToken,

            async (
                req,
                res
            ) => {

                try {

                    // =========================================
                    // COLLECTION CHECK
                    // =========================================

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


                    // =========================================
                    // INPUTS
                    // =========================================

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


                    // =========================================
                    // VALIDATE NOTIFICATION ID
                    // =========================================

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
                    // MARK AS READ
                    // =========================================

                    const result =
                        await notificationsCollection
                            .updateOne(

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


                    // =========================================
                    // NOT FOUND
                    // =========================================

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

            notificationWriteLimiter,

            authenticateToken,

            async (
                req,
                res
            ) => {

                try {

                    // =========================================
                    // COLLECTION CHECK
                    // =========================================

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


                    // =========================================
                    // AUTHENTICATION
                    // =========================================

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


                    // =========================================
                    // UPDATE ALL UNREAD
                    // =========================================

                    const result =
                        await notificationsCollection
                            .updateMany(

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

            notificationWriteLimiter,

            authenticateToken,

            async (
                req,
                res
            ) => {

                try {

                    // =========================================
                    // COLLECTION CHECK
                    // =========================================

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


                    // =========================================
                    // INPUTS
                    // =========================================

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


                    // =========================================
                    // VALIDATE ID
                    // =========================================

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
                    // DELETE ONLY OWN NOTIFICATION
                    // =========================================

                    const result =
                        await notificationsCollection
                            .deleteOne({

                                _id:
                                    new ObjectId(
                                        notificationId
                                    ),


                                recipientId:
                                    new ObjectId(
                                        authenticatedUserId
                                    )

                            });


                    // =========================================
                    // NOT FOUND
                    // =========================================

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
        // RETURN ROUTER
        // ====================================================

        return router;

    };