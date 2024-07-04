import express from 'express';

// Import services
import * as WorkspaceService from '../services/workspaces.js';
import * as AssignmentService from '../services/assignments.js';

// Function to generate invite codes
import generateCode from '../services/generateCode.js';

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

// Gets a list of groups (with members) from the workspace
router.get("/:workspaceId/groups", async(req, res) => {
    const { workspaceId } = req.params;
    // Make the call to the service
    const data = await WorkspaceService.getGroups(workspaceId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Gets a list of students from the workspace
router.get("/:workspaceId/students", async(req, res) => {
    const { workspaceId } = req.params;
    // Make the call to the service
    const data = await WorkspaceService.getStudents(workspaceId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Gets students in a workspace with no group
router.get("/:workspaceId/ungrouped", async (req, res) => {
    const { workspaceId } = req.params;
    // Make the call to the service
    const data = await WorkspaceService.getUngrouped(workspaceId);
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
        name, allowedDomains, groupMemberLimit, numGroups
    };
    // Call the service
    const data = await WorkspaceService.create(userId, settings);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Edit a workspace
router.put("/edit", async(req, res) => {
    // Check for required fields
    const {userId, workspaceId, name, allowedDomains, groupMemberLimit, groupLock} = req.body;
    if (!userId || !workspaceId){
        return res.status(400).json({ message: "One or more required fields is not present" });
    }
    // Create a settings object with all fields
    const settings = {
        name, allowedDomains, groupMemberLimit, groupLock
    };
    // Call the service
    const data = await WorkspaceService.edit(userId, workspaceId, settings);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Join a workspace
router.put("/join", async(req, res) => {
    // Check for required fields
    const { userId, inviteCode } = req.body;
    if (!userId || !inviteCode){
        return res.status(400).json({ message: "One or more required fields is not present" });
    }
    // Call the service
    const data = await WorkspaceService.join(userId, inviteCode);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Leave a workspace
router.put("/leave", async(req, res) => {
    // Check for required fields
    const { userId, workspaceId } = req.body;
    if (!userId || !workspaceId){
        return res.status(400).json({ message: "One or more required fields is not present" });
    }
    // Call the service
    const data = await WorkspaceService.leave(userId, workspaceId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Sets the active invite code
router.put("/setInvite", async(req, res) => {
    // Check for required fields
    const { userId, workspaceId } = req.body;
    if (!userId || !workspaceId){
        return res.status(400).json({ message: "One or more required fields is not present" });
    }
    // Call the service
    const data = await WorkspaceService.setInvite(userId, workspaceId, generateCode());
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Remove the active code, effectively locking the workspace
router.delete("/:workspaceId/removeInvite", async(req, res) => {
    // Get fields
    const { workspaceId } = req.params;
    const { userId } = req.body;
    // Call the service
    const data = await WorkspaceService.setInvite(userId, workspaceId, null);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
})

// Delete a workspace entirely
router.delete("/:workspaceId", async(req, res) => {
    // Get fields
    const { workspaceId } = req.params;
    const { userId } = req.body;
    // Call the service
    const data = await WorkspaceService.deleteWorkspace(userId, workspaceId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

export default router;