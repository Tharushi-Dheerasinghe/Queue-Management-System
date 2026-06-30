import bcrypt from "bcryptjs";
import Branch from "../models/Branch.js";
import User from "../models/User.js";
import Token from "../models/Token.js";
import Counter from "../models/Counter.js";
import {
  getBranchScope,
  getOrganizationScope,
  isBranchAdmin,
  isOrganizationAdmin,
  isSuperAdmin,
  normalizeTenantType,
} from "../utils/scopeHelpers.js";
import { errorResponse, successResponse } from "../utils/responseHelpers.js";
import { isValidObjectId, requireFields } from "../utils/validationHelpers.js";
import mongoose from "mongoose";
import { sendSMS } from "../utils/smsService.js";

const ALLOWED_TENANT_TYPES = new Set(["police", "hospital", "bank", "supermarket", "pharmacy", "salon"]);
const ALLOWED_STATUSES = new Set(["active", "inactive"]);

const parseBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
  }

  return Boolean(value);
};

const normalizeText = (value = "") => String(value || "").trim();

const normalizeObjectIdValue = (value) => {
  const normalized = normalizeText(value);
  return normalized || null;
};

const buildBranchResponse = (branch) => ({
  id: branch._id,
  tenantType: branch.tenantType,
  branchName: branch.branchName,
  shortName: branch.shortName,
  branchCode: branch.branchCode,
  city: branch.city,
  address: branch.address,
  contactNumber: branch.contactNumber,
  email: branch.email,
  status: branch.status,
  organizationId: branch.organizationId || null,
  organizationName: branch.organizationName || branch.divisionName || null,
  openingTime: branch.openingTime,
  closingTime: branch.closingTime,
  branchAdminAccess: Boolean(branch.branchAdminAccess),
  createdBy: branch.createdBy || null,
  createdAt: branch.createdAt,
  updatedAt: branch.updatedAt,
});

const getBranchQuery = (reqUser) => {
  const tenantType = normalizeTenantType(reqUser?.tenantType);

  if (isSuperAdmin(reqUser)) {
    return tenantType ? { tenantType } : null;
  }

  if (isOrganizationAdmin(reqUser)) {
    const scope = getOrganizationScope(reqUser);
    if (!scope.organizationId) {
      return null;
    }

    return {
      tenantType,
      organizationId: scope.organizationId,
    };
  }

  if (isBranchAdmin(reqUser)) {
    if (!reqUser?.branchId) {
      return null;
    }

    return {
      tenantType,
      _id: reqUser.branchId,
    };
  }

  return null;
};

const hasBranchAccess = (reqUser, branch) => {
  const tenantType = normalizeTenantType(reqUser?.tenantType);

  if (isSuperAdmin(reqUser)) {
    return branch.tenantType === tenantType;
  }

  if (isOrganizationAdmin(reqUser)) {
    const scope = getOrganizationScope(reqUser);
    if (!scope.organizationId) {
      return false;
    }

    return String(branch.organizationId || "") === String(scope.organizationId);
  }

  if (isBranchAdmin(reqUser)) {
    return String(branch._id || "") === String(reqUser?.branchId || "");
  }

  return false;
};

const resolveBranchScope = (req, tenantType) => {
  const userScope = getOrganizationScope(req.user || {});
  let organizationId = normalizeObjectIdValue(req.body?.organizationId) || userScope.organizationId;
  let organizationName = normalizeText(req.body?.organizationName || userScope.organizationName);
  let divisionName = normalizeText(req.body?.divisionName || req.user?.divisionName);
  let divisionId = null;

  if (tenantType === "police") {
    divisionId = normalizeObjectIdValue(req.body?.divisionId) || userScope.organizationId || null;

    if (!organizationName && divisionName) {
      organizationName = divisionName;
    }

    if (!divisionName && organizationName) {
      divisionName = organizationName;
    }
  }

  return {
    organizationId,
    organizationName,
    divisionId,
    divisionName,
  };
};

const buildBranchPayload = (req, tenantType, scope) => ({
  tenantType,
  organizationId: scope.organizationId,
  organizationName: scope.organizationName || "",
  divisionId: tenantType === "police" ? scope.divisionId || null : null,
  branchName: normalizeText(req.body?.branchName),
  shortName: normalizeText(req.body?.shortName),
  branchCode: normalizeText(req.body?.branchCode) || null,
  city: normalizeText(req.body?.city),
  address: normalizeText(req.body?.address),
  contactNumber: normalizeText(req.body?.contactNumber),
  email: normalizeText(req.body?.email).toLowerCase(),
  openingTime: normalizeText(req.body?.openingTime) || "08:00",
  closingTime: normalizeText(req.body?.closingTime) || "17:00",
  status: normalizeText(req.body?.status || "active").toLowerCase(),
  branchAdminAccess: parseBoolean(req.body?.branchAdminAccess),
  createdBy: req.user?.id || req.user?._id || null,
  divisionName: tenantType === "police" ? scope.divisionName || scope.organizationName || "" : null,
});

