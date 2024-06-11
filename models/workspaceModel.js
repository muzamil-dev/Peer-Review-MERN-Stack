import mongoose, { Mixed, ObjectId } from "mongoose";

const workspaceSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        roles: {
            type: [{
                type: ObjectId,
                ref: "Role",
                required: true
            }],
            default: ["Instructor", "Student"],
            required: true
        },
        adminIds: {
            type: [{
                type: ObjectId,
                ref: "User",
                required: true
            }],
            default: [],
            required: true
        },
        memberIds: {
            type: [{
                type: ObjectId,
                ref: "User",
                required: true
            }],
            default: [],
            required: true
        },
        groupIds: {
            type: [{
                type: ObjectId,
                ref: "Group",
                required: true
            }],
            default: [],
            required: true
        },
        inviteCode: {
            type: String,
            required: true
        },
        inviteCodeExpiry: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Workspace = mongoose.model("workspace", workspaceSchema);