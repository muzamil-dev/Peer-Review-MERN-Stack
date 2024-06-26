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
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        groupIds: {
            type: [ObjectId],
            default: [],
            ref: "group",
            required: true
        },
        workspaceIds: {
            type: [{
                workspaceId: {
                    type: ObjectId,
                    ref: "workspace",
                    required: true
                },
                role: {
                    type: String,
                    required: true
                }
            }],
            _id: false,
            default: [],
            required: true
        },
        resetPasswordToken: {
            type: String,
            default: null
        },
        resetPasswordExpires: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

export const User = mongoose.model("user", userSchema);
