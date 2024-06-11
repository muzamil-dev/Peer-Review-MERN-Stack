import mongoose, { ObjectId } from "mongoose";

const groupMembershipSchema = mongoose.Schema(
    {
        userId: {
            type: ObjectId,
            required: true
        },
        groupId: {
            type: ObjectId,
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const GroupMembership = mongoose.model("groupMembership", groupMembershipSchema);