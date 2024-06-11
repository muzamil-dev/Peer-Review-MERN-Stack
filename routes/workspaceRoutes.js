import express from 'express';
import { User } from '../models/userModel.js';
import { Workspace } from '../models/workspaceModel.js';

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
        const newWorkspace = { name: body.name, creatorId: creator._id };
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
        // Get workspace id
        // Check for the user id
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

export default router;