import mongoose, { Mixed, ObjectId } from "mongoose";

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
        groupIds: {
            type: [ObjectId],
            default: [],
            required: true
        },
        workspaceIds: {
            type: [{
                workspaceId: {
                    type: ObjectId,
                    required: true
                },
                role: {
                    type: String,
                    required: true
                }
            }],
            default: [],
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const User = mongoose.model("user", userSchema);