// Create a group within a given workspace
// Only workspace instructors should be allowed to run this
export const create = async(db, workspaceId, name) => {
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