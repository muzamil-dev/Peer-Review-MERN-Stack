import HttpError from '../services/utils/httpError.js';

import { createReviews } from './reviews.js';

// Get an assignment by its id
export const getById = async(db, assignmentId) => {
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
        throw new HttpError("The requested assignment was not found", 404);

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
    };
}

// Get all assignments for a given workspace
export const getByWorkspace = async(db, workspaceId) => {
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
        throw new HttpError("The requested workspace was not found", 404);

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
        started: row.started
    }));
}

// Check instructor given an assignment id
export const checkInstructor = async(db, userId, assignmentId) => {
    const user = (await db.query(
        `SELECT m.role
        FROM assignments AS a
        LEFT JOIN memberships AS m
        ON a.workspace_id = m.workspace_id AND m.user_id = $1
        WHERE a.id = $2`,
        [userId, assignmentId]
    )).rows[0];

    if (!user)
        throw new HttpError("The requested assignment was not found", 404);
    if (user.role !== 'Instructor')
        throw new HttpError("User is not an instructor of this workspace", 403);

    return { message: "User authorized" }
}

// Create a new assignment
export const create = async(db, workspaceId, settings) => {
    // Get all relevant settings from the settings object
    const { name, startDate, dueDate, questions, description } = settings;
    // Check for a start date. If none was provided, set it to now
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
    if (!assignmentId)
        throw new HttpError("Assignment failed to create", 500);

    // Insert the questions
    const questionRes = await createQuestions(db, assignmentId, questions);

    // Create reviews if assignment has already started
    if (started)
        await createReviews(db, assignmentId);
    return { message: "Created assignment successfully" };
}

// Helper function for adding review questions
const createQuestions = async(db, assignmentId, questions) => {
    // Insert the questions
    let questionsQuery = `INSERT INTO questions (assignment_id, question) VALUES `
    questionsQuery += questions.map((_, index) => `($1, $${index+2})`).join(', ');
    questionsQuery += `RETURNING id`;
    const questionRes = await db.query(questionsQuery, [assignmentId, ...questions]);
    return questionRes;
}

// Edit an assignment
// Change to create reviews if start date is reached
export const edit = async(db, assignmentId, settings) => {
    // Get the assignment, for use for certain comparisons
    const assignment = await getById(db, assignmentId);
    // Insert updates to make
    const updates = {};
    if (settings.name)
        updates.name = settings.name;
    if (settings.startDate){
        const curDate = assignment.startDate;
        const newDate = settings.startDate;
        // Assignment start dates can't be changed after they've been started
        if (new Date(curDate).getTime() !== new Date(newDate).getTime()){
            if (assignment.started)
                throw new HttpError(
                "Cannot modify start date because the assignment has already been started", 
                400);
        }
        updates.start_date = (new Date(newDate)).toISOString();
    }
    if (settings.dueDate){
        updates.due_date = (new Date(settings.dueDate)).toISOString();
    }
    if (settings.description !== undefined) // description can be null or empty
        updates.description = settings.description;

    // Set the questions if provided
    if (settings.questions && Array.isArray(settings.questions)){
        // Get the current questions
        const curQuestionsRes = await db.query(`
            SELECT array_agg(question ORDER BY id) AS questions
            FROM questions 
            WHERE assignment_id = $1
            GROUP BY assignment_id`,
            [assignmentId]
        );
        const curQuestions = curQuestionsRes.rows[0]?.questions || [];
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
            // Delete old questions
            await db.query(
                `DELETE FROM questions WHERE assignment_id = $1`, 
                [assignmentId]
            )
            // Add new questions
            await createQuestions(db, assignmentId, settings.questions);
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
        updateQuery += ` WHERE id = $${values.length+1} RETURNING *`;
        // Query the update
        const updateRes = await db.query(updateQuery, [...values, assignmentId]);
    }

    return { message: "Assignment updated successfully" };
}

// Delete an assignment
export const deleteAssignment = async(db, assignmentId) => {
    // Delete the assignment
    const assignment = (await db.query(
        `DELETE FROM assignments WHERE id = $1 RETURNING *`,
        [assignmentId]
    )).rows[0];
    // Error if assignment wasn't found
    if (!assignment)
        throw new HttpError("The requested assignment was not found", 404);

    return { message: "Assignment deleted successfully" };
}