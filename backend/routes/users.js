import express from 'express';
import jwt from 'jsonwebtoken';
import * as UserService from '../services/users.js';

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret'; // Replace with your actual secret key
const JWT_EXPIRATION = '1h'; // Set your desired expiration time

// Create user (for testing, no error handling here)
// Requires firstName, lastName, email, password
router.post("/", async (req, res) => {
    const data = await UserService.createUser(req.body);
    if (data.error) return res.status(data.status).json({ message: data.error });
    return res.status(201).json(data);
});

// Sign up for an account
router.post("/signup", async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "One or more required fields is not present" });
    }
    const data = await UserService.signup(firstName, lastName, email, password);
    if (data.error) return res.status(data.status).json({ message: data.error });

    // Generate JWT tokens
    const accessToken = jwt.sign({ userId: data.userId }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
    const refreshToken = jwt.sign({ userId: data.userId }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie("jwt", refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.status(201).json({
        message: "Signup successful",
        accessToken
    });
});

// Login to a user's account
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "One or more required fields is not present" });
    }
    const data = await UserService.login(email, password);
    if (data.error) return res.status(data.status).json({ message: data.error });

    // Generate JWT tokens
    const accessToken = jwt.sign({ userId: data.userId }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
    const refreshToken = jwt.sign({ userId: data.userId }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie("jwt", refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({
        message: "Login successful",
        accessToken
    });
});

// Verify the user's email
router.post("/verifyEmail", async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ message: "One or more required fields is not present" });
    }
    const data = await UserService.verifyEmail(token);
    if (data.error) return res.status(data.status).json({ message: data.error });
    return res.status(200).json({ message: "Email verified successfully" });
});

// Get all workspaces that a user is in
router.get(["/:userId/workspaces", "/workspaces"], async (req, res) => {
    const userId = req.params.userId || req.body.userId;
    const data = await UserService.getWorkspaces(userId);
    if (data.error) return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

export default router;
