// Get a workspace given its id
export const getById = async(db, workspaceId) => {
    try{
        const workspace = (await db.query(
            `SELECT id AS "workspaceId", name
            FROM workspaces WHERE id = $1`,
            [workspaceId]
        )).rows[0];
        if (!workspace)
            return {
                error: "The requested workspace was not found",
                status: 404
            }
        return workspace;
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Check that a user is an instructor for a given workspace
export const checkInstructor = async(db, userId, workspaceId) => {
    try{
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
                error: "The requested user was not found",
                status: 404
            }
        if (user.role !== 'Instructor')
            return {
                error: "User is not authorized to make this request",
                status: 403
            }
        return { message: "User is authorized" }
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
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

// Edit a workspace (name only)
export const edit = async(db, workspaceId, updates) => {
    try{
        // Find edited fields
        const edits = {};
        if (updates.name)
            edits.name = updates.name;
        // Separate keys and values
        const keys = Object.keys(edits);
        const values = Object.values(edits);
        if (keys.length === 0)
            return {
                error: "Could not edit because no fields were provided",
                status: 400
            }
        // Build the edit query
        let query = `UPDATE workspaces SET `
        query += keys.map((key, index) => `${key} = $${index+2}`).join(', ');
        query += ` WHERE id = $1 RETURNING *`;
        // Send the query
        const res = await db.query(query, [workspaceId, ...values]);
        // Check if any workspace was updated
        if (res.rows.length === 0)
            return {
                error: "The requested workspace was not found",
                status: 404
            }
        return { message: "Workspace updated successfully" };
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
        (user_id, workspace_id, group_id, role) VALUES `;
        // Map the provided users to the query
        query += users.map((user, index) => {
            if (!user.userId)
                throw new Error('The provided user does not have an id');
            return `($${index+2}, $1, $${index+users.length+2}, 'Student')`;
        }).join(', ');
        // Add the conflict condition
        query += ` ON CONFLICT (user_id, workspace_id) DO NOTHING`;
        // Separate userIds and groupIds
        const userIds = users.map(user => user.userId);
        const groupIds = users.map(user => user.groupId);
        // Insert
        const res = await db.query(query, [workspaceId, ...userIds, ...groupIds]);
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

// Delete the workspace
// This also deletes all assets associated with the workspace, such as groups,
// assignments, and memberships by extension
export const deleteWorkspace = async(db, workspaceId) => {
    try{
        // Delete the workspace
        const res = await db.query(
            `DELETE FROM workspaces WHERE id = $1 RETURNING *`,
            [workspaceId]
        );
        if (res.rows.length === 0)
            return {
                error: "The requested workspace was not found",
                status: 404
            }
        return { message: "Workspace deleted successfully" };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}