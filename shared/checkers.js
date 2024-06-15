import { Group } from "../models/groupModel.js";
import { ReviewAssignment } from "../models/reviewAssignmentModel.js";
import { Review } from "../models/reviewsModel.js";
import { User } from "../models/userModel.js";
import { Workspace } from "../models/workspaceModel.js";

// Checks if the given user is an instructor of the workspace
export async function checkInstructor(userId, workspaceId){
    const workspaces = (await User.findById(userId)).workspaceIds;
    const found = workspaces.find(ws => (ws.workspaceId.equals(workspaceId) && ws.role === "Instructor"));
    if (!found)
        return false
    return true;
}