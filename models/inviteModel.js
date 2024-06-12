import mongoose, { ObjectId } from "mongoose";

const inviteSchema = mongoose.Schema(
    {
        code: {
            type: String,
            required: true
        },
        expires: {
            type: Date,
            default: null,
            required: true
        }
    }
);

export const Invite = mongoose.model('invite', inviteSchema);