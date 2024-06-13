import express from "express";
import { Group } from "../models/groupModel.js";
import { User } from "../models/userModel.js";
import { Workspace } from "../models/workspaceModel.js";

import { 
    checkWorkspace, checkUser, checkGroup, checkInstructor, checkUserInWorkspace,
    checkUserNotInGroup
} from "../middleware/checks.js";
import { addUserToGroup, addGroupToUser, addGroupToWorkspace } from "../shared/adders.js";

const router = express.Router();

// Get all information about a group
router.get("/:groupId", checkGroup, async(req, res) => {
    try {
        //const { groupId } = req.params;
        const groupId = req.body.groupId;
        const group = await Group.findById(groupId);
        res.json(group);
    } 
    catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Get all users in a group
// Formats as an array with _id, firstName, lastName, email
router.get("/:groupId/users", checkGroup, async (req, res) => {
    try {
        // const { groupId } = req.params;
        const groupId = req.body.groupId;
        const group = await Group.findById(groupId).select('userIds');
        const users = await User.find(
            { _id: { $in: group.userIds }}
        ).select('firstName middleName lastName email');
        res.json(users);
    } 
    catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Check that a user is provided in body
router.use(checkUser);

// Create a group in a workspace
router.post("/create", checkWorkspace, checkInstructor, async(req, res) => {
    try{
        // Check that workspace and user were given
        const body = req.body;
        // Check that a name for the group is given
        if (!body.name){
            const numGroups = (await Workspace.findById(body.workspaceId)
                            .select('groupIds').exec()).groupIds.length + 1;
            body.name = `Group ${numGroups}`;
        }
        // Create the group
        const group = await Group.create({ 
            name: body.name, 
            workspaceId: body.workspaceId 
        });
        // Add the group to the workspace's list of groups
        await addGroupToWorkspace(group._id, body.workspaceId);
        return res.status(201).json(group);
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});


// Route to add users to a group
router.put("/join", checkGroup, checkUserNotInGroup, checkUserInWorkspace, async(req, res) => {
    try{
        // Set variables
        const body = req.body;
        const groupId = body.groupId;
        const userId = body.userId;
        // Link the user and the group
        await Promise.all([
            addUserToGroup(userId, groupId),
            addGroupToUser(userId, groupId)
        ]);
        return res.json({ message: "Joined group successfully" });
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

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