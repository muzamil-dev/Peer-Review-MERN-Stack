import mongoose, { ObjectId } from "mongoose";

const userSchema = mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true
        },
        middleName: {
            type: String,
            required: false
        },
        lastName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        classes: {
            type: [ObjectId],
            default: [],
            required: true
        },
        groups: {
            type: [ObjectId],
            default: [],
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const User = mongoose.model("user", userSchema);