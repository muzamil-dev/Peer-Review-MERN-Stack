// Create the workspace and set the creator as an instructor
// The permission level of the user should be verified before running this
export const createWorkspace = async(db, userId, name) => {
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