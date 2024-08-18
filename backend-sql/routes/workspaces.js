import express from 'express';
import multer from 'multer';
import csv from 'csvtojson';

import pool from '../config.js';
import verifyJWT from '../middleware/verifyJWT.js';

import HttpError from '../services/utils/httpError.js';

import * as UserService from "../services/users.js";
import * as WorkspaceService from "../services/workspaces.js";
import * as GroupService from "../services/groups.js";
import * as AssignmentService from "../services/assignments.js";
import * as AnalyticsService from "../services/analytics.js";
import * as journalService from '../services/journals.js';
import { convertEmailAndGroupNames } from '../services/utils/conversions.js';

const router = express.Router();
const upload = multer(); // Store incoming csv in memory

// Require JWT
if (process.env.JWT_ENABLED === "true") router.use(verifyJWT);

// Get basic information about a workspace
router.get("/:workspaceId", async (req, res) => {
    try {
        const workspace = await WorkspaceService.getById(pool, req.params.workspaceId);
        return res.json(workspace);
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
});

// Get all assignments for a provided workspace
router.get("/:workspaceId/assignments", async (req, res) => {
    try {
        const data = await AssignmentService.getByWorkspace(pool, req.params.workspaceId);
        return res.json(data);
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
});

// Get all groups in a workspace with members
router.get("/:workspaceId/groups", async (req, res) => {
    try {
        const { members } = req.query;
        const groups = members === 'true'
            ? await GroupService.getByWorkspaceWithMembers(pool, req.params.workspaceId)
            : await GroupService.getByWorkspace(pool, req.params.workspaceId);
        return res.json(groups);
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
});

// Get analytics for a particular user across all of the workspace's assignments
router.get("/:workspaceId/analytics/:targetId", async (req, res) => {
    try {
        await WorkspaceService.checkInstructor(pool, req.body.userId, req.params.workspaceId);
        const data = await AnalyticsService.getByUserAndWorkspace(pool, req.params.targetId, req.params.workspaceId);
        return res.json(data);
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
});

// Create a new workspace
router.post("/create", async (req, res) => {
    try {
        await UserService.checkAdmin(pool, req.body.userId);
        const workspace = await WorkspaceService.create(pool, req.body.userId, req.body.name);
        return res.status(201).json(workspace);
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
});

// Insert a single user into the workspace, creates their account if it does not exist
router.post("/insertUser", async (req, res) => {
    try {
        const { userId, workspaceId, groupId, firstName, lastName, email, role } = req.body;
        if (!workspaceId || !email || !role || (role === 'Student' && !groupId) || (role === 'Instructor' && groupId)) {
            throw new HttpError("Invalid input", 400);
        }

        await WorkspaceService.checkInstructor(pool, userId, workspaceId);

        let user = await UserService.createUsers(pool, [{ firstName, lastName, email }]);
        if (user.users.length === 0) user = await UserService.getByEmail(pool, email);
        else user = user.users[0];

        await WorkspaceService.insertUser(pool, workspaceId, { userId: user.userId, groupId, role });
        return res.status(201).json({ message: "User inserted successfully" });
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
});

// Import a csv to create users, groups, and join them in a workspace
router.post("/import", upload.single('csvFile'), async (req, res) => {
    try {
        const { workspaceId, userId } = req.body;

        await WorkspaceService.checkInstructor(pool, userId, workspaceId);

        const csvData = req.file.buffer.toString('utf-8');
        const jsonData = await csv().fromString(csvData);

        await UserService.createUsers(pool, jsonData);
        await GroupService.createGroups(pool, workspaceId, jsonData.map(user => user.groupName));
        const usersAndGroups = await convertEmailAndGroupNames(pool, workspaceId, jsonData);
        await WorkspaceService.insertUsers(pool, workspaceId, usersAndGroups);

        return res.status(201).json({ message: "CSV imported successfully" });
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
});

// Edit a provided workspace
router.put("/edit", async (req, res) => {
    try {
        const { userId, workspaceId, name } = req.body;
        await WorkspaceService.checkInstructor(pool, userId, workspaceId);
        const msg = await WorkspaceService.edit(pool, workspaceId, { name });
        return res.json(msg);
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
});

// Promote a user to instructor (from student)
router.put("/promoteUser", async (req, res) => {
    try {
        const { userId, workspaceId, targetId } = req.body;
        await WorkspaceService.checkInstructor(pool, userId, workspaceId);
        const msg = await WorkspaceService.setRole(pool, targetId, workspaceId, 'Instructor');
        return res.json(msg);
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
});

// Demote a user from instructor to student
router.put("/demoteUser", async (req, res) => {
    try {
        const { userId, workspaceId, targetId } = req.body;
        await WorkspaceService.checkInstructor(pool, userId, workspaceId);
        const msg = await WorkspaceService.setRole(pool, targetId, workspaceId, 'Student');
        return res.json(msg);
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
});

// Remove a user from the workspace
router.put("/removeUser", async (req, res) => {
    try {
        const { userId, workspaceId, targetId } = req.body;
        await WorkspaceService.checkInstructor(pool, userId, workspaceId);
        const msg = await WorkspaceService.removeUser(pool, targetId, workspaceId);
        return res.json(msg);
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
});

// Delete a workspace, used by instructors
router.delete("/:workspaceId/delete", async (req, res) => {
    try {
        const { userId } = req.body;
        await UserService.checkAdmin(pool, userId);
        await WorkspaceService.checkInstructor(pool, userId, req.params.workspaceId);
        const msg = await WorkspaceService.deleteWorkspace(pool, req.params.workspaceId);
        return res.json(msg);
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
});

// Route to create multiple journal assignments
router.post('/:workspaceId/createJournals', async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { startDate, endDate, journalDay, weekNumbersToSkip } = req.body;

        const journalDates = journalService.generateJournalDates(startDate, endDate, journalDay, weekNumbersToSkip);
        for (const [weekNumber, journal] of journalDates.entries()) {
            await journalService.createJournalAssignment(pool, workspaceId, weekNumber + 1, journal.start, journal.end);
        }

        return res.status(201).json({ message: 'Journals created successfully' });
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
});

// Get all journals submitted by a user in a specific workspace
router.get(["/:workspaceId/user", "/:workspaceId/user/:userId"], async (req, res) => {
    try {
        let userId;
        if (req.params.userId) {
            await WorkspaceService.checkInstructor(pool, req.body.userId, req.params.workspaceId);
            userId = req.params.userId;
        } else {
            userId = req.body.userId;
        }

        const journals = await journalService.getJournalsByUserAndWorkspace(pool, req.params.workspaceId, userId);
        return res.status(200).json(journals);
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
});

// Get number of weeks in journal_assignment
router.get("/:workspaceId/weeks", async (req, res) => {
    try {
        const weeks = await journalService.getWeeks(pool, req.params.workspaceId);
        return res.json(weeks);
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
});

export default router;

