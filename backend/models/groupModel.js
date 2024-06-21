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
            ref: "workspace"
        },
        userIds: {
            type: [ObjectId],
            default: [],
            ref: "user",
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Group = mongoose.model("group", groupSchema);