import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const verifyJWT = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "JWT Verification failed - No token found" }); // Unauthorized
    }
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or Expired JWT Token" });
  }
};

export default verifyJWT;
