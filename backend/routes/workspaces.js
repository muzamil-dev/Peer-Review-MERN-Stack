import express from 'express';
import multer from 'multer';
import csv from 'csvtojson';

import pool from '../config.js';
import verifyJWT from '../middleware/verifyJWT.js';

import HttpError from '../services/utils/httpError.js';

import * as UserService from "../services/users.js";
import * as WorkspaceService from "../services/workspaces.js";
import * as GroupService from "../services/groups.js"
import * as AssignmentService from "../services/assignments.js";
import { convertEmailAndGroupNames } from '../services/utils/conversions.js';

const router = express.Router();
const upload = multer(); // Store incoming csv in memory

// Require JWT
if (process.env.JWT_ENABLED === "true")
    router.use(verifyJWT);

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

// Get all assignments for a provided workspace
router.get("/:workspaceId/assignments", async(req, res) => {
    const { workspaceId } = req.params;
    let db;
    try{
        db = await pool.connect();
        // Make the call to the service
        const data = await AssignmentService.getByWorkspace(db, workspaceId);
        res.json(data);
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

// Import a csv to create users, groups, and join them in a workspace
router.post("/import", upload.single('csvFile'), async(req, res) => {
    let db;
    try{
        db = await pool.connect();
        await db.query('BEGIN');
        const userId = req.userId;
        const { workspaceId } = req.body;

        // Check that the user is an instructor
        await WorkspaceService.checkInstructor(db, userId, workspaceId);

        // User is an instructor, get csv data
        const csvFile = req.file;
        if (!csvFile) 
            throw new HttpError('No csv file was provided', 400);
        // Convert csv data to a string
        const csvData = csvFile.buffer.toString('utf-8');
        // Convert csv string to json
        const jsonData = await csv().fromString(csvData);
        
        // Create accounts for anyone without one
        await UserService.createUsers(db, jsonData);
        // Create all groups mentioned in the csv
        const groups = jsonData.map(user => user.groupName);
        await GroupService.createGroups(db, workspaceId, groups);
        // Insert all users into their groups
        const usersAndGroups = await convertEmailAndGroupNames(db, workspaceId, jsonData);
        await WorkspaceService.insertUsers(db, workspaceId, usersAndGroups);
        await db.query('COMMIT');
        return res.status(201).json({ message: "CSV imported successfully"});
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
            throw new HttpError("One or more required fields is not present", 400);
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

// Promote a user to instructor (from student)
router.put("/promoteUser", async(req, res) => {
    let db;
    try{
        db = await pool.connect();
        await db.query('BEGIN');
        const { userId, workspaceId, targetId } = req.body;
        console.log(userId);
        // Check that the provided user is an instructor of the workspace
        await WorkspaceService.checkInstructor(db, userId, workspaceId);
        // Delete the workspace
        const msg = await WorkspaceService.setRole(db, targetId, workspaceId, 'Instructor');
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

// Promote a user to instructor (from student)
router.put("/demoteUser", async(req, res) => {
    let db;
    try{
        db = await pool.connect();
        await db.query('BEGIN');
        const { userId, workspaceId, targetId } = req.body;
        // Check that the provided user is an instructor of the workspace
        await WorkspaceService.checkInstructor(db, userId, workspaceId);
        // Delete the workspace
        const msg = await WorkspaceService.setRole(db, targetId, workspaceId, 'Student');
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

// Remove a user from the workspace
router.put("/removeUser", async(req, res) => {
    let db; // Save the client for use in all blocks
    try{
        db = await pool.connect();
        await db.query('BEGIN');
        const { userId, workspaceId, targetId } = req.body;
        // Check that the provided user is an instructor of the workspace
        await WorkspaceService.checkInstructor(db, userId, workspaceId);
        // Delete the workspace
        const msg = await WorkspaceService.removeUser(db, targetId, workspaceId);
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

// Delete a workspace, used by instructors
router.delete("/:workspaceId/delete", async(req, res) => {
    let db; // Save the client for use in all blocks
    try{
        db = await pool.connect();
        await db.query('BEGIN');
        const { userId } = req.body;
        const { workspaceId } = req.params;
        // Check that the provided user is an instructor of the workspace
        await WorkspaceService.checkInstructor(db, userId, workspaceId);
        // Delete the workspace
        const msg = await WorkspaceService.deleteWorkspace(db, workspaceId);
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