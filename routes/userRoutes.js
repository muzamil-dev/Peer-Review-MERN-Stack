import express from 'express';
import { User } from '../models/userModel.js';

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

// Create a new user
router.post("/", async (req, res) => {
    try {
        const body = req.body;
        // Check for required fields
        if (!body.firstName || !body.lastName || !body.email || !body.password) {
            return res.status(400).json({ message: "One or more required fields is not present." });
        }
        else {
            // Create the new user in db
            const newUser = {
                firstName: body.firstName,
                lastName: body.lastName,
                email: body.email,
                password: body.password
            }
            if (body.middleName)
                newUser.middleName = body.middleName;
            const userData = await User.create(newUser);
            // Return new user's data
            return res.status(201).json(userData);
        }
    }
    catch (err) {
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


export default router;