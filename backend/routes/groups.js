import express from 'express';

// Import services
import * as WorkspaceService from '../services/workspaces.js';
import * as AssignmentService from '../services/assignments.js';
import * as GroupService from '../services/groups.js';

const router = express.Router();

// Get a group by its id
router.get("/:groupId", async(req, res) => {
    const { groupId } = req.params;
    // Call the service
    const data = await GroupService.getById(groupId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Create a new group within a workspace
router.post("/create", async(req, res) => {
    const { userId, workspaceId } = req.body;
    // Check for required fields
    if (!userId || !workspaceId){
        return res.status(400).json({ message: "One or more required fields is not present" });
    }
    // Call the service
    const data = await GroupService.create(userId, workspaceId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(201).json(data);
});

// Create several groups
router.post("/create/:num", async(req, res) => {
    let { num } = req.params;
    const { userId, workspaceId } = req.body;
    // Check for required fields
    if (!userId || !workspaceId){
        return res.status(400).json({ message: "One or more required fields is not present" });
    }
    // Cast num to a number
    num = parseInt(num);
    if (isNaN(num) || num < 1)
        return res.status(400).json({ message: "Number of groups must be a positive integer" });

    // Call the service
    const data = await GroupService.createMany(userId, workspaceId, num);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(201).json(data);
});

// Join a group
router.put("/join", async(req, res) => {
    const { userId, groupId } = req.body;
    // Check for required fields
    if (!userId || !groupId){
        return res.status(400).json({ message: "One or more required fields is not present" });
    }

    // Call the service
    const data = await GroupService.join(userId, groupId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Leave a group
router.put("/leave", async(req, res) => {
    const { userId, groupId } = req.body;
    // Check for required fields
    if (!userId || !groupId){
        return res.status(400).json({ message: "One or more required fields is not present" });
    }

    // Call the service
    const data = await GroupService.leave(userId, groupId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Add a user to a group (instructors only)
router.put("/addUser", async(req, res) => {
    const { userId, targetId, groupId } = req.body;
    // Check for required fields
    if (!userId || !targetId || !groupId){
        return res.status(400).json({ message: "One or more required fields is not present" });
    }

    // Call the service
    const data = await GroupService.addUser(userId, targetId, groupId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Remove a user from a group (instructors only)
router.put("/removeUser", async(req, res) => {
    const { userId, targetId, groupId } = req.body;
    // Check for required fields
    if (!userId || !targetId || !groupId){
        return res.status(400).json({ message: "One or more required fields is not present" });
    }

    // Call the service
    const data = await GroupService.removeUser(userId, targetId, groupId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Delete a group
router.delete("/:groupId", async(req, res) => {
    const { userId } = req.body;
    const { groupId } = req.params;

    // Call the service
    const data = await GroupService.deleteGroup(userId, groupId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
})

export default router;