import db from '../config.js';

export const createAssignment = async (assignment) => {
    try {
        const res = await db.query(
            'INSERT INTO journal_assignment (workspace_id, start_date, end_date) VALUES ($1, $2, $3) RETURNING *',
            [assignment.workspace_id, assignment.start_date, assignment.end_date]
        );
        return res.rows[0];
    } catch (err) {
        throw new Error(err.message);
    }
};

export const getAssignmentsByWorkspace = async (workspaceId) => {
    try {
        const res = await db.query('SELECT * FROM journal_assignment WHERE workspace_id = $1', [workspaceId]);
        return res.rows;
    } catch (err) {
        throw new Error(err.message);
    }
};

export const updateAssignment = async (id, assignment) => {
    try {
        const res = await db.query(
            'UPDATE journal_assignment SET start_date = $1, end_date = $2 WHERE id = $3 RETURNING *',
            [assignment.start_date, assignment.end_date, id]
        );
        return res.rows[0];
    } catch (err) {
        throw new Error(err.message);
    }
};

export const deleteAssignment = async (id) => {
    try {
        await db.query('DELETE FROM journal_assignment WHERE id = $1', [id]);
    } catch (err) {
        throw new Error(err.message);
    }
};
