import HttpError from "./utils/httpError.js";

// Get a workspace given its id
export const getById = async(db, workspaceId) => {
    const workspace = (await db.query(
        `SELECT id AS "workspaceId", name
        FROM workspaces WHERE id = $1`,
        [workspaceId]
    )).rows[0];
    // Throw an error if nothing was found
    if (!workspace)
        throw new HttpError("The requested workspace was not found", 404);
    return workspace;
}

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
        throw new HttpError("The requested user was not found", 404);
    if (user.role !== 'Instructor')
        throw new HttpError("User is not an instructor of this workspace", 403);

    return { message: "User authorized" }
}

// Create the workspace and set the creator as an instructor
// The permission level of the user should be verified before running this
export const create = async(db, userId, name) => {
    // Create the workspace
    const res = await db.query(
        `INSERT INTO workspaces (name)
        VALUES ($1) RETURNING *`,
        [name]
    );
    // Set the creator as an instructor of the workspace
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

// Change a user's role within a workspace
export const setRole = async(db, targetId, workspaceId, role) => {
    // Set role
    const res = await db.query(
        `UPDATE memberships
        SET role = $1 WHERE user_id = $2 AND workspace_id = $3
        RETURNING *`,
        [role, targetId, workspaceId]
    );
    // Check if the role was updated
    if (res.rows.length === 0)
        throw new HttpError("The provided user is not a member of this workspace", 400);
    // Return
    return { message: "Role updated successfully" };
}

// Edit a workspace (name only)
export const edit = async(db, workspaceId, updates) => {
    // Find edited fields
    const edits = {};
    if (updates.name)
        edits.name = updates.name;

    // Separate keys and values
    const keys = Object.keys(edits);
    const values = Object.values(edits);
    if (keys.length === 0)
        throw new HttpError("Could not edit because no fields were provided", 400);

    // Build the edit query
    let query = `UPDATE workspaces SET `
    query += keys.map((key, index) => `${key} = $${index+2}`).join(', ');
    query += ` WHERE id = $1 RETURNING *`;
    // Send the query
    const res = await db.query(query, [workspaceId, ...values]);
    // Check if any workspace was updated
    if (res.rows.length === 0)
        throw new HttpError("The requested workspace was not found", 404);

    return { message: "Workspace updated successfully" };
}

// Insert a list of users into a workspace
// Each element of users must contain a userId
export const insertUsers = async(db, workspaceId, users) => {
    // Build the insertion query
    let query = `INSERT INTO memberships 
    (user_id, workspace_id, group_id, role) VALUES `;
    // Map the provided users to the query
    query += users.map((user, index) => {
        if (!user.userId)
            throw new HttpError('One or more provided users does not have an id', 400);
        return `($${index+2}, $1, $${index+users.length+2}, 'Student')`;
    }).join(', ');
    // Add the conflict condition
    query += ` ON CONFLICT (user_id, workspace_id) DO UPDATE SET
            group_id = EXCLUDED.group_id`;
    // Separate userIds and groupIds
    const userIds = users.map(user => user.userId);
    const groupIds = users.map(user => user.groupId);
    // Insert
    const res = await db.query(query, [workspaceId, ...userIds, ...groupIds]);
    return {
        message: "Users inserted successfully"
    }
}

// Remove a user from a workspace
// Check that the request is made by an instructor beforehand
export const removeUser = async(db, userId, workspaceId) => {
    // Remove the specified target
    const res = await db.query(
        `DELETE FROM memberships
        WHERE user_id = $1 AND workspace_id = $2
        RETURNING *`,
        [userId, workspaceId]
    );
    const data = res.rows[0];
    if (!data)
        throw new HttpError("User is not in the specified workspace", 400);

    return { message: "User removed from workspace successfully" };
}

// Delete the workspace
// This also deletes all assets associated with the workspace, such as groups,
// assignments, and memberships by extension
export const deleteWorkspace = async(db, workspaceId) => {
    // Delete the workspace
    const res = await db.query(
        `DELETE FROM workspaces WHERE id = $1 RETURNING *`,
        [workspaceId]
    );
    if (res.rows.length === 0)
        throw new HttpError("The requested workspace was not found", 404);
    
    return { message: "Workspace deleted successfully" };
}