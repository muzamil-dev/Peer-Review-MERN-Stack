import express from "express";
import { Group } from "../models/groupModel.js";
import { User } from "../models/userModel.js";
import { Workspace } from "../models/workspaceModel.js";

import * as Adders from "../shared/adders.js";
import * as Removers from "../shared/removers.js";
import * as Checkers from "../shared/checkers.js";
import * as Getters from "../shared/getters.js";

const router = express.Router();

// Get information about a group
router.get("/:groupId", async(req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);
        // Check that the group was found
        if (!group)
            return res.status(404).json({
                message: "The provided group was not found in our database" 
            });
        // Get formatted data
        const groupData = await Getters.getGroupData(groupId);
        // Return formatted json
        res.json(groupData);
    } 
    catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Create a group in a workspace
// Required: workspaceId
// Optional: name
router.post("/create", async(req, res) => {
    try{
        const body = req.body;
        // Checks that a workspaceId was given
        if (!body.workspaceId)
            return res.status(400).json({ message: "One or more required fields is not present" });
        
        // Check that the workspace exists
        const workspace = await Workspace.findById(body.workspaceId);
        if (!workspace)
            return res.status(404).json({ 
                message: "The provided workspace was not found in our database" 
            });
        
        // Check that the user is an instructor in the workspace
        if (!await Checkers.checkInstructor(body.userId, workspace._id))
            return res.status(403).json({
                message: "The provided user is not authorized to create groups"
            });

        // Check that a name for the group is given
        if (!body.name){
            const numGroups = await Group.countDocuments({ workspaceId: body.workspaceId });
            body.name = `Group ${numGroups + 1}`;
        }
        // Create the group
        const group = await Group.create({ 
            name: body.name, 
            workspaceId: body.workspaceId 
        });

        return res.status(201).json(group);
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

// Creates a list of groups
// Required: workspaceId
router.post("/create/:num", async(req, res) => {
    try{
        const body = req.body;
        const { num } = req.params;
        // Check that a number of groups is passed in
        if (!body.workspaceId || num < 1){
            return res.status(400).json({ message: "One or more required fields is not present" });
        }

        // Check that the workspace exists
        const workspace = await Workspace.findById(body.workspaceId);
        if (!workspace)
            return res.status(404).json({ 
                message: "The provided workspace was not found in our database" 
            });

        // Check that the user is an instructor in the workspace
        if (!await Checkers.checkInstructor(body.userId, workspace._id))
            return res.status(403).json({
                message: "The provided user is not authorized to create groups"
            });

        // Create the groups objects
        const promises = new Array(num);
        for (let i = 0; i < num; i++){
            promises[i] = Group.create({
                name: `Group ${i+1}`,
                workspaceId: workspace._id
            });
        }
        // Wait for promises to resolve, format the return json
        const groups = (await Promise.all(promises)).map(group => ({
            name: group.name,
            groupId: group._id
        }));
        // Return formatted json
        return res.status(201).json({
            message: "Groups created successfully", groups
        });
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

// Route to join a group
// Required: groupId
router.put("/join", async(req, res) => {
    try{
        // Set variables
        const groupId = req.body.groupId;
        const userId = req.body.userId;
        // Get group and check that it exists
        const group = await Group.findById(groupId).select('workspaceId');
        if (!group)
            return res.status(404).json({ 
                message: "The provided group was not found in our database" 
            });
        // Check that the user is in the same workspace as the group
        if (!await Checkers.checkUserInWorkspace(userId, group.workspaceId))
            return res.status(400).json({ message: "The provided user was not found in this workspace" });

        // Check that the user isn't already in a group within the group's workspace
        if (await Checkers.checkUserInWorkspaceGroup(userId, group.workspaceId))
            return res.status(400).json({ 
                message: "User is already a member of a group in this workspace" 
            });
        // Link the user and the group
        await Promise.all([
            Adders.addUserToGroup(userId, groupId),
            Adders.addGroupToUser(userId, groupId)
        ]);
        return res.json({ message: "Joined group successfully" });
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

// Route to leave a group
// Required: groupId
router.put("/leave", async(req, res) => {
    try{
        // Check that a group was provided
        if (!req.body.groupId)
            return res.status(400).json({ message: "One or more required fields is not present" });

        // Remove the group and user from their respective arrays
        await Promise.all([
            Removers.removeUserFromGroup(req.body.userId, req.body.groupId),
            Removers.removeGroupFromUser(req.body.userId, req.body.groupId)
        ]);

        // Return success response
        return res.json({ message: "Left group successfully" });
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

// Deletes a group
router.delete("/delete/:groupId", async(req, res) => {
    try{
        const { groupId } = req.params;
        // Check that the group exists
        const group = await Group.findById(groupId).select('workspaceId userIds');
        if (!group)
            return res.status(404).json({ 
                message: "The provided group was not found in our database" 
            });
        // Check that the user is an instructor in the workspace
        const workspaceId = group.workspaceId;
        if (!await Checkers.checkInstructor(req.body.userId, workspaceId))
            return res.status(403).json({
                message: "The provided user is not authorized to delete this group"
            });
        // Get the group's members
        const groupMembers = group.userIds;
        // Remove group from users
        await Promise.all([
            Removers.removeGroupFromUsers(groupMembers, groupId),
            Group.findByIdAndDelete(groupId)
        ]);
        res.json({ message: "Group deleted successfully" });
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

// Remove user from group
// router.put("/removeUser", Checks.checkGroup, Checks.checkInstructor, async (req, res) => {
//     try {
//         const { groupId, targetId } = req.body;

//         // Check if the targetId was provided
//         if (!targetId){
//             return res.status(400).json({ message: "One or more required fields is not present" });
//         }

//         await Promise.all([
//             Removers.removeGroupFromUser(targetId, groupId),
//             Removers.removeUserFromGroup(targetId, groupId)
//         ]);
//         res.json({ message: "User removed from group successfully" });
//     } 
//     catch (err) {
//         console.log(err.message);
//         res.status(500).send({ message: err.message });
//     }
// });

// Update group information
// router.put("/:groupId", async (req, res) => {
//     try {
//         const { groupId } = req.params;
//         const { name } = req.body;

//         const group = await Group.findById(groupId);
//         if (!group) {
//             return res.status(404).json({ message: "Group not found" });
//         }

//         if (name) {
//             group.name = name;
//         }

//         const updatedGroup = await group.save();
//         res.status(200).json(updatedGroup);
//     } catch (err) {
//         console.log(err.message);
//         res.status(500).send({ message: err.message });
//     }
// });

// Join several users in a group (for testing)
// router.put("/bulkjoin", Checks.checkGroup, async(req, res) => {
//     try {
//         const groupId = req.body.groupId;
//         const userIds = req.body.userIds;

//         const group = await Group.findById(groupId);
//         group.userIds.push(...userIds);
//         await group.save();

//         await User.updateMany(
//             { _id: { $in: userIds }},
//             { $push: { groupIds: groupId }}
//         );
//         res.send("Users added");
//     } 
//     catch (err) {
//         console.log(err.message);
//         res.status(500).send({ message: err.message });
//     }
// });

export default router;