import express from "express";
import dotenv from "dotenv";

// Routers
import jwtRoutes from './routes/jwt.js';
import groupRoutes from './routes/groups.js';
import userRoutes from './routes/users.js';
import workspaceRoutes from './routes/workspaces.js';
import assignmentRoutes from './routes/assignments.js';

// Access env variables
dotenv.config();

// Set the port
const PORT = process.env.PORT || 5000;

// Initialize the app
const app = express();
app.use(express.json());

// Use routers
app.use("/groups", groupRoutes);
app.use("/users", userRoutes);
app.use("/workspaces", workspaceRoutes);
app.use("/assignments", assignmentRoutes);
app.use("/jwt", jwtRoutes);

// Test to ping the server
app.get("/ping", (req, res) => {
    const message = "If you're seeing this, the api is accessible";
    return res.json({ message });
});

// A joke <3
app.get("/joke", (req, res) => {
    return res.json({
        question: "Why did Hashim cross the road?",
        answer: "To work on 'The Jokes Webapp'"
    });
});

// Listen on the provided port
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Listening on port ${PORT}.`);
});