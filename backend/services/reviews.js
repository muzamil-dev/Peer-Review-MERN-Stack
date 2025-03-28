import db from '../config.js';

// Get a review by id
export const getById = async(reviewId) => {
    try{
        const res = await db.query(
            `WITH rating_table AS
            (SELECT r.user_id, r.target_id, a.start_date, a.due_date,
            array_agg(q.question ORDER BY q.id) FILTER(WHERE q.question IS NOT NULL) AS questions,
            array_agg(ra.rating ORDER BY ra.question_id) FILTER(WHERE ra.rating IS NOT NULL) AS ratings,
            r.comment AS comment -- Fetch the comment from the reviews table
            FROM reviews AS r
            LEFT JOIN assignments AS a
            ON r.assignment_id = a.id
            LEFT JOIN questions AS q
            ON q.assignment_id = r.assignment_id
            LEFT JOIN ratings AS ra
            ON ra.question_id = q.id AND ra.review_id = r.id
            WHERE r.id = $1
            GROUP BY r.user_id, r.target_id, a.start_date, a.due_date, r.comment
            )
            SELECT user_id AS "userId", target_id AS "targetId",
            u1.first_name AS "firstName", u1.last_name AS "lastName",
            u2.first_name AS "targetFirstName", u2.last_name AS "targetLastName",
            start_date AS "startDate", due_date AS "dueDate",
            questions, ratings, comment
            FROM rating_table
            JOIN users AS u1
            ON u1.id = user_id
            JOIN users AS u2
            ON u2.id = target_id`,
            [reviewId]
        );
        // Check that the review exists
        const data = res.rows[0];
        if (!data)
            return { 
                error: "The requested review was not found", 
                status: 404 
            };
            
        return data;
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
            `/* Get the review ids and ratings, group them together to create an array of ratings for each review */
            WITH review_table AS
            (SELECT r.id, r.assignment_id, r.user_id, r.target_id, 
            array_agg(ra.rating ORDER BY q.id) FILTER (WHERE q.id IS NOT NULL) AS ratings
            FROM reviews AS r
            LEFT JOIN ratings as ra
            ON r.id = ra.review_id
            LEFT JOIN questions as q
            ON ra.question_id = q.id
            WHERE r.user_id = $1 AND r.assignment_id = $2
            GROUP BY r.id
            ORDER BY r.id),

            /* Group into one row with the specified assignment and user, join target name */
            row_table AS
            (SELECT rt.assignment_id, rt.user_id,
            jsonb_agg(
                jsonb_build_object(
                    'reviewId', rt.id,
                    'targetId', rt.target_id,
                    'firstName', u.first_name,
                    'lastName', u.last_name,
                    'ratings', rt.ratings
                ) ORDER BY rt.id
            ) AS reviews
            FROM review_table AS rt
            JOIN users AS u
            ON u.id = rt.target_id
            GROUP BY assignment_id, user_id)
            
            /* Join the assignment questions and user's name */
            SELECT rt.user_id, u.first_name, u.last_name, rt.reviews,
            array_agg(q.question ORDER BY q.id) AS questions
            FROM row_table AS rt
            JOIN users AS u
            ON u.id = rt.user_id
            JOIN questions AS q
            ON rt.assignment_id = q.assignment_id
            GROUP BY rt.user_id, u.first_name, u.last_name, rt.reviews`,
            [userId, assignmentId]
        );
        const data = res.rows[0];
        if (!data)
            return {
                error: "The requested reviews were not found",
                status: 200
            };

        // Filter complete and incomplete reviews
        const completedReviews = data.reviews.filter(review => review.ratings !== null);
        const incompleteReviews = data.reviews.filter(review => review.ratings === null);

        // Return formatted object
        return {
            userId: data.user_id,
            firstName: data.first_name,
            lastName: data.last_name,
            questions: data.questions,
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
            `/* Get the review ids and ratings, group them together to create an array of ratings for each review */
            WITH review_table AS
            (SELECT r.id, r.assignment_id, r.user_id, r.target_id, 
            array_agg(ra.rating ORDER BY q.id) FILTER (WHERE q.id IS NOT NULL) AS ratings
            FROM reviews AS r
            LEFT JOIN ratings as ra
            ON r.id = ra.review_id
            LEFT JOIN questions as q
            ON ra.question_id = q.id
            WHERE r.target_id = $1 AND r.assignment_id = $2
            GROUP BY r.id
            ORDER BY r.id),

            /* Group into one row with the specified assignment and target, join user name */
            row_table AS
            (SELECT rt.assignment_id, rt.target_id,
            jsonb_agg(
                jsonb_build_object(
                    'reviewId', rt.id,
                    'userId', rt.user_id,
                    'firstName', u.first_name,
                    'lastName', u.last_name,
                    'ratings', rt.ratings
                ) ORDER BY rt.id
            ) AS reviews
            FROM review_table AS rt
            JOIN users AS u
            ON u.id = rt.user_id
            GROUP BY assignment_id, target_id)
            
            /* Join the assignment questions and user's name */
            SELECT rt.target_id, u.first_name, u.last_name, rt.reviews,
            array_agg(q.question ORDER BY q.id) AS questions
            FROM row_table AS rt
            JOIN users AS u
            ON u.id = rt.target_id
            JOIN questions AS q
            ON rt.assignment_id = q.assignment_id
            GROUP BY rt.target_id, u.first_name, u.last_name, rt.reviews`,
            [targetId, assignmentId]
        );
        // Check if the reviews were found
        const data = res.rows[0];
        if (!data)
            return {
                error: "The requested reviews were not found",
                status: 200
            };

        // Filter complete reviews, incomplete reviews will be excluded
        data.reviews = data.reviews.filter(review => review.ratings !== null);
        return {
            targetId: data.target_id,
            firstName: data.first_name,
            lastName: data.last_name,
            questions: data.questions,
            reviews: data.reviews
        };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
} 

