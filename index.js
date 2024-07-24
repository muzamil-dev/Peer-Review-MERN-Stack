import express from "express";
import dotenv from "dotenv";

// Routers
import workspaceRoutes from './routes/workspaces.js';

// Access env variables
dotenv.config();

// Set the port
const PORT = process.env.PORT || 5000;

// Initialize the app
const app = express();
app.use(express.json());

// Use routers
app.use("/workspaces", workspaceRoutes);

// Test to ping the server
app.get("/ping", (req, res) => {
    const message = "If you're seeing this, the api is accessible";
    return res.json({ message });
});

// Listen on the provided port
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Listening on port ${PORT}.`);
});