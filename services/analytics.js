import HttpError from "./utils/httpError.js";

import * as AssignmentService from "../services/assignments.js";

// Update analytics for a specific user. Used when submitting reviews
// Must be used within a transaction
export const updateAnalytics = async(db, userId, assignmentId) => {
    // Lock the row to prevent collisions
    await db.query(
        `SELECT * FROM analytics 
        WHERE user_id = $1 AND assignment_id = $2
        FOR UPDATE`,
        [userId, assignmentId]
    );
    // Compute analytics
    const res = await db.query(
        `INSERT INTO analytics
        SELECT target_id AS user_id, assignment_id, avg(rating) AS average_rating
        FROM reviews
        LEFT JOIN ratings
        ON review_id = id
        WHERE assignment_id = $1 AND target_id = $2
        GROUP BY target_id, assignment_id
        ON CONFLICT (user_id, assignment_id) DO UPDATE SET
        average_rating = EXCLUDED.average_rating
        RETURNING *`,
        [assignmentId, userId]
    );
    return res.rows;
}