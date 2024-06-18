import mongoose, { ObjectId } from "mongoose";

const groupSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        workspaceId: {
            type: ObjectId,
            required: true,
            ref: "Workspace"
        },
        userIds: {
            type: [ObjectId],
            default: [],
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Group = mongoose.model("group", groupSchema);