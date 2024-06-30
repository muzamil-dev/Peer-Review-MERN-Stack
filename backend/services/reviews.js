import db from '../config.js';

// TODO: Submit/edit review

// Create reviews for an assignment
// These will made close to when an assignment opens
export const createReviews = async(assignmentId) => {
    try{
        // Get a list of users within each group
        const res = await db.query(
            `SELECT g.id as group_id, array_agg(m.user_id) AS group_members
            FROM assignments AS a
            JOIN groups AS g
            ON g.workspace_id = a.workspace_id
            JOIN memberships AS m
            ON g.id = m.group_id
            WHERE a.id = $1
            GROUP BY g.id`,
            [assignmentId]
        );
        // Build the query
        let query = `INSERT INTO reviews (assignment_id, group_id, user_id, target_id) VALUES `
        const quads = [];
        res.rows.forEach(row => {
            const group = row.group_id;
            const members = row.group_members;
            for (let i = 0; i < members.length; i++){
                for (let j = 0; j < members.length; j++){
                    if (i === j)
                        continue;
                    quads.push(`(${assignmentId}, ${group}, ${members[i]}, ${members[j]})`);
                }
            }
        });
        query += quads.join(', ');
        await db.query(query);
        return;
    }
    catch(err){
        return { error: err.message, status: 500 };
    }
}