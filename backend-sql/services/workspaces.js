import HttpError from "./utils/httpError.js";

// Get a workspace given its id
export const getById = async (db, workspaceId) => {
    const query = `
        SELECT id AS "workspaceId", name
        FROM workspaces 
        WHERE id = $1
    `;
    const { rows } = await db.query(query, [workspaceId]);

    if (rows.length === 0) {
        throw new HttpError("The requested workspace was not found", 404);
    }

    return rows[0];
};

// Check that a user is an instructor for a given workspace
export const checkInstructor = async (db, userId, workspaceId) => {
    const query = `
        SELECT m.role
        FROM users AS u
        LEFT JOIN memberships AS m
        ON m.user_id = u.id AND m.workspace_id = $1
        WHERE u.id = $2
    `;
    const { rows } = await db.query(query, [workspaceId, userId]);

    if (rows.length === 0) {
        throw new HttpError("The requested user was not found", 404);
    }

    if (rows[0].role !== 'Instructor') {
        throw new HttpError("User is not an instructor of this workspace", 403);
    }

    return { message: "User authorized" };
};

// Create the workspace and set the creator as an instructor
export const create = async (db, userId, name) => {
    const workspaceQuery = `
        INSERT INTO workspaces (name)
        VALUES ($1) 
        RETURNING id
    `;
    const { rows } = await db.query(workspaceQuery, [name]);

    const membershipQuery = `
        INSERT INTO memberships (user_id, workspace_id, role)
        VALUES ($1, $2, $3)
    `;
    await db.query(membershipQuery, [userId, rows[0].id, 'Instructor']);

    return {
        workspaceId: rows[0].id,
        name
    };
};

// Change a user's role within a workspace
export const setRole = async (db, targetId, workspaceId, role) => {
    const query = `
        UPDATE memberships
        SET role = $1 
        WHERE user_id = $2 AND workspace_id = $3
        RETURNING *
    `;
    const { rows } = await db.query(query, [role, targetId, workspaceId]);

    if (rows.length === 0) {
        throw new HttpError("The provided user is not a member of this workspace", 400);
    }

    return { message: "Role updated successfully" };
};

// Edit a workspace (name only)
export const edit = async (db, workspaceId, updates) => {
    const keys = Object.keys(updates);
    const values = Object.values(updates);

    if (keys.length === 0) {
        throw new HttpError("Could not edit because no fields were provided", 400);
    }

    const query = `
        UPDATE workspaces 
        SET ${keys.map((key, index) => `${key} = $${index + 2}`).join(', ')}
        WHERE id = $1 
        RETURNING *
    `;
    const { rows } = await db.query(query, [workspaceId, ...values]);

    if (rows.length === 0) {
        throw new HttpError("The requested workspace was not found", 404);
    }

    return { message: "Workspace updated successfully" };
};

// Insert a single user into a workspace
export const insertUser = async (db, workspaceId, user) => {
    const { userId, groupId, role } = user;
    const query = `
        INSERT INTO memberships (user_id, workspace_id, group_id, role) 
        VALUES ($1, $2, $3, $4) 
        ON CONFLICT (user_id, workspace_id) DO UPDATE 
        SET group_id = EXCLUDED.group_id, role = EXCLUDED.role
    `;
    await db.query(query, [userId, workspaceId, groupId, role]);

    return { message: "Inserted user into workspace successfully" };
};

// Insert a list of users into a workspace
export const insertUsers = async (db, workspaceId, users) => {
    const userIds = users.map(user => user.userId);
    const groupIds = users.map(user => user.groupId);

    const query = `
        INSERT INTO memberships (user_id, workspace_id, group_id, role) 
        VALUES ${users.map((_, index) => `($${index + 2}, $1, $${index + users.length + 2}, 'Student')`).join(', ')}
        ON CONFLICT (user_id, workspace_id) DO UPDATE SET group_id = EXCLUDED.group_id
    `;
    await db.query(query, [workspaceId, ...userIds, ...groupIds]);

    return { message: "Users inserted successfully" };
};

// Remove a user from a workspace
export const removeUser = async (db, userId, workspaceId) => {
    const query = `
        DELETE FROM memberships
        WHERE user_id = $1 AND workspace_id = $2
        RETURNING *
    `;
    const { rows } = await db.query(query, [userId, workspaceId]);

    if (rows.length === 0) {
        throw new HttpError("User is not in the specified workspace", 400);
    }

    return { message: "User removed successfully" };
};

// Delete the workspace and its related assets
export const deleteWorkspace = async (db, workspaceId) => {
    await db.query(`
        DELETE FROM journal_entries 
        WHERE journal_assignment_id IN (
            SELECT id FROM journal_assignments WHERE workspace_id = $1
        )
    `, [workspaceId]);

    await db.query(`
        DELETE FROM journal_assignments 
        WHERE workspace_id = $1
    `, [workspaceId]);

    const res = await db.query(`
        DELETE FROM workspaces 
        WHERE id = $1 
        RETURNING *
    `, [workspaceId]);

    if (res.rowCount === 0) {
        throw new HttpError("The requested workspace was not found", 404);
    }

    return { message: "Workspace and all associated journals deleted successfully" };
};
