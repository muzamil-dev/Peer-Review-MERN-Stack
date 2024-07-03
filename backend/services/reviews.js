import db from '../config.js';

// Format the return data
// Change to enforce certain ordering
export const getById = async(reviewId) => {
    try{
        const res = await db.query(
            `WITH rating_table AS
            (SELECT r.user_id, r.target_id, q.question, q.id AS question_id, ra.rating
            FROM reviews AS r
            LEFT JOIN ratings AS ra
            ON r.id = ra.review_id
            LEFT JOIN questions AS q
            ON q.id = ra.question_id
            WHERE r.id = $1),
            
            grouped_table AS 
            (SELECT user_id, target_id,
            jsonb_agg(
                jsonb_build_object(
                    'question', question,
                    'rating', rating
                ) ORDER BY question_id
            ) FILTER (WHERE rating IS NOT NULL) AS ratings
            FROM rating_table
            GROUP BY user_id, target_id)
            
            SELECT g.ratings, u1.first_name, u1.last_name,
            u2.first_name AS target_first_name,
            u2.last_name AS target_last_name
            FROM grouped_table AS g
            JOIN users AS u1
            ON g.user_id = u1.id
            JOIN users AS u2
            ON g.target_id = u2.id`,
            [reviewId]
        );
        // Check that the review exists
        const data = res.rows[0];
        if (!data)
            return { 
                error: "The requested review was not found", 
                status: 404 
            };
            
        // Format the data
        const formatted = {
            firstName: data.first_name,
            lastName: data.last_name,
            targetFirstName: data.target_first_name,
            targetLastName: data.target_last_name,
            ratings: data.ratings
        }
        return formatted;
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Get all reviews for a given assignment/user
// Read the blocks of sql and comments above each block to get 
// a better understanding of the query (it is very long)
export const getByAssignmentAndUser = async(userId, assignmentId) => {
    try{
        const res = await db.query(
            `/* Get the review ids for reviews with specified assignment/user. Join the question, rating,
            and target's name to each review to be grouped */
            WITH review_table AS
            (SELECT r.assignment_id, r.user_id, r.id, r.target_id, ra.rating, q.question, q.id AS question_id
            FROM reviews AS r
            LEFT JOIN ratings as ra
            ON r.id = ra.review_id
            LEFT JOIN questions as q
            ON ra.question_id = q.id
            WHERE r.user_id = $1 AND r.assignment_id = $2
            ORDER BY r.id),

            /* Group to create a list of reviews */
            ratings_table AS
            (SELECT assignment_id, user_id, target_id,
            jsonb_agg(
                jsonb_build_object(
                    'question', question,
                    'rating', rating
                ) ORDER BY question_id
            ) FILTER (WHERE rating IS NOT NULL) AS ratings
            FROM review_table
            JOIN users AS u
            ON target_id = u.id
            GROUP BY assignment_id, user_id, target_id),
            
            /* Group to create a single row with an array of reviews */
            assignment_user_table AS
            (SELECT rt.assignment_id, rt.user_id,
            jsonb_agg(
                jsonb_build_object(
                    'targetId', rt.target_id,
                    'firstName', u.first_name,
                    'lastName', u.last_name,
                    'ratings', rt.ratings
                )
            ) AS reviews
            FROM ratings_table AS rt
            JOIN users AS u
            ON rt.target_id = u.id
            GROUP BY rt.assignment_id, rt.user_id)
            
            /* Join the user's name to the new table */
            SELECT assignment_user_table.*, u.first_name, u.last_name
            FROM assignment_user_table
            JOIN users AS u
            ON user_id = u.id`,
            [userId, assignmentId]
        );
        const data = res.rows[0];
        if (!data)
            return {
                error: "The requested reviews were not found",
                status: 404
            };

        // Filter complete and incomplete reviews
        const completedReviews = data.reviews.filter(review => review.ratings !== null);
        const incompleteReviews = data.reviews.filter(review => review.ratings === null);

        // Return formatted object
        return {
            userId: data.user_id,
            firstName: data.first_name,
            lastName: data.last_name,
            completedReviews,
            incompleteReviews
        };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

export const getByAssignmentAndTarget = async(targetId, assignmentId) => {
    try{
        const res = await db.query(
            `/* Get the review ids for reviews with specified assignment/user. Join the question, rating,
            and target's name to each review to be grouped */
            WITH review_table AS
            (SELECT r.assignment_id, r.user_id, r.id, r.target_id, ra.rating, q.question, q.id AS question_id
            FROM reviews AS r
            LEFT JOIN ratings as ra
            ON r.id = ra.review_id
            LEFT JOIN questions as q
            ON ra.question_id = q.id
            WHERE r.target_id = $1 AND r.assignment_id = $2
            ORDER BY r.id),

            /* Group to create a list of reviews */
            ratings_table AS
            (SELECT assignment_id, user_id, target_id,
            jsonb_agg(
                jsonb_build_object(
                    'question', question,
                    'rating', rating
                ) ORDER BY question_id
            ) FILTER (WHERE rating IS NOT NULL) AS ratings
            FROM review_table
            JOIN users AS u
            ON user_id = u.id
            GROUP BY assignment_id, user_id, target_id),

            /* Group to create a single row with an array of reviews */
            assignment_target_table AS
            (SELECT rt.assignment_id, rt.target_id,
            jsonb_agg(
                jsonb_build_object(
                    'userId', rt.user_id,
                    'firstName', u.first_name,
                    'lastName', u.last_name,
                    'ratings', rt.ratings
                )
            ) AS reviews
            FROM ratings_table AS rt
            JOIN users AS u
            ON rt.user_id = u.id
            GROUP BY rt.assignment_id, rt.target_id)

            /* Join the target's name to the new table */
            SELECT att.target_id as "targetId", att.reviews, 
            u.first_name as "firstName", u.last_name as "lastName"
            FROM assignment_target_table as att
            JOIN users AS u
            ON att.target_id = u.id`,
            [targetId, assignmentId]
        );
        // Check if the reviews were found
        const data = res.rows[0];
        if (!data)
            return {
                error: "The requested reviews were not found",
                status: 404
            };

        // Filter complete reviews, incomplete reviews will be excluded
        data.reviews = data.reviews.filter(review => review.ratings !== null);
        return data;
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Helper function to create reviews for an assignment
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
        return { message: "Created reviews successfully" };
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
                ) ORDER BY q.id
            ) AS questions
            FROM reviews as r
            LEFT JOIN questions AS q
            ON q.assignment_id = r.assignment_id
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
        
        // Already in sorted order
        const questionIds = data.questions.map(question => question.question_id);
        // Sort the ratings by question id
        const ratingQuestionIds = ratings.map(rating => rating.questionId);
        ratingQuestionIds.sort((a, b) => a - b);

        if (JSON.stringify(questionIds) !== JSON.stringify(ratingQuestionIds))
            return {
                error: "Incorrect review submission",
                status: 400
            } 
        
        // Mark the review as completed
        const setComplete = await db.query(
            `UPDATE reviews SET completed = true
            WHERE id = $1`,
            [reviewId]
        );

        // Generate the ratings
        const ids = ratings.map(rating => rating.questionId);
        const newRatings = ratings.map(rating => rating.rating);

        let ratingsQuery = `INSERT INTO ratings VALUES `;
        ratingsQuery += questionIds.map(
            (_, idx) => `($1, $${idx+2}, $${idx+2+ratings.length})`
        ).join(', ');
        const insertRatings = await db.query(ratingsQuery, [data.id, ...ids, ...newRatings]);
        return { message: "Review submitted successfully" };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}