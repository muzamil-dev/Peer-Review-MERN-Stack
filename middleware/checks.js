import { Group } from "../models/groupModel.js";
import { ReviewAssignment } from "../models/reviewAssignmentModel.js";
import { User } from "../models/userModel.js";
import { Workspace } from "../models/workspaceModel.js";

// Check if the workspace is in the body
export async function checkWorkspace(req, res, next){
    if (req.params?.workspaceId){
        if (!req.body)
            req.body = {};
        req.body.workspaceId = req.params.workspaceId;
    }
    const workspace = await Workspace.findById(
        req.body.workspaceId
    );
    if (!workspace)
        return res.status(400).json({ message: "The provided workspace was not found in our database" });
    next();
}

// Check if the user exists
export async function checkUser(req, res, next){
    const user = await User.findById(
        req.body.userId
    );
    if (!user)
        return res.status(400).json({ message: "The provided user was not found in our database" });
    next();
}

// Check if the group exists
export async function checkGroup(req, res, next){
    if (req.params?.groupId){
        if (!req.body)
            req.body = {};
        req.body.groupId = req.params.groupId;
    }
    const group = await Group.findById(
        req.body.groupId
    );
    if (!group)
        return res.status(400).json({ message: "The provided group was not found in our database" });
    // For use with other middleware
    req.body.workspaceId = group.workspaceId;
    next();
}

// Check that the assignmentId is provided (for creating a review)
export async function checkAssignment(req, res, next){
    if (req.params?.assignmentId){
        if (!req.body)
            req.body = {};
        req.body.assignmentId = req.params.assignmentId;
    }
    const assignment = await ReviewAssignment.findById(
        req.body.assignmentId
    );
    if (!assignment){
        return res.status(400).json({
            message: "The provided assignment was not found in our database" 
        });
    }
    next();
} 


// Checks if the user is in the group
export async function checkUserNotInGroup(req, res, next){
    const groupUsers = (await Group.findById(req.body.groupId)).userIds;
    const found = groupUsers.find(
        user => user.equals(req.body.userId)
    );
    if (found){
        return res.status(400).json({ message: "User is already a member of this group" });
    }
    next();
}

// Checks if the user is in the workspace. Assumes existence of workspace is checked
export async function checkUserInWorkspace(req, res, next){
    // Search for target in workspace
    const workspaceUsers = (await Workspace.findById(
        req.body.workspaceId
    ).select('userIds')).userIds;
    const found = workspaceUsers.find(
        user => user.userId.equals(req.body.userId)
    );
    if (!found){
        return res.status(400).json({ message: "The provided user was not found in this workspace" });
    }
    next();
}

// Checks if the target user is in the workspace. Assumes existence of workspace is checked
export async function checkTargetInWorkspace(req, res, next){
    // Search for target in workspace
    const workspaceUsers = (await Workspace.findById(
        req.body.workspaceId
    ).select('userIds')).userIds;
    const found = workspaceUsers.find(
        user => user.userId.equals(req.body.targetId)
    );
    if (!found){
        return res.status(400).json({ message: "The provided user was not found in this workspace" });
    }
    next();
}

// Checks if the given user is an instructor
// User/workspace should be checked before using this function
export async function checkInstructor(req, res, next){
    const body = req.body;
    const workspaceMembers = (await Workspace.findById(body.workspaceId)).userIds;
    const found = workspaceMembers.find(user => user.userId.equals(body.userId));
    if (!found){
        return res.status(400).json({ message: "The provided user is not a member of this workspace" });
    }
    else if (found.role !== "Instructor"){
        return res.status(403).json({ message: "The provided user is not authorized to make this request" });
    }
    next();
}