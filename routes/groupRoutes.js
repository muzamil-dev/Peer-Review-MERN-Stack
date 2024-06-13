import express from "express";
import { Group } from "../models/groupModel.js";
import { User } from "../models/userModel.js";
import { Workspace } from "../models/workspaceModel.js";

import { checkWorkspace, checkUser, checkGroup } from "../middleware/checks.js";
import { addUserToGroup, addGroupToUser } from "../shared/adders.js";

const router = express.Router();

// Create a group in a workspace
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

// Get users by group
// router.get("/:groupId/users", async (req, res) => {
//     try {
//         const { groupId } = req.params;
//         const group = await Group.findById(groupId).populate('userIds');
//         res.status(200).json(group.userIds);
//     } catch (err) {
//         console.log(err.message);
//         res.status(500).send({ message: err.message });
//     }
// });

// Remove user from group
// router.put("/:groupId/removeUser", async (req, res) => {
//     try {
//         const { groupId } = req.params;
//         const { userId } = req.body;

//         if (!userId) {
//             return res.status(400).json({ message: "User ID is required" });
//         }

//         const group = await Group.findById(groupId);
//         if (!group) {
//             return res.status(404).json({ message: "Group not found" });
//         }

//         group.userIds.pull(userId);
//         await group.save();

//         const user = await User.findById(userId);
//         if (user) {
//             user.groupIds.pull(groupId);
//             await user.save();
//         }

//         res.status(200).json({ message: "User removed from group successfully" });
//     } catch (err) {
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

// Delete a group
// router.delete("/:groupId", async (req, res) => {
//     try {
//         const { groupId } = req.params;

//         const group = await Group.findByIdAndDelete(groupId);
//         if (!group) {
//             return res.status(404).json({ message: "Group not found" });
//         }

//         const userIds = group.userIds;
//         await User.updateMany(
//             { _id: { $in: userIds } },
//             { $pull: { groupIds: groupId } }
//         );

//         res.status(200).json({ message: "Group deleted successfully" });
//     } catch (err) {
//         console.log(err.message);
//         res.status(500).send({ message: err.message });
//     }
// });

export default router;