import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";

import db from '../config.js';

dotenv.config();

const router = express.Router();
router.use(cookieParser());

router.get("/refresh", async(req, res) => {
    try{
        // Get the refresh token
        const cookies = req.cookies;
        if (!(cookies?.jwt))
            res.status(401).json({ message: "JWT refresh failed - No cookie found"});
        const refresh = cookies.jwt;
        // Chech db for correct token (will encrypt later)
        console.log(`Refresh: ${refresh}`);
        const user = (await db.query(
            `SELECT id AS "userId", first_name AS "firstName", last_name AS "lastName"
            FROM users WHERE refresh_token = $1`,
            [refresh]
        )).rows[0];
        console.log(user);
        if (!user)
            res.status(403).json({ message: "JWT refresh failed - Could not authenticate user"});
        // Verify the refresh token if found in db
        jwt.verify(
            refresh,
            process.env.REFRESH_TOKEN_SECRET,
            (err, payload) => {
                if (err || (!user.userId === payload.userId))
                    res.status(403).json({ message: "JWT refresh failed - Could not authenticate user"});
                // Generate access token
                const accessToken = jwt.sign(
                    user,
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: "1m" }
                );
                // Return access token
                res.json({
                    message: "Refresh successful",
                    accessToken
                });
            }
        );
    }
    catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

export default router;