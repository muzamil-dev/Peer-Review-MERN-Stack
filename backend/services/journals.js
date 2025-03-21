import db from "../config.js";

export const generateJournalDates = (
  startDate,
  endDate,
  journalDay,
  weekNumbersToSkip
) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
      throw new Error("Invalid start date or end date provided", 400);
    }

    const journalDates = [];
    let current = new Date(start);
    let weekNumber = 1;

    while (current <= end) {
      if (current.getDay() === journalDay) {
        if (!weekNumbersToSkip.includes(weekNumber)) {
          journalDates.push({
            start: new Date(current),
            end: new Date(current.setDate(current.getDate() + 6)), // Journal is open for a week
          });
        }
        weekNumber++;
      }
      current.setDate(current.getDate() + 1);
    }

    return journalDates;
  } catch (error) {
    return { error: error.message, status: 500 };
  }
};

export const createJournalAssignment = async (
  workspaceId,
  weekNumber,
  startDate,
  endDate
) => {
  if (!workspaceId || !weekNumber || !startDate || !endDate) {
    throw new Error(
      "Missing required fields for creating a journal assignment"
    );
  }

  try {
    await db.query(
      `INSERT INTO journal_assignment (name, workspace_id, start_date, end_date, week_number)
             VALUES ($1, $2, $3, $4, $5)`,
      [
        `Journal Week ${weekNumber}`,
        workspaceId,
        startDate,
        endDate,
        weekNumber,
      ]
    );
  } catch (err) {
    throw new Error("Error creating journal assignment", 500);
  }
};

export const submitJournalEntry = async (
  journalAssignmentId,
  userId,
  content
) => {
  if (!journalAssignmentId || !userId || !content) {
    throw new Error(
      "Missing required fields for submitting a journal entry",
      400
    );
  }

  // Fetch the journal assignment to check its start and end dates
  const res = await db.query(
    `SELECT start_date, end_date FROM journal_assignment WHERE id = $1`,
    [journalAssignmentId]
  );

  if (res.length === 0) {
    throw new Error("Journal assignment not found", 404);
  }

  const { start_date, end_date } = res[0];
  const now = new Date();

  // Check if the current date is within the start and end dates
  if (now < start_date || now > end_date) {
    throw new Error(
      "Journal entry submission is not allowed outside the assignment period",
      403
    );
  }

  // Insert or update the journal entry
  await db.query(
    `INSERT INTO journal_entries (journal_assignment_id, user_id, content)
         VALUES ($1, $2, $3)
         ON CONFLICT (journal_assignment_id, user_id) DO UPDATE SET content = EXCLUDED.content, submitted_at = CURRENT_TIMESTAMP`,
    [journalAssignmentId, userId, content]
  );
};

export const getJournalsByUserAndWorkspace = async (workspaceId, userId) => {
  const res = await db.query(
    `SELECT ja.id AS "journalAssignmentId", ja.name, ja.week_number, ja.start_date AS "startDate", ja.end_date AS "endDate", 
                je.content, je.submitted_at AS "submittedAt"
         FROM journal_assignment AS ja
         LEFT JOIN journal_entries AS je ON ja.id = je.journal_assignment_id AND je.user_id = $2
         WHERE ja.workspace_id = $1
         ORDER BY ja.start_date ASC`,
    [workspaceId, userId]
  );

  if (res.length === 0) {
    throw new Error(
      "No journals found for the specified user in this workspace",
      404
    );
  }

  return res;
};

//get journal by id
export const getJournalById = async (journalAssignmentId, userId) => {
  const res = await db.query(
    `SELECT ja.id AS "journalAssignmentId", ja.name, ja.start_date AS "startDate", ja.end_date AS "endDate", 
                je.content, je.submitted_at AS "submittedAt"
         FROM journal_assignment AS ja
         LEFT JOIN journal_entries AS je ON ja.id = je.journal_assignment_id AND je.user_id = $2
         WHERE ja.id = $1`,
    [journalAssignmentId, userId]
  );

  if (res.length === 0) {
    throw new Error("Journal assignment not found", 404);
  }

  return res[0];
};

export const getWeeks = async (workspaceId) => {
  const res = await db.query(
    `SELECT DISTINCT week_number, start_date, end_date
         FROM journal_assignment
         WHERE workspace_id = $1
         ORDER BY week_number ASC`,
    [workspaceId]
  );

  const now = new Date();

  const weeks = {
    past: [],
    current: [],
    future: [],
  };

  if (res.rowCount > 0) {
    res.rows.forEach((row) => {
      const startDate = new Date(row.start_date);
      const endDate = new Date(row.end_date);

      if (now > endDate) {
        weeks.past.push(row.week_number);
      } else if (now >= startDate && now <= endDate) {
        weeks.current.push(row.week_number);
      } else if (now < startDate) {
        weeks.future.push(row.week_number);
      }
    });
  }

  return weeks;
};
