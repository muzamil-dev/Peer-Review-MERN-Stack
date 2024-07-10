import mongoose, { ObjectId } from "mongoose";

const reviewsSchema = mongoose.Schema(
    {
        assignmentId: {
            type: ObjectId,
            ref: "reviewassignment",
            required: true
        },
        userId: {
            type: ObjectId,
            ref: "user",
            required: true
        },
        targetId: {
            type: ObjectId,
            ref: "user",
            required: true
        },
        groupId: {
            type: ObjectId,
            required: true,
            ref: "group"
        },
        ratings: [{
            type: Number,
            required: false
        }],
        text: {
            type: String,
            required: false
        },
        completed: {
            type: Boolean,
            required: true,
            default: false
        }
    },
    {
        timestamps: true
    }
);

export const Review = mongoose.model("review", reviewsSchema);
