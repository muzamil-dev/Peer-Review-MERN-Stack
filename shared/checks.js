import { Group } from "../models/groupModel.js";
import { User } from "../models/userModel.js";
import { Workspace } from "../models/workspaceModel.js";

// Check if the workspace exists
export async function checkWorkspace(workspaceId){
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace){
        return null;
    }
    return workspace._id;
}

// Check if the user exists
export async function checkUser(userId){
    const user = await User.findById(userId);
    if (!user){
        return null;
    }
    return user._id;
}

// Check if the group exists
export async function checkGroup(groupId){
    const group = await Group.findById(groupId);
    if (!group){
        return null;
    }
    return group._id;
}