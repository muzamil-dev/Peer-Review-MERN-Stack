import express from "express";
import { Group } from "../models/groupModel.js";
import { User } from "../models/userModel.js";
import { Workspace } from "../models/workspaceModel.js";

import * as Checks from "../middleware/checks.js";
import * as Adders from "../shared/adders.js";
import * as Removers from "../shared/removers.js";
import * as Checkers from "../shared/checkers.js";

const router = express.Router();

// Get all information about a group
router.get("/:groupId", async(req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);
        // Check that the group was found
        if (!group)
            return res.status(404).json({
                message: "The provided group was not found in our database" 
            });
        res.json(group);
    } 
    catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Get all users in a group
// Formats as an array with _id, firstName, middleName, lastName
router.get("/:groupId/users", async (req, res) => {
    try {
        // Get the group
        const { groupId } = req.params;
        const group = await Group.findById(groupId).select('userIds');
        // Check that the group was found
        if (!group)
            return res.status(404).json({
                message: "The provided group was not found in our database" 
            });
        // Get the group's users
        const users = await User.find(
            { _id: { $in: group.userIds }}
        ).select('firstName middleName lastName');
        // Return formatted json
        res.json(users.map(user => ({
            userId: user._id,
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName
        })));
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
// Required: workspaceId, numGroups (at least 1)
router.post("/createMany", async(req, res) => {
    try{
        const body = req.body;
        // Check that a number of groups is passed in
        if (!body.workspaceId || !body.numGroups || body.numGroups < 1){
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

        // Create the group objects
        const groupObjs = [];
        for (let i = 0; i < body.numGroups; i++){
            groupObjs.push({
                name: `Group ${i+1}`,
                workspaceId: workspace._id
            });
        }
        // Create groups and return
        const groups = await Group.create(groupObjs);
        return res.status(201).json(groups);
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

// Deletes a group
router.delete("/delete", Checks.checkGroup, Checks.checkInstructor, async(req, res) => {
    try{
        const groupId = req.body.groupId;
        const workspaceId = req.body.workspaceId;
        // Get group's members
        const groupMembers = (await Group.findById(groupId).select('userIds')).userIds;
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

// Route to join a group
// Required: groupId
router.put("/join", Checks.checkGroup, Checks.checkUserNotInGroup, Checks.checkUserInWorkspace, async(req, res) => {
    try{
        // Set variables
        const body = req.body;
        const groupId = body.groupId;
        const userId = body.userId;
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
            return res.status(400).json({ message: "One or more required fields is not present"})

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