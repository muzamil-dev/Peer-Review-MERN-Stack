import express from "express";
import { Group } from "../models/groupModel.js";
import { User } from "../models/userModel.js";
import { Workspace } from "../models/workspaceModel.js";

const router = express.Router();

// Check if the workspace exists
async function checkWorkspace(workspaceId){
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace){
        return null;
    }
    return workspace._id;
}

// Check if the user exists
async function checkUser(userId){
    const user = await User.findById(userId);
    if (!user){
        return null;
    }
    return user._id;
}

// Check if the group exists
async function checkGroup(groupId){
    const group = await Group.findById(groupId);
    if (!group){
        return null;
    }
    return group._id;
}

// Update workspace with user
async function addUserToWorkspace(userId, workspaceId, role){
    const result = await Workspace.updateOne(
        { _id: workspaceId },
        { $push: { userIds: { userId, role } }}
    );
    return result;
}

// Update user with workspace
async function addWorkspaceToUser(userId, workspaceId, role){
    const result = await User.updateOne(
        { _id: userId },
        { $push: { workspaceIds: { workspaceId, role } }}
    );
    return result;
}

// Update group with user
async function addUserToGroup(userId, groupId){
    const result = await Group.updateOne(
        { _id: groupId },
        { $push: { userIds: userId }}
    );
    return result;
}

// Update user with group
async function addGroupToUser(userId, groupId){
    const result = await User.updateOne(
        { _id: userId },
        { $push: { groupIds: groupId }}
    );
    return result;
}

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