import db from "../config.js";

// Create a workspace
export const createWorkspace = async(userId, name) => {
    try{
        // Create the workspace
        const res = await db.query(
            `insert into workspaces (name)
            values ($1)
            returning *`,
            [name]
        );
        const workspace = res.rows[0];
        // Make the creator an instructor of the workspace
        await db.query(
            `insert into memberships
            (user_id, workspace_id, role)
            values ($1, $2, $3)`,
            [userId, workspace.id, "Instructor"]
        );
        return workspace;
    }
    catch(err){
        return { 
            message: err.message,
            status: 500
        }
    }
}