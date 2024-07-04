import db from "../config.js";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";

// Function to send emails
import { sendEmail } from './emailService.js';

dotenv.config();

// Sign up for a new account
export const signup = async(firstName, lastName, email, password) => {
    try{
        // Check that the user provided a valid email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
            return { 
                error: "Invalid email address",
                status: 400
            };

        // Check that user doesn't already exist
        const existingUser = await getUserByEmail(email);
        if (existingUser)
            return { 
                error: "An account with this email already exists",
                status: 400
            };
        
        // Insert the new temporary user
        const verificationToken = crypto.randomInt(100000, 1000000).toString();
        const verificationTokenExpires = Date.now() + 10*60*1000; // 10 minutes
        const tempUser = await db.query(
            `INSERT INTO temp_users VALUES
            ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (email) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            password = EXCLUDED.password,
            verification_token = EXCLUDED.verification_token,
            verification_token_expiry = EXCLUDED.verification_token_expiry`,
            [firstName, lastName, email, password, verificationToken, 
            (new Date(verificationTokenExpires)).toISOString()]
        );

        // Generate the email with the token and sending it
        const message = `
            <p>Please verify your email by entering the following token:</p>
            <p><strong>${verificationToken}</strong></p>
        `;
        await sendEmail(email, 'Email Verification', message);
        return { message: "User created. Please check your email for verification." };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Login to a user's account
export const login = async(email, password) => {
    try{
        const res = await db.query
        (`SELECT id AS "userId", first_name AS "firstName", last_name AS "lastName"
        FROM users WHERE email = $1 AND password = $2`, 
        [email, password]);
        const data = res.rows[0];
        // Check if the combination was correct
        if (!data)
            return {
                error: "The email/password combination was incorrect",
                status: 401
            };
        // Assign JWTs (access and refresh)
        const accessToken = jwt.sign(
            data,
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );
        const refreshToken = jwt.sign(
            data,
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "1d" }
        );
        return {
            accessToken, refreshToken,
            refreshTokenAge: 24*60*60*1000
        };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Verify the user's email on signup
export const verifyEmail = async(token) => {
    try{
        const res = await db.query(
            `SELECT * FROM temp_users
            WHERE verification_token = $1`,
            [token]
        );
        const data = res.rows[0];
        // Token was not found
        if (!data)
            return {
                error: "No account was found with this token",
                status: 401
            };

        // Token was found but it expired
        if ((new Date(data.verification_token_expiry)) < Date.now())
            return {
                error: "Verification token expired. Please sign up again",
                status: 401
            };
        
        // Verification successful, create the new user
        const newUser = await db.query(
            `INSERT INTO users (first_name, last_name, email, password)
            VALUES ($1, $2, $3, $4)`,
            [data.first_name, data.last_name, data.email, data.password]
        );
        return { message: "User verified successfully" }
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Function to request a password reset
export const requestPasswordReset = async(email) => {
    
}

// Get a user by their id
export const getUserById = async(userId) => {
    try{
        const res = await db.query
        (`SELECT * FROM users WHERE id = $1`, [userId]);
        return res.rows[0];
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Get user by their email
export const getUserByEmail = async(email) => {
    try{
        const res = await db.query
        (`SELECT * FROM users WHERE email = $1`, [email]);
        return res.rows[0];
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Get workspaces that a user is a member of
export const getWorkspaces = async(userId) => {
    try{
        const res = await db.query(
            `SELECT w.id AS "workspaceId", w.name, m.role
            FROM memberships AS m
            JOIN workspaces AS w
            ON w.id = m.workspace_id
            WHERE m.user_id = $1
            ORDER BY w.id`,
            [userId]
        );
        return res.rows;
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Create a new user
// Returns the newly created user object
export const createUser = async(user) => {
    const fields = [user.firstName, user.lastName, user.email, user.password];
    try{
        const res = await db.query(
            `INSERT INTO users
            (first_name, last_name, email, password)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            fields
        );
        return res.rows[0];
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Delete user by id
export const deleteUser = async(userId) => {
    try{
        const res = await db.query(
            `delete from users
            where id = $1
            returning *`,
            [userId]
        );
        return res.rows[0];
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}