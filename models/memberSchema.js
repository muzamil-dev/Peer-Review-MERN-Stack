import mongoose, { ObjectId } from "mongoose";

export const memberSchema = mongoose.Schema(
    {
        userId: {
            type: ObjectId,
            required: true
        },
        role: {
            type: String,
            required: true
        }
    },
    {
        _id: false,
        collection: null,
        timestamps: false
    }
);

