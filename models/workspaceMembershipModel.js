import mongoose, { ObjectId } from "mongoose";

const workspaceMembershipSchema = mongoose.Schema(
    {
        userId: {
            type: ObjectId,
            required: true
        },
        workspaceId: {
            type: ObjectId,
            required: true
        },
        role: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const WorkspaceMembership = mongoose.model('workspaceMembership', workspaceMembershipSchema);