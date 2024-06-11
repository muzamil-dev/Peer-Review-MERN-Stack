import mongoose, { ObjectId } from "mongoose";

const groupSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        workspaceId: {
            type: ObjectId,
            required: true
        },
        userIds: {
            type: [ObjectId],
            default: [],
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Group = mongoose.model("group", groupSchema);