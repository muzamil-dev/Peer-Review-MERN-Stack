import express from 'express';
import { User } from '../models/userModel.js';
import { Workspace } from '../models/workspaceModel.js';
import { Group } from '../models/groupModel.js';

import * as Adders from "../shared/adders.js";
import * as Removers from "../shared/removers.js"
import * as Checkers from '../shared/checkers.js';
import * as Getters from "../shared/getters.js";

import generateCode from '../shared/generateCode.js';

const router = express.Router();

// Gets a list of groups from the workspace
router.get("/:workspaceId/groups", async(req, res) => {
    try{
        // Get the workspace
        const { workspaceId } = req.params;
        const workspace = Workspace.findById(workspaceId);
        // Check that the workspace exists
        if (!workspace)
            return res.status(404).json({ 
                message: "The provided workspace was not found in our database" 
            });

        // Get all groups from workspace
        const groups = await Group.find({ workspaceId }).select('_id');
        const groupDataArray = await Promise.all(groups.map(group => Getters.getGroupData(group._id)));
        return res.json(groupDataArray);
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Creates a new workspace
// Required: name
router.post("/create", async(req, res) => {
    try{
        // Check for the workspace name
        const body = req.body;
        if (!body.name){
            return res.status(400).json({ message: "One or more required fields is not present" });
        }

        // Create new workspace object and member object
        const newWorkspace = { name: body.name };
        // Create and get the new workspace
        const workspace = await Workspace.create(newWorkspace);
        // Add the workspace membership for the creator
        await Promise.all([
            Adders.addUserToWorkspace(body.userId, workspace._id, "Instructor"),
            Adders.addWorkspaceToUser(body.userId, workspace._id, "Instructor")
        ]);
        
        return res.status(201).json({
            message: "Workspace created successfully",
            workspaceId: workspace._id
        });
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Join a workspace
// Required: workspaceId, inviteCode
router.put("/join", async(req, res) => {
    try{
        const body = req.body;
        // Get userId and workspaceId
        const userId = body.userId;
        const workspaceId = body.workspaceId;
        const inviteCode = body.inviteCode;
        // Check that the invite code was given
        if (!body.workspaceId || !body.inviteCode){
            return res.status(400).json({ message: "One or more required fields was not present" });
        }
        // Get relevant info from the user and workspace
        const userInfo = await User.findById(userId).select('email');
        const workspace = await Workspace.findById(workspaceId).select('inviteCode allowedDomains');

        // Check that the workspace exists
        if (!workspace)
            return res.status(404).json({ message: "The provided workspace was not found in our database" });

        // Check if user's email contains an allowed domain
        if (workspace.allowedDomains !== null 
            && workspace.allowedDomains.length > 0){
            // Check the list of domains if an allowedDomains list exists
            const userDomain = userInfo.email.split('@')[1];
            const domainCheck = (domain, userDomain) => {
                const domainPattern = new RegExp(domain);
                return domainPattern.test(userDomain);
            }
            const foundDomain = workspace.allowedDomains.find(domain => domainCheck(domain, userDomain));
            if (!foundDomain){
                return res.status(403).json({ message: "The given user is not authorized to join this workspace." });
            }
        }

        // Check if the correct invite code is provided
        const correctCode = workspace.inviteCode;
        // Return if code exists and provided code doesn't match
        if (!correctCode || inviteCode !== correctCode){
            return res.status(403).json({ message: "The given user is not authorized to join this workspace." });
        }

        // Check if user is already in workspace
        const workspaces = (await User.findById(userId)).workspaceIds;
        const found = workspaces.find(space => space.workspaceId.equals(workspaceId));
        if (found){
            return res.status(400).json({ message: "The given user is already in the workspace" });
        }

        // Add workspace membership relationship
        await Promise.all([
            Adders.addUserToWorkspace(userId, workspaceId, "Student"),
            Adders.addWorkspaceToUser(userId, workspaceId, "Student")
        ]);
        // Return success message
        res.json({ message: "Workspace joined successfully!" });
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Leave a workspace
// Required: workspaceId
router.put("/leave", async(req, res) => {
    try{
        const userId = req.body.userId;
        const workspaceId = req.body.workspaceId;

        await Promise.all([
            Removers.removeUserFromWorkspace(userId, workspaceId),
            Removers.removeWorkspaceFromUser(userId, workspaceId)
        ]);

        res.json({ message: "Workspace left successfully" });
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Sets the active invite code
router.put("/setInvite", async(req, res) => {
    try{
        const inviteCode = generateCode();
        // Check that the user is the instructor
        if (!await Checkers.checkInstructor(req.body.userId, req.body.workspaceId))
            return res.status(403).json({ 
                message: "The provided user is not authorized to delete this workspace" 
            });
        // Set the invite code
        const workspace = await Workspace.updateOne(
            { _id: req.body.workspaceId },
            { inviteCode }
        );
        // Check that the workspace was updated
        if (!workspace.matchedCount)
            return res.status(404).json({ 
                message: "The provided workspace wasn't found in our database" 
            });

        return res.json({ 
            message: "Invite code updated successfully",
            inviteCode
        });
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Sets the allowed domains
// Reset the domains by passing an empty array
// Required: workspaceId, allowedDomains (array)
router.put("/setAllowedDomains", async(req, res) => {
    try{
        // Check that the user is the instructor
        if (!await Checkers.checkInstructor(req.body.userId, req.body.workspaceId))
            return res.status(403).json({ 
                message: "The provided user is not authorized to delete this workspace" 
            });

        // Return if allowedDomains is not specified
        if (!req.body.allowedDomains){
            return res.status(400).json({ message: "One or more required fields was not present"} );
        }
        else if (!Array.isArray(req.body.allowedDomains)){
            return res.status(400).json({ message: "Field allowedDomains must be an array"} );
        }
        // Set the invite code
        const workspace = await Workspace.updateOne(
            { _id: req.body.workspaceId },
            { allowedDomains: req.body.allowedDomains }
        );
        // Check that the workspace was updated
        if (!workspace.matchedCount)
            return res.status(404).json({ 
                message: "The provided workspace wasn't found in our database" 
            });

        return res.json({ message: "Allowed Domains set successfully" });
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Deletes the given workspace
router.delete("/delete/:workspaceId", async(req, res) => {
    try{
        // Get all workspace users
        const workspace = await Workspace.findById(
            req.params.workspaceId
        ).select('userIds');

        // Check that the user is the instructor
        if (!await Checkers.checkInstructor(req.body.userId, workspace._id))
            return res.status(403).json({ 
                message: "The provided user is not authorized to delete this workspace" 
            });
        // Check that the workspace exists
        if (!workspace)
            return res.status(404).json({ 
                message: "The provided workspace wasn't found in our database"
            });

        // Create an array with just user ids
        const userIds = workspace.userIds.map(
            user => user.userId
        );

        // Remove groups in workspace from user's list of groups
        const groups = await Group.find({ workspaceId: req.body.workspaceId }).select('userIds');
        await Promise.all(
            groups.map(group => Removers.removeGroupFromUsers(group.userIds, group._id))
        );
        // Pull from the user's workspaceIds
        await Removers.removeWorkspaceFromUsers(userIds, workspace._id);
        // Delete groups and workspace
        await Promise.all([
            Group.deleteMany({ workspaceId: req.body.workspaceId }),
            Workspace.findByIdAndDelete(req.body.workspaceId)
        ]);
        
        return res.json({ message: "Workspace deleted successfully" });
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Removes the active invite code
router.delete("/:workspaceId/removeInvite", async(req, res) => {
    try{
        // Check that the user is the instructor
        if (!await Checkers.checkInstructor(req.body.userId, req.params.workspaceId))
            return res.status(403).json({ 
                message: "The provided user is not authorized to delete this workspace" 
            });
        // Set the invite code
        const workspace = await Workspace.updateOne(
            { _id: req.params.workspaceId },
            { inviteCode: null }
        );
        // Check that the workspace was updated
        if (!workspace.matchedCount)
            return res.status(404).json({ 
                message: "The provided workspace wasn't found in our database" 
            });

        return res.json({ message: "Invite code removed successfully" });
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

////////////////////////////

// This is for testing and likely wont be available to users
// Pass in an array (workspaces) with documents: { name, userId }
// No input validation is used in this endpoint
// router.post("/createMany", async(req, res) => {
//     try{
//         const workspaces = req.body.workspaces;
//         const created = (await Workspace.insertMany(
//             workspaces
//         )).map(space => ({ 
//             name: space.name, 
//             workspaceId: space._id
//         }));
//         res.status(201).json({ 
//             message: `Workspaces created (${workspaces.length})`,
//             workspaces: created
//         });
//     }
//     catch(err){
//         console.log(err.message);
//         res.status(500).send({ message: err.message });
//     }
// });

export default router;