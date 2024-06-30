import db from '../config.js';

import * as ReviewService from './reviews.js';

// TODO: Modify create to check for instructor + create reviews if start date
// TODO: Create edit assignment
// TODO: Create delete assignment
// TODO: Create getByWorkspace
// LATER: Potentially edit so that review does not require group_id (use joins)

// Get an assignment by its id
export const getById = async(assignmentId) => {
    try{
        const res = await db.query(
            `SELECT * FROM assignments WHERE id = $1`,
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
            workspaceId: data.workspace_id,
            startDate: data.start_date,
            dueDate: data.due_date,
            questions: data.questions,
            description: data.description,
            started: data.started
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
            `SELECT a.*, w.id AS workspace_id
            FROM workspaces AS w
            LEFT JOIN assignments AS a
            ON w.id = a.workspace_id
            WHERE w.id = $1
            ORDER BY id`,
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
            workspaceId: row.workspace_id,
            startDate: row.start_date,
            dueDate: row.due_date,
            questions: row.questions,
            description: row.description,
            started: row.started
        }));
        return res.rows;
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Create a new assignment
export const create = async(userId, workspaceId, settings) => {
    try{
        const { startDate, dueDate, questions, description } = settings;
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
        const res = await db.query(
            `INSERT INTO assignments (workspace_id, start_date, due_date, questions, description, started)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [workspaceId, start_date.toISOString(), due_date, questions, description, started]
        );
        // Create reviews if assignment has already started
        if (started)
            await ReviewService.createReviews(res.rows[0].id);
        return { message: "Created assignment successfully" };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}