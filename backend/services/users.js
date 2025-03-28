import db from "../config.js";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";

// Function to send emails
import { sendEmail } from "./emailService.js";
import generateCode from "./generateCode.js";

dotenv.config();

export const signup = async (firstName, lastName, email, password) => {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return {
        error: "Invalid email address",
        status: 400,
      };

    const existingUser = await getByEmail(email);
    if (existingUser)
      return {
        error: "An account with this email already exists",
        status: 400,
      };

    const verificationToken = crypto.randomInt(100000, 1000000).toString();
    const verificationTokenExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await db.query(
      `INSERT INTO temp_users (first_name, last_name, email, password, verification_token, verification_token_expiry)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (email) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            password = EXCLUDED.password,
            verification_token = EXCLUDED.verification_token,
            verification_token_expiry = EXCLUDED.verification_token_expiry`,
      [
        firstName,
        lastName,
        email,
        password,
        verificationToken,
        new Date(verificationTokenExpires).toISOString(),
      ]
    );

    const message = `
            <p>Please verify your email by entering the following token:</p>
            <p><strong>${verificationToken}</strong></p>
        `;
    await sendEmail(email, "Email Verification", message);
    return {
      message: "User created. Please check your email for verification.",
    };
  } catch (err) {
    return { error: err.message, status: 500 };
  }
};

// Login to a user's account
export const login = async (email, password) => {
  try {
    const res = await db.query(
      `SELECT id AS "userId", first_name AS "firstName", last_name AS "lastName"
        FROM users WHERE email = $1 AND password = $2`,
      [email, password]
    );
    const data = res.rows[0];
    // Check if the combination was correct
    if (!data)
      return {
        error: "The email/password combination was incorrect",
        status: 401,
      };
    // Assign JWTs (access and refresh)
    const accessToken = jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(data, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "1d",
    });
    // Insert the refresh token into the database
    const refreshUpload = await db.query(
      `UPDATE users SET refresh_token = $1 WHERE id = $2`,
      [refreshToken, data.userId]
    );
    return {
      accessToken,
      refreshToken,
      refreshTokenAge: 24 * 60 * 60 * 1000,
    };
  } catch (err) {
    return { error: err.message, status: 500 };
  }
};

// Verify the user's email on signup
export const verifyEmail = async (token) => {
  try {
    const res = await db.query(
      `SELECT * FROM temp_users WHERE verification_token = $1`,
      [token]
    );
    const data = res.rows[0];

    // Token was not found
    if (!data) {
      return {
        error: "No account was found with this token",
        status: 401,
      };
    }

    // Token was found but it expired
    if (new Date(data.verification_token_expiry) < Date.now()) {
      return {
        error: "Verification token expired. Please sign up again",
        status: 401,
      };
    }

    // Verification successful, create the new user
    await db.query(
      `INSERT INTO users (first_name, last_name, email, password)
            VALUES ($1, $2, $3, $4)`,
      [data.first_name, data.last_name, data.email, data.password]
    );

    // Delete the temporary user entry
    await db.query(`DELETE FROM temp_users WHERE verification_token = $1`, [
      token,
    ]);

    return { message: "User verified successfully" };
  } catch (err) {
    return { error: err.message, status: 500 };
  }
};

// Function to request a password reset
export const requestPasswordReset = async (email) => {
  try {
    // Find the user
    const user = await getByEmail(email);
    if (!user)
      return {
        error: "No user was found with this email",
        status: 404,
      };
    else if (user.error) return user;

    // Generate the password token
    const resetToken = generateCode();
    const resetTokenExpires = new Date(
      Date.now() + 60 * 60 * 1000
    ).toISOString(); // 1 hour
    // Insert the token into the password reset table
    const resetQuery = await db.query(
      `INSERT INTO password_reset VALUES ($1, $2, $3)
            ON CONFLICT(email) DO UPDATE SET
            email = EXCLUDED.email,
            reset_token = EXCLUDED.reset_token,
            reset_token_expiry = EXCLUDED.reset_token_expiry`,
      [email, resetToken, resetTokenExpires]
    );
    const message = `
            <p>Your password reset token is: <strong>${resetToken}</strong></p>
            <p>Please use this token to reset your password. The token is valid for 1 hour.</p>
        `;
    const emailSent = await sendEmail(user.email, "Password Reset", message);
    if (emailSent.error) return emailSent;
    return { message: "Password reset email sent" };
  } catch (err) {
    return { error: err.message, status: 500 };
  }
};

// Reset the user's password based on their password reset token
export const resetPassword = async (token, password) => {
  try {
    // Find the token in the password reset table
    const res = await db.query(
      `SELECT * FROM password_reset WHERE reset_token = $1`,
      [token]
    );
    const data = res.rows[0];
    if (!data)
      return {
        error: "No password reset with this token was found",
        status: 404,
      };
    // Check that the token hasn't expired
    if (new Date(data.reset_token_expiry) < Date.now())
      return {
        error: "The reset token has already expired",
        status: 400,
      };
    // Delete the token from the password_reset table
    db.query(`DELETE FROM password_reset WHERE reset_token = $1`, [token]);
    // Insert the new password
    const pwInsert = await db.query(
      `UPDATE users SET password = $1 WHERE email = $2`,
      [password, data.email]
    );
    return { message: "New password set successfully" };
  } catch (err) {
    return { error: err.message, status: 500 };
  }
};

// Get a user by their id
export const getById = async (userId) => {
  try {
    const res = await db.query(`SELECT * FROM users WHERE id = $1`, [userId]);
    // Return if not found
    const data = res.rows[0];
    if (!data)
      return {
        error: "No user was found with this id",
        status: 404,
      };
    return {
      userId: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
    };
  } catch (err) {
    return { error: err.message, status: 500 };
  }
};

// Get user by their email
export const getByEmail = async (email) => {
  try {
    const res = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);
    return res.rows[0];
  } catch (err) {
    return { error: err.message, status: 500 };
  }
};

// Get workspaces that a user is a member of
export const getWorkspaces = async (userId) => {
  try {
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
  } catch (err) {
    return { error: err.message, status: 500 };
  }
};

// Create a new user
// Returns the newly created user object
export const createUser = async (user) => {
  const fields = [user.firstName, user.lastName, user.email, user.password];
  try {
    const res = await db.query(
      `INSERT INTO users
            (first_name, last_name, email, password)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
      fields
    );
    return res.rows[0];
  } catch (err) {
    return { error: err.message, status: 500 };
  }
};

// Delete user by id
export const deleteUser = async (userId) => {
  try {
    const res = await db.query(
      `delete from users
            where id = $1
            returning *`,
      [userId]
    );
    return res.rows[0];
  } catch (err) {
    return { error: err.message, status: 500 };
  }
};
