import mongoose, { ObjectId } from "mongoose";

const workspaceSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        creatorId: {
            type: ObjectId,
            required: true
        },
        roles: {
            type: [String],
            default: ["Instructor", "Student"],
            required: true
        },
    },
    {
        timestamps: true
    }
);

export const Workspace = mongoose.model("workspace", workspaceSchema);