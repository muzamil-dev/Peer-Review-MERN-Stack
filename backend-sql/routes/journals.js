import express from 'express';
import { query } from '../config.js';
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

    try {
        await query('BEGIN');

        await journalService.submitJournalEntry(journalAssignmentId, userId, content);

        await query('COMMIT');
        res.status(201).json({ message: 'Journal entry submitted successfully' });
    } catch (err) {
        await query('ROLLBACK');

        if (err instanceof HttpError) {
            res.status(err.status).json({ message: err.message });
        } else {
            console.error('Error submitting journal entry:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
});

// Get journal by id
router.get('/:journalAssignmentId/user/:userId', async (req, res) => {
    const { journalAssignmentId, userId } = req.params;

    try {
        const journal = await journalService.getJournalById(journalAssignmentId, userId);
        res.status(200).json(journal);
    } catch (err) {
        if (err instanceof HttpError) {
            res.status(err.status).json({ message: err.message });
        } else {
            console.error('Error fetching journal:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
});

export default router;
