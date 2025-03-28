import db from '../config.js';

import * as ReviewService from './reviews.js';

// Get an assignment by its id
export const getById = async(assignmentId) => {
    try{
        const res = await db.query(
            `SELECT a.*, 
            array_agg(q.question ORDER BY q.id) AS questions
            FROM assignments AS a
            JOIN questions AS q
            ON a.id = q.assignment_id
            WHERE a.id = $1
            GROUP BY a.id`,
            [assignmentId]
        );
        const data = res.rows[0];
        // Check if assignment was found
        if (!data)
            return {
                error: "The requested assignment was not found",
                status: 404
            }
        // Return the formatted assignment data
        return {
            assignmentId: data.id,
            name: data.name,
            workspaceId: data.workspace_id,
            startDate: data.start_date,
            dueDate: data.due_date,
            questions: data.questions,
            description: data.description,
            started: data.started,
            completed: data.completed
        };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Get all assignments for a given workspace
export const getByWorkspace = async(workspaceId) => {
    try{
        const res = await db.query(
            `SELECT a.*, 
            array_agg(q.question ORDER BY q.id) AS questions
            FROM workspaces AS w
            LEFT JOIN assignments AS a
            ON w.id = a.workspace_id
            LEFT JOIN questions AS q
            ON a.id = q.assignment_id
            WHERE w.id = $1
            GROUP BY a.id
            ORDER BY a.due_date`,
            [workspaceId]
        );
        const data = res.rows;
        // Workspace does not exist if no rows are found
        if (data.length === 0)
            return { 
                error: "The requested workspace was not found", 
                status: 404 
            };
        // Workspace exists, but no assignments were found
        if (data.length === 1 && data[0].id === null)
            return [];

        // Format the data
        return data.map(row => ({
            assignmentId: row.id,
            name: row.name,
            workspaceId: row.workspace_id,
            startDate: row.start_date,
            dueDate: row.due_date,
            questions: row.questions,
            description: row.description,
            started: row.started,
            completed: row.completed
        }));
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Create a new assignment
// Edit to phase out questions array in assignments
export const create = async(userId, workspaceId, settings) => {
    try{
        const res = await db.query(
            `SELECT w.id AS workspace_id, m.role AS user_role
            FROM workspaces AS w
            LEFT JOIN memberships as m
            ON w.id = m.workspace_id AND m.user_id = $1
            WHERE w.id = $2`,
            [userId, workspaceId]
        );
        const data = res.rows[0];
        // Check that the workspace exists
        if (!data)
            return {
                error: "The requested workspace was not found",
                status: 404
            }
        // Check that the user is an instructor
        if (data.user_role !== "Instructor")
            return { 
                error: "User is not authorized to create assignments", 
                status: 403
            };

        // Create the assignment
        const { name, startDate, dueDate, questions, description } = settings;
        // Insert the fields
        // Check for a start date. If none was provided set it to now
        let start_date;
        if (!startDate)
            start_date = new Date(Date.now());
        else
            start_date = new Date(startDate);

        const due_date = (new Date(dueDate)).toISOString();
        let started = false;
        if (start_date <= Date.now())
            started = true

        // Insert the assignment
        const assignmentRes = await db.query(
            `INSERT INTO assignments (name, workspace_id, start_date, due_date, description, started)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, workspaceId, start_date.toISOString(), due_date, description, started]
        );
        // Get the assignment id
        const assignmentId = assignmentRes.rows[0].id;

        // Insert the questions
        const questionRes = await createQuestions(assignmentId, questions);

        // Create reviews if assignment has already started
        if (started)
            await ReviewService.createReviews(assignmentId);
        return { message: "Created assignment successfully" };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Helper function for adding review questions
export const createQuestions = async(assignmentId, questions) => {
    try{
        // Insert the questions
        let questionsQuery = `INSERT INTO questions (assignment_id, question) VALUES `
        questionsQuery += questions.map((_, index) => `($1, $${index+2})`).join(', ');
        questionsQuery += `RETURNING id`;
        const questionRes = await db.query(questionsQuery, [assignmentId, ...questions]);
        return questionRes;
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Edit an assignment
// Change to work with new questions table
// Change to create reviews if start date is reached
export const edit = async(userId, assignmentId, settings) => {
    try{
        const res = await db.query(
            `SELECT a.*, m.role AS user_role
            FROM assignments AS a
            LEFT JOIN memberships as m
            ON a.workspace_id = m.workspace_id AND m.user_id = $1
            WHERE a.id = $2`,
            [userId, assignmentId]
        );
        const assignment = res.rows[0];
        // Check that the assignment exists
        if (!assignment)
            return {
                error: "The requested assignment was not found",
                status: 404
            }
        // Check that the user is an instructor
        if (assignment.user_role !== "Instructor")
            return { 
                error: "User is not authorized to edit this assignment", 
                status: 403
            };
        
        // Format settings to use the same columns as the database
        const updates = {};
        if (settings.name)
            updates.name = settings.name;
        if (settings.startDate){
            const curDate = assignment.start_date;
            const newDate = settings.startDate;
            if (new Date(curDate).getTime() !== new Date(newDate).getTime()){
                if (assignment.started)
                    return {
                        error: "Cannot modify start date because the assignment has already been started",
                        status: 400
                    }
            }
            updates.start_date = (new Date(newDate)).toISOString();
        }
        if (settings.dueDate){
            const curDate = assignment.due_date;
            const newDate = settings.dueDate;
            if (new Date(curDate).getTime() !== new Date(newDate).getTime()){
                if (assignment.completed)
                    return {
                        error: "Cannot modify due date because analytics have already been computed",
                        status: 400
                    }
            }
            updates.due_date = (new Date(newDate)).toISOString();
        }
        if (settings.description !== undefined) // description can be null or empty
            updates.description = settings.description;

        // Set the questions if provided
        if (settings.questions){
            // Get the current questions
            const curQuestions = (await db.query(`
                SELECT array_agg(question ORDER BY id) AS questions
                FROM questions 
                WHERE assignment_id = $1
                GROUP BY assignment_id`,
                [assignment.id]
            )).rows[0].questions;
            // Check that the questions arrays aren't the same
            let flag = true; // true if the arrays are the same, false if not
            if (curQuestions.length !== settings.questions.length)
                flag = false;
            if (flag){
                for (let i = 0; i < curQuestions.length; i++){
                    if (curQuestions[i] !== settings.questions[i]){
                        flag = false;
                        break;
                    }
                }
            }
            if (!flag){ // Questions are different, replace them
                await Promise.all([
                    // Delete old questions
                    db.query(`DELETE FROM questions WHERE assignment_id = $1`, [assignment.id]),
                    // Add new questions
                    createQuestions(assignment.id, settings.questions)
                ]);
            }
        }

        // Build the update query
        let updateQuery = `UPDATE assignments SET `;
        // Build the set clause
        const keys = Object.keys(updates);
        const values = Object.values(updates);
        if (keys.length > 0){
            updateQuery += keys.map((key, index) => `${key} = $${index+1}`).join(', ');
            // Complete the query with assignment id
            updateQuery += ` WHERE id = $${values.length+1}`;
            // Query the update
            const updateRes = await db.query(updateQuery, [...values, assignment.id]);
        }

        return { message: "Assignment updated successfully" };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Delete an assignment
export const deleteAssignment = async(userId, assignmentId) => {
    try{
        const res = await db.query(
            `SELECT a.id as assignment_id, a.workspace_id, m.role AS user_role
            FROM assignments AS a
            LEFT JOIN memberships as m
            ON a.workspace_id = m.workspace_id AND m.user_id = $1
            WHERE a.id = $2`,
            [userId, assignmentId]
        );
        const data = res.rows[0];
        // Check that the assignment exists
        if (!data)
            return {
                error: "The requested assignment was not found",
                status: 404
            }
        // Check that the user is an instructor
        if (data.user_role !== "Instructor")
            return { 
                error: "User is not authorized to delete this assignment", 
                status: 403
            };
        // Delete the assignment
        await db.query(
            `DELETE FROM assignments WHERE id = $1`,
            [assignmentId]
        );
        return { message: "Assignment deleted successfully" };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}