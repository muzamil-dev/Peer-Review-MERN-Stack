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
        await journalService.submitJournalEntry(db, journalAssignmentId, userId, content);
        res.status(201).json({ message: 'Journal entry submitted successfully' });
    } catch (err) {
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

// Get all journals submitted by a user in a specific workspace
router.get(["/:workspaceId/user", "/:workspaceId/user/:userId"], async (req, res) => {
    const { workspaceId } = req.params;
    let userId, db;

    try {
        db = await pool.connect();

        // If a userId is provided in the route parameter, check if the requester is an instructor
        if (req.params.userId) {
            await WorkspaceService.checkInstructor(db, req.body.userId, workspaceId); // Assuming req.body.userId is the admin's userId from JWT
            userId = req.params.userId;
        } else {
            userId = req.body.userId; // For regular users who pass their userId in the body
        }

        const journals = await journalService.getJournalsByUserAndWorkspace(db, workspaceId, userId);
        res.status(200).json(journals);
    } catch (err) {
        if (err instanceof HttpError) {
            res.status(err.status).json({ message: err.message });
        } else {
            console.error('Error fetching journals:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    } finally {
        if (db) db.done();
    }
});

export default router;
