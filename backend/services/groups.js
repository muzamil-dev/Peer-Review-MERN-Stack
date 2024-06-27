import db from "../config.js";

import * as WorkspaceService from "./workspaces.js";

export const create = async(userId, workspaceId) => {
    try{
        // Check if the workspace exists
        const workspace = await WorkspaceService.getById(workspaceId);
        if (!workspace)
            return {
                error: "The provided workspace does not exist",
                status: 404
            }
        // Get the group's workspace
        const instructors = await db.query(
            `select m.user_id, w.groups_created
            from workspaces as w
            join memberships as m
            on m.workspace_id = w.id and m.role = 'Instructor'
            where id = $1`,
            [workspaceId]
        );
        // Check if the user is an instructor
        const found = instructors.rows.find(user => user.user_id === userId);
        if (!found)
            return {
                error: "This user is not authorized to make this request",
                status: 403
            }
        // Create the group
        const [res, _] = await Promise.all([
            db.query(`insert into groups (name, workspace_id) values ($1, $2) returning *`,
                [`Group ${found.groups_created + 1}`, workspaceId]),
            db.query(`update workspaces set groups_created = $1 where id = $2`,
                [found.groups_created + 1, workspaceId])
        ]);
        // Format the result
        const group = res.rows.map(row => ({
            groupId: row.id,
            name: row.name,
            workspaceId: row.workspace_id
        }))[0];
        // Return the new group
        return group;
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}