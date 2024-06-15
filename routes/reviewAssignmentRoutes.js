import express from "express";
import { Review } from "../models/reviewsModel.js";
import { User } from "../models/userModel.js";
import { Group } from "../models/groupModel.js";
import { Workspace } from "../models/workspaceModel.js"
import { ReviewAssignment } from "../models/reviewAssignmentModel.js";

import * as Checkers from "../shared/checkers.js";

const router = express.Router();

// Get the reviews that a user has done on a specific assignment
// TODO: Modify to use either a targetId (instructor checks user's review) or no id (user checks their own reviews)
router.get(["/:assignmentId/reviews", "/:assignmentId/reviews/:userId"], async(req, res) => {
    try{
        const { assignmentId } = req.params;
        const userId = req.params.userId || req.body.userId

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
// Required: workspaceId, dueDate, questions
// Optional: startDate, description
router.post("/create", async(req, res) => {
    try{
        const body = req.body;
        const userId = body.userId
        const workspaceId = body.workspaceId
        // Check for required fields
        if (!body.dueDate || !body.questions || body.questions.length < 1){
            return res.status(400).json({ message: "One or more required fields is not present" });
        }

        // Check that the workspace exists
        const workspaceExists = Checkers.checkWorkspaceExists(workspaceId);
        if (!workspaceExists)
            return res.status(400).json({ message: "The provided workspace was not found in our database" });

        // Check that the user requesting is an instructor in the workspace
        const verifyInstructor = Checkers.checkInstructor(userId, workspaceId);
        if (!verifyInstructor)
            return res.status(403).json({ message: "The provided user is not authorized to make this request" });

        // Add required fields to a new object
        const dueDate = new Date(body.dueDate);
        const questions = body.questions;

        const assignmentObj = { workspaceId, dueDate, questions};

        // Look for optional fields
        if (body.startDate) assignmentObj.startDate = new Date(body.startDate);
        if (body.description) assignmentObj.description = body.description;

        // Create the assignment
        const assignment = await ReviewAssignment.create(
            assignmentObj
        );
        // Return a success response
        return res.status(201).json({
            message: "Assignment created successfully",
            assignmentId: assignment._id
        });
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

// Delete an assignment
router.delete("/delete/:assignmentId", async(req, res) => {
    try{
        // Get assignmentId
        const { assignmentId } = req.params;
        // Check that the user making the request is an instructor
        const assignment = await ReviewAssignment.findById(assignmentId).select('workspaceId');
        const verifyInstructor = await Checkers.checkInstructor(req.body.userId, assignment.workspaceId);
        if (!verifyInstructor)
            return res.status(403).json({ message: "The provided user is not authorized to make this request" });
        // Delete the assignment
        await Promise.all([
            ReviewAssignment.findByIdAndDelete(assignmentId), // Delete the assignment itself
            Review.deleteMany({ assignmentId }) // Delete all reviews associated with the assignment
        ]);
        return res.json({ message: "Assignment deleted successfully" });
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

export default router;