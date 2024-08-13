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

    try {
        await db.query(
            `INSERT INTO journal_entries (journal_assignment_id, user_id, content)
             VALUES ($1, $2, $3)
             ON CONFLICT (journal_assignment_id, user_id) DO UPDATE SET content = EXCLUDED.content, submitted_at = CURRENT_TIMESTAMP`,
            [journalAssignmentId, userId, content]
        );
    } catch (err) {
        throw new HttpError('Error submitting journal entry', 500);
    }
};


export const getJournalsByUserAndWorkspace = async (db, workspaceId, userId) => {
    const res = await db.query(
        `SELECT ja.id AS "journalAssignmentId", ja.name, ja.week_number, je.content, je.submitted_at AS "submittedAt"
         FROM journal_assignments AS ja
         LEFT JOIN journal_entries AS je ON ja.id = je.journal_assignment_id
         WHERE ja.workspace_id = $1 AND je.user_id = $2
         ORDER BY ja.start_date ASC`,
        [workspaceId, userId]
    );

    if (res.length === 0) {
        throw new HttpError("No journals found for the specified user in this workspace", 404);
    }

    return res;
};
