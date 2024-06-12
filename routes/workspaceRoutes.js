import express from 'express';
import { User } from '../models/userModel.js';
import { Workspace } from '../models/workspaceModel.js';

import { checkWorkspace, checkUser } from "../shared/checks.js";
import { addUserToWorkspace, addWorkspaceToUser } from "../shared/adders.js";
import generateInviteCode from '../shared/inviteCode.js';

const router = express.Router();

// Takes in a user for now, will be modified to work with JWT
router.post("/", async(req, res) => {
    try{
        // Check for the user id
        const body = req.body;
        if (!body.userId){
            return res.status(400).json({ message: "No user id was provided" });
        }
        if (!body.name){
            return res.status(400).json({ message: "Please provide a name for your workspace" });
        }
        // Find the given user
        const creator = await checkUser(body.userId);
        if (!creator){
            return res.status(404).json({ message: "The specified user was not found in our database" });
        }

        // Create new workspace object and member object
        const newWorkspace = { name: body.name };
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

router.put("/join", async(req, res) => {
    try{
        // Check for the workspace id and user id
        const body = req.body;
        if (!body.workspaceId || !body.userId){
            return res.status(400).json({ message: "One or more required fields is not present" });
        }
        const [workspaceId, userId] = await Promise.all(
            [
                checkWorkspace(body.workspaceId), 
                checkUser(body.userId)
            ]
        );
        if (!workspaceId){
            return res.status(400).json({ message: "The provided workspace was not found in our database" });
        }
        if (!userId){
            return res.status(400).json({ message: "The provided user was not found in our database" });
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

router.put("/setInvite", async(req, res) => {
    // Check for the workspace id and user id
    try{
        const body = req.body;
        if (!body.workspaceId || !body.userId){
            return res.status(400).json({ message: "One or more required fields is not present" });
        }
        // Check if workspace and user exist
        const [workspaceId, userId] = await Promise.all(
            [
                checkWorkspace(body.workspaceId), 
                checkUser(body.userId)
            ]
        );
        if (!workspaceId){
            return res.status(400).json({ message: "The provided workspace was not found in our database" });
        }
        if (!userId){
            return res.status(400).json({ message: "The provided user was not found in our database" });
        }
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
        const update = { inviteCode: generateInviteCode() };
        // Throws error if invalid date is given, sets to null if none is provided
        update.inviteCodeExpiry = body.inviteCodeExpiry ? new Date(body.inviteCodeExpiry) : null;
        await Workspace.updateOne(
            { _id: workspaceId },
            update
        );
        return res.json({ message: "Invite code updated successfully" });
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

export default router;