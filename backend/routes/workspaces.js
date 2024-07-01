import express from 'express';

// Import services
import * as WorkspaceService from '../services/workspaces.js';
import * as AssignmentService from '../services/assignments.js';

const router = express.Router();

// Get all assignments for a provided workspace
router.get("/:workspaceId/assignments", async(req, res) => {
    const { workspaceId } = req.params;
    // Make the call to the service
    const data = await AssignmentService.getByWorkspace(workspaceId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

export default router;