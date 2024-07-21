// Create a group within a given workspace
// Only workspace instructors should be allowed to run this
export const createGroup = async(db, workspaceId, name) => {
    try{
        const res = await db.query(
            `INSERT INTO groups (workspace_id, name)
            VALUES ($1, $2) ON CONFLICT DO NOTHING 
            RETURNING *`,
            [workspaceId, name]
        );
        // Check that the group didn't already exist
        if (res.rows.length === 0)
            return {
                error: "The provided group name is already taken",
                status: 400
            };
        return {
            message: "Group created successfully",
            groupId: res.rows[0].id,
            workspaceId, name
        }
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Create several groups within a given workspace from a list of names
// Only workspace instructors should be allowed to run this
export const createGroups = async(db, workspaceId, names) => {
    try{
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
    catch(err){
        return { error: err.message, status: 500 };
    }
}