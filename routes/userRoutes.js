import express from 'express';
import { User } from '../models/userModel.js';

const router = express.Router();

// Get a user of a specific id
router.get("/:id", async(req, res) => {
    try{
        const { id } = req.params;
        const userData = await User.findById(id);
        if (!userData){
            return res.status(404).json({ message: "The requested user was not found in our database." });
        }
        return res.status(200).json(userData);
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

// Create a new user
router.post("/", async(req, res) => {
    try {
        const body = req.body;
        if (!body.firstName || !body.lastName || !body.email || !body.password){
            return res.status(400).json({ message: "One or more required fields is not present." });
        }
        else {
            const newUser = {
                firstName: body.firstName,
                lastName: body.lastName,
                email: body.email,
                password: body.password
            }
            if (body.middleName)
                newUser.middleName = body.middleName;
            const userData = await User.create(newUser);
            return res.status(201).json(userData);
        }
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

export default router;