const maybeCreateBranchAdmin = async (req, tenantType, branch, scope) => {
  const {
    adminName,
    adminEmail,
    adminPhone,
    adminUsername,
    adminPassword,
  } = req.body || {};

  const hasAnyAdminField =
    adminName || adminEmail || adminPhone || adminUsername || adminPassword;

  if (!hasAnyAdminField) {
    return null;
  }

  if (!adminName || !adminEmail || !adminUsername || !adminPassword) {
    throw new Error("adminName, adminEmail, adminUsername, and adminPassword are required to create branch admin");
  }

  const existingAdmin = await User.findOne({ email: normalizeText(adminEmail).toLowerCase() });
  if (existingAdmin) {
    throw new Error("Admin email already exists");
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  return User.create({
    name: normalizeText(adminName),
    email: normalizeText(adminEmail).toLowerCase(),
    password: hashedPassword,
    phone: normalizeText(adminPhone),
    username: normalizeText(adminUsername),
    role: "branch_admin",
    tenantType,
    organizationId: scope.organizationId,
    organizationName: scope.organizationName || null,
    divisionName: tenantType === "police" ? scope.divisionName || scope.organizationName || null : null,
    branchId: branch._id,
    branchName: branch.branchName,
    status: "active",
  });
};

export const createBranch = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    if (!isSuperAdmin(req.user) && !isOrganizationAdmin(req.user)) {
      return errorResponse(res, 403, "Only super_admin or organization_admin can create branches");
    }

    const missingFields = requireFields(req.body, ["tenantType", "branchName"]);
    if (missingFields.length > 0) {
      return errorResponse(res, 400, `Missing required fields: ${missingFields.join(", ")}`);
    }

    const tenantType = normalizeTenantType(req.body.tenantType);

    const userTenantType = normalizeTenantType(req.user.tenantType);
    if (!userTenantType || userTenantType !== tenantType) {
      return errorResponse(res, 403, "You can only manage branches within your own tenantType");
    }

    const scope = resolveBranchScope(req, tenantType);

    if (!scope.organizationId) {
      return errorResponse(res, 400, "organizationId is required");
    }

    if (!isValidObjectId(scope.organizationId)) {
      return errorResponse(res, 400, "organizationId must be a valid ObjectId");
    }

    const branchCode = normalizeText(req.body.branchCode);
    if (branchCode) {
      const duplicateBranch = await Branch.findOne({
        branchCode,
      }).lean();

      if (duplicateBranch) {
        return errorResponse(res, 409, "branchCode already exists");
      }
    }

    const branchPayload = buildBranchPayload(req, tenantType, scope);
    if (!branchPayload.branchName) {
      return errorResponse(res, 400, "branchName is required");
    }

    if (!ALLOWED_STATUSES.has(branchPayload.status)) {
      return errorResponse(res, 400, "status must be active or inactive");
    }

    const newBranch = await Branch.create(branchPayload);

    let branchAdmin = null;
    try {
      branchAdmin = await maybeCreateBranchAdmin(req, tenantType, newBranch, scope);
    } catch (adminError) {
      await Branch.deleteOne({ _id: newBranch._id });
      return errorResponse(res, 409, adminError.message);
    }

    return successResponse(res, 201, "Branch created successfully", {
      branch: buildBranchResponse(newBranch),
      ...(branchAdmin && {
        branchAdmin: {
          id: branchAdmin._id,
          name: branchAdmin.name,
          email: branchAdmin.email,
          phone: branchAdmin.phone,
          username: branchAdmin.username,
          role: branchAdmin.role,
          tenantType: branchAdmin.tenantType,
          branchId: branchAdmin.branchId,
          branchName: branchAdmin.branchName,
          status: branchAdmin.status,
        },
      }),
    });
  } catch (error) {
    console.error("createBranch error:", error);
    return errorResponse(res, 500, "Server error while creating branch", {
      error: error?.message || error,
    });
  }
};

