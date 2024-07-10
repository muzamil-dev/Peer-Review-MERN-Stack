import { Group } from "../models/groupModel.js";
import { ReviewAssignment } from "../models/reviewAssignmentModel.js";
import { Review } from "../models/reviewsModel.js";
import { User } from "../models/userModel.js";
import { Workspace } from "../models/workspaceModel.js";

// Checks if the user is in the workspace. Assumes existence of workspace is checked
export async function checkUserInWorkspace(userId, workspaceId){
    // Search for target in workspace
    const workspaces = (await User.findById(userId).select('workspaceIds')).workspaceIds;
    const found = workspaces.find(
        ws => ws.workspaceId.equals(workspaceId)
    );
    if (found)
        return true;
    return false;
}

// Checks if the user is in the group (assumes workspace is provided)
export async function checkUserInWorkspaceGroup(userId, workspaceId){
    // Get all groupIds that user is in
    const userGroups = await User.findById(userId).select('groupIds');
    // Get all groups
    const groups = await Group.find(
        { _id: { $in: userGroups.groupIds }}
    ).select('workspaceId');
    // Move workspaceIds to an array
    const workspaceIds = groups.map(
        group => group.workspaceId
    );
    // Find the user in all of the users in groups
    const found = workspaceIds.find(
        id => id.equals(workspaceId)
    );
    if (found)
        return true;
    return false;
}

// Checks if the given user is an instructor of the workspace
export async function checkInstructor(userId, workspaceId){
    // Convert workspaceId to objectId
    const workspaces = (await User.findById(userId)).workspaceIds;
    const found = workspaces.find(
        ws => (ws.workspaceId.equals(workspaceId) && ws.role === "Instructor")
    );
    if (!found)
        return false
    return true;
}