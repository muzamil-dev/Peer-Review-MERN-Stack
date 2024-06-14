import mongoose, { ObjectId } from "mongoose";

const reviewsSchema = mongoose.Schema(
    {
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
        },
        groupId: {
            type: ObjectId,
            required: true,
            ref: "Group"
        }
    }
);

export const Review = mongoose.model("Review", reviewsSchema);