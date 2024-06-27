import db from "../config.js";

import * as WorkspaceService from "./workspaces.js";

// Get a group by id
export const getById = async(groupId) => {
    try{
        const res = await db.query(
            `select *
            from groups
            where id = $1`,
            [groupId]
        );
        // Format the above query
        const group = res.rows.map(row => ({
            groupId: row.id,
            name: row.name,
            workspaceId: row.workspace_id
        }))[0];
        // Return
        if (!group)
            return { 
                error: "The requested group was not found", 
                status: 404 
            };
        return group;
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Get all members of a given group
export const getMembers = async(groupId) => {
    try{
        const res = await db.query(
            `select g.id as group_id, g.name, m.user_id, 
            u.first_name, u.last_name
            from groups as g
            left join memberships as m
            on m.group_id = g.id
            left join users as u
            on m.user_id = u.id
            where g.id = $1`,
            [groupId]
        );

        let members;
        // Check if the group does not exist
        if (res.rows.length == 0)
            return { 
                error: "The requested group was not found", 
                status: 404 
            };
        // Check if the group exists and has no members
        else if (res.rows.length === 1 && res.rows[0].user_id === null)
            members = [];
        // Group exists and has members
        else {
            members = res.rows.map(row => ({
                userId: row.user_id,
                firstName: row.first_name,
                lastName: row.last_name
            }));
        }
        // Return formatted member list
        return {
            name: res.rows[0].name,
            groupId: res.rows[0].group_id,
            members
        };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

export const create = async(userId, workspaceId) => {
    try{
        // Check if the workspace exists
        const workspace = await WorkspaceService.getById(workspaceId);
        // Return if an error happened
        if (workspace.error)
            return workspace;
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