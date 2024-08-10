import HttpError from "./utils/httpError.js";

import * as AssignmentService from "../services/assignments.js";

export const getAveragesByAssignment = async(db, assignmentId, page, perPage) => {
    // Set start point
    const startIndex = perPage * (page - 1);
    const res = await db.query(
        `WITH all_results AS
        (SELECT a.user_id AS "userId",
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        round(a.average_rating, 2)::float AS "averageRating"
        FROM analytics AS a
        JOIN users AS u
        ON u.id = a.user_id
        WHERE a.assignment_id = $1 AND a.average_rating IS NOT NULL
        ORDER BY average_rating),
        
        limited_results AS
        (SELECT * FROM all_results
        LIMIT $2 OFFSET $3)
        
        SELECT
            (SELECT count(*)::int FROM all_results) AS "totalResults",
            (SELECT jsonb_agg(limited_results) FROM
            limited_results) AS results`,
        [assignmentId, perPage, startIndex]
    );
    return res[0];
}

// Function to get users who haven't completed all of their reviews
export const getCompletionByAssignment = async(db, assignmentId, page, perPage) => {
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
    return res[0];
}

// Get all averages on an assignment for a user and workspace
export const getByUserAndWorkspace = async(db, userId, workspaceId) => {
    const curDate = (new Date(Date.now())).toISOString();
    // Get the results
    const res = await db.query(
        `WITH averages AS
        (SELECT u.id AS user_id,
        jsonb_agg(
            jsonb_build_object(
                'assignmentId', a.assignment_id,
                'startDate', b.start_date,
                'dueDate', b.due_date,
                'averageRating', round(a.average_rating, 2)::float
            ) ORDER BY b.due_date
        ) AS "assignments"
        FROM users AS u
        LEFT JOIN analytics AS a
        ON u.id = a.user_id
        JOIN assignments AS b
        ON a.assignment_id = b.id AND b.workspace_id = $2 
        AND b.start_date < $3
        WHERE u.id = $1
        GROUP BY u.id)
        
        SELECT u.id AS "userId", u.first_name AS "firstName",
        u.last_name AS "lastName", 
        COALESCE(a.assignments, '[]'::jsonb) AS assignments
        FROM users AS u
        LEFT JOIN averages AS a
        ON u.id = a.user_id
        WHERE u.id = $1`,
        [userId, workspaceId, curDate]
    );
    const data = res[0];
    return data;
}

// Initialize the analytics table with reviews. Use after creating reviews
export const createAnalytics = async(db, assignmentId) => {
    const res = await db.query(
        `INSERT INTO analytics (user_id, assignment_id, total_reviews)
        SELECT r.user_id, r.assignment_id,
        count(*)::int AS total_reviews
        FROM reviews AS r
        WHERE r.assignment_id = $1
        GROUP BY r.user_id, r.assignment_id
        RETURNING *`,
        [assignmentId]
    );
    return res;
}

// Update analytics for a specific user. Used when submitting reviews
// This does not use prepared 
export const updateAnalytics = async(db, userId, targetId, assignmentId) => {
    // Check if the review was previously completed. If it wasn't, set
    // Compute analytics and insert
    const res = await Promise.all([
        db.query(
        `WITH averages AS
        (SELECT avg(ra.rating) AS average_rating
        FROM reviews AS r
        LEFT JOIN ratings AS ra
        ON ra.review_id = r.id
        WHERE r.assignment_id = $1 AND r.target_id = $2
        GROUP BY r.target_id, r.assignment_id)

        UPDATE analytics
        SET average_rating = a.average_rating
        FROM averages AS a
        WHERE assignment_id = $1 AND user_id = $2`,
        [assignmentId, targetId]),

        db.query(
        `WITH completion AS
        (SELECT count(CASE WHEN completed = true THEN 1 END)::int 
        AS completed_reviews
        FROM reviews
        WHERE user_id = $2 AND assignment_id = $1)
        
        UPDATE analytics SET
        completed_reviews = c.completed_reviews
        FROM completion AS c
        WHERE assignment_id = $1 AND user_id = $2`,
        [assignmentId, userId])
    ]);

    return { message: "Analytics computed" };
}