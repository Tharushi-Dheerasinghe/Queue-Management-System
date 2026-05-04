import express from "express";
import { getNotifications, markAsRead, markAllAsRead } from "../controllers/notificationController.js";
import authMiddleware from "../middlewares/authMiddleware.js";


const notificationRouter = express.Router();

notificationRouter.get("/", authMiddleware, getNotifications);
notificationRouter.patch("/:id/read", authMiddleware, markAsRead);
notificationRouter.post("/mark-all-read", authMiddleware, markAllAsRead);

export default notificationRouter;