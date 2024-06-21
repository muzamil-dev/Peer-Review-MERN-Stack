import express from 'express';
import pool from '../config.js';
import verifyJWT from '../middleware/verifyJWT.js';

import HttpError from '../services/utils/httpError.js';

import * as UserService from "../services/users.js";
import * as GroupService from "../services/groups.js";
import * as WorkspaceService from "../services/workspaces.js";

const router = express.Router();

// Log into an account
router.post("/login", async(req, res) => {
    let db;
    const { email, password } = req.body;
    try{
        db = await pool.connect();
        await db.query('BEGIN');
        // Run the login function
        const tokenData = await UserService.login(db, email, password);
        await db.query('COMMIT');
        res.cookie("jwt", tokenData.refreshToken, { 
            httpOnly: true, 
            maxAge: tokenData.refreshTokenAge
        });
        res.json({
            message: "Logged in successfully",
            accessToken: tokenData.accessToken
        });
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

// Have an email sent to get a password reset code
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

// Set a new password by providing an email, reset code, and new password
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

// Use jwt for routes below
if (process.env.JWT_ENABLED === 'true')
    router.use(verifyJWT);

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

export default router;