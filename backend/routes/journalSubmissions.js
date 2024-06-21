import express from 'express';
import dotenv from 'dotenv';
import verifyJWT from '../middleware/verifyJWT.js';
import * as JournalSubmissionsService from '../services/journalSubmissions.js';

dotenv.config();
const router = express.Router();

// Require JWT
// if (process.env.JWT_ENABLED === "true")
//     router.use(verifyJWT);

// Create a new journal submission
router.post('/', async (req, res) => {
    try {
        const newSubmission = await JournalSubmissionsService.createSubmission(req.body);
        res.json(newSubmission);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Get all journal submissions for an assignment
router.get('/assignment/:assignmentId', async (req, res) => {
    try {
        const submissions = await JournalSubmissionsService.getSubmissionsByAssignment(req.params.assignmentId);
        res.json(submissions);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Update a journal submission
router.put('/:id', async (req, res) => {
    try {
        const updatedSubmission = await JournalSubmissionsService.updateSubmission(req.params.id, req.body);
        res.json(updatedSubmission);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Delete a journal submission
router.delete('/:id', async (req, res) => {
    try {
        await JournalSubmissionsService.deleteSubmission(req.params.id);
        res.sendStatus(204);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

export default router;
