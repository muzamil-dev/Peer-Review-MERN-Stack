// Takes in an array of emails/group names (from the csv), outputs an
// array with corresponding userIds and groupIds
export const convertEmailAndGroupNames = async(db, workspaceId, users) => {
    // Create a temporary table to house users and groups
    const tableName = `temp_${Math.floor(Math.random() * 1e6)}`;
    const table = await db.query(`
        CREATE TEMP TABLE ${tableName}(
            email TEXT,
            group_name TEXT
        )`);
    // Separate emails and group names
    const emails = users.map(user => user.email);
    const groups = users.map(user => user.groupName);

    // Insert into the table
    let insertQuery = `INSERT INTO ${tableName} (email, group_name) VALUES `;
    insertQuery += users.map(
        (user, index) => `($${index+1}, $${index+users.length+1})`
    ).join(', ');
    // Run the insert query
    await db.query(insertQuery, [...emails, ...groups]);

    // Join user ids and group ids
    const res = await db.query(
        `SELECT u.id AS "userId", g.id AS "groupId"
        FROM ${tableName} AS t
        LEFT JOIN users AS u
        ON t.email = u.email
        LEFT JOIN groups AS g
        ON g.name = t.group_name AND g.workspace_id = $1`,
        [workspaceId]
    );
    return res.rows;
}