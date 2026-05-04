import mongoose from "mongoose";
import Branch from "../models/Branch.js";
import Service from "../models/Service.js";
import Organization from "../models/Organization.js";

const normalize = (value = "") => String(value || "").trim();
const normalizeLower = (value = "") => normalize(value).toLowerCase();

const buildExactCaseInsensitiveRegex = (value) => {
  const escaped = String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}$`, "i");
};

export const getUserPoliceDivisions = async (req, res) => {
  try {
    const divisions = await Organization.find({
      tenantType: "police",
      status: { $in: ["approved", "active"] },
    })
      .select("_id divisionName organizationName")
      .sort({ divisionName: 1, organizationName: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      organizations: divisions
        .map((division) => ({
          id: division._id,
          name: normalize(division.divisionName || division.organizationName),
        }))
        .filter((division) => Boolean(division.name)),
    });
  } catch (error) {
    console.error("getUserPoliceDivisions error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching police divisions",
    });
  }
};

export const getUserBranches = async (req, res) => {
  try {
    const tenantType = normalizeLower(req.query.tenantType);
    const organization = normalize(req.query.organization);

    if (!tenantType) {
      return res.status(400).json({
        success: false,
        message: "tenantType query parameter is required",
      });
    }

    const query = {
      tenantType,
      status: "active",
    };

    if (organization) {
      if (tenantType === "police") {
        const policeDivisionFilter = buildExactCaseInsensitiveRegex(organization);
        query.$or = [
          { divisionName: policeDivisionFilter },
          { organizationName: policeDivisionFilter },
        ];
      } else {
        query.organizationName = buildExactCaseInsensitiveRegex(organization);
      }
    }

    const branches = await Branch.find(query)
      .select("_id branchName")
      .sort({ branchName: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      branches: branches.map((branch) => ({
        id: branch._id,
        branchName: branch.branchName,
      })),
    });
  } catch (error) {
    console.error("getUserBranches error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching branches",
    });
  }
};

export const getUserServices = async (req, res) => {
  try {
    const tenantType = normalizeLower(req.query.tenantType);
    const branchId = normalize(req.query.branchId);

    if (!tenantType || !branchId) {
      return res.status(400).json({
        success: false,
        message: "tenantType and branchId query parameters are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid branchId",
      });
    }

    const branch = await Branch.findOne({
      _id: branchId,
      tenantType,
      status: "active",
    })
      .select("_id")
      .lean();

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found for the given tenantType",
      });
    }

    const services = await Service.find({
      tenantType,
      branchIds: { $in: [branchId] },
      status: "active",
    })
      .select("_id serviceName")
      .sort({ serviceName: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      services: services.map((service) => ({
        id: service._id,
        serviceName: service.serviceName,
      })),
    });
  } catch (error) {
    console.error("getUserServices error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching services",
    });
  }
};
