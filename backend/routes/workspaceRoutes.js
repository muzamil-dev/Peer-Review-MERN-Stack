import express from 'express';
import { User } from '../models/userModel.js';
import { Workspace } from '../models/workspaceModel.js';
import { Group } from '../models/groupModel.js';

import * as Adders from "../shared/adders.js";
import * as Removers from "../shared/removers.js"
import * as Checkers from '../shared/checkers.js';
import * as Getters from "../shared/getters.js";

import generateCode from '../shared/generateCode.js';
import { ReviewAssignment } from '../models/reviewAssignmentModel.js';

const router = express.Router();

// Gets a list of assignments made in the workspace
router.get("/:workspaceId/assignments", async (req, res) => {
    try {
        // Get the workspace
        const { workspaceId } = req.params;
        const workspace = await Workspace.findById(workspaceId);
        // Check that the workspace exists
        if (!workspace)
            return res.status(404).json({
                message: "The provided workspace was not found in our database"
            });

        // Get the assignments with the provided workspaceId
        const assignments = await ReviewAssignment.find(
            { workspaceId }
        );
        // Format the assignments json
        const formatted = assignments.map(
            asn => ({
                assignmentId: asn._id,
                startDate: asn.startDate,
                dueDate: asn.dueDate,
                description: asn.description,
                questions: asn.questions
            })
        );
        return res.json(formatted);
    }
    catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Gets a list of groups from the workspace
router.get("/:workspaceId/groups", async (req, res) => {
    try {
        // Get the workspace
        const { workspaceId } = req.params;
        const workspace = await Workspace.findById(workspaceId)
            .select('groupMemberLimit');
        // Check that the workspace exists
        if (!workspace)
            return res.status(404).json({
                message: "The provided workspace was not found in our database"
            });

        // Get all groups from workspace
        const groups = await Group.find({ workspaceId }).populate({
            path: 'userIds',
            select: 'firstName lastName'
        });
        // Format the groups
        const formatted = groups.map(group => {
            const members = group.userIds.map(ids => ({
                userId: ids._id,
                firstName: ids.firstName,
                lastName: ids.lastName
            }));
            return {
                groupId: group._id,
                name: group.name,
                members
            };
        });
        const groupObj = {
            groupMemberLimit: workspace.groupMemberLimit,
            groups: formatted
        };
        return res.json(groupObj);
    }
    catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

//get workspace name
router.get('/:workspaceId/name', async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }
        res.json({ name: workspace.name });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Get workspace details
router.get("/:workspaceId/details", async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }
        res.json({
            name: workspace.name,
            allowedDomains: workspace.allowedDomains,
            groupMemberLimit: workspace.groupMemberLimit,
            inviteCode: workspace.inviteCode,
            groupLock: workspace.groupLock
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

// Get workspace details
router.get("/:workspaceId/details", async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        return res.status(404).json({ message: 'Workspace not found' });
      }
      res.json({
        name: workspace.name,
        allowedDomains: workspace.allowedDomains,
        groupMemberLimit: workspace.groupMemberLimit,
        groupLock: workspace.groupLock
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: err.message });
    }
  });

// Creates a new workspace
// Required: name
// Optional: numGroups, groupMemberLimit, allowedDomains
router.post("/create", async (req, res) => {
    try {
        // Check for the workspace name
        const { name, userId, allowedDomains, groupMemberLimit, numGroups } = req.body;
        if (!name || !userId) {
            return res.status(400).json({ message: "One or more required fields is not present" });
        }

        // Create new workspace object and member object
        const newWorkspace = { name };
        // Optional fields
        if (groupMemberLimit && groupMemberLimit >= 1)
            newWorkspace.groupMemberLimit = groupMemberLimit;
        if (allowedDomains && Array.isArray(allowedDomains))
            newWorkspace.allowedDomains = allowedDomains;

        // Create and get the new workspace
        const workspace = await Workspace.create(newWorkspace);
        // Add the workspace membership for the creator
        await Promise.all([
            Adders.addUserToWorkspace(userId, workspace._id, "Instructor"),
            Adders.addWorkspaceToUser(userId, workspace._id, "Instructor")
        ]);

        // Create groups if provided
        if (numGroups && numGroups > 0) {
            const workspaceId = workspace._id;
            const groups = Array(numGroups);
            for (let i = 1; i <= numGroups; i++)
                groups[i - 1] = { name: `Group ${i}`, workspaceId };
            await Group.insertMany(groups);
        }

        return res.status(201).json({
            message: "Workspace created successfully",
            workspaceId: workspace._id
        });
    }
    catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Join a workspace
// Required: inviteCode
router.put("/join", async (req, res) => {
    try {
        const body = req.body;
        // Get userId and workspaceId
        const userId = body.userId;
        const inviteCode = body.inviteCode;
        // Check that the invite code was given
        if (!body.inviteCode) {
            return res.status(400).json({ message: "One or more required fields was not present" });
        }
        // Get relevant info from the user and workspace
        const userInfo = await User.findById(userId).select('email');
        const workspace = await Workspace.findOne(
            { inviteCode }
        ).select('allowedDomains');

        // Check that the workspace exists
        if (!workspace)
            return res.status(404).json({ message: "No workspace with this invite code was found" });
        const workspaceId = workspace._id;

        // Check if user is already in workspace
        const workspaces = (await User.findById(userId)).workspaceIds;
        const found = workspaces.find(space => space.workspaceId.equals(workspaceId));
        if (found) {
            return res.status(400).json({ message: "The given user is already in the workspace" });
        }

        // Check if user's email contains an allowed domain
        if (workspace.allowedDomains !== null
            && workspace.allowedDomains.length > 0) {
            // Check the list of domains if an allowedDomains list exists
            const userDomain = userInfo.email.split('@')[1];
            const domainCheck = (domain, userDomain) => {
                const domainPattern = new RegExp(domain);
                return domainPattern.test(userDomain);
            }
            const foundDomain = workspace.allowedDomains.find(domain => domainCheck(domain, userDomain));
            if (!foundDomain) {
                return res.status(403).json({ message: "The given user is not authorized to join this workspace." });
            }
        }

        // Add workspace membership relationship
        await Promise.all([
            Adders.addUserToWorkspace(userId, workspaceId, "Student"),
            Adders.addWorkspaceToUser(userId, workspaceId, "Student")
        ]);
        // Return success message
        res.json({
            message: "Workspace joined successfully!", workspaceId
        });
    }
    catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Leave a workspace
// Required: workspaceId
router.put("/leave", async (req, res) => {
    try {
        const userId = req.body.userId;
        const workspaceId = req.body.workspaceId;

        // Find user's group id
        const group = (await Getters.getGroupInWorkspace(userId, workspaceId));
        let groupId;
        if (group)
            groupId = group._id;

        // Remove from workspace and group
        await Promise.all([
            Removers.removeUserFromWorkspace(userId, workspaceId),
            Removers.removeWorkspaceFromUser(userId, workspaceId),
            Removers.removeGroupFromUser(userId, groupId),
            Removers.removeUserFromGroup(userId, groupId)
        ]);

        res.status(200).json({ message: "Workspace left successfully" });
    }
    catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});


// Sets the active invite code
router.put("/setInvite", async (req, res) => {
    try {
        const inviteCode = generateCode();
        // Check that the user is the instructor
        if (!await Checkers.checkInstructor(req.body.userId, req.body.workspaceId))
            return res.status(403).json({
                message: "The provided user is not authorized to set invite codes"
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
    catch (err) {
        console.log(err);
        res.status(500).send({ message: err.message });
    }
});

// Edit a workspace
// Required: workspaceId
// Optional: name, allowedDomains, groupMemberLimit
router.put("/edit", async (req, res) => {
    try {
        const { workspaceId, name, allowedDomains, groupMemberLimit, groupLock } = req.body;
        const update = {};
        // Check that the user is the instructor
        if (!await Checkers.checkInstructor(req.body.userId, req.body.workspaceId))
            return res.status(403).json({
                message: "The provided user is not authorized to edit this workspace"
            });

        // Check that workspaceId was provided
        if (!workspaceId)
            return res.status(400).json({
                message: "One or more required fields is not present"
            });
        // Check optional fields
        if (name && typeof (name) === "string")
            update.name = name;
        if (allowedDomains && Array.isArray(allowedDomains))
            update.allowedDomains = allowedDomains;
        if (groupMemberLimit && groupMemberLimit >= 1)
            update.groupMemberLimit = groupMemberLimit;
        if (groupLock === false || groupLock === true)
            update.groupLock = groupLock;

        // Update the workspace
        const updated = await Workspace.updateOne(
            { _id: workspaceId }, update
        );
        return res.status(200).json({ message: "Workspace updated successfully" });
    }
    catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Sets the allowed domains
// Reset the domains by passing an empty array
// Required: workspaceId, allowedDomains (array)
// deprecated :(
router.put("/setAllowedDomains", async (req, res) => {
    try {
        // Check that the user is the instructor
        if (!await Checkers.checkInstructor(req.body.userId, req.body.workspaceId))
            return res.status(403).json({
                message: "The provided user is not authorized to delete this workspace"
            });

        // Return if allowedDomains is not specified
        if (!req.body.allowedDomains) {
            return res.status(400).json({ message: "One or more required fields was not present" });
        }
        else if (!Array.isArray(req.body.allowedDomains)) {
            return res.status(400).json({ message: "Field allowedDomains must be an array" });
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

        return res.status(200).json({ message: "Allowed Domains set successfully" });
    }
    catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Deletes the given workspace
router.delete("/:workspaceId/delete", async (req, res) => {
    try {
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

        return res.status(200).json({ message: "Workspace deleted successfully" });
    }
    catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Removes the active invite code
router.delete("/:workspaceId/removeInvite", async (req, res) => {
    try {
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

        return res.status(200).json({ message: "Invite code removed successfully" });
    }
    catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// gets all students in a workspace
router.get("/:workspaceId/students", async (req, res) => {
    try {
        const { workspaceId } = req.params;

        // Fetch workspace and check existence
        const workspace = await Workspace.findById(workspaceId).populate({
            path: 'userIds.userId',
            select: 'email firstName lastName'
        });
        if (!workspace) {
            return res.status(404).json({ message: "The provided workspace was not found in our database" });
        }

        // Get all student IDs in the workspace, ensuring to handle null values
        const allStudents = workspace.userIds
            .filter(user => user.userId && user.role === 'Student') // Filter out null or undefined user references and non-students
            .map(user => ({
                userId: user.userId._id,
                email: user.userId.email,
                firstName: user.userId.firstName,
                lastName: user.userId.lastName
            }));

        //get groups in workspace
        const groups = await Group.find({ workspaceId });
        const groupMap = {};
        groups.forEach(group => {
            group.userIds.forEach(userId => {
                groupMap[userId.toString()] = { groupId: group._id, groupName: group.name };
            });
        });

        // Add group information to students
        const studentsWithGroups = allStudents.map(student => {
            const groupInfo = groupMap[student.userId.toString()] || { groupId: null, groupName: null };
            return {
                ...student,
                groupId: groupInfo.groupId,
                groupName: groupInfo.groupName
            };
        });

        return res.json(studentsWithGroups);
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ message: err.message });
    }
});

//gets ungrouped students in a workspace
router.get("/:workspaceId/ungrouped", async (req, res) => {
    try {
        const { workspaceId } = req.params;

        // Fetch workspace and check existence
        const workspace = await Workspace.findById(workspaceId).populate({
            path: 'userIds.userId',
            select: 'email firstName lastName'
        });
        if (!workspace) {
            return res.status(404).json({ message: "The provided workspace was not found in our database" });
        }

        // Get all student IDs in the workspace, ensuring to handle null values
        const allStudents = workspace.userIds
            .filter(user => user.userId && user.role === 'Student') // Filter out null or undefined user references and non-students
            .map(user => ({
                userId: user.userId._id,
                email: user.userId.email,
                firstName: user.userId.firstName,
                lastName: user.userId.lastName,
                role: user.role
            }));

        // Get all groups in the workspace
        const groups = await Group.find({ workspaceId });
        const groupUserIds = groups.reduce((acc, group) => {
            return acc.concat(group.userIds.map(id => id.toString()));
        }, []);

        // Find students who are not in any group
        const studentsWithoutGroup = allStudents.filter(student => !groupUserIds.includes(student.userId.toString()));

        return res.json(studentsWithoutGroup);
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ message: err.message });
    }
});

//moves student to group
router.put("/:workspaceId/moveStudentToGroup", async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { studentId, groupId } = req.body;

        // Fetch the group and check existence
        const group = await Group.findById(groupId);
        if (!group || group.workspaceId.toString() !== workspaceId) {
            return res.status(404).json({ message: "The provided group was not found in this workspace" });
        }

        // Remove student from current group if exists
        await Group.updateMany(
            { workspaceId },
            { $pull: { userIds: studentId } }
        );

        // Add student to the new group
        if (!group.userIds.includes(studentId)) {
            group.userIds.push(studentId);
            await group.save();
        }

        return res.json({ message: "Student moved to the group successfully" });
    } catch (err) {
        console.error(err.message);
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