export const getBranches = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    const role = normalizeText(req.user.role).toLowerCase();
    const tenantType = normalizeTenantType(req.user.tenantType);
    const query = {};

    if (isSuperAdmin(req.user)) {
      if (role === "company_super_admin") {
        const requestedTenantType = normalizeTenantType(req.query?.tenantType);
        if (requestedTenantType) {
          query.tenantType = requestedTenantType;
        }
      } else if (role === "hospital_super_admin") {
        query.tenantType = "hospital";
      } else if (role === "police_super_admin") {
        query.tenantType = "police";
      } else if (tenantType) {
        query.tenantType = tenantType;
      } else {
        return errorResponse(res, 403, "You are not allowed to list branches");
      }
    } else if (isOrganizationAdmin(req.user)) {
      const scope = getOrganizationScope(req.user);
      if (!scope.organizationId) {
        return errorResponse(res, 403, "You are not allowed to list branches");
      }

      query.organizationId = scope.organizationId;
      if (tenantType) {
        query.tenantType = tenantType;
      }
    } else if (isBranchAdmin(req.user)) {
      if (!req.user?.branchId) {
        return errorResponse(res, 403, "You are not allowed to list branches");
      }

      query._id = req.user.branchId;
      if (tenantType) {
        query.tenantType = tenantType;
      }
    } else if (tenantType) {
      query.tenantType = tenantType;
    } else {
      return errorResponse(res, 403, "You are not allowed to list branches");
    }

    const branches = await Branch.find(query).sort({ createdAt: -1 }).lean();

    return successResponse(res, 200, "Branches fetched successfully", {
      count: branches.length,
      branches: branches.map(buildBranchResponse),
    });
  } catch (error) {
    console.error("getBranches error:", error);
    return errorResponse(res, 500, "Server error while fetching branches", {
      error: error?.message || error,
    });
  }
};

export const getPublicBranches = async (req, res) => {
  try {
    const tenantType = normalizeTenantType(req.query?.tenantType);
    const organizationId = normalizeText(req.query?.organizationId);

    if (!tenantType) {
      return errorResponse(res, 400, "tenantType query parameter is required");
    }

    if (!organizationId) {
      return errorResponse(res, 400, "organizationId query parameter is required");
    }

    if (!isValidObjectId(organizationId)) {
      return errorResponse(res, 400, "organizationId must be a valid ObjectId");
    }

    const query = {
      tenantType,
      status: "active",
    };

    
    query.organizationId = organizationId;
    

    const branches = await Branch.find(query)
      .sort({ branchName: 1 })
      .lean();

    return successResponse(res, 200, "Branches fetched successfully", {
      count: branches.length,
      branches: branches.map(b => ({
        id: b._id, 
        branchName: b.branchName
      })),
    });

  } catch (error) {
    console.error("getBranchesByOrganization error:", error);
    return errorResponse(res, 500, "Server error while fetching branches", {
      error: error?.message || error,
    });
  }
};

export const getBranchesByOrganization = async (req, res) => getPublicBranches(req, res);

export const getBranchById = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid branch id");
    }

    const branch = await Branch.findById(id);
    if (!branch) {
      return errorResponse(res, 404, "Branch not found");
    }

    if (!hasBranchAccess(req.user, branch)) {
      return errorResponse(res, 403, "You are not allowed to access this branch");
    }

    return successResponse(res, 200, "Branch fetched successfully", {
      branch: buildBranchResponse(branch),
    });
  } catch (error) {
    console.error("getBranchById error:", error);
    return errorResponse(res, 500, "Server error while fetching branch", {
      error: error?.message || error,
    });
  }
};

