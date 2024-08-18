import HttpError from "./utils/httpError.js";
import { query } from '../config.js';

import * as AssignmentService from "../services/assignments.js";
import * as AnalyticsService from "../services/analytics.js";

// Get a review by id
export const getById = async(reviewId) => {
    const res = await query(
        `WITH rating_table AS
        (SELECT a.id AS "assignmentId", r.user_id, r.target_id, r.comment, a.start_date, a.due_date,
        array_agg(q.question ORDER BY q.id) FILTER(WHERE q.question IS NOT NULL) AS questions,
        array_agg(ra.rating ORDER BY ra.question_id) FILTER(WHERE ra.rating IS NOT NULL) AS ratings
        FROM reviews AS r
        LEFT JOIN assignments AS a
        ON r.assignment_id = a.id
        LEFT JOIN questions AS q
        ON q.assignment_id = r.assignment_id
        LEFT JOIN ratings AS ra
        ON ra.question_id = q.id AND ra.review_id = r.id
        WHERE r.id = $1
        GROUP BY r.id, a.id)
        
        SELECT "assignmentId", user_id AS "userId", target_id AS "targetId",
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
        throw new HttpError("The requested review was not found", 404);
        
    return data;
}

// Get all reviews for a given assignment/user
export const getByAssignmentAndUser = async(userId, assignmentId) => {
    // Check that the assignment has started
    const assignment = await AssignmentService.getById(assignmentId);
    if (new Date(assignment.startDate) > Date.now())
        throw new HttpError(
            "Cannot get reviews for this assignment as it has not started",
            400
        );
    
    // Get the reviews with names attached
    const res = await query(
        `WITH review_table AS
        (SELECT r.id, r.assignment_id, r.user_id, r.target_id, r.comment, r.completed,
        array_agg(ra.rating ORDER BY q.id) FILTER (WHERE q.id IS NOT NULL) AS ratings
        FROM reviews AS r
        LEFT JOIN ratings as ra
        ON r.id = ra.review_id
        LEFT JOIN questions as q
        ON ra.question_id = q.id
        WHERE r.user_id = $1 AND r.assignment_id = $2
        GROUP BY r.id
        ORDER BY r.id),

        row_table AS
        (SELECT rt.assignment_id, rt.user_id,
        jsonb_agg(
            jsonb_build_object(
                'reviewId', rt.id,
                'targetId', rt.target_id,
                'firstName', u.first_name,
                'lastName', u.last_name,
                'ratings', rt.ratings,
                'comment', rt.comment,
                'completed', rt.completed
            ) ORDER BY rt.id
        ) AS reviews
        FROM review_table AS rt
        JOIN users AS u
        ON u.id = rt.target_id
        GROUP BY assignment_id, user_id)
        
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
        throw new HttpError(
            "No reviews were assigned for this user", 400
        );

    // Filter complete and incomplete reviews
    const completedReviews = data.reviews.filter(review => review.completed);
    const incompleteReviews = data.reviews.filter(review => !review.completed);

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

// Get reviews on an assignment created toward a specified user
export const getByAssignmentAndTarget = async(targetId, assignmentId) => {
    // Check that the assignment has started
    const assignment = await AssignmentService.getById(assignmentId);
    if (new Date(assignment.startDate) > Date.now())
        throw new HttpError(
            "Cannot get reviews for this assignment as it has not started",
            400
        );

    // Get reviews with names attached
    const res = await query(
        `WITH review_table AS
        (SELECT r.id, r.assignment_id, r.user_id, r.target_id, r.comment, 
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
                'ratings', rt.ratings,
                'comment', rt.comment
            ) ORDER BY rt.id
        ) AS reviews
        FROM review_table AS rt
        JOIN users AS u
        ON u.id = rt.user_id
        GROUP BY assignment_id, target_id)
        
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
        throw new HttpError(
            "Reviews cannot be accessed as this assignment has not started", 400
        );

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

// Helper function to create reviews for an assignment
export const createReviews = async(assignmentId) => {
    // Get a list of users within each group
    const res = await query(
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
    let queryText = `INSERT INTO reviews (assignment_id, group_id, user_id, target_id) VALUES `
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
    queryText += insertions.join(', ');
    await query(queryText);
    return { message: "Created reviews successfully" };
}

// Submit a review
export const submit = async(userId, reviewId, ratings, comment) => {
    // Get required data about the review and assignment
    const data = (await query(
        `SELECT r.user_id AS "userId", r.target_id AS "targetId",
        r.completed, a.id AS "assignmentId", 
        a.start_date AS "startDate", a.due_date AS "dueDate", 
        array_agg(q.id ORDER BY q.id) as "questionIds"
        FROM reviews AS r
        JOIN assignments AS a
        ON r.assignment_id = a.id
        JOIN questions AS q
        ON a.id = q.assignment_id
        WHERE r.id = $1
        GROUP BY r.id, a.id`,
        [reviewId]
    )).rows[0];
    if (!data)
        throw new HttpError("The requested review was not found", 404);

    // Check that the user submitting the review is the user listed on the review
    if (userId !== data.userId)
        throw new HttpError("Incorrect review submission", 400);

    // Check that the submission is within the start and end dates
    const startDate = new Date(data.startDate);
    const dueDate = new Date(data.dueDate);
    if (startDate > Date.now() || dueDate < Date.now())
        throw new HttpError("This assignment is not currently active", 400);

    // Questions are sorted by id, the ratings' order is assumed to match the ordering of questions
    if (data.questionIds.length !== ratings.length)
        throw new HttpError("Incorrect number of ratings given", 400);
    // Check that each rating is between 1 and 5
    ratings.forEach(rating => {
        if (!Number.isInteger(rating) || rating < 1 || rating > 5)
            throw new HttpError("All ratings must be integers between 1 and 5", 400);
    });

    // Build a query to insert all of the ratings
    let ratingsQuery = `INSERT INTO ratings VALUES `;
    ratingsQuery += ratings.map(
        (_, idx) => `(${reviewId}, ${data.questionIds[idx]}, ${ratings[idx]})`
    ).join(', ');
    ratingsQuery += ';';

    await query(
        // Delete old ratings
        `DELETE FROM ratings WHERE review_id = ${reviewId};
        ${ratingsQuery}` // Insert ratings
    );
    // Insert comment and set review to completed
    await query(
        `UPDATE reviews SET 
        completed = true, comment = $1 
        WHERE id = $2`, 
        [comment, reviewId]
    );

    // Update the analytics for that user
    await AnalyticsService.updateAnalytics(
        data.userId, data.targetId, 
        data.assignmentId
    );

    return { message: "Review submitted successfully" };
}
