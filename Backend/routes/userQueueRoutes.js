import express from "express";
import {
	getUserBranches,
	getUserPoliceDivisions,
	getUserServices,
} from "../controllers/userQueueController.js";

const userQueueRouter = express.Router();

// GET /api/user/police-divisions
userQueueRouter.get("/police-divisions", getUserPoliceDivisions);

// GET /api/user/branches?tenantType=...&organization=...
userQueueRouter.get("/branches", getUserBranches);

// GET /api/user/services?tenantType=...&branchId=...
userQueueRouter.get("/services", getUserServices);

export default userQueueRouter;
