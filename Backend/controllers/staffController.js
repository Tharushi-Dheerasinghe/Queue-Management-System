import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Service from "../models/Service.js";
import Counter from "../models/Counter.js";
import Token from "../models/Token.js";
import WorkSession from "../models/WorkSession.js";
import { createNotification } from "./notificationController.js";
import {
  getBranchScope,
  isStaff,
  normalizeTenantType,
} from "../utils/scopeHelpers.js";

const normalizeText = (value = "") => String(value || "").trim();

const getStaffScope = (user = {}) => {
  const branchScope = getBranchScope(user);
  const tenantType = normalizeTenantType(user?.tenantType);
  const organizationId = branchScope.organizationId || null;

  return {
    tenantType,
    organizationId,
    branchId: branchScope.branchId || null,
    branchName: branchScope.branchName || "",
    divisionId: user?.divisionId || null,
  };
};

const buildScopedWorkSessionQuery = (user = {}, extraQuery = {}) => {
  const scope = getStaffScope(user);

  return {
    tenantType: scope.tenantType,
    organizationId: scope.organizationId,
    branchId: scope.branchId,
    ...extraQuery,
  };
};

export const getStaffBranchServices = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    if (!isStaff(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only staff can view branch services",
      });
    }

    const scope = getStaffScope(req.user);
    if (!scope.branchId) {
      return res.status(400).json({
        success: false,
        message: "Staff branch scope is missing",
      });
    }

    const serviceQuery = {
      tenantType: scope.tenantType,
      branchIds: { $in: [scope.branchId] },
    };

    if (scope.organizationId) {
      serviceQuery.organizationId = scope.organizationId;
    }

    const services = await Service.find(serviceQuery)
      .select("_id serviceName status")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      services: services.map((service) => ({
        id: service._id,
        serviceName: service.serviceName,
        status: service.status,
      })),
    });
  } catch (error) {
    console.error("getStaffBranchServices error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching branch services",
    });
  }
};

export const getStaffBranchCounters = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    if (!isStaff(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only staff can view branch counters",
      });
    }

    const scope = getStaffScope(req.user);
    if (!scope.branchId) {
      return res.status(400).json({
        success: false,
        message: "Staff branch scope is missing",
      });
    }

    const counterQuery = {
      tenantType: scope.tenantType,
      branchId: scope.branchId,
    };

    if (scope.organizationId) {
      counterQuery.organizationId = scope.organizationId;
    }

    const counters = await Counter.find(counterQuery)
      .select("_id serviceId counterName status")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      counters: counters.map((counter) => ({
        id: counter._id,
        serviceId: counter.serviceId || null,
        counterName: counter.counterName,
        status: counter.status,
      })),
    });
  } catch (error) {
    console.error("getStaffBranchCounters error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching branch counters",
    });
  }
};

export const getCurrentStaffTask = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    if (!isStaff(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only staff can view current task",
      });
    }

    const scope = getStaffScope(req.user);
    if (!scope.branchId) {
      return res.status(400).json({
        success: false,
        message: "Staff branch scope is missing",
      });
    }

    const activeSession = await WorkSession.findOne(
      buildScopedWorkSessionQuery(req.user, {
        staffId: req.user.id,
        status: "active",
      }),
    )
      .select(
        "_id serviceId serviceName counterId counterName startedAt status",
      )
      .sort({ startedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      currentTask: activeSession
        ? {
            id: activeSession._id,
            serviceId: activeSession.serviceId,
            serviceName: activeSession.serviceName,
            counterId: activeSession.counterId,
            counterName: activeSession.counterName,
            startedAt: activeSession.startedAt,
            status: activeSession.status,
          }
        : null,
    });
  } catch (error) {
    console.error("getCurrentStaffTask error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching current staff task",
    });
  }
};

