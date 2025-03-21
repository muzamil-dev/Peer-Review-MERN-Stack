import db from '../config.js';

export const createSubmission = async (submission) => {
    try {
        const res = await db.query(
            'INSERT INTO journal_submission (journal_assignment_id, user_id, submission_text) VALUES ($1, $2, $3) RETURNING *',
            [submission.journal_assignment_id, submission.user_id, submission.submission_text]
        );
        return res.rows[0];
    } catch (err) {
        throw new Error(err.message);
    }
};

export const getSubmissionsByAssignment = async (assignmentId) => {
    try {
        const res = await db.query('SELECT * FROM journal_submission WHERE journal_assignment_id = $1', [assignmentId]);
        return res.rows;
    } catch (err) {
        throw new Error(err.message);
    }
};

export const updateSubmission = async (id, submission) => {
    try {
        const res = await db.query(
            'UPDATE journal_submission SET submission_text = $1 WHERE id = $2 RETURNING *',
            [submission.submission_text, id]
        );
        return res.rows[0];
    } catch (err) {
        throw new Error(err.message);
    }
};

export const deleteSubmission = async (id) => {
    try {
        await db.query('DELETE FROM journal_submission WHERE id = $1', [id]);
    } catch (err) {
        throw new Error(err.message);
    }
};
