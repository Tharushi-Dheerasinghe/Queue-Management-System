import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createOrganization,
  getOrganizationById,
  getOrganizationsList,
  getOrganizations,
  updateOrganization,
} from "../controllers/organizationController.js";

const organizationRouter = express.Router();

organizationRouter.post("/", authMiddleware, createOrganization);
organizationRouter.get("/", authMiddleware, getOrganizations);
organizationRouter.get("/list", getOrganizationsList);
organizationRouter.get("/:id", authMiddleware, getOrganizationById);
organizationRouter.patch("/:id", authMiddleware, updateOrganization);

export default organizationRouter;
