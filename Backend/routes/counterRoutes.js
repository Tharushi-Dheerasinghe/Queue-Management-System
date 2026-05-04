import express from "express";
import { createCounter, updateCounterScope } from "../controllers/counterController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const counterRouter = express.Router();

// POST /api/counters - Create a counter in authenticated branch_admin scope
counterRouter.post("/", authMiddleware, createCounter);

// PUT /api/counters/:counterId - Update a counter in authenticated branch_admin scope
counterRouter.put("/:counterId", authMiddleware, updateCounterScope);



export default counterRouter;
