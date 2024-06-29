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

        const numGroups = await Group.countDocuments({ workspaceId: body.workspaceId });
        const name = `Group ${numGroups + 1}`;
        
        // Create the group
        const groupObj = {
            groupId: null,
            name, 
            workspaceId: body.workspaceId,
        }
        const group = await Group.create(groupObj);
        groupObj.groupId = group._id;

        return res.status(201).json(groupObj);
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
        const group = await Group.findById(groupId).populate('workspaceId', 'groupLock');
        if (!group)
            return res.status(404).json({ 
                message: "The provided group was not found in our database" 
            });
        
        // Set variables from populate
        const workspaceId = group.workspaceId._id;
        const groupLock = group.workspaceId.groupLock;
        
        // Check if the groups are locked
        if (groupLock){
            return res.status(400).json({ message: "This group is locked and cannot be joined" });
        }

        // Check that the user is in the same workspace as the group
        if (!await Checkers.checkUserInWorkspace(userId, workspaceId))
            return res.status(400).json({ message: "The provided user was not found in this workspace" });

        // Check that the user isn't already in a group within the group's workspace
        if (await Checkers.checkUserInWorkspaceGroup(userId, workspaceId))
            return res.status(400).json({ 
                message: "User is already a member of a group in this workspace" 
            });

        // Get group member limit
        const memberLimit = (await Workspace.findById(workspaceId)
                            .select('groupMemberLimit')).groupMemberLimit;
        // Check the group's member limit
        if (memberLimit && group.userIds.length > memberLimit)
            return res.status(400).json({
                message: "Cannot join group because the member limit has been reached"
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
        const { groupId } = req.body;
        if (!groupId)
            return res.status(400).json({ message: "One or more required fields is not present" });

        // Get group and check that it exists
        const group = await Group.findById(groupId).populate('workspaceId', 'groupLock');
        if (!group)
            return res.status(404).json({ 
                message: "The provided group was not found in our database" 
            });
        
        // Set variables from populate
        const groupLock = group.workspaceId.groupLock;
        
        // Check if the groups are locked
        if (groupLock){
            return res.status(400).json({ message: "This group is locked and cannot be left" });
        }

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

// Route for admin to add user to a group, overrides member limit and locks
// Required: targetId, groupId
router.put("/addUser", async(req, res) => {
    try{
        const { userId, targetId, groupId } = req.body;
        // Check for required fields
        if (!targetId || !groupId)
            return res.status(400).json({ message: "One or more required fields is not present" });

        // Get group and check that it exists
        const group = await Group.findById(groupId);
        if (!group)
            return res.status(404).json({ 
                message: "The provided group was not found in our database" 
            });

        // Check that the user is an instructor in the workspace
        if (!await Checkers.checkInstructor(userId, group.workspaceId))
            return res.status(403).json({
                message: "The provided user is not authorized to modify this group"
            });
        // Check that the user is in the same workspace as the group
        if (!await Checkers.checkUserInWorkspace(targetId, group.workspaceId))
            return res.status(400).json({ message: "The provided user was not found in this workspace" });

        // Check that the user isn't already in a group within the group's workspace
        if (await Checkers.checkUserInWorkspaceGroup(targetId, group.workspaceId))
            return res.status(400).json({ 
                message: "User is already a member of a group in this workspace" 
            });
        
        // Link the user and the group
        await Promise.all([
            Adders.addUserToGroup(targetId, groupId),
            Adders.addGroupToUser(targetId, groupId)
        ]);
        return res.json({ message: "Added user to group successfully" });
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

// Route for admin to remove user from a group
// Required: targetId, groupId
router.put("/removeUser", async(req, res) => {
    try{
        const { userId, targetId, groupId } = req.body;
        // Check for required fields
        if (!targetId || !groupId)
            return res.status(400).json({ message: "One or more required fields is not present" });

        // Get group and check that it exists
        const group = await Group.findById(groupId);
        if (!group)
            return res.status(404).json({ 
                message: "The provided group was not found in our database" 
            });

        // Check that the user is an instructor in the workspace
        if (!await Checkers.checkInstructor(userId, group.workspaceId))
            return res.status(403).json({
                message: "The provided user is not authorized to modify this group"
            });
        
        // Link the user and the group
        await Promise.all([
            Removers.removeUserFromGroup(targetId, groupId),
            Removers.removeGroupFromUser(targetId, groupId)
        ]);
        return res.json({ message: "Removed user from group successfully" });
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

// Deletes a group
router.delete("/:groupId", async(req, res) => {
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

export default router;