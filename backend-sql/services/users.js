import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import HttpError from "./utils/httpError.js";
import pool from '../config.js';
import { sendEmail } from "./emailService.js";

// Login to a user's account
export const login = async (email, password) => {
    const res = (await pool.query(
        `SELECT * FROM users WHERE email = $1`, [email]
    )).rows[0];
    if (!res)
        throw new HttpError("The requested user was not found", 404);
    // Check that the user has a password
    if (!res.password)
        throw new HttpError(
            "Cannot log in. Please set a password using 'Forgot my Password'",
            401
        );
    // Check if the password is correct
    if (!await bcrypt.compare(password, res.password))
        throw new HttpError("The email/password combination was incorrect", 401);
    // Select data to include in jwt
    const data = {
        userId: res.id,
        firstName: res.first_name,
        lastName: res.last_name,
        email: res.email
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
    // Insert the refresh token into the database
    await pool.query(
        `UPDATE users SET refresh_token = $1 WHERE id = $2`,
        [refreshToken, data.userId]
    );
    return {
        accessToken, refreshToken,
        refreshTokenAge: 24 * 60 * 60 * 1000
    };
}

// Function to request a password reset
export const requestPasswordReset = async (email) => {
    // Find the user
    const user = await getByEmail(email);
    // Generate the password token
    const resetToken = Math.floor(Math.random() * 900000) + 100000; // 6 digit number
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    // Insert the token into the password reset table
    await pool.query(
        `INSERT INTO password_reset (email, reset_token, reset_token_expiry)
        VALUES ($1, $2, $3)
        ON CONFLICT(email) DO UPDATE SET
        reset_token = EXCLUDED.reset_token,
        reset_token_expiry = EXCLUDED.reset_token_expiry`,
        [email, resetToken, resetTokenExpires]
    );
    const message = `
        <p>Your password reset token is: <strong>${resetToken}</strong></p>
        <p>Please use this token to reset your password. The token is valid for 1 hour.</p>
    `;
    await sendEmail(user.email, 'Password Reset', message);
    return { message: "Password reset email sent" };
}

// Reset the user's password based on their password reset token
export const resetPassword = async (jsonData) => {
    // Extract the components of the data sent
    const { email, password, token } = jsonData;
    // Find the token in the password reset table
    const res = (await pool.query(
        `SELECT * FROM password_reset 
        WHERE email = $1 AND reset_token = $2`,
        [email, token]
    )).rows[0];
    if (!res)
        throw new HttpError(
            "No password reset with this token was found", 404
        );
    // Check that the token hasn't expired
    if ((new Date(res.reset_token_expiry)) < Date.now())
        throw new HttpError("The reset token has already expired", 400);

    // Delete the token from the password_reset table
    await pool.query(`DELETE FROM password_reset WHERE reset_token = $1`, [token]);
    // Insert the new password
    const hashedPw = await bcrypt.hash(password, 10);
    await pool.query(
        `UPDATE users SET password = $1 WHERE email = $2`,
        [hashedPw, email]
    );
    return { message: "New password set successfully" };
}

// Get a user by their id
export const getById = async (userId) => {
    const res = (await pool.query(
        `SELECT * FROM users WHERE id = $1`, [userId]
    )).rows[0];
    // Throw error if not found
    if (!res)
        throw new HttpError("No user was found with this id", 404);

    return {
        userId: res.id,
        firstName: res.first_name,
        lastName: res.last_name,
        email: res.email,
        role: res.role
    };
}

// Get a user by their email
export const getByEmail = async (email) => {
    const res = (await pool.query(
        `SELECT * FROM users WHERE email = $1`, [email]
    )).rows[0];
    // Throw error if not found
    if (!res)
        throw new HttpError("No user was found with this email", 404);

    return {
        userId: res.id,
        firstName: res.first_name,
        lastName: res.last_name,
        email: res.email,
        role: res.role
    };
}

// Get all workspaces that a user is in
export const getWorkspaces = async (userId) => {
    const res = (await pool.query(
        `SELECT w.id AS "workspaceId", w.name, m.role
        FROM memberships AS m
        JOIN workspaces AS w
        ON w.id = m.workspace_id
        WHERE m.user_id = $1
        ORDER BY w.id`,
        [userId]
    )).rows;
    return res;
}

// Check that a user is an admin
export const checkAdmin = async (userId) => {
    // Check that the user creating them is an admin
    const user = await getById(userId);
    if (user.role !== 'Admin')
        throw new HttpError("User is not authorized to make this request", 403);
    return { message: "User is authorized" };
}

// Create a new user, returns the newly created user object
export const createUser = async (user) => {
    try {
        // Encrypt password
        user.password = await bcrypt.hash(user.password, 10);
        // Insert the user information
        const fields = [user.firstName, user.lastName, user.email, user.password, user.role];
        const res = (await pool.query(
            `INSERT INTO users
            (first_name, last_name, email, password, role)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (email) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            password = EXCLUDED.password,
            role = EXCLUDED.role
            RETURNING id AS "userId", first_name AS "firstName", last_name AS "lastName", email`,
            fields
        )).rows[0];
        return res;
    }
    catch (err) {
        return { error: err.message, status: 500 };
    }
}

// Users is an array of user objects, assumed to be students
// If a given user exists, the row will be updated
export const createUsers = async (users) => {
    // Create the users
    // Separate fields into individual arrays
    let query = `INSERT INTO users 
    (first_name, last_name, email, role) VALUES `;
    // Build the insert clause
    query += users.map(
        user => {
            if (!user.firstName || !user.lastName || !user.email)
                throw new Error('One or more first names, last names, or emails is missing');
            return `('${user.firstName}', '${user.lastName}',
            '${user.email}', 'User')`;
        }
    ).join(', ');

    // Set the conflict clause
    query += ` ON CONFLICT (email) DO NOTHING `;
    // Set the returning clause
    query += `RETURNING id AS "userId", first_name AS "firstName", last_name AS "lastName", email`;

    // Run the user query
    const res = (await pool.query(query)).rows;
    // Return success message
    return {
        message: `Created ${res.length} new users successfully`,
        users: res
    };
}
