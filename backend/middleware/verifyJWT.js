<<<<<<< HEAD
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader){
        return res.status(401).json({ message: "JWT Verification failed - No token found" }); // Unauthorized
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, payload) => {
            if (err)
                return res.status(403).json({ message: "JWT Verification failed - Incorrect token" });
            if (!req.body)
                req.body = {};

            // Set user vars
            req.body.userId = payload.userId;
            // Go to next
            next();
        }
    );
}

=======
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader){
        return res.status(401).json({ message: "JWT Verification failed - No token found" }); // Unauthorized
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, payload) => {
            if (err)
                return res.status(403).json({ message: "JWT Verification failed - Incorrect token" });
            if (!req.body)
                req.body = {};

            // Set user vars
            req.body.userId = payload.userId;
            // Go to next
            next();
        }
    );
}

>>>>>>> backend
export default verifyJWT;