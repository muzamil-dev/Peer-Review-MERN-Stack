import mongoose, { ObjectId } from "mongoose";
import { memberSchema } from "./memberSchema.js";

const groupSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        workspace: {
            type: ObjectId,
            required: true
        },
        members: {
            type: [memberSchema],
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Group = mongoose.model("group", groupSchema);