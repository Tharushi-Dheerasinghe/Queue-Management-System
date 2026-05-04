import express from "express";
import {
	createStaffUser,
	endStaffTask,
	getStaffBranchCounters,
	getStaffBranchServices,
	getCurrentStaffTask,
	getStaffUsers,
	startStaffTask,
} from "../controllers/staffController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const staffRouter = express.Router();

// GET /api/staff - List staff users in branch_admin's own branch scope
staffRouter.get("/", authMiddleware, getStaffUsers);

// POST /api/staff - Create staff user in branch_admin's own branch scope
staffRouter.post("/", authMiddleware, createStaffUser);

// Canonical work-session routes for the common multi-tenant flow.
staffRouter.post("/work-sessions/start", authMiddleware, startStaffTask);
staffRouter.get("/work-sessions/current", authMiddleware, getCurrentStaffTask);
staffRouter.patch("/work-sessions/end", authMiddleware, endStaffTask);
staffRouter.get("/work-sessions/services", authMiddleware, getStaffBranchServices);
staffRouter.get("/work-sessions/counters", authMiddleware, getStaffBranchCounters);

// POST /api/staff/tasks/start - Start active staff work session on selected service and counter
staffRouter.post("/tasks/start", authMiddleware, startStaffTask);

// GET /api/staff/tasks/current - Get current active task for logged-in staff
staffRouter.get("/tasks/current", authMiddleware, getCurrentStaffTask);

// PATCH /api/staff/tasks/end - Complete active work session for logged-in staff
staffRouter.patch("/tasks/end", authMiddleware, endStaffTask);

// GET /api/staff/tasks/services - List branch services for logged-in staff
staffRouter.get("/tasks/services", authMiddleware, getStaffBranchServices);

// GET /api/staff/tasks/counters - List branch counters for logged-in staff
staffRouter.get("/tasks/counters", authMiddleware, getStaffBranchCounters);

export default staffRouter;
