import express from "express";
import { getBranchAdminCounts, getBranchAdminOperations } from "../controllers/branchAdminController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const branchAdminRouter = express.Router();

// GET /api/branch-admin/counts - branch scoped dashboard counts (from req.user.branchId)
branchAdminRouter.get("/counts", authMiddleware, getBranchAdminCounts);

// GET /api/branch-admin/operations - branch scoped operations dashboard data
branchAdminRouter.get("/operations", authMiddleware, getBranchAdminOperations);

export default branchAdminRouter;
