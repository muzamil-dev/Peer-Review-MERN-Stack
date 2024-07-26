import express from 'express';
import pool from '../config.js';

import HttpError from '../services/utils/httpError.js';

import * as UserService from "../services/users.js";
import * as GroupService from "../services/groups.js";
import * as WorkspaceService from "../services/workspaces.js";

const router = express.Router();

router.get("/", async(req, res) => {
    let db;
    const { userId } = req.body;
    try{
        db = await pool.connect();
        const user = await UserService.getById(db, userId);
        return res.json(user);
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

router.get("/workspaces", async(req, res) => {
    let db;
    const { userId } = req.body;
    try{
        db = await pool.connect();
        const workspaces = await UserService.getWorkspaces(db, userId);
        return res.json(workspaces);
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

router.post("/requestPasswordReset", async(req, res) => {
    let db;
    const { email } = req.body;
    try{
        // Check for an email
        if (!email)
            throw new HttpError("One or more required fields is missing", 400);
        // Connect to the pool
        db = await pool.connect();
        await db.query('BEGIN');
        const msg = await UserService.requestPasswordReset(db, email);
        await db.query('COMMIT');
        return res.json(msg);
    }
    catch(err){
        if (db) await db.query('ROLLBACK');
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
    finally{
        if (db) db.release();
    }
});

router.post("/resetPassword", async(req, res) => {
    let db;
    const { email, token, newPassword } = req.body;
    try{
        // Check for an email
        if (!email || !token || !newPassword)
            throw new HttpError("One or more required fields is missing", 400);
        // Connect to the pool
        db = await pool.connect();
        await db.query('BEGIN');
        // Place data in a new json object and pass it to the service
        const jsonData = {
            email, token, password: newPassword
        };
        const msg = await UserService.resetPassword(db, jsonData);
        await db.query('COMMIT');
        return res.json(msg);
    }
    catch(err){
        if (db) await db.query('ROLLBACK');
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
    finally{
        if (db) db.release();
    }
});

export default router;