import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Import JWT
import verifyJWT from '../middleware/verifyJWT.js';

// Import services
import * as UserService from '../services/users.js';

// Add reset password functionality

const router = express.Router();

// Create user (for testing, no error handling here)
// Requires firstName, lastName, email, password
router.post("/", async(req, res) => {
    // Call the service
    const data = await UserService.createUser(req.body);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(201).json(data);
});

// Sign up for an account
router.post("/signup", async(req, res) => {
    // Check for required fields
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password){
        return res.status(400).json({ message: "One or more required fields is not present" });
    }
    // Call the service
    const data = await UserService.signup(firstName, lastName, email, password);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(201).json(data);
});

// Login to a user's account
router.post("/login", async(req, res) => {
    // Check for required fields
    const { email, password } = req.body;
    if (!email || !password){
        return res.status(400).json({ message: "One or more required fields is not present" });
    }
    // Call the service
    const data = await UserService.login(email, password);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    // Return tokens
    res.cookie("jwt", data.refreshToken, { httpOnly: true, maxAge: data.refreshTokenAge});
    res.json({ 
        message: "Login successful",
        accessToken: data.accessToken 
    });
});

// Verify the user's email
router.post("/verifyEmail", async(req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ message: "One or more required fields is not present" });
    }
    // Call the service
    const data = await UserService.verifyEmail(token);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(201).json(data);
});

// Request a password reset
router.post("/requestPasswordReset", async(req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "One or more required fields is not present" });
    }
    // Call the service
    const data = await UserService.requestPasswordReset(email);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(201).json(data);
});

// Set the user's new password after requesting a reset
router.post("/resetPassword", async(req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ message: "One or more required fields is not present" });
    }
    // Call the service
    const data = await UserService.resetPassword(token, newPassword);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Require JWT
if (process.env.JWT_ENABLED === "true")
    router.use(verifyJWT);

// Get all workspaces that a user is in
router.get(["/:userId/workspaces", "/workspaces"], async(req, res) => {
    const userId = req.params.userId || req.body.userId;
    // Call the service
    const data = await UserService.getWorkspaces(userId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

export default router;