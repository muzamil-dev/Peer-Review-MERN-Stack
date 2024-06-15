import { Group } from "../models/groupModel.js";
import { ReviewAssignment } from "../models/reviewAssignmentModel.js";
import { Review } from "../models/reviewsModel.js";
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


// Checks if the user is in the group (assumes workspace is provided)
export async function checkUserNotInGroup(req, res, next){
    // Get all groupIds that user is in
    const userGroups = await User.findById(
        req.body.userId
    ).select('groupIds');
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
        id => id.equals(req.body.workspaceId)
    );
    if (found){
        return res.status(400).json({ message: "User is already a member of a group in this workspace" });
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
// Same as checkUserInWorkspace, but uses a targetId instead of a userId
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

// Checks if a review exists or not for a specified assignment/user/target
// If exists is true, it will require that the review exists
// If exists is false, it will require that the review does not exist
export function checkReview(exists){
    return async(req, res, next) => {
        let review;
        // Find the review by id if review is required to exist
        if (exists){
            review = await Review.findById(req.body.reviewId)
        }
        // Find by assignment, user, and target to see if a review was already made
        else{
            review = await Review.findOne({
                assignmentId: req.body.assignmentId,
                userId: req.body.userId,
                targetId: req.body.targetId
            });
        }
        if (review && !exists){
            return res.status(400).json({ message: "A review has already been submitted for this person" });
        }
        else if (!review && exists){
            return res.status(404).json({ message: "No review was found that matched these query results" });
        }
        next();
    }
}