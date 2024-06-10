import mongoose, { ObjectId } from "mongoose";
import { memberSchema } from "./memberSchema.js";

const workspaceSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        creator: {
            type: ObjectId,
            required: true
        },
        roles: {
            type: [String],
            default: ["Instructor", "Student"],
            required: true
        },
        members: {
            type: [memberSchema],
            default: [],
            required: true
        },
        groups: {
            type: [ObjectId],
            default: [],
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Workspace = mongoose.model("workspace", workspaceSchema);