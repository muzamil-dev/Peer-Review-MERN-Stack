import express from 'express';
import { query } from '../config.js'; // Use the query function from config.js
import verifyJWT from '../middleware/verifyJWT.js';
import HttpError from '../services/utils/httpError.js';
import * as UserService from "../services/users.js";
import * as GroupService from "../services/groups.js";
import * as WorkspaceService from "../services/workspaces.js";

const router = express.Router();

// Log into an account
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        // Run the login function
        const tokenData = await UserService.login(email, password);
        res.cookie("jwt", tokenData.refreshToken, {
            httpOnly: true,
            maxAge: tokenData.refreshTokenAge
        });
        res.json({
            message: "Logged in successfully",
            accessToken: tokenData.accessToken
        });
    } catch (err) {
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

// Have an email sent to get a password reset code
router.post("/requestPasswordReset", async (req, res) => {
    const { email } = req.body;
    try {
        // Check for an email
        if (!email)
            throw new HttpError("One or more required fields is missing", 400);
        const msg = await UserService.requestPasswordReset(email);
        return res.json(msg);
    } catch (err) {
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

// Set a new password by providing an email, reset code, and new password
router.post("/resetPassword", async (req, res) => {
    const { email, token, newPassword } = req.body;
    try {
        // Check for an email
        if (!email || !token || !newPassword)
            throw new HttpError("One or more required fields is missing", 400);
        const jsonData = {
            email, token, password: newPassword
        };
        const msg = await UserService.resetPassword(jsonData);
        return res.json(msg);
    } catch (err) {
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

// Use jwt for routes below
if (process.env.JWT_ENABLED === 'true')
    router.use(verifyJWT);

router.get("/", async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await UserService.getById(userId);
        return res.json(user);
    } catch (err) {
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

router.get("/workspaces", async (req, res) => {
    const { userId } = req.body;
    try {
        const workspaces = await UserService.getWorkspaces(userId);
        return res.json(workspaces);
    } catch (err) {
        return res.status(err.status || 500).json(
            { message: err.message }
        );
    }
});

export default router;
