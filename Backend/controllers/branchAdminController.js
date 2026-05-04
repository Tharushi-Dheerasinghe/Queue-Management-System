import Branch from "../models/Branch.js";
import Counter from "../models/Counter.js";
import Service from "../models/Service.js";
import Token from "../models/Token.js";
import User from "../models/User.js";

/**
 * Branch-admin scoped dashboard counts.
 * Scope is derived from req.user and cannot be overridden by client input.
 */
export const getBranchAdminCounts = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    if (req.user.role !== "branch_admin") {
      return res.status(403).json({
        success: false,
        message: "Only branch admins can access branch dashboard counts",
      });
    }

    const branchId = req.user.branchId;
    if (!branchId) {
      return res.status(403).json({
        success: false,
        message: "Logged-in user does not have a branchId",
      });
    }

    const branchScopeFilter = {
      _id: branchId,
      tenantType: req.user.tenantType || undefined,
      organizationId: req.user.organizationId || undefined,
      divisionId: req.user.divisionId || undefined,
    };

    // Remove undefined keys from filter object.
    Object.keys(branchScopeFilter).forEach((key) => {
      if (branchScopeFilter[key] === undefined) {
        delete branchScopeFilter[key];
      }
    });

    const branch = await Branch.findOne(branchScopeFilter).lean();
    if (!branch) {
      return res.status(403).json({
        success: false,
        message: "Access denied for this branch",
      });
    }

    const staffCount = await User.countDocuments({
      branchId,
      role: { $in: ["staff", "police_staff"] },
    });

    const tokenFilter = {
      tenantType: req.user.tenantType || branch.tenantType,
      branch: branch.branchName,
    };

    if (req.user.organizationName) {
      tokenFilter.organization = req.user.organizationName;
    }

    const tokensCount = await Token.countDocuments(tokenFilter);
    const operationsCount = await Token.countDocuments({
      ...tokenFilter,
      status: { $ne: "Waiting" },
    });
    const tasksCount = await Token.countDocuments({
      ...tokenFilter,
      status: "Waiting",
    });

    return res.status(200).json({
      success: true,
      counts: {
        staff: staffCount,
        tokens: tokensCount,
        operations: operationsCount,
        tasks: tasksCount,
      },
    });
  } catch (error) {
    console.error("getBranchAdminCounts error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching branch admin counts",
    });
  }
};

export const getBranchAdminOperations = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const requesterRole = String(req.user.role || "").trim().toLowerCase();
    if (requesterRole !== "branch_admin") {
      return res.status(403).json({
        success: false,
        message: "Only branch_admin can access branch operations",
      });
    }

    const branchId = req.user.branchId || null;
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Logged-in user does not have a branchId",
      });
    }

    const branch = await Branch.findById(branchId).select("_id branchName").lean();
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const [services, counters, staffUsers] = await Promise.all([
      Service.find({ branchIds: { $in: [branchId] } })
        .select("_id serviceName status")
        .sort({ createdAt: -1 })
        .lean(),
      Counter.find({ branchId })
        .select("_id serviceId counterName status assignedStaffId")
        .sort({ createdAt: -1 })
        .lean(),
      User.find({ role: "staff", branchId })
        .select("_id name email status")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const staffById = new Map(staffUsers.map((staff) => [String(staff._id), staff]));

    const countersByServiceId = new Map();
    const assignedStaffIds = new Set();

    for (const counter of counters) {
      if (!counter.serviceId) {
        continue;
      }

      const serviceKey = String(counter.serviceId);
      if (!countersByServiceId.has(serviceKey)) {
        countersByServiceId.set(serviceKey, []);
      }

      const assignedStaff = counter.assignedStaffId
        ? staffById.get(String(counter.assignedStaffId)) || null
        : null;

      if (assignedStaff) {
        assignedStaffIds.add(String(assignedStaff._id));
      }

      countersByServiceId.get(serviceKey).push({
        counterId: counter._id,
        counterName: counter.counterName,
        status: counter.status,
        assignedStaff: assignedStaff
          ? {
              id: assignedStaff._id,
              name: assignedStaff.name,
              email: assignedStaff.email,
              status: assignedStaff.status,
            }
          : null,
      });
    }

    const servicesResponse = services.map((service) => {
      const serviceCounters = countersByServiceId.get(String(service._id)) || [];

      return {
        serviceId: service._id,
        serviceName: service.serviceName,
        status: service.status,
        counters: serviceCounters,
        activeCounterCount: serviceCounters.filter((counter) => counter.status === "active").length,
        inactiveCounterCount: serviceCounters.filter((counter) => counter.status !== "active").length,
      };
    });

    const unassignedCounters = counters
    .filter((counter) => !counter.serviceId)
    .map((counter) => ({
      counterId: counter._id,
      counterName: counter.counterName,
      status: counter.status,
    }));

    const activeStaff = staffUsers
      .filter((staff) => String(staff.status || "").toLowerCase() === "active")
      .map((staff) => ({
        id: staff._id,
        name: staff.name,
        email: staff.email,
        status: staff.status,
      }));

    const inactiveStaff = staffUsers
      .filter((staff) => String(staff.status || "").toLowerCase() !== "active")
      .map((staff) => ({
        id: staff._id,
        name: staff.name,
        email: staff.email,
        status: staff.status,
      }));

    const unassignedStaff = staffUsers
      .filter((staff) => !assignedStaffIds.has(String(staff._id)))
      .map((staff) => ({
        id: staff._id,
        name: staff.name,
        email: staff.email,
        status: staff.status,
      }));

    return res.status(200).json({
      branch: {
        branchId: branch._id,
        branchName: branch.branchName,
      },
      services: servicesResponse,
      unassignedCounters: unassignedCounters,
      staffSummary: {
        activeStaff,
        inactiveStaff,
        unassignedStaff,
      },
    });
  } catch (error) {
    console.error("getBranchAdminOperations error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching branch operations",
    });
  }
};
