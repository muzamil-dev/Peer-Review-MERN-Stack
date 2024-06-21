import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";

dotenv.config();

const router = express.Router();
router.use(cookieParser());

router.get("/refresh", (req, res) => {
    try{
        const cookies = req.cookies;
        if (!(cookies?.jwt))
            res.status(401).json({ message: "JWT refresh failed - No cookie found"});
        const refresh = cookies.jwt;
        jwt.verify(
            refresh,
            process.env.REFRESH_TOKEN_SECRET,
            (err, payload) => {
                if (err)
                    res.status(403).json({ message: "JWT refresh failed - Could not authenticate user"});
                console.log(payload);
                res.json(payload);
            }
        );
    }
    catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
    }
});

export default router;