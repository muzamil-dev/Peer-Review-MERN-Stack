import express from 'express';
import { User } from '../models/userModel.js';
import { Workspace } from '../models/workspaceModel.js';
import { WorkspaceMembership } from '../models/workspaceMembershipModel.js';

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
        const creator = await User.findById(body.userId);
        if (!creator){
            return res.status(404).json({ message: "The specified user was not found in our database" });
        }

        // Create new workspace object and member object
        const newWorkspace = { name: body.name, creator: creator._id };
        // Create and get the new workspace
        const workspace = await Workspace.create(newWorkspace);
        // Add the workspace membership for the creator
        await WorkspaceMembership.create({ userId: creator._id, workspaceId: workspace._id, role: "Instructor" });

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
        // Check if user is already in workspace
        const membership = await WorkspaceMembership.find({ userId: user._id, workspaceId: workspace._id });
        if (membership.length > 0){
            return res.status(400).json({ message: "The given user is already in the workspace" });
        }
        // Add workspace membership relationship
        await WorkspaceMembership.create({ userId: user._id, workspaceId: workspace._id, role: "Student" });
        
        res.status(200).send({ message: `Joined ${workspace.name} successfully!`});
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

export default router;