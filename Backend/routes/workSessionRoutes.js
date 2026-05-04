import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  endStaffTask,
  getCurrentStaffTask,
  getStaffBranchCounters,
  getStaffBranchServices,
  startStaffTask,
} from "../controllers/staffController.js";

const workSessionRouter = express.Router();

workSessionRouter.post("/start", authMiddleware, startStaffTask);
workSessionRouter.get("/current", authMiddleware, getCurrentStaffTask);
workSessionRouter.patch("/end", authMiddleware, endStaffTask);
workSessionRouter.get("/services", authMiddleware, getStaffBranchServices);
workSessionRouter.get("/counters", authMiddleware, getStaffBranchCounters);

export default workSessionRouter;
