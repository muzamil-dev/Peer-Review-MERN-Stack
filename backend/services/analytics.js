import db from "../config.js";

export const getByAssignment = async (userId, assignmentId, page, perPage) => {
  try {
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
        status: 404,
      };
    if (user.role !== "Instructor")
      return {
        error: "User is not authorized to make this request",
        status: 403,
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
    return res.rows.map((row) => ({
      ...row,
      averageRating: parseFloat(row.averageRating),
    }));
  } catch (err) {
    return { error: err.message, status: 500 };
  }
};

// Get all averages on an assignment for a user and workspace
export const getByUserAndWorkspace = async (userId, workspaceId) => {
  try {
    const curDate = new Date(Date.now()).toISOString();
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

    const data = res.rows[0];
    return data;
  } catch (err) {
    return { error: err.message, status: 500 };
  }
};

export const calculateAnalytics = async (assignmentId) => {
  try {
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
  } catch (err) {
    return { error: err.message, status: 500 };
  }
};
