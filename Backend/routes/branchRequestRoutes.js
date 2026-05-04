import express from "express";
import {
	approveBranchRequest,
	createBranchRequest,
	getMyBranchRequests,
	getPendingBranchRequests,
	rejectBranchRequest,
} from "../controllers/branchRequestController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const branchRequestRouter = express.Router();

// POST /api/branch-requests - Create a branch request for organization_admin users
branchRequestRouter.post("/", authMiddleware, createBranchRequest);

// GET /api/branch-requests/pending - List pending branch requests for the signed-in super_admin tenantType
branchRequestRouter.get("/pending", authMiddleware, getPendingBranchRequests);

// GET /api/branch-requests/my - List pending branch requests for logged-in organization_admin
branchRequestRouter.get("/my", authMiddleware, getMyBranchRequests);

// PATCH /api/branch-requests/:id/approve - Approve pending branch request
branchRequestRouter.patch("/:id/approve", authMiddleware, approveBranchRequest);

// PATCH /api/branch-requests/:id/reject - Reject pending branch request
branchRequestRouter.patch("/:id/reject", authMiddleware, rejectBranchRequest);

export default branchRequestRouter;
