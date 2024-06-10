import express from 'express';
import { User } from '../models/userModel.js';
import { Workspace } from '../models/workspaceModel.js';

const router = express.Router();

// Adds the provided member object as a member of the given workspace
async function addMemberToWorkspace(workspaceId, member){
    return Workspace.findByIdAndUpdate(
        workspaceId,
        { $push: { members: member }}
    );
}

// Adds the provided workspace to the provided user
async function addWorkspaceToUser(userId, workspaceId){
    return User.findByIdAndUpdate(
        userId,
        { $push: { workspaces: workspaceId }}
    );
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
        const creator = await User.findById(body.userId);
        if (!creator){
            return res.status(404).json({ message: "The specified user was not found in our database" });
        }

        // Create new workspace object and member object
        const newWorkspace = { name: body.name, creator: creator._id };
        const newMember = { userId: creator._id, role: "Instructor" };

        // Create and get the new workspace
        const workspace = await Workspace.create(newWorkspace);
        
        // Run queries async
        await Promise.all[
            addMemberToWorkspace(workspace._id, newMember), // Add the creator as a member of the workspace
            addWorkspaceToUser(creator._id, workspace._id) // Add the workspace to the user's workspaces
        ];
        return res.status(201).json(workspace);
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

router.put("/join/:id", async(req, res) => {
    try{
        // Get workspace id
        const { id } = req.params;
        // Check for the user id
        const body = req.body;
        if (!body.userId){
            return res.status(400).json({ message: "No user id was provided" });
        }
        // Find the given user
        const user = await User.findById(body.userId);
        if (!user){
            return res.status(404).json({ message: "The specified user was not found in our database" });
        }
        // Find the given workspace
        const workspace = await Workspace.findById(id).select("name").exec();
        if (!workspace){
            return res.status(404).json({ message: "The specified workspace was not found in our database" });
        }
        // Create a member object for the new member
        const newMember = { userId: user._id, role: "Student" };
        // Add new member to workspace
        await Promise.all[
            addMemberToWorkspace(workspace._id, newMember), // Add the user as a member of the workspace
            addWorkspaceToUser(user._id, workspace._id) // Add the workspace to the user's workspaces
        ];
        res.status(200).send({ message: `Joined ${workspace.name} successfully!`});
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

export default router;