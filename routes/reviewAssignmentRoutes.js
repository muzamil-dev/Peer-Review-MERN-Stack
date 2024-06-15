import express from "express";
import { Review } from "../models/reviewsModel.js";
import { User } from "../models/userModel.js";
import { Group } from "../models/groupModel.js";
import { Workspace } from "../models/workspaceModel.js"
import { ReviewAssignment } from "../models/reviewAssignmentModel.js";

import { checkWorkspace, checkInstructor } from "../middleware/checks.js";

const router = express.Router();

// Get the reviews that a user has done on a specific assignment
// TODO: Modify to use either a targetId (instructor checks user's review) or no id (user checks their own reviews)
router.get("/:assignmentId/reviews/:userId", async(req, res) => {
    try{
        const { assignmentId, userId } = req.params;
        // Get info about assignment
        const assignment = await ReviewAssignment.findById(
            assignmentId
        ).select('workspaceId questions');
        // Get groups from workspace that contain userId
        const group = await Group.findOne({
            workspaceId: assignment.workspaceId,
            userIds: userId
        });

        // Keep track of complete vs incomplete reviews
        const completed = [];
        const notCompleted = [];
        
        // Remove the id of the user being searched
        group.userIds = group.userIds.filter(
            id => !id.equals(userId)
        );
        group.userIds = group.userIds.map(id => id.toString());
        // Gets all reviews by user for group members
        const groupReviews = await Review.find({
            assignmentId,
            userId,
            targetId: { $in: group.userIds }
        }).select('userId targetId');

        // Get targetIds for completed reviews and incomplete reviews
        const completedIds = groupReviews.map(
            review => review.targetId
        );
        const reviewIds = groupReviews.map(
            review => review._id
        );

        // Filter out completedIds from all userIds
        const notCompletedIds = group.userIds.filter(
            id1 => !completedIds.some(id2 => id1.equals(id2))
        );

        // Get names of group members
        let [completeUsers, incompleteUsers] = await Promise.all([
            User.find({ _id: { $in: completedIds }}).select('firstName middleName lastName'),
            User.find({ _id: { $in: notCompletedIds }}).select('firstName middleName lastName')
        ]);

        // Change name of fields
        completeUsers = completeUsers.map(
            (user, index) => ({ targetId: user._id, reviewId: reviewIds[index], targetFirstName: user.firstName, 
            targetMiddleName: user.middleName, targetLastName: user.lastName })
        );
        incompleteUsers = incompleteUsers.map(
            user => ({ targetId: user._id, targetFirstName: user.firstName, 
            targetMiddleName: user.middleName, targetLastName: user.lastName })
        );

        // Add the reviews to the arrays
        completed.push(...completeUsers);
        notCompleted.push(...incompleteUsers);
        
        res.json({ assignmentId, userId, completed, notCompleted });
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

// Create a new review assignment
router.post("/create", checkWorkspace, checkInstructor, async(req, res) => {
    try{
        const body = req.body;
        const workspaceId = body.workspaceId
        // Check for required fields
        if (!body.dueDate || !body.questions || body.questions.length < 1){
            return res.status(400).json({ message: "One or more required fields is not present" });
        }
        // Create assigned reviews array (to populate)
        const assignedReviews = [];
        // Get all groups in the workspace
        const groups = await Group.find(
            { workspaceId }
        ).select('userIds');

        // Add required fields to object
        const dueDate = new Date(body.dueDate);
        const questions = body.questions;

        const assignmentObj = { workspaceId, dueDate, questions};

        // Look for optional fields
        if (body.startDate) assignmentObj.startDate = new Date(body.startDate);
        if (body.description) assignmentObj.description = body.description;

        // Get the returned object
        const assignment = (await ReviewAssignment.create(
            assignmentObj
        )).toObject();

        return res.json(assignment);
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

export default router;