export const startStaffTask = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    if (!isStaff(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only staff can start tasks",
      });
    }

    const { serviceId, counterId } = req.body || {};

    if (!serviceId || !counterId) {
      return res.status(400).json({
        success: false,
        message: "serviceId and counterId are required",
      });
    }

    const scope = getStaffScope(req.user);
    if (!scope.branchId) {
      return res.status(400).json({
        success: false,
        message: "Staff branch scope is missing",
      });
    }

    const existingActiveSession = await WorkSession.findOne(
      buildScopedWorkSessionQuery(req.user, {
        staffId: req.user.id,
        status: "active",
      }),
    )
      .select("_id startedAt")
      .lean();

    if (existingActiveSession) {
      return res.status(409).json({
        success: false,
        message: "Staff already has an active work session",
      });
    }

    const [service, counter, staffUser] = await Promise.all([
      Service.findById(serviceId).select(
        "_id tenantType organizationId divisionId branchIds serviceName status",
      ),
      Counter.findById(counterId).select(
        "_id tenantType organizationId divisionId branchId serviceId counterName status assignedStaffId",
      ),
      User.findById(req.user.id).select(
        "_id name tenantType organizationId divisionId branchId branchName status role",
      ),
    ]);

    if (!staffUser || !isStaff(staffUser)) {
      return res.status(403).json({
        success: false,
        message: "Only staff can start tasks",
      });
    }

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (!counter) {
      return res.status(404).json({
        success: false,
        message: "Counter not found",
      });
    }

    const serviceOrganizationId = service.organizationId || null;
    const counterOrganizationId = counter.organizationId || null;
    const organizationId = scope.organizationId || null;

    if (
      service.tenantType !== scope.tenantType ||
      counter.tenantType !== scope.tenantType
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Selected service or counter does not belong to your tenantType",
      });
    }

    const serviceBranchIds = Array.isArray(service.branchIds)
      ? service.branchIds.map((id) => String(id))
      : [];

    if (!serviceBranchIds.includes(String(scope.branchId))) {
      return res.status(403).json({
        success: false,
        message: "Selected service does not belong to your branch",
      });
    }

    if (String(counter.branchId) !== String(scope.branchId)) {
      return res.status(403).json({
        success: false,
        message: "Selected counter does not belong to your branch",
      });
    }

    if (
      organizationId &&
      serviceOrganizationId &&
      String(serviceOrganizationId) !== String(organizationId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Selected service does not belong to your organization scope",
      });
    }

    if (
      organizationId &&
      counterOrganizationId &&
      String(counterOrganizationId) !== String(organizationId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Selected counter does not belong to your organization scope",
      });
    }

    if (
      counter.serviceId &&
      String(counter.serviceId) !== String(service._id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Selected counter is assigned to a different service",
      });
    }

    const workSession = await WorkSession.create({
      tenantType: scope.tenantType,
      organizationId: organizationId,
      branchId: scope.branchId,
      staffId: staffUser._id,
      staffName: staffUser.name,
      serviceId: service._id,
      serviceName: service.serviceName,
      counterId: counter._id,
      counterName: counter.counterName,
      status: "active",
      startedAt: new Date(),
    });

    await Promise.all([
      User.updateOne(
        { _id: staffUser._id }, 
        { $set: { status: "active" } }
      ),
      Counter.updateOne(
        { _id: counter._id },
        {
          $set: {
            status: "active",
            assignedStaffId: staffUser._id,
            serviceId: service._id, // තෝරාගත් සේවාව කවුන්ටරයට Assign කිරීම
          },
        },
      ),
    ]);

    const otherActiveSessions = await WorkSession.countDocuments({
      serviceId: service._id,
      branchId: scope.branchId,
      status: "active",
      _id: { $ne: workSession._id },
    });

    if (otherActiveSessions === 0) {
      const waitingTokens = await Token.find({
        branchId: scope.branchId,
        serviceId: service._id,
        status: "Waiting",
      })
        .select("userId")
        .lean();

      const waitingUserIds = [...new Set(
        waitingTokens
          .map((token) => String(token.userId || "").trim())
          .filter(Boolean)
      )];

      const notificationMessage = `Service ${service.serviceName} has started. You can now join the queue or check your status.`;

      await Promise.all(
        waitingUserIds.map((userId) =>
          createNotification({
            tenantType: scope.tenantType,
            title: "Queue Started",
            message: notificationMessage,
            type: "queue",
            module: scope.tenantType,
            userId,
          }),
        ),
      );
    }

    return res.status(201).json({
      success: true,
      message: "Work session started successfully",
      workSession,
      staff: {
        id: staffUser._id,
        status: "active",
      },
      counter: {
        id: counter._id,
        status: "active",
        assignedStaffId: staffUser._id,
      },
    });
  } catch (error) {
    console.error("startStaffTask error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while starting staff task",
    });
  }
};

