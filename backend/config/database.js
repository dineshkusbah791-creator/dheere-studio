const { MongoClient } =
    require("mongodb");



const client =
    new MongoClient(
        process.env.MONGODB_URI
    );



async function connectDatabase() {

    await client.connect();



    const database =
        client.db(
            "dheereStudio"
        );



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



    // ========================================================
    // UNIQUE USERNAME
    // ========================================================

    await usersCollection.createIndex(

        {
            username: 1
        },

        {
            unique: true
        }

    );



    // ========================================================
    // UNIQUE EMAIL
    // ========================================================

    await usersCollection.createIndex(

        {
            email: 1
        },

        {
            unique: true
        }

    );



    // ========================================================
    // POSTS
    // ========================================================

    await postsCollection.createIndex(

        {
            createdAt: -1
        }

    );



    await postsCollection.createIndex(

        {
            authorId: 1,

            createdAt: -1
        }

    );



    // ========================================================
    // PASSWORD RESET
    // ========================================================

    await usersCollection.createIndex(

        {
            resetTokenHash: 1
        },

        {
            sparse: true
        }

    );



    // ========================================================
    // NOTIFICATIONS
    // ========================================================

    await notificationsCollection.createIndex(

        {
            recipientId: 1,

            createdAt: -1
        }

    );



    await notificationsCollection.createIndex(

        {
            recipientId: 1,

            read: 1,

            createdAt: -1
        }

    );



    await notificationsCollection.createIndex(

        {
            recipientId: 1,

            actorId: 1,

            type: 1,

            postId: 1
        }

    );



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



    return {

        client,

        database,

        feedbackCollection,

        usersCollection,

        postsCollection,

        notificationsCollection

    };

}



module.exports = {

    connectDatabase,

    client

};