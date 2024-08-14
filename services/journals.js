import HttpError from './utils/httpError.js';

export const generateJournalDates = (startDate, endDate, journalDay, weekNumbersToSkip) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
        throw new HttpError('Invalid start date or end date provided', 400);
    }

    const journalDates = [];
    let current = new Date(start);
    let weekNumber = 1;

    while (current <= end) {
        if (current.getDay() === journalDay) {
            if (!weekNumbersToSkip.includes(weekNumber)) {
                journalDates.push({
                    start: new Date(current),
                    end: new Date(current.setDate(current.getDate() + 6))  // Journal is open for a week
                });
            }
            weekNumber++;
        }
        current.setDate(current.getDate() + 1);
    }

    return journalDates;
};

export const createJournalAssignment = async (db, workspaceId, weekNumber, startDate, endDate) => {
    if (!workspaceId || !weekNumber || !startDate || !endDate) {
        throw new HttpError('Missing required fields for creating a journal assignment', 400);
    }

    try {
        await db.query(
            `INSERT INTO journal_assignments (name, workspace_id, start_date, end_date, week_number)
             VALUES ($1, $2, $3, $4, $5)`,
            [`Journal Week ${weekNumber}`, workspaceId, startDate, endDate, weekNumber]
        );
    } catch (err) {
        throw new HttpError('Error creating journal assignment', 500);
    }
};

export const submitJournalEntry = async (db, journalAssignmentId, userId, content) => {
    if (!journalAssignmentId || !userId || !content) {
        throw new HttpError('Missing required fields for submitting a journal entry', 400);
    }

    // Fetch the journal assignment to check its start and end dates
    const res = await db.query(
        `SELECT start_date, end_date FROM journal_assignments WHERE id = $1`,
        [journalAssignmentId]
    );

    if (res.length === 0) {
        throw new HttpError('Journal assignment not found', 404);
    }

    const { start_date, end_date } = res[0];
    const now = new Date();

    // Check if the current date is within the start and end dates
    if (now < start_date || now > end_date) {
        throw new HttpError('Journal entry submission is not allowed outside the assignment period', 403);
    }

    // Insert or update the journal entry
    await db.query(
        `INSERT INTO journal_entries (journal_assignment_id, user_id, content)
         VALUES ($1, $2, $3)
         ON CONFLICT (journal_assignment_id, user_id) DO UPDATE SET content = EXCLUDED.content, submitted_at = CURRENT_TIMESTAMP`,
        [journalAssignmentId, userId, content]
    );
};



export const getJournalsByUserAndWorkspace = async (db, workspaceId, userId) => {
    const res = await db.query(
        `SELECT ja.id AS "journalAssignmentId", ja.name, ja.week_number, ja.start_date AS "startDate", ja.end_date AS "endDate", 
                je.content, je.submitted_at AS "submittedAt"
         FROM journal_assignments AS ja
         LEFT JOIN journal_entries AS je ON ja.id = je.journal_assignment_id AND je.user_id = $2
         WHERE ja.workspace_id = $1
         ORDER BY ja.start_date ASC`,
        [workspaceId, userId]
    );

    if (res.length === 0) {
        throw new HttpError("No journals found for the specified user in this workspace", 404);
    }

    return res;
};

//get journal by id
export const getJournalById = async (db, journalAssignmentId, userId) => {
    const res = await db.query(
        `SELECT ja.id AS "journalAssignmentId", ja.name, ja.start_date AS "startDate", ja.end_date AS "endDate", 
                je.content, je.submitted_at AS "submittedAt"
         FROM journal_assignments AS ja
         LEFT JOIN journal_entries AS je ON ja.id = je.journal_assignment_id AND je.user_id = $2
         WHERE ja.id = $1`,
        [journalAssignmentId, userId]
    );

    if (res.length === 0) {
        throw new HttpError("Journal assignment not found", 404);
    }

    return res[0];
};
