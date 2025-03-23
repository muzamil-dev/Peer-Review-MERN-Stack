import express from "express";
import dotenv from "dotenv";

dotenv.config();

// Import JWT
import verifyJWT from "../middleware/verifyJWT.js";

// Import services
import * as WorkspaceService from "../services/workspaces.js";
import * as AssignmentService from "../services/assignments.js";
import * as journalService from "../services/journals.js";
import * as UserService from "../services/users.js";

// Function to generate invite codes
import generateCode from "../services/generateCode.js";
import { sendEmail } from "../services/emailService.js";

const router = express.Router();

// Require JWT
if (process.env.JWT_ENABLED === "true") router.use(verifyJWT);

// Get details about a specific workspace
router.get("/:workspaceId", async (req, res) => {
  const { workspaceId } = req.params;
  // Call getById
  const data = await WorkspaceService.getById(workspaceId);
  // Send the error if the service returned one
  if (data.error) return res.status(data.status).json({ message: data.error });
  return res.status(200).json(data);
});

// Get all assignments for a provided workspace
router.get("/:workspaceId/assignments", async (req, res) => {
  const { workspaceId } = req.params;
  // Make the call to the service
  const data = await AssignmentService.getByWorkspace(workspaceId);
  // Send the error if the service returned one
  if (data.error) return res.status(data.status).json({ message: data.error });
  return res.status(200).json(data);
});

// Gets a list of groups (with members) from the workspace
router.get("/:workspaceId/groups", async (req, res) => {
  const { workspaceId } = req.params;
  // Make the call to the service
  const data = await WorkspaceService.getGroups(workspaceId);
  // Send the error if the service returned one
  if (data.error) return res.status(data.status).json({ message: data.error });
  return res.status(200).json(data);
});

// Gets a list of students from the workspace
router.get("/:workspaceId/students", async (req, res) => {
  const { workspaceId } = req.params;
  // Make the call to the service
  const data = await WorkspaceService.getStudents(workspaceId);
  // Send the error if the service returned one
  if (data.error) return res.status(data.status).json({ message: data.error });
  return res.status(200).json(data);
});

// Gets students in a workspace with no group
router.get("/:workspaceId/ungrouped", async (req, res) => {
  const { workspaceId } = req.params;
  // Make the call to the service
  const data = await WorkspaceService.getUngrouped(workspaceId);
  // Send the error if the service returned one
  if (data.error) return res.status(data.status).json({ message: data.error });
  return res.status(200).json(data);
});

// Creates a new workspace
router.post("/create", async (req, res) => {
  // Check for required fields
  const { name, allowedDomains, groupMemberLimit, numGroups } = req.body;
  const userId = req.user;

  if (!name || !userId) {
    return res
      .status(400)
      .json({ message: "One or more required fields is not present" });
  }
  // Create a settings object with all fields
  const settings = {
    name,
    allowedDomains,
    groupMemberLimit,
    numGroups,
  };
  // Call the service
  const data = await WorkspaceService.create(userId, settings);
  // Send the error if the service returned one
  if (data.error) return res.status(data.status).json({ message: data.error });
  return res.status(201).json(data);
});

// Edit a workspace
router.put("/edit", async (req, res) => {
  // Check for required fields
  const { workspaceId, name, allowedDomains, groupMemberLimit, groupLock } =
    req.body;
  const userId = req.user;

  if (!userId || !workspaceId) {
    return res
      .status(400)
      .json({ message: "One or more required fields is not present" });
  }
  // Create a settings object with all fields
  const settings = {
    name,
    allowedDomains,
    groupMemberLimit,
    groupLock,
  };
  // Call the service
  const data = await WorkspaceService.edit(userId, workspaceId, settings);
  // Send the error if the service returned one
  if (data.error) return res.status(data.status).json({ message: data.error });
  return res.status(200).json(data);
});

// Join a workspace
router.put("/join", async (req, res) => {
  // Check for required fields
  const { inviteCode } = req.body;
  const userId = req.user;

  if (!userId || !inviteCode) {
    return res
      .status(400)
      .json({ message: "One or more required fields is not present" });
  }
  // Call the service
  const data = await WorkspaceService.join(userId, inviteCode);
  // Send the error if the service returned one
  if (data.error) return res.status(data.status).json({ message: data.error });
  return res.status(200).json(data);
});

// Leave a workspace
router.put("/leave", async (req, res) => {
  // Check for required fields
  const { workspaceId } = req.body;
  const userId = req.user;

  if (!userId || !workspaceId) {
    return res
      .status(400)
      .json({ message: "One or more required fields is not present" });
  }
  // Call the service
  const data = await WorkspaceService.leave(userId, workspaceId);
  // Send the error if the service returned one
  if (data.error) return res.status(data.status).json({ message: data.error });
  return res.status(200).json(data);
});

// Remove a user from a workspace
router.put("/removeUser", async (req, res) => {
  // Check for required fields
  const { targetId, workspaceId } = req.body;
  const userId = req.user;

  if (!userId || !targetId || !workspaceId) {
    return res
      .status(400)
      .json({ message: "One or more required fields is not present" });
  }
  // Call the service
  const data = await WorkspaceService.removeUser(userId, targetId, workspaceId);
  // Send the error if the service returned one
  if (data.error) return res.status(data.status).json({ message: data.error });
  return res.status(200).json(data);
});