export const updateBranch = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid branch id");
    }

    const branch = await Branch.findById(id);
    if (!branch) {
      return errorResponse(res, 404, "Branch not found");
    }

    if (!hasBranchAccess(req.user, branch)) {
      return errorResponse(res, 403, "You are not allowed to update this branch");
    }

    const updates = {};
    const allowedPatchFields = [
      "branchName",
      "shortName",
      "branchCode",
      "city",
      "address",
      "contactNumber",
      "email",
      "openingTime",
      "closingTime",
      "status",
      "branchAdminAccess",
      "organizationName",
      "divisionName",
    ];

    for (const field of allowedPatchFields) {
      if (req.body?.[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.body?.tenantType !== undefined || req.body?.organizationId !== undefined || req.body?.divisionId !== undefined) {
      return errorResponse(res, 400, "tenantType and organizationId cannot be changed on branch update");
    }

    if (updates.branchName !== undefined) {
      updates.branchName = normalizeText(updates.branchName);
      if (!updates.branchName) {
        return errorResponse(res, 400, "branchName cannot be empty");
      }
    }

    if (updates.shortName !== undefined) {
      updates.shortName = normalizeText(updates.shortName);
    }

    if (updates.branchCode !== undefined) {
      updates.branchCode = normalizeText(updates.branchCode) || null;
      if (updates.branchCode) {
        const duplicateBranch = await Branch.findOne({
          branchCode: updates.branchCode,
          _id: { $ne: branch._id },
        }).lean();

        if (duplicateBranch) {
          return errorResponse(res, 409, "branchCode already exists");
        }
      }
    }

    if (updates.city !== undefined) {
      updates.city = normalizeText(updates.city);
    }

    if (updates.address !== undefined) {
      updates.address = normalizeText(updates.address);
    }

    if (updates.contactNumber !== undefined) {
      updates.contactNumber = normalizeText(updates.contactNumber);
    }

    if (updates.email !== undefined) {
      updates.email = normalizeText(updates.email).toLowerCase();
    }

    if (updates.openingTime !== undefined) {
      updates.openingTime = normalizeText(updates.openingTime);
    }

    if (updates.closingTime !== undefined) {
      updates.closingTime = normalizeText(updates.closingTime);
    }

    if (updates.status !== undefined) {
      updates.status = normalizeText(updates.status).toLowerCase();
      if (!ALLOWED_STATUSES.has(updates.status)) {
        return errorResponse(res, 400, "status must be active or inactive");
      }
    }

    if (updates.branchAdminAccess !== undefined) {
      updates.branchAdminAccess = parseBoolean(updates.branchAdminAccess);
    }

    if (updates.organizationName !== undefined) {
      updates.organizationName = normalizeText(updates.organizationName);
      if (branch.tenantType === "police") {
        updates.divisionName = updates.organizationName;
      }
    }

    if (updates.divisionName !== undefined) {
      updates.divisionName = normalizeText(updates.divisionName);
      if (branch.tenantType === "police" && !updates.organizationName) {
        updates.organizationName = updates.divisionName;
      }
    }

    Object.assign(branch, updates);
    await branch.save();

    return successResponse(res, 200, "Branch updated successfully", {
      branch: buildBranchResponse(branch),
    });
  } catch (error) {
    console.error("updateBranch error:", error);
    return errorResponse(res, 500, "Server error while updating branch", {
      error: error?.message || error,
    });
  }
};

export const createHospitalBranch = async (req, res) => createBranch(req, res);

export const createCompanyBranch = async (req, res) => createBranch(req, res);

export const listBranches = async (req, res) => getBranches(req, res);

export const getBranchDisplayData = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!id || id.length !== 24) {
      return res.status(400).json({ success: false, message: "Invalid branch ID" });
    }

    const branch = await Branch.findById(id).select("branchName organizationName status organizationId").populate("organizationId", "branding").lean();
    if (!branch) {
      return res.status(404).json({ success: false, message: "Branch not found" });
    }

    // Fetch tokens currently being called
    const calledTokens = await Token.find({
      branchId: branch._id,
      status: "Called"
    }).sort({ startedAt: -1 }).lean();

    // Fetch waiting tokens (next 5)
    const waitingTokens = await Token.find({
      branchId: branch._id,
      status: "Waiting"
    }).sort({ sequenceNumber: 1 }).limit(5).lean();

    const counterIds = [
      ...new Set(
        calledTokens
          .map((token) => token.counterId)
          .filter(Boolean)
          .map((id) => String(id))
      ),
    ];

    const counters = counterIds.length
      ? await Counter.find({ _id: { $in: counterIds } }).select("_id counterName serviceId").lean()
      : [];

    const counterMap = new Map(counters.map((counter) => [String(counter._id), counter]));

    const calledWithUnits = calledTokens.map((token) => {
      const counter = token.counterId ? counterMap.get(String(token.counterId)) : null;
      return {
        ...token,
        unitName: token.serviceName || "",
        counterName: counter?.counterName || "",
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        branch: branch,
        branding: branch.organizationId?.branding || {},
        called: calledWithUnits,
        waiting: waitingTokens
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBranch = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid branch id");
    }

    const branch = await Branch.findById(id).session(session);
    if (!branch) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 404, "Branch not found");
    }

    if (!hasBranchAccess(req.user, branch)) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 403, "You are not allowed to delete this branch");
    }

    // Find pending tokens
    const pendingTokens = await Token.find({ branchId: id, status: "Waiting" }).session(session);
    
    // Simulate sending SMS
    for (const token of pendingTokens) {
      if (token.contactNumber) {
        await sendSMS(
          token.contactNumber, 
          `We apologize, but your appointment (Token ${token.sequenceNumber}) at ${branch.branchName} has been cancelled due to branch closure.`
        );
      }
    }

    // Hard Delete
    await Token.deleteMany({ branchId: id }).session(session);
    await Service.deleteMany({ branchIds: id }).session(session); // Note: service holds branchIds or branchId depending on schema, we'll delete using both just in case
    await Service.deleteMany({ branchId: id }).session(session);
    await Branch.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    session.endSession();

    return successResponse(res, 200, "Branch and related data deleted successfully, SMS sent to pending customers");
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("deleteBranch error:", error);
    return errorResponse(res, 500, "Server error while deleting branch");
  }
};

