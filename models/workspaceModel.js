import mongoose, { ObjectId } from "mongoose";

const workspaceSchema = mongoose.Schema(
    {
        name: {
            type: String,
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
                    ref: "User",
                    required: true
                },
                role: {
                    type: String,
                    required: true
                }
            }],
            _id: false,
            default: [],
            required: true,
        },
        // groupIds will potentially be removed
        groupIds: {
            type: [{
                type: ObjectId,
                ref: "Group",
                required: true
            }],
            default: [],
            required: true
        },
        allowedDomains: {
            type: [String],
            default: null,
            required: false
        },
        inviteCode: {
            type: String,
            default: null,
            required: false
        }
    },
    {
        timestamps: true
    }
);

export const Workspace = mongoose.model("workspace", workspaceSchema);