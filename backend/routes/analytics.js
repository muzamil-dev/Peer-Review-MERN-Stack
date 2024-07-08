import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Import JWT
import verifyJWT from '../middleware/verifyJWT.js';

// Import services
import * as AnalyticsService from "../services/analytics.js";

const router = express.Router();

// Require JWT
if (process.env.JWT_ENABLED === "true")
    router.use(verifyJWT);

// Get analytics for a specific user + workspace
router.get("/workspace/:workspaceId/user/:targetId", async(req, res) => {
    const { targetId, workspaceId } = req.params;
    const { userId } = req.body;
    // Call getById
    const data = await AnalyticsService.getByUserAndWorkspace(userId, targetId, workspaceId);
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

// Get analytics for a specific assignment
router.get("/assignment/:assignmentId", async(req, res) => {
    const { assignmentId } = req.params;
    const { page, perPage } = req.query;
    const { userId } = req.body;
    // Check for query params
    if (!page || !perPage)
        return res.status(400).json({ message: "One or more required fields is not present" });
    // Call getById
    const data = await AnalyticsService.getByAssignment(userId, assignmentId,
                    parseInt(page), parseInt(perPage)
                 );
    // Send the error if the service returned one
    if (data.error)
        return res.status(data.status).json({ message: data.error });
    return res.status(200).json(data);
});

export default router;