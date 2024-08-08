import HttpError from "./utils/httpError.js";

// Get a group by id (excluding members)
export const getById = async(db, groupId) => {
    const res = await db.query(
        `SELECT id AS "groupId", name, workspace_id AS "workspaceId"
        FROM groups WHERE id = $1`,
        [groupId]
    );
    const group = res.rows[0];
    // Return
    if (!group)
        throw new HttpError("The requested group was not found", 404);

    return group;
}

// Get a group by id (including members)
export const getByIdWithMembers = async(db, groupId) => {
    const res = await db.query(
        `SELECT g.*, jsonb_agg(
            jsonb_build_object(
                'userId', u.id,
                'firstName', u.first_name,
                'lastName', u.last_name
            ) ORDER BY u.id
        ) AS members
        FROM groups AS g
        LEFT JOIN memberships AS m
        ON g.id = m.group_id
        LEFT JOIN users AS u
        ON u.id = m.user_id
        WHERE g.id = $1
        GROUP BY g.id`,
        [groupId]
    );
    // Format the above query
    const group = res.rows.map(row => ({
        groupId: row.id,
        name: row.name,
        members: row.members,
        workspaceId: row.workspace_id
    }))[0];
    // Return
    if (!group)
        throw new HttpError("The requested group was not found", 404);

    return group;
}

// Get basic information about each group in a workspace
export const getByWorkspace = async(db, workspaceId) => {
    // Query for groups and members
    const res = await db.query(
        `SELECT g.id AS "groupId", g.name
        FROM workspaces AS w
        LEFT JOIN groups AS g
        ON g.workspace_id = w.id
        WHERE w.id = $1
        GROUP BY g.id
        ORDER BY g.id`,
        [workspaceId]
    );
    // Check if the workspace was not found
    if (res.rows.length === 0)
        throw new HttpError("The requested workspace was not found", 404);
    // Check if a null group was joined. If so, the workspace exists but has no groups
    if (!res.rows[0].groupId)
        res.rows = [];
    // Return formatted json
    return res.rows;
}

// Get all groups in a workspace with members
export const getByWorkspaceWithMembers = async(db, workspaceId) => {
    // Query for groups and members
    const res = await db.query(
        `SELECT g.id AS "groupId", g.name,
        COALESCE(jsonb_agg(
            jsonb_build_object(
                'userId', u.id,
                'firstName', u.first_name,
                'lastName', u.last_name
            ) ORDER BY u.last_name, u.id
        ) FILTER (WHERE u.id IS NOT NULL), '[]') AS members
        FROM workspaces AS w
        LEFT JOIN groups AS g
        ON g.workspace_id = w.id
        LEFT JOIN memberships AS m
        ON g.id = m.group_id
        LEFT JOIN users AS u
        ON u.id = m.user_id
        WHERE w.id = $1
        GROUP BY g.id
        ORDER BY g.id`,
        [workspaceId]
    );
    // Check if the workspace was not found
    if (res.rows.length === 0)
        throw new HttpError("The requested workspace was not found", 404);
    // Check if a null group was joined. If so, the workspace exists but has no groups
    if (!res.rows[0].groupId)
        res.rows = [];
    // Return formatted json
    return res.rows;
}

// Check that a user is an instructor of the workspace assocaited with a group
export const checkInstructor = async(db, userId, groupId) => {
    const user = (await db.query(
        `SELECT m.role
        FROM groups AS g
        LEFT JOIN memberships AS m
        ON g.workspace_id = m.workspace_id AND m.user_id = $1
        WHERE g.id = $2`,
        [userId, groupId]
    )).rows[0];

    if (!user)
        throw new HttpError("The requested assignment was not found", 404);
    if (user.role !== 'Instructor')
        throw new HttpError("User is not an instructor of this workspace", 403);

    return { message: "User authorized" }
}

// Create a group within a given workspace
// Only workspace instructors should be allowed to run this
export const createGroup = async(db, workspaceId, name) => {
    const res = await db.query(
        `INSERT INTO groups (workspace_id, name)
        VALUES ($1, $2) ON CONFLICT DO NOTHING 
        RETURNING *`,
        [workspaceId, name]
    );
    // Check that the group didn't already exist
    if (res.rows.length === 0)
        throw new HttpError("The provided group name is already in use", 400);
    return {
        groupId: res.rows[0].id,
        workspaceId, name
    }
}

// Create several groups within a given workspace from a list of names
// Only workspace instructors should be allowed to run this
export const createGroups = async(db, workspaceId, names) => {
    // Build the query to insert each group
    let query = `INSERT INTO groups (workspace_id, name) VALUES `;
    query += names.map((name, index) => {
        return `($1, $${index+2})`
    }).join(', ');
    // Add the on conflict and returning clauses
    query += `ON CONFLICT (workspace_id, name) DO NOTHING 
    RETURNING id AS "groupId", name`;

    // Execute parameterized query
    const res = await db.query(query, [workspaceId, ...names]);
    // Return the new groups
    return {
        message: `Created ${res.rows.length} groups successfully`,
        groups: res.rows
    };
}

// Moves the provided user to the provided group
// The provided user must be part of the workspace that the group is in
// Set groupId to null to remove a user from their group
export const moveUser = async(db, userId, groupId) => {
    // Get the group's workspace
    const workspaceId = (await getById(db, groupId)).workspaceId;
    const res = (await db.query(`
        UPDATE memberships
        SET group_id = $1
        WHERE user_id = $2 AND workspace_id = $3
        RETURNING *`,
    [groupId, userId, workspaceId])).rows[0];
    if (!res)
        throw new HttpError(
            "The user is not a member of the group's workspace", 400
        );
    // Set separate messages for adding and removing users
    return { message: "Added user to group successfully" }
}

// Edit a group (name only)
export const edit = async(db, groupId, updates) => {
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
    let query = `UPDATE groups SET `
    query += keys.map((key, index) => `${key} = $${index+2}`).join(', ');
    query += ` WHERE id = $1 RETURNING *`;
    // Send the query
    const res = await db.query(query, [groupId, ...values]);
    // Check if any workspace was updated
    if (res.rows.length === 0)
        throw new HttpError("The requested group was not found", 404);

    return { message: "Group updated successfully" };
}

// Delete a group
// User must be an instructor of the workspace that contains the group
export const deleteGroup = async(db, groupId) => {
    try{
        // Delete the group
        const res = await db.query(
            `DELETE FROM groups WHERE id = $1 RETURNING *`,
            [groupId]
        );
        // Return an error if the group wasn't found
        if (!res.rows[0])
            throw new HttpError("The requested group was not found", 404);

        return { message: `Group deleted successfully` };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}