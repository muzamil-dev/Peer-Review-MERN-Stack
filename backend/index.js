import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";

// Import database client
import db from "./config.js";

// Import service for cron job
import * as ReviewService from './services/reviews.js';

// Import routers
import workspaceRoutes from './routes/workspaces.js';

dotenv.config();

// Set the port
const PORT = process.env.PORT || 5000;

// Initialize the app
const app = express();
app.use(express.json());

// Set routes
app.use("/workspaces", workspaceRoutes);

// Connect to the database
await db.connect();
console.log(`Connected to the database.`);

// Sample cron job runs every minute
cron.schedule('0 * * * * *', async() => {
    const res = await db.query(
        `UPDATE assignments
        SET started = false
        WHERE started = false AND start_date <= $1
        RETURNING id`,
        [(new Date(Date.now())).toISOString()]
    );
    const assignments = res.rows;
    console.log(`Updated ${assignments.length} assignments`);
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}.`);
});
