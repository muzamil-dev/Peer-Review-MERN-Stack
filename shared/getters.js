import { Group } from "../models/groupModel.js";
import { User } from "../models/userModel.js";
import { Workspace } from "../models/workspaceModel.js";

export async function getGroupInWorkspace(userId, workspaceId){
    const user = await User.findById(
        userId
    ).select('groupIds');
    return Group.findOne(
        { workspaceId, _id: { $in: user.groupIds }}
    );
}