import HttpError from "./utils/httpError.js";

import * as AssignmentService from "../services/assignments.js";

export const getByAssignment = async(db, assignmentId, page, perPage) => {
    // Set start point
    const startIndex = perPage * (page - 1);
    const res = await db.query(
        `SELECT a.user_id AS "userId",
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        round(a.average_rating, 2) AS "averageRating"
        FROM analytics AS a
        JOIN users AS u
        ON u.id = a.user_id
        WHERE a.assignment_id = $1 AND a.average_rating IS NOT NULL
        ORDER BY average_rating
        LIMIT $2 OFFSET $3`,
        [assignmentId, perPage, startIndex]
    );
    return res.rows.map(row => ({
        ...row,
        averageRating: parseFloat(row.averageRating)
    }));
}

// Function to get users who haven't completed all of their reviews
export const getIncomplete = async(db, assignmentId, page, perPage) => {
    // Set start point
    const startIndex = perPage * (page - 1);
    const res = await db.query(
        `WITH all_results AS
        (SELECT u.id AS "userId",
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        count(CASE WHEN r.completed = true THEN 1 END)::int AS "completedReviews",
        count(r.id)::int AS "totalReviews"
        FROM assignments AS a
        JOIN reviews AS r
        ON r.assignment_id = a.id
        JOIN users AS u
        ON u.id = r.user_id
        WHERE a.id = $1
        GROUP BY u.id),
        
        filtered_ordered_results AS 
        (SELECT *
        FROM all_results
        WHERE "completedReviews" != "totalReviews"
        ORDER BY "completedReviews"::float / "totalReviews",
        "lastName", "firstName"),

        limited_results AS
        (SELECT * FROM filtered_ordered_results LIMIT $2 OFFSET $3)
        
        SELECT
            (SELECT count(*)::int FROM filtered_ordered_results) 
            AS "totalResults",
            (SELECT jsonb_agg(limited_results)
            FROM limited_results) AS "results"`,
        [assignmentId, perPage, startIndex]
    );
    return res.rows;
}

// Update analytics for a specific user. Used when submitting reviews
export const updateAnalytics = async(db, userId, assignmentId) => {
    // Compute analytics and insert
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