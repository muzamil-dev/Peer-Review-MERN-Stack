// Check that a user is an instructor for a given workspace
export const checkInstructor = async(db, userId, workspaceId) => {
    // Check that the user creating them is an admin
    const user = (await db.query(`
        SELECT m.role
        FROM users AS u
        LEFT JOIN memberships AS m
        ON m.user_id = u.id AND m.workspace_id = $1
        WHERE u.id = $2`,
        [workspaceId, userId])).rows[0];
    if (!user) // Return the error if there was one
        return {
            error: "No user was found with this id",
            status: 404
        }
    if (user.role !== 'Instructor')
        return {
            error: "User is not authorized to make this request",
            status: 403
        }
    return { message: "User is authorized" }
}

// Create the workspace and set the creator as an instructor
// The permission level of the user should be verified before running this
export const create = async(db, userId, name) => {
    try{
        const res = await db.query(
            `INSERT INTO workspaces (name)
            VALUES ($1) RETURNING *`,
            [name]
        );
        await db.query(
            `INSERT INTO memberships (user_id, workspace_id, role)
            VALUES ($1, $2, $3)`,
            [userId, res.rows[0].id, 'Instructor']
        );
        return {
            workspaceId: res.rows[0].id,
            name
        }
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Insert a list of users into a workspace
// Each element of users must contain a userId
export const insertUsers = async(db, workspaceId, users) => {
    try{
        let query = `INSERT INTO memberships 
        (user_id, workspace_id, role) VALUES `;
        // Map the provided users to the query
        query += users.map(user => {
            if (!user.userId)
                throw new Error('The provided user does not have an id');
            return `(${user.userId}, ${workspaceId}, 'Student')`;
        }).join(', ');
        // Add the conflict condition
        query += ` ON CONFLICT (user_id, workspace_id) DO NOTHING`;
        // Insert
        const res = await db.query(query);
        return {
            message: "Users inserted successfully"
        }
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Remove a user from a workspace
// Check that the request is made by an instructor beforehand
export const removeUser = async(db, userId, workspaceId) => {
    try{
        // Remove the specified target
        const res = await db.query(
            `DELETE FROM memberships
            WHERE user_id = $1 AND workspace_id = $2
            RETURNING *`,
            [userId, workspaceId]
        );
        const data = res.rows[0];
        if (!data)
            return {
                error: "User is not in the specified workspace",
                status: 404
            }
        return { message: "User removed from workspace successfully" };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}