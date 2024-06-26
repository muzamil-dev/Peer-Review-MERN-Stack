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
                    ref: "user",
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
        groupMemberLimit: {
            type: Number,
            default: null,
            required: false
        },
        groupLock: {
            type: Boolean,
            default: false,
            required: true
        },
        allowedDomains: {
            type: [String],
            default: [],
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