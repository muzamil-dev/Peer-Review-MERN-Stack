import express from 'express';

// Import services
import * as WorkspaceService from '../services/workspaces.js';
import * as AssignmentService from '../services/assignments.js';

const router = express.Router();

// Get details about a specific workspace
router.get("/:workspaceId", async(req, res) => {
    const { workspaceId } = req.params;
    // Call getById
    const data = await WorkspaceService.getById(workspaceId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

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

// Gets a list of groups from the workspace
router.get("/:workspaceId/groups", async(req, res) => {
    const { workspaceId } = req.params;
    // Make the call to the service
    const data = await WorkspaceService.getGroups(workspaceId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Creates a new workspace
router.post("/create", async(req, res) => {
    // Check for required fields
    const {name, userId, allowedDomains, groupMemberLimit, numGroups} = req.body;
    if (!name || !userId){
        return res.status(400).json({ message: "One or more required fields is not present" });
    }
    // Create a settings object with all fields
    const settings = {
        name, userId, allowedDomains, groupMemberLimit, numGroups
    };
    // Call the service
    const data = await WorkspaceService.create(userId, settings);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

export default router;