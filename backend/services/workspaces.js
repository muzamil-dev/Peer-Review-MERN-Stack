import db from "../config.js";

import * as GroupService from './groups.js';

// Get workspace by id
export const getById = async(workspaceId) => {
    try{
        const res = await db.query(
            `SELECT * FROM workspaces WHERE id = $1`,
            [workspaceId]
        );
        // Format the above query
        const workspace = res.rows.map(ws => ({
            workspaceId: ws.id,
            name: ws.name,
            inviteCode: ws.invite_code,
            allowedDomains: ws.allowed_domains,
            groupMemberLimit: ws.group_member_limit,
            groupLock: ws.groups_locked
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

// Get all groups in a workspace
// Returns an array of groups
export const getGroups = async(workspaceId) => {
    try{
        // Check that the workspace exists
        // Not using getById because group_member_limit is needed
        const workspace = (await db.query(
            `SELECT * FROM workspaces WHERE id = $1`,
            [workspaceId]
        )).rows[0];
        if (!workspace)
            return { 
                error: "The requested workspace was not found", 
                status: 404 
            };

        // Query for groups and members
        const res = await db.query(
            `SELECT g.id, g.name,
            jsonb_agg(
                jsonb_build_object(
                    'userId', u.id,
                    'firstName', u.first_name,
                    'lastName', u.last_name
                ) ORDER BY u.id
            ) as members
            FROM groups AS g
            LEFT JOIN memberships AS m
            ON g.id = m.group_id
            LEFT JOIN users AS u
            ON u.id = m.user_id
            WHERE g.workspace_id = $1
            GROUP BY g.id
            ORDER BY g.id`,
            [workspaceId]
        );
        // Format the above result
        const groups = res.rows.map(group => {
            if (!group.members[0].userId)
                group.members = [];
            return {
                groupId: group.id,
                name: group.name,
                members: group.members
            }
        });
        // Return formatted json
        return {
            groupMemberLimit: workspace.group_member_limit,
            groups
        };
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

// Get all ungrouped students in a workspace
// Returns an array of students
export const getUngrouped = async(workspaceId) => {
    try{
        const res = await db.query(
            `SELECT m.*, u.first_name, u.last_name, 
            u.email, g.name AS group_name
            FROM memberships AS m
            LEFT JOIN users AS u
            ON m.user_id = u.id
            LEFT JOIN groups AS g
            ON m.group_id = g.id
            WHERE m.workspace_id = $1 and m.role = 'Student' AND m.group_id IS NULL`,
            [workspaceId]
        );
        // Format the above query
        const students = res.rows.map(row => ({
            userId: row.user_id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
        }));
        // Return the array
        return students;
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Create a workspace
// Modify to also allow creation of num groups
export const create = async(userId, settings) => {
    try{
        // Create the workspace
        const { name, allowedDomains, groupMemberLimit, numGroups } = settings;
        const res = await db.query(
            `INSERT INTO workspaces (name, allowed_domains, group_member_limit)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [name, allowedDomains, groupMemberLimit]
        );
        // Make the creator an instructor of the workspace
        await db.query(
            `INSERT INTO memberships
            (user_id, workspace_id, role)
            VALUES ($1, $2, $3)`,
            [userId, res.rows[0].id, "Instructor"]
        );
        // Create groups
        if (numGroups)
            await GroupService.createMany(userId, res.rows[0].id, numGroups);
        // Return the workspace
        return { message: "Workspace created successfully", workspaceId: res.rows[0].id };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Edit a workspace
// Possible updates: name, allowedDomains, groupMemberLimit, groupLock
export const edit = async(userId, workspaceId, settings) => {
    // Create the workspace
    try{
        const res = await db.query(
            `SELECT w.id as workspace_id, m.role AS user_role
            FROM workspaces AS w
            LEFT JOIN memberships as m
            ON w.id = m.workspace_id AND m.user_id = $1
            WHERE w.id = $2`,
            [userId, workspaceId]
        );
        const data = res.rows[0];
        // Check that the workspace exists
        if (!data)
            return { 
                error: "The requested workspace was not found", 
                status: 404 
            };
        // Check that the user is an instructor of the workspace
        if (data.user_role !== "Instructor")
            return { 
                error: "User is not authorized to edit this workspace", 
                status: 403
            };

        // Create updates object based on database fields
        const updates = {};
        if (settings.name)
            updates.name = settings.name;
        if (settings.allowedDomains)
            updates.allowed_domains = settings.allowedDomains;
        if (settings.groupMemberLimit || settings.groupMemberLimit === null)
            updates.group_member_limit = settings.groupMemberLimit;
        if (settings.groupLock === true || settings.groupLock === false)
            updates.groups_locked = settings.groupLock

        // Generate the query string
        const keys = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(', ');
        // Push workspace id onto list of values to use in query
        values.push(workspaceId);

        // Build and send the query
        const query = `UPDATE workspaces SET ${setClause} WHERE id = $${values.length}`
        await db.query(
            query, values
        );
        return { message: "Workspace updated successfully" };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Join a workspace
// Edit to use allowedDomains as well
export const join = async(userId, code) => {
    try{
        const workspace = (await db.query(
            `SELECT *
            FROM workspaces
            WHERE invite_code = $1`,
            [code]
        )).rows[0];
        // Check the workspace's invite code
        if (!workspace)
            return { 
                error: "Cannot join workspace: No workspace with this code was found", 
                status: 404
            };
        
        // Get the user's email
        const user = (await db.query(
            `SELECT email, workspace_id FROM users
            LEFT JOIN memberships
            ON user_id = id AND workspace_id = $1
            WHERE id = $2`,
            [workspace.id, userId]
        )).rows[0];
        // Check that the user is found and not in the workspace
        if (!user)
            return { 
                error: "The requested user was not found", 
                status: 404
            };
        if (user.workspace_id !== null)
            return { 
                error: "User is already in this workspace", 
                status: 400
            };

        // Check the workspace's allowed domains, if there are any
        if (workspace.allowed_domains && workspace.allowed_domains.length > 0){
            const userDomain = user.email.split('@')[1];
            const domainCheck = (domain, userDomain) => {
                const domainPattern = new RegExp(domain);
                return domainPattern.test(userDomain);
            }
            const foundDomain = workspace.allowed_domains.find(domain => domainCheck(domain, userDomain));
            if (!foundDomain){
                return { 
                    error: "The given user is not authorized to join this workspace.",
                    status: 403
                };
            }
        }

        // Join
        const _ = await db.query(
            `INSERT INTO memberships
            (user_id, workspace_id, role)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [userId, workspace.id, "Student"]
        );
        return { message: `Joined ${workspace.name} successfully!` };
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
            `DELETE FROM memberships
            WHERE user_id = $1 AND workspace_id = $2
            RETURNING *`,
            [userId, workspaceId]
        );
        return { message: "Left workspace successfully" };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Remove a user (target) from a workspace (instructors only)
export const removeUser = async(userId, targetId, workspaceId) => {
    try{
        const res = await db.query(
            `SELECT w.id as workspace_id, m.role AS user_role
            FROM workspaces AS w
            LEFT JOIN memberships as m
            ON w.id = m.workspace_id AND m.user_id = $1
            WHERE w.id = $2`,
            [userId, workspaceId]
        );
        const data = res.rows[0];
        // Check that the workspace exists
        if (!data)
            return { 
                error: "The requested workspace was not found", 
                status: 404 
            };
        // Check that the user is an instructor of the workspace
        if (data.user_role !== "Instructor")
            return { 
                error: "User is not authorized to remove other users", 
                status: 403
            };
        // Remove the specified target
        const removal = await db.query(
            `DELETE FROM memberships
            WHERE user_id = $1 AND workspace_id = $2
            RETURNING *`,
            [targetId, workspaceId]
        );
        const removalData = removal.rows[0];
        if (!removalData)
            return {
                error: "User is not in the specified workspace",
                status: 400
            }
        return { message: "User removed from workspace successfully" };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Set the invite code of the workspace
// The code will be generated in the endpoint and passed to 'code'
// Set code to null to removeInvite
export const setInvite = async(userId, workspaceId, code) => {
    try{
        // Check that the workspace exists and that the user is an instructor
        const res = await db.query(
            `SELECT w.id, w.name, m.* FROM workspaces as w
            LEFT JOIN memberships as m
            ON m.workspace_id = w.id AND m.user_id = $1
            WHERE w.id = $2`,
            [userId, workspaceId]
        );
        // Check that workspace exists
        const data = res.rows[0];
        if (!data)
            return { 
                error: "The requested workspace was not found", 
                status: 404 
            };
        // Check that the user is an instructor
        if (data.role !== "Instructor")
            return { 
                error: "Cannot set invite: Only instructors can set invites", 
                status: 403
            };
        // Update the workspace
        await db.query(
            `UPDATE workspaces SET invite_code = $1 WHERE id = $2`,
            [code, data.id]
        );
        return { message: "Invite code set successfully", inviteCode: code };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}

// Delete the workspace
export const deleteWorkspace = async(userId, workspaceId) => {
    try{
        const res = await db.query(
            `SELECT w.id as workspace_id, m.role AS user_role
            FROM workspaces AS w
            LEFT JOIN memberships as m
            ON w.id = m.workspace_id AND m.user_id = $1
            WHERE w.id = $2`,
            [userId, workspaceId]
        );
        const data = res.rows[0];
        // Check that the workspace exists
        if (!data)
            return { 
                error: "The requested workspace was not found", 
                status: 404 
            };
        // Check that the user is an instructor of the workspace
        if (data.user_role !== "Instructor")
            return { 
                error: "User is not authorized to delete this workspace", 
                status: 403
            };
        // Delete the workspace
        await db.query(
            `DELETE FROM workspaces WHERE id = $1`,
            [workspaceId]
        );
        return { message: "Workspace deleted successfully" };
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}