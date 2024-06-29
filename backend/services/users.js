import db from "../config.js";

// TODO: Re-add signup features

// Get a user by their id
export const getUserById = async(userId) => {
    try{
        const res = await db.query
        (`select * from users where id = $1`, [userId]);
        return res.rows[0];
    }
    catch(err){
        return { error: err.message };
    }
}

// Get user by their email
export const getUserByEmail = async(email) => {
    try{
        const res = await db.query
        (`select * from users where email = $1`, [email]);
        return res.rows[0];
    }
    catch(err){
        return { error: err.message };
    }
}

// Create a new user
// Returns the newly created user object
export const createUser = async(user) => {
    const fields = [user.firstName, user.lastName, user.email, user.password];
    try{
        const res = await db.query(
            `insert into users
            (first_name, last_name, email, password)
            values ($1, $2, $3, $4)
            returning *`,
            fields
        );
        return res.rows[0];
    }
    catch(err){
        return { error: err.message };
    }
}

// Delete user by id
export const deleteUserById = async(userId) => {
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
        return { error: err.message };
    }
}