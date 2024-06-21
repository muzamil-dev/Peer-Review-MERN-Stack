import express from 'express';
import dotenv from 'dotenv';
import verifyJWT from '../middleware/verifyJWT.js';
import * as JournalAssignmentsService from '../services/journalAssignments.js';

dotenv.config();
const router = express.Router();

// Require JWT
// if (process.env.JWT_ENABLED === "true")
//     router.use(verifyJWT);

// Create a new journal assignment
router.post('/', async (req, res) => {
    try {
        const newAssignment = await JournalAssignmentsService.createAssignment(req.body);
        res.json(newAssignment);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Get all journal assignments for a workspace
router.get('/workspace/:workspaceId', async (req, res) => {
    try {
        const assignments = await JournalAssignmentsService.getAssignmentsByWorkspace(req.params.workspaceId);
        res.json(assignments);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Update a journal assignment
router.put('/:id', async (req, res) => {
    try {
        const updatedAssignment = await JournalAssignmentsService.updateAssignment(req.params.id, req.body);
        res.json(updatedAssignment);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Delete a journal assignment
router.delete('/:id', async (req, res) => {
    try {
        await JournalAssignmentsService.deleteAssignment(req.params.id);
        res.sendStatus(204);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

export default router;
