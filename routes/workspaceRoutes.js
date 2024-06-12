import express from 'express';
import { User } from '../models/userModel.js';
import { Workspace } from '../models/workspaceModel.js';

import { checkWorkspace, checkUser, checkInstructor } from "../middleware/checks.js";
import { addUserToWorkspace, addWorkspaceToUser } from "../shared/adders.js";
import generateInviteCode from '../shared/inviteCode.js';

const router = express.Router();

// Creates a new workspace
router.post("/", async(req, res) => {
    try{
        // Check for the user id and workspace name
        const body = req.body;
        if (!body.userId){
            return res.status(400).json({ message: "No user id was provided" });
        }
        if (!body.name){
            return res.status(400).json({ message: "Please provide a name for your workspace" });
        }

        // Find the given user in the database
        const creator = await checkUser(body.userId);
        if (!creator){
            return res.status(404).json({ message: "The specified user was not found in our database" });
        }

        // Create new workspace object and member object
        const newWorkspace = { name: body.name, allowedDomains };
        // Create and get the new workspace
        const workspace = await Workspace.create(newWorkspace);
        // Add the workspace membership for the creator
        await Promise.all(
            [
                addUserToWorkspace(creator._id, workspace._id, "Instructor"),
                addWorkspaceToUser(creator._id, workspace._id, "Instructor")
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
// Routes that require a user to change an existing workspace should go here
router.use(checkUser);
router.use(checkWorkspace);

// Join a workspace
router.put("/join", async(req, res) => {
    try{
        // Get userId and workspaceId
        const body = req.body;
        const userId = body.userId;
        const workspaceId = body.workspaceId;

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
        if (!correctCode || body.inviteCode !== correctCode){
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

        res.status(200).send({ message: "Workspace joined successfully!"});
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

router.use(checkInstructor);

// Sets the active invite code
router.put("/setInvite", async(req, res) => {
    // Check for the workspace id and user id
    try{
        // Get userId and workspaceId
        const body = req.body;
        const userId = body.userId;
        const workspaceId = body.workspaceId;
        // Check that the user is authorized to send the invite
        const workspaceMembers = (await Workspace.findById(workspaceId)).userIds;
        const found = workspaceMembers.find(user => user.userId.equals(userId));
        if (!found){
            return res.status(400).json({ message: "The provided user is not a member of this workspace" });
        }
        else if (found.role !== "Instructor"){
            return res.status(403).json({ message: "The provided user is not authorized to make this request" });
        }
        // Set the invite code
        await Workspace.updateOne(
            { _id: workspaceId },
            { inviteCode: generateInviteCode() }
        );
        return res.json({ message: "Invite code updated successfully" });
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

export default router;