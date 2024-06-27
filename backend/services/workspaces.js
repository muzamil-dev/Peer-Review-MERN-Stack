import db from "../config.js";

// Get workspace by id
export const getById = async(workspaceId) => {
    try{
        const res = await db.query(
            `select *
            from workspaces
            where id = $1`,
            [workspaceId]
        );
        // Format the above query
        const workspace = res.rows.map(ws => ({
            workspaceId: ws.id,
            name: ws.name
        }))[0];
        if (!workspace)
            return { 
                error: "The requested workspace was not found", 
                status: 404 
            };
        // Return a single workspace
        return workspace;
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Get all students of a workspace
// Returns an array of students
export const getStudents = async(workspaceId) => {
    try{
        const res = await db.query(
            `select m.*, u.first_name, u.last_name, 
            u.email, g.name as group_name
            from memberships as m
            left join users as u
            on m.user_id = u.id
            left join groups as g
            on m.group_id = g.id
            where m.workspace_id = $1 and m.role = 'Student'`,
            [workspaceId]
        );
        // Format the above query
        const students = res.rows.map(row => ({
            userId: row.user_id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            groupId: row.group_id,
            groupName: row.group_name
        }));
        // Return the array
        return students;
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Create a workspace
export const create = async(userId, name) => {
    try{
        // Create the workspace
        const res = await db.query(
            `insert into workspaces (name)
            values ($1)
            returning *`,
            [name]
        );
        // Make the creator an instructor of the workspace
        await db.query(
            `insert into memberships
            (user_id, workspace_id, role)
            values ($1, $2, $3)`,
            [userId, res.rows[0].id, "Instructor"]
        );
        // Format the above query
        const workspace = res.rows.map(ws => ({
            workspaceId: ws.id,
            name: ws.name
        }))[0];
        // Return the workspace
        return workspace;
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Join a workspace
// Edit to use invite code instead of workspaceId
export const join = async(userId, workspaceId) => {
    try{
        // Join
        const res = await db.query(
            `insert into memberships
            (user_id, workspace_id, role)
            values ($1, $2, $3)
            returning *`,
            [userId, workspaceId, "Student"]
        );
        return res.rows[0];
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Leave workspace
export const leave = async(userId, workspaceId) => {
    try{
        // Leave
        const res = await db.query(
            `delete from memberships
            where user_id = $1 and workspace_id = $2
            returning *`,
            [userId, workspaceId]
        );
        return res.rows[0];
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}