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
            reviewId: review._id,
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

export async function getTargetReviewsByAssignment(targetId, assignmentId){
    // Get completed reviews
    const reviews = await Review.find(
        { assignmentId, targetId, completed: true }
    ).select('userId ratings completed').sort({ userId: 1 });
    // Get the name for the target
    const targetName = await User.findById(targetId).select('firstName middleName lastName');
    // Get all user ids from completed
    const userIds = reviews.map(review => review.userId);
    // Get names for all users
    const names = await User.find(
        { _id: { $in: userIds }}
    ).select('firstName middleName lastName').sort({ _id: 1 });
    // Return formatted json
    return {
        targetId,
        firstName: targetName.firstName,
        middleName: targetName.middleName,
        lastName: targetName.lastName,
        reviews: reviews.map(
            (review, index) => ({
                reviewId: review._id,
                userId: review.userId,
                firstName: names[index].firstName,
                middleName: names[index].middleName,
                lastName: names[index].lastName,
                ratings: review.ratings
            })
        )
    };
}

// Takes in an assignment and groupId, gets all reviews for that group
export async function getGroupReviewsByAssignment(groupId, assignmentId){
    // Get reviews
    const reviews = await Review.find(
        { assignmentId, groupId }
    ).select('userId targetId ratings completed')
    .sort({ userId: 1, targetId: 1 });

    // Find all users from group at the time of the assignment
    const userIdArray = [];
    let i = 0, curUser = reviews[0].userId;
    userIdArray.push(curUser);
    while (reviews[i].userId.equals(curUser)){
        userIdArray.push(reviews[i].targetId);
        i++;
    }
    // Get names of users
    const names = await User.find(
        { _id: { $in: userIdArray }}
    ).select('firstName middleName lastName')
    .sort({ _id: 1 });

    const reviewArray = [];
    // Split reviews by userId
    let reviewIndex = 0;
    for (i = 0; i < userIdArray.length; i++){
        const userReviewsObj = { 
            userId: userIdArray[i], 
            firstName: names[i].firstName,
            middleName: names[i].middleName,
            lastName: names[i].lastName
        };
        // Get the reviews by userIdArray[i]
        const userReviews = reviews.slice(reviewIndex, reviewIndex + userIdArray.length - 1);
        // Filter out the current id (userIdArray[i]) from the names array
        const otherUsers = names.filter((_, idx) => idx !== i);
        // Format the reviews to include name
        const formattedReviews = userReviews.map(
            (review, index) => ({
                reviewId: review._id,
                targetId: review.targetId,
                firstName: otherUsers[index].firstName,
                middleName: otherUsers[index].middleName,
                lastName: otherUsers[index].lastName,
                ratings: review.ratings,
                completed: review.completed
            })
        );
        // Split between completed and incomplete
        const completedReviews = formattedReviews.filter(r => r.completed);
        const incompleteReviews = formattedReviews.filter(r => !r.completed);
        // Add to the object
        userReviewsObj.completedReviews = completedReviews;
        userReviewsObj.incompleteReviews = incompleteReviews;
        // Push
        reviewIndex += (userIdArray.length - 1);
        reviewArray.push(userReviewsObj);
    }

    return reviewArray;
}