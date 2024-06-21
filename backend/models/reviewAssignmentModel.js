import mongoose, { ObjectId } from "mongoose";

const reviewAssignmentSchema = mongoose.Schema(
    {
        workspaceId: {
            type: ObjectId,
            ref: "workspace",
            required: true
        },
        description: {
            type: String,
            required: false
        },
        startDate: {
            type: Date,
            required: true,
            default: Date.now()
        },
        dueDate: {
            type: Date,
            required: true
        },
        questions: {
            type: [String],
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const ReviewAssignment = mongoose.model("reviewassignment", reviewAssignmentSchema);