import express from 'express';

// Import services
import * as WorkspaceService from '../services/workspaces.js';
import * as AssignmentService from '../services/assignments.js';
import * as UserService from '../services/users.js';

// Add signup, verify, reset pw

const router = express.Router();

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

// Get all workspaces that a user is in
router.get("/:userId/workspaces", async(req, res) => {
    const { userId } = req.params;
    // Call the service
    const data = await UserService.getWorkspaces(userId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

export default router;