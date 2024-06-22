import mongoose from "mongoose";

const tempUserSchema = mongoose.Schema(
    {
        firstName: {type: String, required: true},
        middleName: {type: String, required: false},
        lastName: {type: String, required: true},
        email: {type: String, required: true},
        password: {type: String, required: true},
        verificationToken: {type: String, required: true},
        verificationTokenExpires: {type: Date, required: true},
    },
    {
        timestamps: true
    }
);

export const TempUser = mongoose.model("tempUser", tempUserSchema);
