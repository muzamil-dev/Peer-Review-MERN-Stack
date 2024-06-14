import { Group } from "../models/groupModel.js";
import { User } from "../models/userModel.js";
import { Workspace } from "../models/workspaceModel.js";

// Remove group from user
export async function removeGroupFromUsers(userIds, groupId){
    const result = await User.updateMany(
        { _id: { $in: userIds }},
        { $pull: { groupIds: groupId}}
    );
    return result;
}

// Remove user from group
export async function removeUserFromGroup(userId, groupId){
    const result = await Group.updateOne(
        { _id: groupId },
        { $pull: { userIds: userId }}
    );
    return result;
}

// Remove group from user's group list
export async function removeGroupFromUser(userId, groupId){
    const result = await User.updateOne(
        { _id: userId },
        { $pull: { groupIds: groupId }}
    );
    return result;
}