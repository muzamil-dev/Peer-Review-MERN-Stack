import express from "express";
import { Group } from "../models/groupModel.js";
import { GroupMembership } from "../models/groupMembershipModel.js";
import { User } from "../models/userModel.js";
import { Workspace } from "../models/workspaceModel.js";
import { WorkspaceMembership } from "../models/workspaceMembershipModel.js";

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
        const instructors = await WorkspaceMembership
                                .find({ workspaceId, role: "Instructor" })
                                .select({ userId: 1, _id: 0 }).exec();
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

export default router;