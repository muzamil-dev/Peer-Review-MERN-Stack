import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Login to a user's account
export const login = async(db, email, password) => {
    try{
        const res = await getByEmail(email);
        if (res.error) // Will return if user not found
            return res;
        // Check if the password is correct
        if (!await bcrypt.compare(password, res.password))
            return {
                error: "The email/password combination was incorrect",
                status: 401
            }
        // Select data to include in jwt
        const data = {
            userId: res.userId,
            firstName: res.firstName,
            lastName: res.lastName,
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
        const refreshUpload = await db.query(
            `UPDATE users SET refresh_token = $1 WHERE id = $2`,
            [refreshToken, data.userId]
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

// Get a user by their id
export const getById = async(db, userId) => {
    try{
        const res = await db.query
        (`SELECT * FROM users WHERE id = $1`, [userId]);
        // Return if not found
        const data = res.rows[0];
        if (!data)
            return {
                error: "No user was found with this id",
                status: 404
            }
        return {
            userId: data.id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            role: data.role
        };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Get a user by their email
export const getByEmail = async(db, email) => {
    try{
        const res = await db.query
        (`SELECT * FROM users WHERE email = $1`, [email]);
        // Return if not found
        const data = res.rows[0];
        if (!data)
            return {
                error: "No user was found with this email",
                status: 404
            }
        return {
            userId: data.id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            password: data.password,
            role: data.role
        };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Check that a user is an admin
export const checkAdmin = async(db, userId) => {
    // Check that the user creating them is an admin
    const user = await getById(db, userId);
    if (user.error) // Return the error if there was one
        return user;
    if (user.role !== 'Admin')
        return {
            error: "User is not authorized to make this request",
            status: 403
        }
    return { message: "User is authorized" }
}

// Create a new user, returns the newly created user object
export const createUser = async(db, user) => {
    try{
        // Encrypt password
        user.password = await bcrypt.hash(user.password, 10);
        // Insert the user information
        const fields = [user.firstName, user.lastName, user.email, user.password, user.role];
        const res = await db.query(
            `INSERT INTO users
            (first_name, last_name, email, password, role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id AS "userId", first_name AS "firstName", last_name AS "lastName", email`,
            fields
        );
        return res.rows[0];
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Users is an array of user objects, assumed to be students
// If a given user exists, the row will be updated
export const createUsers = async(db, users) => {
    try{
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
        const res = await db.query(query);
        // Return success message
        return { 
            message: `Created ${res.rows.length} new users successfully`,
            users: res.rows
        };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}