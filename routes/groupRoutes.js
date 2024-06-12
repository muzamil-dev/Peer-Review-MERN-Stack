import express from "express";
import { Group } from "../models/groupModel.js";
import { User } from "../models/userModel.js";
import { Workspace } from "../models/workspaceModel.js";

import { checkWorkspace, checkUser, checkGroup } from "../middleware/checks.js";
import { addUserToGroup, addGroupToUser } from "../shared/adders.js";

const router = express.Router();

router.post("/", async(req, res) => {
    try{
        // Check that workspace and user were given
        const body = req.body;
        if (!body.name || !body.workspaceId || !body.userId){
            return res.status(400).json({ message: "One or more required fields is not present" });
        }
        // Check if workspaceId and userId exist
        const [workspaceId, userId] = await Promise.all(
            [checkWorkspace(body.workspaceId), checkUser(body.userId)]
        );
        if (!workspaceId){
            return res.status(400).json({ message: "The provided workspace was not found in our database" });
        }
        if (!userId){
            return res.status(400).json({ message: "The provided user was not found in our database" });
        }
        // Query for instructors
        const workspaceMembers = (await Workspace.findById(workspaceId)).userIds;
        const instructors = workspaceMembers.filter(member => member.role === "Instructor");

        // Check if the user is one of the instructors
        const found = instructors.find(elem => userId.equals(elem.userId));
        if (!found){
            return res.status(403).json({ 
                message: "The provided user is not authorized to create groups in this workspace"
            });
        }
        // Create the group
        const group = await Group.create({ name: body.name, workspaceId });
        return res.status(201).json(group);
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});


// Route to add users to a group
router.put("/join", async(req, res) => {
    try{
        const body = req.body;

        if(!body.userId || !body.groupId){
            return res.status(400).json({ message: "One or more required fields is not present" });
        }

        const [userId, groupId] = await Promise.all(
            [
                checkUser(body.userId),
                checkGroup(body.groupId)
            ]
        );
        if (!groupId){
            return res.status(400).json({ message: "The provided group was not found in our database" });
        }
        if (!userId){
            return res.status(400).json({ message: "The provided user was not found in our database" });
        }
        // Check if user is already in group
        const groupUsers = (await Group.findById(groupId)).userIds;
        const userFound = groupUsers.find(user => user.equals(userId));
        if (userFound){
            return res.status(400).json({ message: "User is already a member of this group" });
        }
        // Get the id of the group's workspace
        const workspaceId = (await Group.findById(groupId)).workspaceId;
        // Check that the user is in the same workspace as the group
        const userWorkspaces = (await
            User.findById(userId).select('workspaceIds').exec()
        ).workspaceIds;
        const found = userWorkspaces.find(space => space.workspaceId.equals(workspaceId));
        if (!found){
            return res.status(400).json({ message: "User is not in the group's workspace" });
        }
        // Link the user and the group
        await Promise.all(
            [
                addUserToGroup(userId, groupId),
                addGroupToUser(userId, groupId)
            ]
        );
        return res.status(200).json({ message: "Joined group successfully" });
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

export default router;