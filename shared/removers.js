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