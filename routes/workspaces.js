import express from 'express';
import pool from '../config.js';

import HttpError from '../services/utils/httpError.js';

import * as UserService from "../services/users.js";
import * as WorkspaceService from "../services/workspaces.js";
import * as GroupService from "../services/groups.js"

const router = express.Router();

// Get basic information about a workspace
router.get("/:workspaceId", async(req, res) => {
    let db;
    const { workspaceId } = req.params;
    try{
        db = await pool.connect();
        const workspace = await WorkspaceService.getById(db, workspaceId);
        return res.json(workspace);
    }
    catch(err){
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
    finally{
        if (db) db.release();
    }
});

// Get all groups in a workspace with members
router.get("/:workspaceId/groups", async(req, res) => {
    let db, groups;
    const { members } = req.query;
    const { workspaceId } = req.params;
    try{
        db = await pool.connect();
        if (members === 'true')
            groups = await GroupService.getByWorkspaceWithMembers(db, workspaceId);
        else
            groups = await GroupService.getByWorkspace(db, workspaceId);
        return res.json(groups);
    }
    catch(err){
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
    finally{
        if (db) db.release();
    }
});

// Create a new workspace
router.post("/create", async(req, res) => {
    let db; // Save the client for use in all blocks
    try{
        db = await pool.connect();
        await db.query('BEGIN');
        const { userId, name } = req.body;
        // Only site admins can create new workspaces
        await UserService.checkAdmin(db, userId);
        // Create the workspace
        const workspace = await WorkspaceService.create(db, userId, name);
        // Commit and release connection
        await db.query('COMMIT');
        // Send data and release
        return res.status(201).json(workspace);
    }
    catch(err){
        if (db) 
            await db.query('ROLLBACK');
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
    finally{
        if (db) db.release();
    }
});

// Edit a provided workspace
router.put("/edit", async(req, res) => {
    let db; // Save the client for use in all blocks
    try{
        db = await pool.connect();
        await db.query('BEGIN');
        const { userId, workspaceId, name } = req.body;
        const updates = { name };
        // Check that the workspaceId was provided
        if (!workspaceId)
            throw new HttpError("One or more required fields is missing", 400);
        // Check that the provided user is an instructor of the workspace
        await WorkspaceService.checkInstructor(db, userId, workspaceId);
        // Edit the workspace
        const msg = await WorkspaceService.edit(db, workspaceId, updates);
        // Commit and release connection
        await db.query('COMMIT');
        // Send data and release
        return res.json(msg);
    }
    catch(err){
        if (db) 
            await db.query('ROLLBACK');
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
    finally{
        if (db) db.release();
    }
});

export default router;