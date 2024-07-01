import db from '../config.js';

// TODO: (look below)
// Likely wont add edit review

// Format the return data
export const getById = async(reviewId) => {
    try{
        const res = await db.query(
            `SELECT t1.*, u1.first_name, u1.last_name,
            u2.first_name AS target_first_name, u2.last_name AS target_last_name
            FROM 
            (SELECT r.user_id, r.target_id, r.completed,
            jsonb_agg(
                jsonb_build_object(
                    'question', q.question,
                    'rating', ra.rating
                )
            ) AS ratings
            FROM reviews AS r
            LEFT JOIN ratings AS ra
            ON r.id = ra.review_id
            LEFT JOIN questions AS q
            ON ra.question_id = q.id
            WHERE r.id = $1
            GROUP BY r.id) t1
            JOIN users AS u1
            ON t1.user_id = u1.id
            JOIN users AS u2
            ON t1.target_id = u2.id`,
            [reviewId]
        );
        // Check that the review exists
        const data = res.rows[0];
        return data;
        if (!data)
            return { 
                error: "The requested review was not found", 
                status: 404 
            };
        // Check if the review was completed
        if (!data.completed)
            ratings = [];

        return res.rows[0];
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

export const getByAssignmentAndUser = async(userId, assignmentId) => {

}

export const getByAssignmentAndTarget = async(targetId, assignmentId) => {

}

// Create reviews for an assignment
// These will made close to when an assignment opens
export const createReviews = async(assignmentId) => {
    try{
        // Get a list of users within each group
        const res = await db.query(
            `SELECT g.id as group_id, array_agg(m.user_id) AS group_members
            FROM assignments AS a
            JOIN groups AS g
            ON g.workspace_id = a.workspace_id
            JOIN memberships AS m
            ON g.id = m.group_id
            WHERE a.id = $1
            GROUP BY g.id`,
            [assignmentId]
        );
        // Build the query
        let query = `INSERT INTO reviews (assignment_id, group_id, user_id, target_id) VALUES `
        const insertions = [];
        res.rows.forEach(row => {
            const group = row.group_id;
            const members = row.group_members;
            for (let i = 0; i < members.length; i++){
                for (let j = 0; j < members.length; j++){
                    if (i === j)
                        continue;
                    insertions.push(`(${assignmentId}, ${group}, ${members[i]}, ${members[j]})`);
                }
            }
        });
        query += insertions.join(', ');
        await db.query(query);
        return;
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Submit a review

// Modify to remove ratings array
export const submit = async(userId, reviewId, ratings) => {
    try{
        const res = await db.query(
            `SELECT r.*,
            jsonb_agg(
                jsonb_build_object(
                    'question', q.question,
                    'question_id', q.id
                )
            ) AS questions
            FROM reviews as r
            LEFT JOIN assignment_questions AS aq
            ON aq.assignment_id = r.assignment_id
            JOIN questions AS q
            ON q.id = aq.question_id
            WHERE r.id = $1
            GROUP BY r.id`,
            [reviewId]
        );
        const data = res.rows[0];
        // Check that the referenced review exists
        if (!data)
            return { 
                error: "The requested review was not found", 
                status: 404 
            };
        // Check that the user submitting the review is the user listed on the review
        if (userId !== data.user_id)
            return {
                error: "Incorrect review submission",
                status: 400
            }
        // Check that the number of ratings is equal to the number of questions
        if (ratings.length !== data.questions.length)
            return {
                error: "Incomplete review submission",
                status: 400
            }
        // Mark the review as completed
        const setComplete = await db.query(
            `UPDATE reviews SET ratings = $1, completed = true
            WHERE id = $2`,
            [ratings, reviewId]
        );

        // Generate the ratings
        const questionIds = data.questions.map(q => q.question_id);
        let ratingsQuery = `INSERT INTO ratings VALUES `;
        ratingsQuery += questionIds.map(
            (_, idx) => `($1, $${idx+2}, $${idx+2+ratings.length})`
        ).join(', ');
        const insertRatings = await db.query(ratingsQuery, [data.id, ...questionIds, ...ratings])
        return { message: "Review submitted successfully" };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}