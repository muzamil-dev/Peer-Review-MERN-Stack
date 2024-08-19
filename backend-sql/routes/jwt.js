import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";

import pool from '../config.js';

dotenv.config();

const router = express.Router();
router.use(cookieParser());

router.get("/refresh", async (req, res) => {
    try {
        // Get the refresh token
        const cookies = req.cookies;
        if (!cookies?.jwt) {
            return res.status(401).json({ message: "JWT refresh failed - No cookie found" });
        }
        const refresh = cookies.jwt;

        // Check db for correct token
        const userResult = await pool.query(
            `SELECT id AS "userId", first_name AS "firstName", last_name AS "lastName"
            FROM users WHERE refresh_token = $1`,
            [refresh]
        );
        const user = userResult[0];

        if (!user) {
            return res.status(403).json({ message: "JWT refresh failed - Could not authenticate user" });
        }

        // Verify the refresh token if found in db
        jwt.verify(
            refresh,
            process.env.REFRESH_TOKEN_SECRET,
            (err, payload) => {
                if (err || user.userId !== payload.userId) {
                    return res.status(403).json({ message: "JWT refresh failed - Could not authenticate user" });
                }
                // Generate access token
                const accessToken = jwt.sign(
                    user,
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: "15m" }
                );
                // Return access token
                return res.json({
                    message: "Refresh successful",
                    accessToken
                });
            }
        );
    } catch (err) {
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

export default router;
