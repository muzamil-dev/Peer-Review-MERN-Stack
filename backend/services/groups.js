import db from "../config.js";

import * as WorkspaceService from "./workspaces.js";

// TODO: Create many
// TOOD: Remove user
// TODO: Delete group

// Get a group by id
export const getById = async(groupId) => {
    try{
        const res = await db.query(
            `SELECT *
            FROM groups
            WHERE id = $1`,
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
            `SELECT g.id AS group_id, g.name, m.user_id, 
            u.first_name, u.last_name
            FROM groups AS g
            LEFT JOIN memberships AS m
            ON m.group_id = g.id
            LEFT JOIN users AS u
            ON m.user_id = u.id
            WHERE g.id = $1`,
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

// Create a new group
// Must have instructor role in workspace
export const create = async(userId, workspaceId) => {
    try{
        // Get the group's workspace
        const instructors = await db.query(
            `SELECT m.user_id, w.groups_created
            FROM workspaces AS w
            JOIN memberships AS m
            ON m.workspace_id = w.id AND m.role = 'Instructor'
            WHERE id = $1`,
            [workspaceId]
        );
        // Check if the workspace exists
        if (instructors.rows.length === 0)
            return {
                error: "Failed to create group: The requested workspace does not exist",
                status: 404
            };
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

// Create many groups
// Must have instructor role in workspace
export const createMany = async(userId, workspaceId, numGroups) => {
    try{
        // Get the groups' workspace
        const instructors = await db.query(
            `SELECT m.user_id, w.groups_created
            FROM workspaces AS w
            JOIN memberships AS m
            ON m.workspace_id = w.id AND m.role = 'Instructor'
            WHERE id = $1`,
            [workspaceId]
        );
        // Check if the workspace exists
        if (instructors.rows.length === 0)
            return {
                error: "Failed to create group: The requested workspace does not exist",
                status: 404
            };
        // Check if the user is an instructor
        const found = instructors.rows.find(user => user.user_id === userId);
        if (!found)
            return {
                error: "This user is not authorized to make this request",
                status: 403
            }
        // Build the query
        const curGroups = found.groups_created;
        let insertQuery = `INSERT INTO groups (name, workspace_id) VALUES `;
        for (let i = 1; i < numGroups; i++){
            insertQuery += `('Group ${curGroups + i}', ${workspaceId}), `;
        }
        insertQuery += `('Group ${curGroups + numGroups}', ${workspaceId})
                        RETURNING *`;
        
        // Create the groups
        const [res, _] = await Promise.all([
            db.query(insertQuery),
            db.query(`update workspaces set groups_created = groups_created + $1 where id = $2`,
                [numGroups, workspaceId])
        ]);
        // Format the result
        const groups = res.rows.map(row => ({
            groupId: row.id,
            name: row.name,
            workspaceId: row.workspace_id
        }));
        // Return the new group
        return { message: "Groups created successfully", groups };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Join a group
export const join = async(userId, groupId) => {
    try{
        const check = await db.query(
            `SELECT g.id AS group_to_join, g.name AS group_name, m.group_id AS group_joined, 
            m.workspace_id, m.role, w.groups_locked AS locked, w.group_member_limit
            FROM groups AS g
            LEFT join memberships AS m
            ON g.workspace_id = m.workspace_id AND m.user_id = $1
            LEFT join workspaces AS w
            ON g.workspace_id = w.id
            WHERE g.id = $2`,
            [userId, groupId]
        );

        // Check that the group exists
        const data = check.rows[0];
        if (!data)
            return { 
                error: "The requested group was not found", 
                status: 404 
            };
        // Check that the user is in the workspace
        if (!data.workspace_id)
            return {
                error: "Cannot join group: User is not in the same workspace as the group", 
                status: 400
            }
        // Check if the group is locked
        if (data.lock)
            return { 
                error: "Cannot join group: Groups are locked for this workspace", 
                status: 400 
            };
        // Check that the user is a student
        if (data.role !== "Student")
            return { 
                error: "Cannot join group: Only students can join groups", 
                status: 400
            };
        // Check that the user isn't already in another group
        if (data.group_joined)
            return {
                error: "Cannot join group: User is already in a group in this workspace",
                status: 400
            }
        
        // Check membership limit
        const members = (await db.query(
            `SELECT count(*) FROM memberships WHERE group_id = $1`,
            [groupId]
        )).rows[0];
        if (members.count >= data.group_member_limit)
            return {
                error: "Cannot join group: The group's member limit has been reached",
                status: 400
            }

        // Join the group
        const res = await db.query(
            `UPDATE memberships
            SET group_id = $1
            where user_id = $2 AND workspace_id = $3`,
            [groupId, userId, data.workspace_id]
        );
        return { message: `Joined ${data.group_name} successfully!` };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Leave a group
// Join memberships table to check the group theyre in
export const leave = async(userId, groupId) => {
    try{
        const res = await db.query(
            `SELECT g.id, g.name, g.workspace_id, 
            w.groups_locked AS lock, m.group_id AS group_joined
            FROM groups AS g
            JOIN workspaces AS w
            ON g.workspace_id = w.id
            JOIN memberships AS m
            ON m.user_id = $1 AND m.workspace_id = g.workspace_id
            WHERE g.id = $2`,
            [userId, groupId]
        );
        const data = res.rows[0];
        // Check if no data was returned, this means that no membership for that user/workspace was found
        if (!data)
            return {
                error: "Cannot leave group: User is not a member of this workspace",
                status: 400
            };
        // Check if the group is locked
        if (data.lock)
            return { 
                error: "Cannot leave group: Groups are locked for this workspace", 
                status: 400
            };
        // Check that the group being left is the group they are in
        if (data.id !== data.group_joined)
            return {
                error: "Cannot leave group: User is not a member of this group",
                status: 400
            };
        // Update the user's membership
        const update = await db.query(
            `UPDATE memberships
            SET group_id = NULL
            WHERE user_id = $1 AND workspace_id = $2`,
            [userId, data.workspace_id]
        );
        return { message: `Left ${data.name} successfully!` };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Add a user to a group
// This overrides locks and membership limits
export const addUser = async(userId, targetId, groupId) => {
    try{
        const check = await db.query(
            `SELECT g.id AS new_group, g.name AS new_group_name, m1.group_id AS target_cur_group, 
            m1.workspace_id, m1.role as target_role, m2.role as user_role
            FROM groups AS g
            LEFT JOIN memberships AS m1
            ON g.workspace_id = m1.workspace_id AND m1.user_id = $1
            LEFT JOIN workspaces AS w
            ON g.workspace_id = w.id
            LEFT JOIN memberships as m2
            ON g.workspace_id = m2.workspace_id AND m2.user_id = $2
            WHERE g.id = $3`,
            [targetId, userId, groupId]
        );
        // Check for any errors
        const data = check.rows[0];
        
        // Check that the group was found
        if (!data)
            return { 
                error: "The requested group was not found", 
                status: 404 
            };
        // Check that the user is in the workspace. This will be null if no membership was found
        // between the target and the workspace
        if (!data.workspace_id)
            return {
                error: "Cannot join group: Target is not in the same workspace as the group", 
                status: 400
            }
        // Check that the user is a student
        if (data.target_role !== "Student")
            return { 
                error: "Cannot join group: Only students can join groups", 
                status: 400
            };
        // Check that the user isn't already in another group
        if (data.target_cur_group)
            return {
                error: "Cannot join group: Target is already in a group in this workspace",
                status: 400
            }
        // Check that the user making the request is an instructor
        if (data.user_role !== "Instructor")
            return { 
                error: "User is not authorized to make this request", 
                status: 403
            };

        // Move the user to the group
        await db.query(
            `UPDATE memberships SET group_id = $1
            WHERE user_id = $2 and workspace_id = $3`,
            [groupId, targetId, data.workspace_id]
        );
        return { message: "Target added to group successfully" };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}