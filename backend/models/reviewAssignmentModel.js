import mongoose, { ObjectId } from "mongoose";

const reviewAssignmentSchema = mongoose.Schema(
    {
        workspaceId: {
            type: ObjectId,
            ref: "Workspace",
            required: true
        },
        description: {
            type: String,
            required: false
        },
        startDate: {
            type: Date,
            required: true
        },
        dueDate: {
            type: Date,
            required: true
        },
        questions: {
            type: [String],
            required: true
        },
        /*
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
        */
    },
    {
        timestamps: true
    }
);

export const ReviewAssignment = mongoose.model("ReviewAssignment", reviewAssignmentSchema);