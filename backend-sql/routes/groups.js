import express from 'express';
import { query } from '../config.js';
import verifyJWT from '../middleware/verifyJWT.js';

import HttpError from '../services/utils/httpError.js';

import * as GroupService from "../services/groups.js";
import * as WorkspaceService from "../services/workspaces.js";

const router = express.Router();

// Require JWT
if (process.env.JWT_ENABLED === "true")
    router.use(verifyJWT);

// Get a group by its id
router.get("/:groupId", async (req, res) => {
    const { members } = req.query;
    const { groupId } = req.params;
    try {
        let group;
        if (members === 'true')
            group = await GroupService.getByIdWithMembers(query, groupId);
        else
            group = await GroupService.getById(query, groupId);
        return res.json(group);
    } catch (err) {
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

// Create a new group
router.post("/create", async (req, res) => {
    try {
        await query('BEGIN');
        const { userId, workspaceId, name } = req.body;
        // Check that the required fields are provided
        if (!workspaceId || !name)
            throw new HttpError("One or more required fields is missing", 400);
        // Check that the person creating the group is an instructor
        await WorkspaceService.checkInstructor(query, userId, workspaceId);
        // Create the group
        const group = await GroupService.createGroup(query, workspaceId, name);
        // Commit and release connection
        await query('COMMIT');
        // Send data and release
        return res.status(201).json(group);
    } catch (err) {
        await query('ROLLBACK');
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

// Edit a group's info (only name)
router.put("/edit", async (req, res) => {
    try {
        await query('BEGIN');
        const { userId, groupId, name } = req.body;
        const updates = { name };
        // Check that the groupId was provided
        if (!groupId)
            throw new HttpError("One or more required fields is missing", 400);
        // Get the group workspace
        const workspaceId = (await GroupService.getById(query, groupId)).workspaceId;
        // Check that the provided user is an instructor of the workspace
        await WorkspaceService.checkInstructor(query, userId, workspaceId);
        // Edit the workspace
        const msg = await GroupService.edit(query, groupId, updates);
        // Commit and release connection
        await query('COMMIT');
        // Send data and release
        return res.json(msg);
    } catch (err) {
        await query('ROLLBACK');
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

// Move a user to a different group
router.put("/moveUser", async (req, res) => {
    try {
        await query('BEGIN');
        const { userId, targetId, groupId } = req.body;
        // Check that the groupId was provided
        if (!targetId || !groupId)
            throw new HttpError("One or more required fields is missing", 400);
        // Check that the user requesting is an instructor
        await GroupService.checkInstructor(query, userId, groupId);
        // Add the user
        const msg = await GroupService.moveUser(query, targetId, groupId);
        // Commit and release connection
        await query('COMMIT');
        // Send data and release
        return res.json(msg);
    } catch (err) {
        await query('ROLLBACK');
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

// Delete a provided group
router.delete("/:groupId", async (req, res) => {
    try {
        await query('BEGIN');
        const { userId } = req.body;
        const { groupId } = req.params;
        // Get the workspaceId of the group
        const workspaceId = (await GroupService.getById(query, groupId)).workspaceId;
        // Check that the provided user is an instructor of the workspace
        await WorkspaceService.checkInstructor(query, userId, workspaceId);
        // Delete the workspace
        const msg = await GroupService.deleteGroup(query, groupId);
        // Commit and release connection
        await query('COMMIT');
        // Send data and release
        return res.json(msg);
    } catch (err) {
        await query('ROLLBACK');
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

export default router;
