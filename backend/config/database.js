// ============================================================
// DEPENDENCIES
// ============================================================

const {
    MongoClient
} =
    require(
        "mongodb"
    );



// ============================================================
// ENVIRONMENT CHECK
// ============================================================

if (
    !process.env.MONGODB_URI
) {

    throw new Error(
        "Missing required environment variable: MONGODB_URI"
    );

}



// ============================================================
// MONGODB CLIENT
// ============================================================

const client =
    new MongoClient(
        process.env.MONGODB_URI
    );



// ============================================================
// DATABASE CONNECTION
// ============================================================

async function connectDatabase() {

    try {

        // ====================================================
        // CONNECT
        // ====================================================

        await client.connect();



        // ====================================================
        // DATABASE
        // ====================================================

        const database =
            client.db(
                "dheereStudio"
            );



        // ====================================================
        // VERIFY CONNECTION
        // ====================================================

        await database.command({

            ping: 1

        });



        // ====================================================
        // COLLECTIONS
        // ====================================================

        const feedbackCollection =
            database.collection(
                "feedback"
            );


        const usersCollection =
            database.collection(
                "users"
            );


        const postsCollection =
            database.collection(
                "posts"
            );


        const notificationsCollection =
            database.collection(
                "notifications"
            );



        // ====================================================
        // UNIQUE USERNAME
        // ====================================================

        await usersCollection.createIndex(

            {
                username:
                    1
            },

            {
                unique:
                    true
            }

        );



        // ====================================================
        // UNIQUE EMAIL
        // ====================================================

        await usersCollection.createIndex(

            {
                email:
                    1
            },

            {
                unique:
                    true
            }

        );



        // ====================================================
        // POSTS INDEX
        // ====================================================

        await postsCollection.createIndex(

            {
                createdAt:
                    -1
            }

        );



        await postsCollection.createIndex(

            {
                authorId:
                    1,


                createdAt:
                    -1
            }

        );



        // ====================================================
        // PASSWORD RESET INDEX
        // ====================================================

        await usersCollection.createIndex(

            {
                resetTokenHash:
                    1
            },

            {
                sparse:
                    true
            }

        );



        // ====================================================
        // NOTIFICATIONS INDEXES
        // ====================================================

        await notificationsCollection.createIndex(

            {
                recipientId:
                    1,


                createdAt:
                    -1
            }

        );



        await notificationsCollection.createIndex(

            {
                recipientId:
                    1,


                read:
                    1,


                createdAt:
                    -1
            }

        );



        await notificationsCollection.createIndex(

            {
                recipientId:
                    1,


                actorId:
                    1,


                type:
                    1,


                postId:
                    1
            }

        );



        // ====================================================
        // SUCCESS LOGS
        // ====================================================

        console.log(
            "MongoDB connected successfully"
        );


        console.log(
            "Username system initialized"
        );


        console.log(
            "Notifications system initialized"
        );


        console.log(
            "Password reset system initialized"
        );



        // ====================================================
        // RETURN DATABASE OBJECTS
        // ====================================================

        return {

            client,

            database,

            feedbackCollection,

            usersCollection,

            postsCollection,

            notificationsCollection

        };


    } catch (error) {

        // ====================================================
        // CONNECTION ERROR
        // ====================================================

        console.error(
            "MongoDB connection failed:",
            error.message
        );



        throw error;

    }

}



// ============================================================
// MODULE EXPORTS
// ============================================================

module.exports = {

    connectDatabase,

    client

};