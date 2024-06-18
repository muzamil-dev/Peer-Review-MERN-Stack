import { Group } from "../models/groupModel.js";
import { User } from "../models/userModel.js";
import { Workspace } from "../models/workspaceModel.js";
import { Review } from "../models/reviewsModel.js";

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

// Takes in assignmentId and userId, assumes both exist
export async function getUserReviewsByAssignment(userId, assignmentId){
    // Get reviews
    const reviews = await Review.find(
        { assignmentId, userId }
    ).select('targetId ratings completed').sort({ targetId: 1 });
    // Get the name of the user
    const user = await User.findById(userId).select('firstName middleName lastName');
    // Get ids for all members
    const targets = reviews.map(review => review.targetId);
    // Get names for all targets
    const targetNames = await User.find(
        { _id: { $in: targets }}
    ).select('firstName middleName lastName').sort({ _id: 1 });
    // Match the targetNames to the reviews (formatted)
    const formatted = reviews.map(
        (review, index) => ({
            targetId: review.targetId,
            firstName: targetNames[index].firstName,
            middleName: targetNames[index].middleName,
            lastName: targetNames[index].lastName,
            ratings: review.ratings,
            completed: review.completed
        })
    );
    // Filter the reviews
    const completedReviews = formatted.filter(review => review.completed);
    const incompleteReviews = formatted.filter(review => !review.completed);
    // Return the formatted object
    return {
        userId,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        completedReviews,
        incompleteReviews
    };
}