// Remove a user from a workspace
router.put("/removeUser", async (req, res) => {
  // Check for required fields
  const { targetId, workspaceId } = req.body;
  const userId = req.user;

  if (!userId || !targetId || !workspaceId) {
    return res
      .status(400)
      .json({ message: "One or more required fields is not present" });
  }
  // Call the service
  const data = await WorkspaceService.removeUser(userId, targetId, workspaceId);
  // Send the error if the service returned one
  if (data.error) return res.status(data.status).json({ message: data.error });
  return res.status(200).json(data);
});

// Sets the active invite code
router.put("/setInvite", async (req, res) => {
  // Check for required fields
  const { workspaceId } = req.body;
  const userId = req.user;

  if (!userId || !workspaceId) {
    return res
      .status(400)
      .json({ message: "One or more required fields is not present" });
  }
  // Call the service
  const data = await WorkspaceService.setInvite(
    userId,
    workspaceId,
    generateCode()
  );
  // Send the error if the service returned one
  if (data.error) return res.status(data.status).json({ message: data.error });
  return res.status(200).json(data);
});

// Remove the active code, effectively locking the workspace
router.delete("/:workspaceId/removeInvite", async (req, res) => {
  // Get fields
  const { workspaceId } = req.params;
  const userId = req.user;

  // Call the service
  const data = await WorkspaceService.setInvite(userId, workspaceId, null);
  // Send the error if the service returned one
  if (data.error) return res.status(data.status).json({ message: data.error });
  return res.status(200).json(data);
});

// Delete a workspace entirely
router.delete("/:workspaceId", async (req, res) => {
  // Get fields
  const { workspaceId } = req.params;
  const userId = req.user;

  // Call the service
  const data = await WorkspaceService.deleteWorkspace(userId, workspaceId);
  // Send the error if the service returned one
  if (data.error) return res.status(data.status).json({ message: data.error });
  return res.status(200).json(data);
});

// Route to create multiple journal assignments
router.post("/:workspaceId/createJournals", async (req, res) => {
  const { workspaceId } = req.params;
  const { startDate, endDate, journalDay, weekNumbersToSkip } = req.body;

  try {
    const journalDates = journalService.generateJournalDates(
      startDate,
      endDate,
      journalDay,
      weekNumbersToSkip
    );

    for (const [weekNumber, journal] of journalDates.entries()) {
      await journalService.createJournalAssignment(
        workspaceId,
        weekNumber + 1,
        journal.start,
        journal.end
      );
    }
    res.status(201).json({ message: "Journals created successfully" });
  } catch (err) {
    if (err instanceof Error) {
      res.status(err.status).json({ message: err.message });
    } else {
      console.error("Error creating journals:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

// Get all journals submitted by a user in a specific workspace
router.get(
  ["/:workspaceId/user", "/:workspaceId/user/:userId"],
  async (req, res) => {
    const { workspaceId } = req.params;
    const userId = req.user || req.body.userId;

    try {
      // If a userId is provided in the route parameter, check if the requester is an instructor
      await WorkspaceService.checkInstructor(userId, workspaceId);

      const journals = await journalService.getJournalsByUserAndWorkspace(
        workspaceId,
        userId
      );

      res.status(200).json(journals);
    } catch (err) {
      if (err instanceof Error) {
        res.status(err.status).json({ message: err.message });
      } else {
        console.error("Error fetching journals:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
);

//get number of weeks in journal_assignment
router.get("/:workspaceId/weeks", async (req, res) => {
  const { workspaceId } = req.params;
  try {
    const weeks = await journalService.getWeeks(workspaceId);
    return res.json(weeks);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

// Insert a single user into the workspace, creates their account if
// it does not exist
router.post("/insertUser", async (req, res) => {
  const { userId, workspaceId, groupId, firstName, lastName, email, role } =
    req.body;
  try {
    // Check for required fields
    if (!workspaceId || !email || !role) {
      const err = new Error("One or more required fields is not present");
      err.status = 400;
      throw err;
    }
    if (role !== "Student" && role !== "Instructor") {
      const err = new Error("Role must be either student or instructor", 400);
      err.status = 400;
      throw err;
    }
    // Check that either the student is given a group, or the instructor is given no group
    if (role === "Student" && !groupId) {
      const err = new Error("Student must be placed into a group", 400);
      err.status = 400;
      throw err;
    }
    if (role === "Instructor" && groupId) {
      const err = new Error("Instructors cannot be placed in groups", 400);
      err.status = 400;
      throw err;
    }
    // Check out a client
    // Authenticate instructor
    let password = generateCode();
    await WorkspaceService.checkInstructor(userId, workspaceId);

    // Create the account if it doesn't exist
    let user = await UserService.createUser({
      firstName,
      lastName,
      email,
      password,
    });

    // Insert the user into the workspace
    await WorkspaceService.insertUser(workspaceId, {
      userId: user.id,
      groupId,
      role,
    });

    let message = `<div><h1>Login Information</h1><h3>Username: ${user.email}></h3> <h3>Password ${user.password}</h3></div>`;
    await sendEmail(user.email, "Rate My Peer Invitation", message);
    return res.status(201).json({ message: "User inserted successfully" });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

export default router;
