import express from "express";
import { Review } from "../models/reviewsModel.js";
import { User } from "../models/userModel.js";
import { Group } from "../models/groupModel.js";
import { Workspace } from "../models/workspaceModel.js"

import { checkWorkspace, checkInstructor } from "../middleware/checks.js";

const router = express.Router();

// In progress
router.post("/create", checkWorkspace, checkInstructor, async(req, res) => {
    try{
        const workspaceId = req.body.workspaceId
        // Check for required fields
        // if (!body.startDate || !body.endDate || !body.questions){
        //     return res.status(400).json({ message: "One or more required fields is not present" });
        // }
        // Create assigned reviews array (to populate)
        const assignedReviews = [];
        // Get all groups in the workspace
        const groups = await Group.find(
            { workspaceId }
        ).select('userIds');
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
        return res.json(assignedReviews);
    }
    catch(err){
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

export default router;