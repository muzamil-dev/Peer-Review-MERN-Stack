import { Group } from "../models/groupModel.js";
import { User } from "../models/userModel.js";
import { Workspace } from "../models/workspaceModel.js";

// Remove user from workspace
export async function removeUserFromWorkspace(userId, workspaceId){
    const result = Workspace.updateOne(
        { _id: workspaceId },
        { $pull: { userIds: { userId: userId }}}
    );
    return result;
}

// Remove workspace from user's workspace list
export async function removeWorkspaceFromUser(userId, workspaceId){
    const result = User.updateOne(
        { _id: userId },
        { $pull: { workspaceIds: { workspaceId: workspaceId }}}
    );
    return result;
}

// Removes all users in userIds from the workspace
export async function removeWorkspaceFromUsers(userIds, workspaceId){
    const result = User.updateMany(
        { _id: { $in: userIds }},
        { $pull: { workspaceIds: { workspaceId: workspaceId }}}
    );
    return result;
}

// Remove user from group
export async function removeUserFromGroup(userId, groupId){
    const result = Group.updateOne(
        { _id: groupId },
        { $pull: { userIds: userId }}
    );
    return result;
}

// Remove group from user's group list
export async function removeGroupFromUser(userId, groupId){
    const result = User.updateOne(
        { _id: userId },
        { $pull: { groupIds: groupId }}
    );
    return result;
}

// Remove group from user
export async function removeGroupFromUsers(userIds, groupId){
    const result = User.updateMany(
        { _id: { $in: userIds }},
        { $pull: { groupIds: groupId}}
    );
    return result;
}

// Remove group from user's group list
export async function removeGroupFromWorkspace(workspaceId, groupId){
    const result = Workspace.updateOne(
        { _id: workspaceId },
        { $pull: { groupIds: groupId }}
    );
    return result;
}