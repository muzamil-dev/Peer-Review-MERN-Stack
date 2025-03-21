import db from "../config.js";

export const getByAssignment = async(userId, assignmentId, page, perPage) => {
    try{
        // Check that the user requesting is the instructor
        let user = await db.query(
            `SELECT a.workspace_id, m.role
            FROM assignments AS a
            LEFT JOIN memberships AS m
            ON a.workspace_id = m.workspace_id AND m.user_id = $1
            WHERE a.id = $2`,
            [userId, assignmentId]
        );
        user = user.rows[0];
        if (!user)
            return {
                error: "The requested assignment does not exist",
                status: 404
            };
        if (user.role !== "Instructor")
            return { 
                error: "User is not authorized to make this request", 
                status: 403
            };
        // Set start point
        const startIndex = perPage * (page - 1);
        const res = await db.query(
            `SELECT a.user_id AS "userId",
            u.first_name AS "firstName",
            u.last_name AS "lastName",
            a.assignment_id AS "assignmentId", 
            round(a.average_rating, 2) AS "averageRating"
            FROM analytics AS a
            JOIN users AS u
            ON u.id = a.user_id
            WHERE a.assignment_id = $1
            ORDER BY average_rating
            LIMIT $2 OFFSET $3`,
            [assignmentId, perPage, startIndex]
        );
        return res.rows.map(row => ({
            ...row,
            averageRating: parseFloat(row.averageRating)
        }));
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Get the average ratings for all assignments for a specific user
export const getByUserAndWorkspace = async(userId, targetId, workspaceId) => {
    try{
        // Check that the user requesting is the instructor
        let user = await db.query(
            `SELECT w.id, m.role
            FROM workspaces AS w
            LEFT JOIN memberships AS m
            ON w.id = m.workspace_id AND m.user_id = $1
            WHERE w.id = $2`,
            [userId, workspaceId]
        );
        user = user.rows[0];
        if (!user)
            return {
                error: "The requested workspace does not exist",
                status: 404
            };
        if (user.role !== "Instructor")
            return { 
                error: "User is not authorized to make this request", 
                status: 403
            };
        
        // Get the results
        const res = await db.query(
            `SELECT u.id AS "userId",
            u.first_name AS "firstName",
            u.last_name AS "lastName",
            jsonb_agg(
                jsonb_build_object(
                    'assignmentId', a.assignment_id,
                    'startDate', b.start_date,
                    'dueDate', b.due_date,
                    'averageRating', round(a.average_rating, 2)
                ) ORDER BY b.due_date
            ) AS "assignments"
            FROM users AS u
            JOIN analytics AS a
            ON u.id = a.user_id
            JOIN assignments AS b
            ON a.assignment_id = b.id
            WHERE u.id = $1 AND b.workspace_id = $2
            GROUP BY u.id, u.first_name, u.last_name`,
            [targetId, workspaceId]
        );
        const data = res.rows[0];
        if (!data)
            return {
                error: "No analytics were found for this user and workspace",
                status: 404
            };
        return data;
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

export const calculateAnalytics = async(assignmentId) => {
    try{
        // Compute analytics
        const res = await db.query(
            `INSERT INTO analytics
            SELECT target_id AS user_id, assignment_id, avg(rating) AS average_rating
            FROM reviews
            LEFT JOIN ratings
            ON review_id = id
            WHERE assignment_id = $1
            GROUP BY target_id, assignment_id
            RETURNING *`,
            [assignmentId]
        );
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}