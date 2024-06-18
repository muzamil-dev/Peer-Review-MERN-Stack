import mongoose, { ObjectId } from "mongoose";

const rolesSchema = mongoose.Schema(
    {
        workspaceId: {
            type: ObjectId,
            required: true,
            ref: "Workspace"
        },
        name: {
            type: String,
            required: true
        },
        permissionIds: [{
            type: ObjectId,
            ref: "Permissions",
            required: true
        }],
        memberIds: [{
            type: ObjectId,
            ref: "User",
            required: true
        }]
    },
    {
        timestamps: true
    }
);

export const Role = mongoose.model("Role", rolesSchema);
