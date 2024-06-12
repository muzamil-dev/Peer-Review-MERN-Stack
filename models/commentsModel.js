import { text } from "express";
import mongoose, { ObjectId } from "mongoose";

const commentsSchema = mongoose.Schema(
    {
        owner_id: {
            type: ObjectId,
            ref: "User",
            required: true
        },
        target_id: {
            type: ObjectId,
            ref: "User",
            required: true
        },
        ratings: [{
            category: {
                type: String,
                required: true
            },
            ratings: {
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
        workspaceId: {
            type: ObjectId,
            required: true,
            ref: "Workspace"
        }
    }
);

export const Comment = mongoose.model("comment", commentsSchema);