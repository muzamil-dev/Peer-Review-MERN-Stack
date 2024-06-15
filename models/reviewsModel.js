import mongoose, { ObjectId } from "mongoose";

const reviewsSchema = mongoose.Schema(
    {
        assignmentId: {
            type: ObjectId,
            ref: "ReviewAssignment",
            required: true
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
            type: Number,
            required: true
        }],
        text: {
            type: String,
            required: false
        },
    },
    {
        timestamps: true
    }
);

export const Review = mongoose.model("Review", reviewsSchema);
