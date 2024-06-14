import express from "express";
import { Review } from "../models/reviewsModel.js";
import { User } from "../models/userModel.js";
import { Group } from "../models/groupModel.js";
import { Workspace } from "../models/workspaceModel.js"
import { ReviewAssignment } from "../models/reviewAssignmentModel.js";

import { checkWorkspace, checkInstructor } from "../middleware/checks.js";

const router = express.Router();

// Excluding assignedReviews for now, will likely be unnecessary
router.post("/create", checkWorkspace, checkInstructor, async(req, res) => {
    try{
        const body = req.body;
        const workspaceId = body.workspaceId
        // Check for required fields
        if (!body.startDate || !body.dueDate || !body.questions || body.questions.length < 1){
            return res.status(400).json({ message: "One or more required fields is not present" });
        }
        // Create assigned reviews array (to populate)
        const assignedReviews = [];
        // Get all groups in the workspace
        const groups = await Group.find(
            { workspaceId }
        ).select('userIds');

        /*
        // Populate assignedReviews
        for (let group of groups){
            const userIds = group.userIds;
            const groupId = group._id;
            for (let j = 0; j < userIds.length; j++){
                const userReviews = { userId: userIds[j], reviews: [] };
                for (let k = 0; k < userIds.length; k++){
                    if (j !== k){
                        userReviews.reviews.push({
                            targetId: userIds[k],
                            reviewId: null
                        });
                    }
                }
                assignedReviews.push(userReviews);
            }
        }
        */

        // Get other fields
        const startDate = new Date(body.startDate);
        const dueDate = new Date(body.dueDate);
        const questions = body.questions;
        const description = body.description;

        // Get the returned object
        const assignment = (await ReviewAssignment.create(
            { workspaceId, description, startDate, dueDate, questions} //, assignedReviews }
        )).toObject();

        // assignedReviews takes up a lot of space, so its not included
        // delete assignment.assignedReviews;

        return res.json(assignment);
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

export default router;