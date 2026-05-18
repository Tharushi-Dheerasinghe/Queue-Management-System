import express from "express";
import { createToken, getToken, updateTokenStatus, trackTokenByNumber, getUserBookings, callNextToken, skipAndCallNextToken, getNextWaitingToken, getWaitingTokenCount, getProcessedTokensByCounter, completeAndCallNextToken, getIotQueueStatus, getWaitingTokensList, recallToken, getWaitRejectedList, getActiveTokens } from "../controllers/tokenController.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const tokenrouter = express.Router();

// Specific routes first (must be before /:id to avoid being matched as a parameter)
tokenrouter.get("/my-bookings", authMiddleware, getUserBookings);
tokenrouter.post("/call-next", authMiddleware, callNextToken);
tokenrouter.post("/skip-and-call-next", authMiddleware, skipAndCallNextToken);
tokenrouter.get("/next-waiting", authMiddleware, getNextWaitingToken);
tokenrouter.get("/waiting-count", authMiddleware, getWaitingTokenCount);
tokenrouter.get("/waiting-list", authMiddleware, getWaitingTokensList);
tokenrouter.get("/wait-rejected-list", authMiddleware, getWaitRejectedList);
tokenrouter.get("/active-tokens", authMiddleware, getActiveTokens);
tokenrouter.get("/processed-history", authMiddleware, getProcessedTokensByCounter);
tokenrouter.post("/iot/complete-and-next", completeAndCallNextToken);
tokenrouter.get("/iot/status", getIotQueueStatus);
tokenrouter.post("/:id/recall", authMiddleware, recallToken);
tokenrouter.get("/track/:tokenNumber", trackTokenByNumber);

// Create, update, and generic get must be after specific routes
tokenrouter.post("/", createToken);
tokenrouter.patch("/:id/status", updateTokenStatus);

// Generic routes last (most general pattern)
tokenrouter.get("/:id", getToken);

export default tokenrouter;