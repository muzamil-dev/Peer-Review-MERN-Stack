import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from 'node-cron';

// Pool
import pool from "./config.js";

// Routers
import jwtRoutes from './routes/jwt.js';
import groupRoutes from './routes/groups.js';
import userRoutes from './routes/users.js';
import workspaceRoutes from './routes/workspaces.js';
import assignmentRoutes from './routes/assignments.js';
import reviewRoutes from './routes/reviews.js';
import journalRoutes from './routes/journals.js';

// Services (for cron job)
import * as ReviewService from './services/reviews.js';
import * as AnalyticsService from './services/analytics.js';

// Access env variables
dotenv.config();

// Set the port
const PORT = process.env.PORT || 5000;

// Initialize the app
const app = express();
app.use(express.json());

// Set allowed origins
const allowedOrigins = ['https://peerreview.site', 'http://peerreview.site', 'http://localhost:3000'];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // Allow requests with no origin (like mobile apps)
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true); // Allow the request
        } else {
            callback(new Error(`CORS error: Disallowed origin (${origin})`)); // Deny the request
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Skip-Interceptor'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // This will handle preflight requests for all routes



// Use routers
app.use("/backend/groups", groupRoutes);
app.use("/backend/users", userRoutes);
app.use("/backend/workspaces", workspaceRoutes);
app.use("/backend/assignments", assignmentRoutes);
app.use("/backend/reviews", reviewRoutes);
app.use("/backend/journals", journalRoutes);
app.use("/backend/jwt", jwtRoutes);

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

// Once per 5 minutes cron job
// Creates the reviews and analytics for assignments
// within 15 minutes before the assignment's start date
cron.schedule('*/5 * * * *', async () => {
    // Set date to 15 minutes after now
    const minute = 60 * 1000; // 60s * 1000ms
    const maxStartDate = (new Date(Date.now() + 15 * minute)).toISOString();
    let db;
    // Check out a client
    try {
        db = await pool.connect();
        await db.query('BEGIN')
        const res = await db.query(
            `UPDATE assignments
            SET started = true
            WHERE started = false AND start_date <= $1
            RETURNING id`,
            [maxStartDate]
        );
        // Get all ids of review assignments
        const ids = res.map(obj => obj.id);
        // Create reviews for each assignment
        const promises = ids.map(async (id) => {
            await ReviewService.createReviews(db, id);
            await AnalyticsService.createAnalytics(db, id);
        });
        await Promise.all(promises);
        await db.query('COMMIT');
    }
    catch (err) {
        if (db) await db.query('ROLLBACK');
        console.log(err);
    }
    finally {
        if (db) db.done();
    }
});

// Listen on the provided port
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Listening on port ${PORT}.`);
});