export const endStaffTask = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    if (!isStaff(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only staff can end tasks",
      });
    }

    const scope = getStaffScope(req.user);
    if (!scope.branchId) {
      return res.status(400).json({
        success: false,
        message: "Staff branch scope is missing",
      });
    }

    const activeSession = await WorkSession.findOne(
      buildScopedWorkSessionQuery(req.user, {
        staffId: req.user.id,
        status: "active",
      }),
    ).sort({ startedAt: -1 });

    if (!activeSession) {
      return res.status(404).json({
        success: false,
        message: "No active work session found",
      });
    }

    const endedAt = new Date();
    const startedAt = activeSession.startedAt
      ? new Date(activeSession.startedAt)
      : endedAt;
    const durationMinutes = Math.max(
      0,
      Math.round((endedAt.getTime() - startedAt.getTime()) / 60000),
    );

    activeSession.status = "completed";
    activeSession.endedAt = endedAt;
    activeSession.durationMinutes = durationMinutes;
    await activeSession.save();

    const updates = [
      User.updateOne({ _id: req.user.id }, { $set: { status: "inactive" } }),
    ];

    if (activeSession.counterId) {
      updates.push(
        Counter.updateOne(
          { _id: activeSession.counterId },
          {
            $set: { 
              status: "inactive",
              
            },
            $unset: { assignedStaffId: "" },
          }
        )
      );
    }

    await Promise.all(updates);

    return res.status(200).json({
      success: true,
      message: "Work session ended successfully",
      workSession: {
        id: activeSession._id,
        status: activeSession.status,
        startedAt: activeSession.startedAt,
        endedAt: activeSession.endedAt,
        durationMinutes: activeSession.durationMinutes,
      },
      staff: {
        id: req.user.id,
        status: "inactive",
      },
      counter: activeSession.counterId
        ? {
            id: activeSession.counterId,
            status: "inactive",
            assignedStaffId: null,
          }
        : null,
    });
  } catch (error) {
    console.error("endStaffTask error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while ending staff task",
    });
  }
};

export const getStaffUsers = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const requesterRole = String(req.user.role || "")
      .trim()
      .toLowerCase();
    if (requesterRole !== "branch_admin") {
      return res.status(403).json({
        success: false,
        message: "Only branch_admin can view staff users",
      });
    }

    const branchId = req.user.branchId || null;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch admin branchId is required",
      });
    }

    const staffUsers = await User.find({
      role: "staff",
      branchId,
    })
      .select("_id name email username phone status")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      staff: staffUsers.map((member) => ({
        id: member._id,
        name: member.name,
        email: member.email,
        username: member.username,
        phone: member.phone,
        status: member.status,
      })),
    });
  } catch (error) {
    console.error("getStaffUsers error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching staff users",
    });
  }
};

export const createStaffUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const requesterRole = String(req.user.role || "")
      .trim()
      .toLowerCase();
    if (requesterRole !== "branch_admin") {
      return res.status(403).json({
        success: false,
        message: "Only branch_admin can create staff users",
      });
    }

    const {
      name,
      email,
      phone = "",
      username = "",
      password,
      status = "active",
    } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email, and password are required",
      });
    }

    const normalizedStatus = String(status || "")
      .trim()
      .toLowerCase();
    if (!["active", "inactive", "pending"].includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: "status must be active, inactive, or pending",
      });
    }

    // Do not trust branch-scoping values from frontend; use authenticated branch_admin scope only.
    const tenantType = req.user.tenantType || null;
    const organizationId = req.user.organizationId || null;
    const divisionId = req.user.divisionId || null;
    const branchId = req.user.branchId || null;
    const branchName = req.user.branchName || null;

    if (!tenantType || !branchId || !branchName) {
      return res.status(400).json({
        success: false,
        message:
          "Branch admin scope is incomplete. Ensure tenantType, branchId, and branchName are present.",
      });
    }

    const normalizedTenantType = String(tenantType).trim().toLowerCase();

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message:
          "Branch admin scope is incomplete. organizationId is required.",
      });
    }

    if (
      ["bank", "supermarket", "hospital", "company"].includes(
        normalizedTenantType,
      ) &&
      !organizationId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Branch admin scope is incomplete. organizationId is required for this tenant.",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staffUser = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: String(phone || "").trim(),
      username: String(username || "").trim(),
      role: "staff",
      tenantType: normalizedTenantType,
      organizationId,
      organizationName: req.user.organizationName || null,
      divisionName: req.user.divisionName || null,
      branchId,
      branchName,
      status: normalizedStatus,
    });

    return res.status(201).json({
      success: true,
      message: "Staff user created successfully",
      staff: {
        id: staffUser._id,
        name: staffUser.name,
        email: staffUser.email,
        phone: staffUser.phone,
        username: staffUser.username,
        role: staffUser.role,
        tenantType: staffUser.tenantType,
        organizationId: staffUser.organizationId,
        branchId: staffUser.branchId,
        branchName: staffUser.branchName,
        status: staffUser.status,
      },
    });
  } catch (error) {
    console.error("createStaffUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating staff user",
    });
  }
};
