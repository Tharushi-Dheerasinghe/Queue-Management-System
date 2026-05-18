import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createOrganization,
  getOrganizationById,
  getOrganizationsList,
  getOrganizations,
  updateOrganization,
  bulkCreateSystem,
  getActiveTenantTypes,
  deleteOrganization,
  getSystemLinks,
} from "../controllers/organizationController.js";

const organizationRouter = express.Router();

organizationRouter.post("/", authMiddleware, createOrganization);
organizationRouter.post("/system-builder", authMiddleware, bulkCreateSystem);
organizationRouter.get("/", authMiddleware, getOrganizations);
organizationRouter.get("/tenant-types", getActiveTenantTypes);
organizationRouter.get("/list", getOrganizationsList);
organizationRouter.get("/:id/system-links", authMiddleware, getSystemLinks);
organizationRouter.get("/:id", authMiddleware, getOrganizationById);
organizationRouter.patch("/:id", authMiddleware, updateOrganization);
organizationRouter.delete("/:id", authMiddleware, deleteOrganization);

export default organizationRouter;
