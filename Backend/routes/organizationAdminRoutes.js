import express from "express";
import {
	addOrganizationBranchService,
	getOrganizationAdminCounts,
	getOrganizationBranchAdminsGrouped,
	getOrganizationBranchServices,
} from "../controllers/organizationAdminController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const organizationAdminRouter = express.Router();

// GET endpoint for organization admin dashboard counts
// Query params: tenantType (required), divisionId (for police), organizationId (for bank/supermarket/hospital)
organizationAdminRouter.get("/counts", getOrganizationAdminCounts);

// GET /api/organization/branch-admins - Branch admins grouped by branch for organization_admin
organizationAdminRouter.get("/branch-admins", authMiddleware, getOrganizationBranchAdminsGrouped);

// GET /api/organization/branch-services - Branch services grouped by branch for organization_admin
organizationAdminRouter.get("/branch-services", authMiddleware, getOrganizationBranchServices);

// POST /api/organization/services - Add a service to a scoped branch for organization_admin
organizationAdminRouter.post("/services", authMiddleware, addOrganizationBranchService);

export default organizationAdminRouter;
