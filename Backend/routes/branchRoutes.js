import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
	createBranch,
	createCompanyBranch,
	createHospitalBranch,
	getBranchById,
	getBranchesByOrganization,
	getPublicBranches,
	getBranches,
	updateBranch,
} from "../controllers/branchController.js";

const branchRouter = express.Router();

branchRouter.get("/list/public", getPublicBranches);
branchRouter.get("/public/list", getBranchesByOrganization);
branchRouter.post("/", authMiddleware, createBranch);
branchRouter.get("/", authMiddleware, getBranches);
branchRouter.get("/:id", authMiddleware, getBranchById);
branchRouter.patch("/:id", authMiddleware, updateBranch);

// Legacy aliases kept for migration safety.
branchRouter.post("/hospital", authMiddleware, createHospitalBranch);
branchRouter.post("/company", authMiddleware, createCompanyBranch);

export default branchRouter;
