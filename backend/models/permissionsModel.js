import mongoose, { ObjectId } from "mongoose";

const permissionsSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        apiEndpoint: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Permissions = mongoose.model("permissions", permissionsSchema);