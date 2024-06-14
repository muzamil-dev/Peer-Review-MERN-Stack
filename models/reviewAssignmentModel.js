import mongoose, { ObjectId } from "mongoose";

const reviewAssignmentSchema = mongoose.Schema(
    {
        workspaceId: {
            type: ObjectId,
            ref: "Workspace",
            required: true
        },
        questions: {
            type: [String],
            required: true
        },
        startDate: {
            type: Date,
            required: true
        },
        dueDate: {
            type: Date,
            required: true
        },
        assignedReviews: [{
            _id: false,
            userId: {
                type: ObjectId,
                required: true,
                ref: "User"
            },
            reviews: [{
                _id: false,
                targetId: {
                    type: ObjectId,
                    required: true,
                    ref: "User"
                },
                reviewId: {
                    type: ObjectId,
                    required: false,
                    default: null,
                    ref: "Review"
                }
            }]
        }]
    }
);

export const ReviewAssignment = mongoose.model("ReviewAssignment", reviewAssignmentSchema);