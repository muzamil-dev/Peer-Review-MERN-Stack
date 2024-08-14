import express from 'express';
import pool from '../config.js';
import verifyJWT from '../middleware/verifyJWT.js';
import HttpError from '../services/utils/httpError.js';
import * as journalService from '../services/journals.js';

const router = express.Router();

if (process.env.JWT_ENABLED === "true")
    router.use(verifyJWT);

// Route to submit a journal entry
router.post('/:journalAssignmentId/submit', async (req, res) => {
    const { journalAssignmentId } = req.params;
    const { userId, content } = req.body;
    let db;

    try {
        db = await pool.connect();
        await db.query('BEGIN');

        await journalService.submitJournalEntry(db, journalAssignmentId, userId, content);

        await db.query('COMMIT');
        res.status(201).json({ message: 'Journal entry submitted successfully' });
    } catch (err) {
        if (db) 
            await db.query('ROLLBACK');

        if (err instanceof HttpError) {
            res.status(err.status).json({ message: err.message });
        } else {
            console.error('Error submitting journal entry:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    } finally {
        if (db) db.done();
    }
});

//get journal by id
router.get('/:journalAssignmentId/user/:userId', async (req, res) => {
    const { journalAssignmentId, userId } = req.params;
    let db;

    try {
        db = await pool.connect();
        const journal = await journalService.getJournalById(db, journalAssignmentId, userId);
        res.status(200).json(journal);
    } catch (err) {
        if (err instanceof HttpError) {
            res.status(err.status).json({ message: err.message });
        } else {
            console.error('Error fetching journal:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    } finally {
        if (db) db.done();
    }
});

export default router;
