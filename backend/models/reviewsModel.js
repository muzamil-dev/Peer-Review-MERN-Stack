import mongoose, { ObjectId } from "mongoose";

const reviewsSchema = mongoose.Schema(
    {
        assignmentId: {
            type: ObjectId,
            ref: "ReviewAssignment",
            required: false // Set this to true later
        },
        userId: {
            type: ObjectId,
            ref: "User",
            required: true
        },
        targetId: {
            type: ObjectId,
            ref: "User",
            required: true
        },
        groupId: {
            type: ObjectId,
            required: true,
            ref: "Group"
        },
        ratings: [{
            category: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                required: true
            }
        }],
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }
);

export const Review = mongoose.model("Review", reviewsSchema);