// services/reviews.js
export const getByAssignmentAndTargetWithQAverages = async(targetId, assignmentId) => {
    try {
        const res = await db.query(
            `WITH review_table AS
            (SELECT r.id, r.assignment_id, r.user_id, r.target_id, 
            array_agg(ra.rating ORDER BY q.id) FILTER (WHERE q.id IS NOT NULL) AS ratings
            FROM reviews AS r
            LEFT JOIN ratings as ra
            ON r.id = ra.review_id
            LEFT JOIN questions as q
            ON ra.question_id = q.id
            WHERE r.target_id = $1 AND r.assignment_id = $2
            GROUP BY r.id
            ORDER BY r.id),

            row_table AS
            (SELECT rt.assignment_id, rt.target_id,
            jsonb_agg(
                jsonb_build_object(
                    'reviewId', rt.id,
                    'userId', rt.user_id,
                    'firstName', u.first_name,
                    'lastName', u.last_name,
                    'ratings', rt.ratings
                ) ORDER BY rt.id
            ) AS reviews
            FROM review_table AS rt
            JOIN users AS u
            ON u.id = rt.user_id
            GROUP BY assignment_id, target_id)
            
            SELECT rt.target_id, u.first_name, u.last_name, rt.reviews,
            array_agg(q.question ORDER BY q.id) AS questions,
            array_agg(q.id ORDER BY q.id) AS questionIds
            FROM row_table AS rt
            JOIN users AS u
            ON u.id = rt.target_id
            JOIN questions as q
            ON rt.assignment_id = q.assignment_id
            GROUP BY rt.target_id, u.first_name, u.last_name, rt.reviews`,
            [targetId, assignmentId]
        );

        const data = res.rows[0];
        if (!data) {
            console.error("No data returned from database.");
            return {
                error: "The requested reviews were not found",
                status: 200
            };
        }

        // Log the data for debugging
        //console.log("Database response:", JSON.stringify(data, null, 2));

        // Ensure reviews and questions are arrays
        data.reviews = data.reviews || [];
        data.questions = data.questions || [];

        // Calculate average ratings per question
        const questionAverages = data.questions.map((question, idx) => {
            const ratings = (data.reviews || []).map(review => review.ratings ? review.ratings[idx] : null).filter(r => r !== null);
            const averageRating = ratings.length > 0 ? ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length : 0;
            return { question, averageRating };
        });

        // Filter complete reviews, incomplete reviews will be excluded
        data.reviews = data.reviews.filter(review => review.ratings !== null);
        return {
            targetId: data.target_id,
            firstName: data.first_name,
            lastName: data.last_name,
            questions: data.questions,
            reviews: data.reviews,
            questionAverages
        };
    } catch (err) {
        console.error("Error in getByAssignmentAndTargetWithQAverages:", err);
        return { error: err.message, status: 500 };
    }
};



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
export const submit = async(userId, reviewId, ratings, comment) => {
    try{
        const res = await db.query(
            `SELECT r.*, a.start_date, a.due_date,
            array_agg(
                q.id ORDER BY q.id
            ) AS "questionIds"
            FROM reviews as r
            LEFT JOIN assignments AS a
            ON r.assignment_id = a.id
            LEFT JOIN questions AS q
            ON q.assignment_id = r.assignment_id
            WHERE r.id = $1
            GROUP BY r.id, a.id`,
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

        // Check that the submission is within the start and end dates
        const startDate = new Date(data.start_date);
        const dueDate = new Date(data.due_date);
        if (startDate > Date.now() || dueDate < Date.now())
            return {
                error: "This review is currently not active",
                status: 400
            }
        
        // Questions are sorted by id, the ratings' order is assumed to match the ordering of questions
        const questionIds = data.questionIds;
        if (questionIds.length !== ratings.length)
            return {
                error: "Incorrect number of ratings given",
                status: 400
            } 

        // Delete old ratings
        const deleteRatings = await db.query(
            `DELETE FROM ratings WHERE review_id = $1`,
            [reviewId]
        );

        // Update the comment in the reviews table
        await db.query(
            `UPDATE reviews SET comment = $2 WHERE id = $1`,
            [reviewId, comment]
        );

        // Insert new ratings
        let ratingsQuery = `INSERT INTO ratings (review_id, question_id, rating) VALUES `;
        ratingsQuery += ratings.map((_, idx) => `($1, $${idx + 2}, $${idx + 2 + ratings.length})`).join(', ');

        const values = [reviewId, ...questionIds, ...ratings];
        await db.query(ratingsQuery, values);

        return { message: "Review submitted successfully" };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}