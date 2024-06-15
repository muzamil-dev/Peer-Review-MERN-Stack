import express from 'express';
import { User } from '../models/userModel.js';
import { Workspace } from '../models/workspaceModel.js';
import { Group } from '../models/groupModel.js';

import { checkWorkspace, checkUser, checkInstructor } from "../middleware/checks.js";
import { addUserToWorkspace, addWorkspaceToUser } from "../shared/adders.js";
import { removeGroupFromUsers, removeUserFromWorkspace, removeWorkspaceFromUser, removeWorkspaceFromUsers } from "../shared/removers.js"
import generateInviteCode from '../shared/inviteCode.js';

const router = express.Router();

// This is for testing and likely wont be available to users
// Pass in an array (workspaces) with documents: { name, userId }
// No input validation is used in this endpoint
router.post("/createMany", async(req, res) => {
    try{
        const workspaces = req.body.workspaces;
        const created = (await Workspace.insertMany(
            workspaces
        )).map(space => ({ 
            name: space.name, 
            workspaceId: space._id
        }));
        res.status(201).json({ 
            message: `Workspaces created (${workspaces.length})`,
            workspaces: created
        });
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Check that the user is provided for any workspace route
// Will be replaced when JWT is added
router.use(checkUser);

// Creates a new workspace
router.post("/", async(req, res) => {
    try{
        // Check for the user id and workspace name
        const body = req.body;
        if (!body.name){
            return res.status(400).json({ message: "One or more required fields is not present" });
        }

        // Create new workspace object and member object
        const newWorkspace = { name: body.name };
        // Create and get the new workspace
        const workspace = await Workspace.create(newWorkspace);
        // Add the workspace membership for the creator
        await Promise.all(
            [
                addUserToWorkspace(body.userId, workspace._id, "Instructor"),
                addWorkspaceToUser(body.userId, workspace._id, "Instructor")
            ]
        );
        
        return res.status(201).json(workspace);
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Middleware
// Routes that require an existing workspace to be modified should go here
router.use(checkWorkspace);

// Join a workspace
router.put("/join", async(req, res) => {
    try{
        const body = req.body;
        // Get userId and workspaceId
        const userId = body.userId;
        const workspaceId = body.workspaceId;
        const inviteCode = body.inviteCode;

        if (!body.inviteCode){
            return res.status(400).json({ message: "One or more required fields was not present" });
        }
        // Get relevant info from the user and workspace
        const userInfo = await User.findById(userId).select('email');
        const workspaceInfo = await Workspace.findById(workspaceId).select('inviteCode allowedDomains');

        // Check if user's email contains an allowed domain
        if (workspaceInfo.allowedDomains !== null 
            && workspaceInfo.allowedDomains.length > 0){
            // Check the list of domains if an allowedDomains list is provided
            const userDomain = userInfo.email.split('@')[1];
            const domainCheck = (domain, userDomain) => {
                const domainPattern = new RegExp(domain);
                return domainPattern.test(userDomain);
            }
            const foundDomain = workspaceInfo.allowedDomains.find(domain => domainCheck(domain, userDomain));
            if (!foundDomain){
                return res.status(403).json({ message: "The given user is not authorized to join this workspace." });
            }
        }

        // Check if the correct invite code is provided
        const correctCode = workspaceInfo.inviteCode;
        // Return if code exists and provided code doesn't match
        if (!correctCode || inviteCode !== correctCode){
            return res.status(403).json({ message: "The given user is not authorized to join this workspace." });
        }

        // Check if user is already in workspace
        const workspaces = (await User.findById(userId)).workspaceIds;
        const found = workspaces.find(space => space.workspaceId.equals(workspaceId));
        if (found){
            return res.status(400).json({ message: "The given user is already in the workspace" });
        }

        // Add workspace membership relationship
        await Promise.all(
            [
                addUserToWorkspace(userId, workspaceId, "Student"),
                addWorkspaceToUser(userId, workspaceId, "Student")
            ]
        );

        res.json({ message: "Workspace joined successfully!" });
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Leave a workspace
router.put("/leave", async(req, res) => {
    try{
        const userId = req.body.userId;
        const workspaceId = req.body.workspaceId;

        await Promise.all([
            removeUserFromWorkspace(userId, workspaceId),
            removeWorkspaceFromUser(userId, workspaceId)
        ]);

        res.json({ message: "Workspace left successfully" });
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Checks that the user is the instructor of the given workspace
// All routes below here are for use by workspace instructors
router.use(checkInstructor);

// Deletes the given workspace
router.delete("/delete", async(req, res) => {
    try{
        // Get all workspace users
        const workspace = await Workspace.findById(
            req.body.workspaceId
        ).select('userIds');
        // Create an array with just user ids
        const userIds = workspace.userIds.map(
            user => user.userId
        );

        // Remove groups in workspace from user's list of groups
        const groups = await Group.find({ workspaceId: req.body.workspaceId }).select('userIds');
        await Promise.all(
            groups.map(group => removeGroupFromUsers(group.userIds, group._id))
        );
        // Pull from the user's workspaceIds
        await removeWorkspaceFromUsers(userIds, workspace._id);
        // Delete groups and workspace
        await Promise.all([
            Group.deleteMany({ workspaceId: req.body.workspaceId }),
            Workspace.findByIdAndDelete(req.body.workspaceId)
        ]);
        
        return res.json({ message: "Workspace deleted successfully" });
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Sets the active invite code
router.put("/setInvite", async(req, res) => {
    try{
        const inviteCode = generateInviteCode();
        // Set the invite code
        await Workspace.updateOne(
            { _id: req.body.workspaceId },
            { inviteCode }
        );
        return res.json({ 
            message: "Invite code updated successfully",
            inviteCode
        });
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Removes the active invite code
router.delete("/removeInvite", async(req, res) => {
    try{
        // Set the invite code
        await Workspace.updateOne(
            { _id: req.body.workspaceId },
            { inviteCode: null }
        );
        return res.json({ message: "Invite code removed successfully" });
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Sets the allowed domains
// Reset the domains by passing an empty array
router.put("/setAllowedDomains", async(req, res) => {
    try{
        // Return if allowedDomains is not specified
        if (!req.body.allowedDomains){
            return res.status(400).json({ message: "One or more required fields was not present"} );
        }
        else if (!Array.isArray(req.body.allowedDomains)){
            return res.status(400).json({ message: "Field allowedDomains must be an array"} );
        }
        // Set the invite code
        await Workspace.updateOne(
            { _id: req.body.workspaceId },
            { allowedDomains: req.body.allowedDomains }
        );
        return res.json({ message: "Allowed Domains set successfully" });
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

export default router;