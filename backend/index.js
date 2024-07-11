import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";
import cors from "cors";

// Import database client
import db from "./config.js";

// Import services for cron jobs
import * as ReviewService from './services/reviews.js';
import * as AnalyticsService from './services/analytics.js';

// Import routers
import userRoutes from './routes/users.js';
import groupRoutes from './routes/groups.js';
import workspaceRoutes from './routes/workspaces.js';
import assignmentRoutes from './routes/assignments.js';
import reviewRoutes from './routes/reviews.js';
import analyticsRoutes from './routes/analytics.js';
import jwtRoutes from './routes/jwt.js';

// Access env variables
dotenv.config();

// Set the port
const PORT = process.env.PORT || 5000;

// Initialize the app
const app = express();
app.use(express.json());
//app.use(cors());

// Define CORS options
const corsOptions = {
    // TODO update to our domain once deployed
    //origin: process.env.NODE_ENV === 'production' ? 'https://ourdomainname.com' : 'http://localhost:3000',
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow credentials
};

// Apply CORS middleware with options
app.use(cors(corsOptions));
// Define routes
app.use("/users", userRoutes);
app.use("/groups", groupRoutes);
app.use("/workspaces", workspaceRoutes);
app.use("/assignments", assignmentRoutes);
app.use("/reviews", reviewRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/jwt", jwtRoutes);

// Connect to the database
await db.connect();
console.log(`Connected to the database.`);

// Hourly cron job
// Deletes old temp users that were never verified
cron.schedule('0 * * * *', async() => {
    const res = await db.query(
        `DELETE FROM temp_users
        WHERE verification_token_expiry < $1
        RETURNING email`,
        [(new Date(Date.now())).toISOString()]
    );
    // Display a message showing how many temp users were deleted
    console.log(`Deleted ${res.rows.length} unverified users`);
});

// Once per minute cron job
// Releases the reviews for a corresponding assignment
cron.schedule('0 * * * * *', async() => {
    const res = await db.query(
        `UPDATE assignments
        SET started = true
        WHERE started = false AND start_date <= $1
        RETURNING id`,
        [(new Date(Date.now())).toISOString()]
    );
    // Get all ids of review assignments
    const ids = res.rows.map(obj => obj.id);
    // Create reviews for each assignment
    ids.forEach(id => {
        ReviewService.createReviews(id);
    });
    console.log(`Started ${ids.length} new assignments`);
});

// Once per minute cron job
// Computes analytics for assignments, sets to complete
cron.schedule('0 * * * * *', async() => {
    const res = await db.query(
        `UPDATE assignments
        SET completed = true
        WHERE completed = false AND due_date <= $1
        RETURNING id`,
        [(new Date(Date.now())).toISOString()]
    );
    // Get all ids of review assignments
    const ids = res.rows.map(obj => obj.id);
    // Calculate analytics for each assignment
    ids.forEach(id => {
        AnalyticsService.calculateAnalytics(id);
    });
    console.log(`Calculated analytics for ${ids.length} completed assignments`);
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}.`);
});