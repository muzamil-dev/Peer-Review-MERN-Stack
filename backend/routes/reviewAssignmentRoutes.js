import express from "express";
import { Review } from "../models/reviewsModel.js";
import { User } from "../models/userModel.js";
import { Group } from "../models/groupModel.js";
import { Workspace } from "../models/workspaceModel.js"
import { ReviewAssignment } from "../models/reviewAssignmentModel.js";

import * as Checkers from "../shared/checkers.js";
import * as Getters from "../shared/getters.js";

const router = express.Router();

// Get information about an assignment
router.get("/:assignmentId", async(req, res) => {
    try{
        // Get assignmentId from params
        const { assignmentId } = req.params;

        // Check that the assignment exists
        const assignment = await ReviewAssignment.findById(assignmentId);
        if (!assignment)
            return res.status(404).json({ 
                message: "The provided assignment wasn't found in our database" 
            });

        // Format the assignment information
        const formattedAssignment = {
            assignmentId: assignment._id,
            workspaceId: assignment.workspaceId,
            description: assignment.description,
            questions: assignment.questions,
            startDate: assignment.startDate,
            dueDate: assignment.dueDate,
        }
        // Return formatted assignment
        return res.json(formattedAssignment)
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

// Get all reviews for a given assignment/user
router.get(["/:assignmentId/user", "/:assignmentId/user/:userId"], async(req, res) => {
    try{
        // Get assignmentId and userId from params
        const { assignmentId } = req.params;
        const userId = req.params.userId || req.body.userId;

        // Check that the assignment exists
        const assignment = await ReviewAssignment.findById(assignmentId);
        if (!assignment)
            return res.status(404).json({ 
                message: "The provided assignment wasn't found in our database" 
            });
        
        // Get the reviews
        const reviews = await Getters.getUserReviewsByAssignment(userId, assignmentId);
        res.json(reviews);
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

// Get all reviews for a given assignment/target
router.get("/:assignmentId/target/:targetId", async(req, res) => {
    try{
        // Get assignmentId and userId from params
        const { assignmentId, targetId } = req.params;

        // Check that the assignment exists
        const assignment = await ReviewAssignment.findById(assignmentId);
        if (!assignment)
            return res.status(404).json({ 
                message: "The provided assignment wasn't found in our database" 
            });
        
        // Get the reviews
        const reviews = await Getters.getTargetReviewsByAssignment(targetId, assignmentId);
        res.json(reviews);
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

// Get all reviews on assignment for a group
router.get("/:assignmentId/group/:groupId", async(req, res) => {
    try{
        const { assignmentId, groupId } = req.params;
        // Check the group
        const group = await Group.findById(groupId);
        if (!group)
            return res.status(404).json({ 
                message: "The provided group wasn't found in our database" 
            });
        
        // Check that the assignment exists
        const assignment = await ReviewAssignment.findById(assignmentId);
        if (!assignment)
            return res.status(404).json({ 
                message: "The provided assignment wasn't found in our database" 
            });

        // Get the reviews
        const groupReviews = await Getters.getGroupReviewsByAssignment(groupId, assignmentId);
        res.json(groupReviews);
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
        const workspace = Workspace.findById(workspaceId);
        if (!workspace)
            return res.status(400).json({ message: "The provided workspace was not found in our database" });

        // Check that the user requesting is an instructor in the workspace
        const verifyInstructor = await Checkers.checkInstructor(userId, workspaceId);
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

        // Get all groups
        const groups = await Group.find({ workspaceId });
        // Holds reviews to create
        const reviews = [];
        // Create the reviews array
        for (let group of groups){
            for (let j = 0; j < group.userIds.length; j++){
                for (let k = 0; k < group.userIds.length; k++){
                    if (j !== k){
                        reviews.push({
                            assignmentId: assignment._id,
                            userId: group.userIds[j],
                            targetId: group.userIds[k],
                            groupId: group._id
                        });
                    }
                }
            }
        }
        await Review.insertMany(reviews);

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

// Edit assignment information
// Required: assignmentId
// Optional: startDate, dueDate, description, questions
router.put("/edit", async(req, res) => {
    // Get assignmentId
    const assignmentId = req.body.assignmentId;
    // Check that the assignment exists
    const assignment = await ReviewAssignment.findById(assignmentId);
    if (!assignment)
        return res.status(404).json({ 
            message: "The provided assignment wasn't found in our database" 
        });
    // Check that the user making the request is an instructor
    const verifyInstructor = await Checkers.checkInstructor(req.body.userId, assignment.workspaceId);
    if (!verifyInstructor)
        return res.status(403).json({ message: "The provided user is not authorized to make this request" });
    // Check for edits on: startDate, dueDate, description, questions
    const edits = {};
    if (req.body.startDate) edits.startDate = new Date(req.body.startDate);
    if (req.body.dueDate) edits.dueDate = new Date(req.body.dueDate);
    if (req.body.description) edits.description = req.body.description;
    // Modify to reset completed reviews if questions are edited
    if (req.body.questions) edits.questions = req.body.questions;
    // Save the edits
    await ReviewAssignment.updateOne(
        { _id: assignment._id }, edits
    );
    return res.json({ 
        message: "Assignment edited successfully",
        assignmentId: assignment._id
    });
})

// Delete an assignment
router.delete("/:assignmentId", async(req, res) => {
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