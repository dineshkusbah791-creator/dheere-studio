// ============================================================
// SOCIAL ROUTES AGGREGATOR
// ============================================================


// ============================================================
// DEPENDENCIES
// ============================================================

const express =
    require(
        "express"
    );


const createPostsRouter =
    require(
        "./posts-routes"
    );


const createCommentsRouter =
    require(
        "./comments-routes"
    );


const createNotificationsRouter =
    require(
        "./notifications-routes"
    );


const createUserRouter =
    require(
        "./user-routes"
    );



// ============================================================
// SOCIAL ROUTER FACTORY
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
        // POSTS
        // ====================================================

        router.use(

            createPostsRouter({

                postsCollection,

                usersCollection,

                notificationsCollection

            })

        );



        // ====================================================
        // COMMENTS
        // ====================================================

        router.use(

            createCommentsRouter({

                postsCollection,

                usersCollection,

                notificationsCollection

            })

        );



        // ====================================================
        // NOTIFICATIONS
        // ====================================================

        router.use(

            createNotificationsRouter({

                notificationsCollection

            })

        );



        // ====================================================
        // USERS / PUBLIC PROFILES
        // ====================================================

        router.use(

            createUserRouter({

                postsCollection,

                usersCollection

            })

        );



        // ====================================================
        // RETURN ROUTER
        // ====================================================

        return router;

    };