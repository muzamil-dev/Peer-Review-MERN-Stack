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

// Takes in a group, outputs formatted data
// Assumes that the group exists
export async function getGroupData(groupId){
    const group = await Group.findById(groupId);
    // Get the group's users
    const users = await User.find(
        { _id: { $in: group.userIds }}
    ).select('firstName middleName lastName');
    // Format the user data
    const members = users.map(user => ({
        userId: user._id,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName
    }));
    // Return formatted json
    return({
        name: group.name,
        workspaceId: group.workspaceId,
        groupId: group._id,
        members
    });
}