import mongoose, { Mixed, ObjectId } from "mongoose";

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
        userIds: {
            type: [{
                userId: {
                    type: ObjectId,
                    required: true
                },
                role: {
                    type: String,
                    required: true
                }
            }],
            default: [],
            required: true
        },
        groupIds: {
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