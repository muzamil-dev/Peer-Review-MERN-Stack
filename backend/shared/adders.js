import { Group } from "../models/groupModel.js";
import { User } from "../models/userModel.js";
import { Workspace } from "../models/workspaceModel.js";

// Update workspace with user
export async function addUserToWorkspace(userId, workspaceId, role){
    const result = await Workspace.updateOne(
        { _id: workspaceId },
        { $push: { userIds: { userId, role } }}
    );
    return result;
}

// Update user with workspace
export async function addWorkspaceToUser(userId, workspaceId, role){
    const result = await User.updateOne(
        { _id: userId },
        { $push: { workspaceIds: { workspaceId, role } }}
    );
    return result;
}

// Update group with user
export async function addUserToGroup(userId, groupId){
    const result = await Group.updateOne(
        { _id: groupId },
        { $push: { userIds: userId }}
    );
    return result;
}

// Update user with group
export async function addGroupToUser(userId, groupId){
    const result = await User.updateOne(
        { _id: userId },
        { $push: { groupIds: groupId }}
    );
    return result;
}

// These functions aren't useful and will likely be removed

// // Update workspace with group
// export async function addGroupToWorkspace(groupId, workspaceId){
//     const result = await Workspace.updateOne(
//         { _id: workspaceId },
//         { $push: { groupIds: groupId }}
//     );
//     return result;
// }

// // Update workspace with groups
// export async function addGroupsToWorkspace(groupIds, workspaceId){
//     const result = await Workspace.updateOne(
//         { _id: workspaceId },
//         { $push: { groupIds: { $each: groupIds }}}
//     );
//     return result;
// }