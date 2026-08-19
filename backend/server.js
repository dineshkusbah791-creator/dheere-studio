const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const bcrypt = require("bcryptjs");

const app = express();

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

let feedbackCollection;
let usersCollection;


// ==========================================
// USERNAME RULES
// ==========================================

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;


// ==========================================
// CONNECT TO MONGODB
// ==========================================

async function connectDatabase() {
    try {

        await client.connect();

        const database = client.db("dheereStudio");

        feedbackCollection =
            database.collection("feedback");

        usersCollection =
            database.collection("users");


        // ==========================================
        // UNIQUE USERNAME INDEX
        // ==========================================

        await usersCollection.createIndex(
            { username: 1 },
            { unique: true }
        );


        console.log(
            "MongoDB connected successfully"
        );

        console.log(
            "Username system initialized"
        );

    } catch (error) {

        console.error(
            "MongoDB connection failed:",
            error
        );

        process.exit(1);
    }
}


// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {

    res.send(
        "Dheere Studio backend is running"
    );

});


// ==========================================
// USERNAME AVAILABILITY ROUTE
// ==========================================

app.get(
    "/check-username/:username",
    async (req, res) => {

        try {

            const username =
                req.params.username
                    .trim()
                    .toLowerCase();


            // ==========================================
            // VALIDATE USERNAME FORMAT
            // ==========================================

            if (!USERNAME_REGEX.test(username)) {

                return res.json({

                    success: true,

                    available: false,

                    valid: false,

                    message:
                        "Username must be 3-20 characters and contain only letters, numbers, and underscores."

                });

            }


            // ==========================================
            // CHECK DATABASE
            // ==========================================

            const existingUser =
                await usersCollection.findOne(
                    { username: username },
                    {
                        projection: {
                            _id: 1
                        }
                    }
                );


            if (existingUser) {

                return res.json({

                    success: true,

                    available: false,

                    valid: true,

                    message:
                        "Username is already taken."

                });

            }


            // ==========================================
            // USERNAME AVAILABLE
            // ==========================================

            return res.json({

                success: true,

                available: true,

                valid: true,

                message:
                    "Username is available."

            });

        } catch (error) {

            console.error(
                "Username check error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    "Could not check username"

            });

        }

    }
);


// ==========================================
// FEEDBACK ROUTE
// ==========================================

app.post("/feedback", async (req, res) => {

    const {
        name,
        email,
        message
    } = req.body;


    try {

        // ==========================================
        // REQUIRED FIELDS
        // ==========================================

        if (
            !name ||
            !email ||
            !message
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "All fields are required"

            });

        }


        // ==========================================
        // CREATE FEEDBACK
        // ==========================================

        const feedback = {

            name:
                name.trim(),

            email:
                email.trim().toLowerCase(),

            message:
                message.trim(),

            createdAt:
                new Date()

        };


        await feedbackCollection.insertOne(
            feedback
        );


        console.log(
            "New feedback saved:"
        );

        console.log(
            "Name:",
            feedback.name
        );

        console.log(
            "Email:",
            feedback.email
        );

        console.log(
            "Message:",
            feedback.message
        );


        res.json({

            success: true,

            message:
                "Feedback received successfully"

        });

    } catch (error) {

        console.error(
            "Error saving feedback:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                "Could not save feedback"

        });

    }

});


// ==========================================
// REGISTER ROUTE
// ==========================================

app.post("/register", async (req, res) => {

    const {
        name,
        username,
        email,
        password
    } = req.body;


    try {

        // ==========================================
        // REQUIRED FIELDS
        // ==========================================

        if (
            !name ||
            !username ||
            !email ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "All fields are required"

            });

        }


        // ==========================================
        // CLEAN VALUES
        // ==========================================

        const cleanName =
            name.trim();

        const cleanUsername =
            username.trim().toLowerCase();

        const cleanEmail =
            email.trim().toLowerCase();


        // ==========================================
        // VALIDATE USERNAME
        // ==========================================

        if (
            !USERNAME_REGEX.test(
                cleanUsername
            )
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Username must be 3-20 characters and contain only letters, numbers, and underscores."

            });

        }


        // ==========================================
        // CHECK EMAIL
        // ==========================================

        const existingEmail =
            await usersCollection.findOne({

                email:
                    cleanEmail

            });


        if (existingEmail) {

            return res.status(400).json({

                success: false,

                error:
                    "Email already registered"

            });

        }


        // ==========================================
        // CHECK USERNAME
        // ==========================================

        const existingUsername =
            await usersCollection.findOne({

                username:
                    cleanUsername

            });


        if (existingUsername) {

            return res.status(400).json({

                success: false,

                error:
                    "Username already taken"

            });

        }


        // ==========================================
        // HASH PASSWORD
        // ==========================================

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        // ==========================================
        // CREATE USER
        // ==========================================

        const user = {

            name:
                cleanName,

            username:
                cleanUsername,

            email:
                cleanEmail,

            password:
                hashedPassword,

            createdAt:
                new Date()

        };


        await usersCollection.insertOne(
            user
        );


        console.log(
            "New user registered:"
        );

        console.log(
            "Name:",
            user.name
        );

        console.log(
            "Username:",
            user.username
        );

        console.log(
            "Email:",
            user.email
        );


        res.status(201).json({

            success: true,

            message:
                "Registration successful",

            user: {

                name:
                    user.name,

                username:
                    user.username,

                email:
                    user.email

            }

        });

    } catch (error) {

        // ==========================================
        // DUPLICATE USERNAME SAFETY
        // ==========================================

        if (
            error &&
            error.code === 11000
        ) {

            return res.status(409).json({

                success: false,

                error:
                    "Username already taken"

            });

        }


        console.error(
            "Registration error:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                "Could not register user"

        });

    }

});


// ==========================================
// LOGIN ROUTE
// ==========================================

app.post("/login", async (req, res) => {

    const {
        email,
        password
    } = req.body;


    try {

        // ==========================================
        // REQUIRED FIELDS
        // ==========================================

        if (
            !email ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Email and password are required"

            });

        }


        // ==========================================
        // CLEAN EMAIL
        // ==========================================

        const cleanEmail =
            email.trim().toLowerCase();


        // ==========================================
        // FIND USER
        // ==========================================

        const user =
            await usersCollection.findOne({

                email:
                    cleanEmail

            });


        // ==========================================
        // ACCOUNT DOES NOT EXIST
        // ==========================================

        if (!user) {

            return res.status(404).json({

                success: false,

                error:
                    "Account not found. Please register first."

            });

        }


        // ==========================================
        // CHECK PASSWORD
        // ==========================================

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        // ==========================================
        // WRONG PASSWORD
        // ==========================================

        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                error:
                    "Incorrect password."

            });

        }


        // ==========================================
        // LOGIN SUCCESS
        // ==========================================

        console.log(
            "User logged in:"
        );

        console.log(
            "Name:",
            user.name
        );

        console.log(
            "Username:",
            user.username
        );

        console.log(
            "Email:",
            user.email
        );


        // ==========================================
        // NEVER SEND PASSWORD/HASH
        // ==========================================

        res.json({

            success: true,

            message:
                "Login successful",

            user: {

                name:
                    user.name,

                username:
                    user.username,

                email:
                    user.email

            }

        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                "Could not login"

        });

    }

});


// ==========================================
// START SERVER
// ==========================================

async function startServer() {

    await connectDatabase();


    const PORT =
        process.env.PORT || 3000;


    app.listen(
        PORT,
        "0.0.0.0",
        () => {

            console.log(
                `Server running on port ${PORT}`
            );

        }
    );

}


startServer();