import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import { User } from '../models/userModel.js';
import { sendEmail } from '../emailService.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { TempUser } from '../models/tempUserModel.js';

dotenv.config();

const router = express.Router();

// Get a user of a specific id
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        // Find user
        const userData = await User.findById(id);
        // Could not find user
        if (!userData) {
            return res.status(404).json({ message: "The requested user was not found in our database." });
        }
        // Return data
        return res.status(200).json(userData);
    }
    catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check for required fields
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }
        // Find user
        const userData = await User.findOne({ email });

        // Could not find user
        if (!userData) {
            return res.status(404).json({ message: "User not found." });
        }
        // Check password
        //const isMatch = await bcrypt.compare(password, userData.password);
        if (password !== userData.password) {
            return res.status(401).json({ message: "Invalid password." });
        }
        // Include selected data
        const user = {
            userId: userData._id,
            firstName: userData.firstName,
            lastName: userData.lastName
        };
        // Assign JWTs (access and refresh)
        const accessToken = jwt.sign(
            user,
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1d" } // shorten this later
        );
        const refreshToken = jwt.sign(
            user,
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "1d" }
        );
        // Return tokens
        res.cookie("jwt", refreshToken, { httpOnly: true, maxAge: 24*60*60*1000});
        res.json({ accessToken });
    }
    catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});


// Create a new user
// Password hashing turned off for now
router.post("/", async (req, res) => {
    try {
        const { firstName, middleName, lastName, email, password } = req.body;
        // Check for required fields
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: "One or more required fields is not present." });
        }

        //validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email address." });
        }

        //check for existing email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "An account with this email already exists." });
        }

        //Hash the password
        // const hashedPassword = await bcrypt.hash(password, 10);

        //create the new user
        const newUser = new User({
            firstName,
            lastName,
            email,
            password
            // password: hashedPassword
        });

        if (middleName) newUser.middleName = middleName;

        const userData = await newUser.save();

        //return the new user data
        return res.status(201).json(userData);
    }
    catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Create a new user with email verification
router.post("/signup", async (req, res) => {
    try{
        const { firstName, middleName, lastName, email, password } = req.body;
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: "One or more required fields is not present." });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email address." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "An account with this email already exists." });
        }

        const verificationToken = crypto.randomInt(100000, 1000000).toString();
        const verificationTokenExpires = Date.now() + 600000; //expires in 10 minutes

        const tempUser = new TempUser({
            firstName,
            middleName,
            lastName,
            email,
            password,
            verificationToken,
            verificationTokenExpires
        });

        await tempUser.save();

        const message = `
            <p>Please verify your email by entering the following token:</p>
            <p><strong>${verificationToken}</strong></p>;
        `
        
        await sendEmail(email, 'Email Verification', message);
        return res.status(201).json({ message: "User created. Please check your email for verification." });
        
    }catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Verify email
router.post("/verifyEmail", async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: "Verification token is required." });
        }

        const tempUser = await TempUser.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!tempUser) {
            return res.status(400).json({ message: "Invalid or expired token." });
        }

        const { firstName, middleName, lastName, email, password } = tempUser;
        const newUser = new User({
            firstName,
            middleName,
            lastName,
            email,
            password
        })

        await newUser.save();
        await TempUser.deleteOne({ _id: tempUser._id });

        return res.status(200).json({ message: "Email verified successfully." });
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});
        


// Edit a user
router.put("/", async (req, res) => {
    try {
        const { id, firstName, middleName, lastName } = req.body;

        if (!id) {
            return res.status(400).json({ message: "User ID is required." });
        }

        // Find user
        const userData = await User.findById(id);
        if (!userData) {
            return res.status(404).json({ message: "User not found." });
        }

        // Update user data
        if (firstName) userData.firstName = firstName;
        if (middleName) userData.middleName = middleName;
        if (lastName) userData.lastName = lastName;

        // Save updated user data
        const updatedUserData = await userData.save();

        // Return updated user data
        return res.status(200).json(updatedUserData);
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Delete a user
router.delete("/", async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ message: "User ID is required." });
        }

        //find user
        const userData = await User.findById(id);
        if (!userData) {
            return res.status(404).json({ message: "User not found." });
        }

        //delete user
        await User.findByIdAndDelete(id);

        //return success message
        return res.status(200).json({ message: "User deleted successfully." });
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

router.post("/requestPasswordReset", async (req, res) => {
    try {
        const { id, email } = req.body;
        let user;
        //const user = await User.findOne({ email });

        if (id) {
            user = await User.findById(id);
        } else if (email) {
            user = await User.findOne({ email });
        } else {
            return res.status(400).json({ message: "Please provide either the user ID or email." });
        }

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const resetToken = crypto.randomBytes(9).toString('hex');
        const resetTokenExpires = Date.now() + 3600000; // 1 hour from now

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpires;

        await user.save();

        //const resetURL = `http://localhost:5000/resetPassword?token=${resetToken}`;
        const message = `
            <p>Your password reset token is: <strong>${resetToken}</strong></p>
            <p>Please use this token to reset your password. The token is valid for 1 hour.</p>
        `;
        await sendEmail(user.email, 'Password Reset', message);

        return res.status(200).json({ message: "Password reset email sent." });
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

router.post("/resetPassword", async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token." });
        }

        //user.password = await bcrypt.hash(newPassword, 10);
        //make sure new password is different from old password
        if (newPassword === user.password) {
            return res.status(400).json({ message: "New password must be different from the old password." });
        }

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        return res.status(200).json({ message: "Password reset successfully." });
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Get all workspaces of a user
router.get("/:userId/workspaces", async (req, res) => {
    try {
        const { userId } = req.params;
        // Find the user and populate the workspaceIds array
        const user = await User.findById(userId).populate('workspaceIds.workspaceId', 'name allowedDomains');

        if (!user) {
            return res.status(404).json({
                message: "The provided user was not found in our database"
            });
        }

        // Extract the workspace details from the populated data
        const userWorkspaces = user.workspaceIds
            .filter(workspace => workspace.workspaceId)  // Filter out null or undefined workspaces
            .map(workspace => {
                return {
                    workspaceId: workspace.workspaceId._id,
                    name: workspace.workspaceId.name,
                    role: workspace.role,
                    allowedDomains: workspace.workspaceId.allowedDomains
                };
            });

        return res.status(200).json(userWorkspaces);
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Bulk user creation
router.post("/bulk", async (req, res) => {
    try {
        const users = req.body;
        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ message: "Request body must be an array of users." });
        }

        const createdUsers = [];
        for (const user of users) {
            const { firstName, middleName, lastName, email, password } = user;
            if (!firstName || !lastName || !email || !password) {
                return res.status(400).json({ message: "One or more required fields is not present." });
            }

            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: "Invalid email address." });
            }

            // Check for existing email
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: `An account with email ${email} already exists.` });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create the new user
            const newUser = new User({
                firstName,
                middleName,
                lastName,
                email,
                password: hashedPassword
            });

            const userData = await newUser.save();
            createdUsers.push(userData);
        }

        return res.status(201).json(createdUsers);
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

export default router;