import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import tokenRoutes from "./routes/tokenRoutes.js";
import userRouter from "./routes/userRoutes.js";
import organizationAdminRouter from "./routes/organizationAdminRoutes.js";
import organizationRouter from "./routes/organizationRoutes.js";
import branchRouter from "./routes/branchRoutes.js";
import serviceRouter from "./routes/serviceRoutes.js";
import branchRequestRouter from "./routes/branchRequestRoutes.js";
import branchAdminRouter from "./routes/branchAdminRoutes.js";
import staffRouter from "./routes/staffRoutes.js";
import counterRouter from "./routes/counterRoutes.js";
import workSessionRouter from "./routes/workSessionRoutes.js";
import userQueueRouter from "./routes/userQueueRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
// Deprecated alias kept during migration.
app.use("/api/tokens", tokenRoutes);
app.use("/api/users", userRouter);
app.use("/api/organizations", organizationRouter);
// Deprecated tenant-specific alias kept during migration.
app.use("/api/organization-admin", organizationAdminRouter);
// Deprecated tenant-specific alias kept during migration.
app.use("/api/organization", organizationAdminRouter);
app.use("/api/branches", branchRouter);
app.use("/api/services", serviceRouter);
app.use("/api/branch-requests", branchRequestRouter);
app.use("/api/work-sessions", workSessionRouter);
app.use("/api/branch-admin", branchAdminRouter);
app.use("/api/staff", staffRouter);
app.use("/api/counters", counterRouter);
// Canonical booking support route.
app.use("/api/customer", userQueueRouter);
// Deprecated alias kept during migration.
app.use("/api/user", userQueueRouter);
app.use("/api/notifications", notificationRouter);
// test route
app.get("/", (req, res) => {
  res.send("API Running...");
});

export default app;