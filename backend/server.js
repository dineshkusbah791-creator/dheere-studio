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

// Connect to MongoDB
async function connectDatabase() {
    try {
        await client.connect();

        const database = client.db("dheereStudio");

        feedbackCollection = database.collection("feedback");
        usersCollection = database.collection("users");

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
}

// Home route
app.get("/", (req, res) => {
    res.send("Dheere Studio backend is running");
});

// ==========================================
// FEEDBACK ROUTE
// ==========================================

app.post("/feedback", async (req, res) => {
    const { name, email, message } = req.body;

    try {
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: "All fields are required"
            });
        }

        const feedback = {
            name,
            email,
            message,
            createdAt: new Date()
        };

        await feedbackCollection.insertOne(feedback);

        console.log("New feedback saved:");
        console.log("Name:", name);
        console.log("Email:", email);
        console.log("Message:", message);

        res.json({
            success: true,
            message: "Feedback received successfully"
        });

    } catch (error) {
        console.error("Error saving feedback:", error);

        res.status(500).json({
            success: false,
            error: "Could not save feedback"
        });
    }
});

// ==========================================
// REGISTER ROUTE
// ==========================================

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: "All fields are required"
            });
        }

        const existingUser = await usersCollection.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = {
            name,
            email,
            password: hashedPassword,
            createdAt: new Date()
        };

        await usersCollection.insertOne(user);

        console.log("New user registered:");
        console.log("Name:", name);
        console.log("Email:", email);

        res.status(201).json({
            success: true,
            message: "Registration successful"
        });

    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            success: false,
            error: "Could not register user"
        });
    }
});

// ==========================================
// LOGIN ROUTE
// ==========================================

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: "Email and password are required"
            });
        }

        const user = await usersCollection.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                error: "Invalid email or password"
            });
        }

        console.log("User logged in:");
        console.log("Name:", user.name);
        console.log("Email:", user.email);

        res.json({
            success: true,
            message: "Login successful",
            user: {
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            error: "Could not login"
        });
    }
});

// ==========================================
// START SERVER
// ==========================================

async function startServer() {
    await connectDatabase();

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();