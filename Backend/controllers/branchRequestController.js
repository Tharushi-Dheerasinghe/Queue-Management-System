import bcrypt from "bcryptjs";
import Branch from "../models/Branch.js";
import BranchRequest from "../models/BranchRequest.js";
import User from "../models/User.js";
import {
  getOrganizationScope,
  isOrganizationAdmin,
  isSuperAdmin,
  normalizeTenantType,
} from "../utils/scopeHelpers.js";
import { errorResponse, successResponse } from "../utils/responseHelpers.js";
import { isValidObjectId, requireFields } from "../utils/validationHelpers.js";

const COMMON_TENANT_TYPES = new Set(["police", "bank", "supermarket", "hospital"]);

const normalizeText = (value = "") => String(value || "").trim();
const normalizeEmail = (value = "") => normalizeText(value).toLowerCase();

const parseBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
  }

  return Boolean(value);
};

const isBcryptHash = (value = "") => /^\$2[aby]?\$\d{2}\$/.test(String(value));

const buildBranchRequestResponse = (branchRequest) => ({
  id: branchRequest._id,
  tenantType: branchRequest.tenantType,
  organizationId: branchRequest.organizationId || null,
  organizationName: branchRequest.organizationName || null,
  branchName: branchRequest.branchName,
  shortName: branchRequest.shortName,
  branchCode: branchRequest.branchCode,
  city: branchRequest.city,
  address: branchRequest.address,
  contactNumber: branchRequest.contactNumber,
  email: branchRequest.email,
  status: branchRequest.status,
  requestedBy: branchRequest.requestedBy,
  requestedByRole: branchRequest.requestedByRole,
  branchAdminAccess: Boolean(branchRequest.branchAdminAccess),
  adminName: branchRequest.adminName,
  adminEmail: branchRequest.adminEmail,
  adminPhone: branchRequest.adminPhone,
  adminUsername: branchRequest.adminUsername,
  createdAt: branchRequest.createdAt,
  updatedAt: branchRequest.updatedAt,
});

const buildBranchResponse = (branch) => ({
  id: branch._id,
  tenantType: branch.tenantType,
  organizationId: branch.organizationId || null,
  organizationName: branch.organizationName || null,
  branchName: branch.branchName,
  shortName: branch.shortName,
  branchCode: branch.branchCode,
  city: branch.city,
  address: branch.address,
  contactNumber: branch.contactNumber,
  email: branch.email,
  status: branch.status,
  branchAdminAccess: Boolean(branch.branchAdminAccess),
  createdBy: branch.createdBy || null,
  createdAt: branch.createdAt,
  updatedAt: branch.updatedAt,
});

const getOrganizationScopeIds = (reqUser) => {
  const scope = getOrganizationScope(reqUser || {});
  return {
    organizationId: scope.organizationId || null,
    organizationName: scope.organizationName || "",
  };
};

const getRequestScopeFilter = (reqUser) => {
  const tenantType = normalizeTenantType(reqUser?.tenantType);
  const organizationScope = getOrganizationScopeIds(reqUser);

  if (!organizationScope.organizationId) {
    return null;
  }

  return {
    tenantType,
    organizationId: organizationScope.organizationId,
  };
};

const buildBranchCreatePayload = (req, tenantType, scope) => {
  const branchName = normalizeText(req.body?.branchName);
  const shortName = normalizeText(req.body?.shortName);
  const branchCode = normalizeText(req.body?.branchCode) || null;

  return {
    tenantType,
    organizationId: scope.organizationId,
    organizationName: scope.organizationName || "",
    divisionName: tenantType === "police" ? scope.organizationName || "" : null,
    branchName,
    shortName,
    branchCode,
    city: normalizeText(req.body?.city),
    address: normalizeText(req.body?.address),
    contactNumber: normalizeText(req.body?.contactNumber),
    email: normalizeEmail(req.body?.email),
    status: "pending",
    branchAdminAccess: parseBoolean(req.body?.branchAdminAccess),
    requestedBy: req.user?.id || req.user?._id || null,
    requestedByRole: "organization_admin",
    adminName: normalizeText(req.body?.adminName),
    adminEmail: normalizeEmail(req.body?.adminEmail),
    adminPhone: normalizeText(req.body?.adminPhone),
    adminUsername: normalizeText(req.body?.adminUsername),
    adminPassword: normalizeText(req.body?.adminPassword),
  };
};

const maybeHashLegacyAdminPassword = (branchRequest) => {
  // TODO: remove adminPassword from BranchRequest after migration.
  if (!branchRequest.adminPassword) {
    return "";
  }

  if (isBcryptHash(branchRequest.adminPassword)) {
    return branchRequest.adminPassword;
  }

  return null;
};

export const createBranchRequest = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    if (!isOrganizationAdmin(req.user)) {
      return errorResponse(res, 403, "Only organization_admin users can create branch requests");
    }

    const missingFields = requireFields(req.body, ["branchName"]);
    if (missingFields.length > 0) {
      return errorResponse(res, 400, `Missing required fields: ${missingFields.join(", ")}`);
    }

    const tenantType = normalizeTenantType(req.body.tenantType || req.user.tenantType);
    if (!COMMON_TENANT_TYPES.has(tenantType)) {
      return errorResponse(res, 400, "tenantType must be one of police, hospital, bank, or supermarket");
    }

    if (tenantType !== normalizeTenantType(req.user.tenantType)) {
      return errorResponse(res, 403, "organization_admin can only create requests for their own tenantType");
    }

    const scope = getOrganizationScopeIds(req.user);
    if (!scope.organizationId) {
      return errorResponse(res, 403, "User does not have an organizationId assigned");
    }

    const branchRequestPayload = buildBranchCreatePayload(req, tenantType, scope);
    if (!branchRequestPayload.branchName) {
      return errorResponse(res, 400, "branchName is required");
    }

    if (tenantType === "police" && !branchRequestPayload.organizationId) {
      return errorResponse(res, 403, "Police organization_admin must have an organizationId assigned");
    }

    if (branchRequestPayload.branchAdminAccess) {
      const missingAdminFields = ["adminName", "adminEmail", "adminUsername", "adminPassword"].filter(
        (field) => !branchRequestPayload[field]
      );

      if (missingAdminFields.length > 0) {
        return errorResponse(res, 400, `Missing required fields for branch admin: ${missingAdminFields.join(", ")}`);
      }

      // TODO: remove plaintext adminPassword storage after migration.
      branchRequestPayload.adminPassword = await bcrypt.hash(branchRequestPayload.adminPassword, 10);
    }

    const duplicateBranchCode = branchRequestPayload.branchCode
      ? await BranchRequest.findOne({ branchCode: branchRequestPayload.branchCode }).lean()
      : null;

    if (duplicateBranchCode) {
      return errorResponse(res, 409, "branchCode already exists");
    }

    const branchRequest = await BranchRequest.create(branchRequestPayload);

    return successResponse(res, 201, "Branch request created successfully", {
      branchRequest: buildBranchRequestResponse(branchRequest),
    });
  } catch (error) {
    if (error?.name === "ValidationError") {
      return errorResponse(res, 400, error.message);
    }

    console.error("createBranchRequest error:", error);
    return errorResponse(res, 500, "Server error while creating branch request", {
      error: error?.message || error,
    });
  }
};

export const getMyBranchRequests = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    if (!isOrganizationAdmin(req.user)) {
      return errorResponse(res, 403, "Only organization_admin can view own branch requests");
    }

    const scope = getOrganizationScopeIds(req.user);
    if (!scope.organizationId) {
      return errorResponse(res, 400, "organizationId is required for organization_admin scope");
    }

    const tenantType = normalizeTenantType(req.user.tenantType);
    const requests = await BranchRequest.find(
      tenantType === "police"
        ? {
            status: "pending",
            $or: [
              { requestedBy: req.user.id || req.user._id },
              { organizationId: scope.organizationId },
            ],
          }
        : {
            status: "pending",
            $or: [{ requestedBy: req.user.id || req.user._id }, { organizationId: scope.organizationId }],
          }
    )
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, 200, "Branch requests fetched successfully", {
      count: requests.length,
      branchRequests: requests.map((request) => ({
        id: request._id,
        branchName: request.branchName,
        branchCode: request.branchCode,
        city: request.city,
        status: request.status,
        createdAt: request.createdAt,
      })),
    });
  } catch (error) {
    console.error("getMyBranchRequests error:", error);
    return errorResponse(res, 500, "Server error while fetching branch requests", {
      error: error?.message || error,
    });
  }
};

export const getPendingBranchRequests = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    if (!isSuperAdmin(req.user)) {
      return errorResponse(res, 403, "Only super_admin can view pending branch requests");
    }

    const role = normalizeText(req.user.role).toLowerCase();
    const requestFilter = { status: "pending" };

    if (role === "company_super_admin") {
      requestFilter.tenantType = { $in: ["bank", "supermarket"] };
    } else if (role === "hospital_super_admin") {
      requestFilter.tenantType = "hospital";
    } else if (role === "police_super_admin") {
      requestFilter.tenantType = "police";
    } else {
      const tenantType = normalizeTenantType(req.user.tenantType);
      if (!tenantType) {
        return errorResponse(res, 400, "User tenantType is required");
      }

      requestFilter.tenantType = tenantType;
    }

    const requests = await BranchRequest.find(requestFilter)
      .populate("requestedBy", "name email")
      .sort({ createdAt: -1 });

    return successResponse(res, 200, "Pending branch requests fetched successfully", {
      count: requests.length,
      branchRequests: requests.map((request) => ({
        id: request._id,
        tenantType: request.tenantType,
        status: request.status,
        branchName: request.branchName,
        organizationId: request.organizationId || null,
        organizationName: request.organizationName,
        city: request.city,
        branchCode: request.branchCode,
        requestedBy:
          request.requestedBy?.name || request.requestedBy?.email || String(request.requestedBy || ""),
        createdAt: request.createdAt,
      })),
    });
  } catch (error) {
    console.error("getPendingBranchRequests error:", error);
    return errorResponse(res, 500, "Server error while fetching pending branch requests", {
      error: error?.message || error,
    });
  }
};

export const approveBranchRequest = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    if (!isSuperAdmin(req.user)) {
      return errorResponse(res, 403, "Only super_admin can approve branch requests");
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid branch request id");
    }

    const branchRequest = await BranchRequest.findById(id);
    if (!branchRequest) {
      return errorResponse(res, 404, "Branch request not found");
    }

    const role = normalizeText(req.user.role).toLowerCase();
    const requestTenantType = normalizeTenantType(branchRequest.tenantType);
    const userTenantType = normalizeTenantType(req.user.tenantType);

    let canManageTenant = false;

    if (role === "company_super_admin") {
      canManageTenant = ["bank", "supermarket"].includes(requestTenantType);
    } else if (role === "hospital_super_admin") {
      canManageTenant = requestTenantType === "hospital";
    } else if (role === "police_super_admin") {
      canManageTenant = requestTenantType === "police";
    } else {
      canManageTenant = requestTenantType === userTenantType;
    }

    if (!canManageTenant) {
      return errorResponse(res, 403, "super_admin can only manage branch requests within their allowed tenant scope");
    }

    if (branchRequest.status !== "pending") {
      return errorResponse(res, 400, "Only pending branch requests can be approved");
    }

    const branchCode = normalizeText(branchRequest.branchCode);
    if (branchCode) {
      const duplicateBranchCode = await Branch.findOne({ branchCode }).lean();
      if (duplicateBranchCode) {
        return errorResponse(res, 409, "branchCode already exists");
      }
    }

    const organizationId = branchRequest.organizationId || null;
    const organizationName = branchRequest.organizationName || branchRequest.divisionName || "";

    const branchData = {
      tenantType: branchRequest.tenantType,
      organizationId,
      organizationName,
      divisionName: branchRequest.divisionName || organizationName || null,
      branchName: branchRequest.branchName,
      shortName: branchRequest.shortName || "",
      branchCode: branchCode || null,
      city: branchRequest.city || "",
      address: branchRequest.address || "",
      contactNumber: branchRequest.contactNumber || "",
      email: branchRequest.email || "",
      status: "active",
      createdBy: branchRequest.requestedBy || null,
      branchAdminAccess: Boolean(branchRequest.branchAdminAccess),
    };

    const createdBranch = await Branch.create(branchData);
    let branchAdmin = null;

    if (branchRequest.branchAdminAccess) {
      if (
        !branchRequest.adminName ||
        !branchRequest.adminEmail ||
        !branchRequest.adminUsername ||
        !branchRequest.adminPassword
      ) {
        await Branch.deleteOne({ _id: createdBranch._id });
        return errorResponse(res, 400, "Branch admin details are incomplete in the branch request");
      }

      const existingAdminByEmail = await User.findOne({ email: normalizeEmail(branchRequest.adminEmail) });
      if (existingAdminByEmail) {
        await Branch.deleteOne({ _id: createdBranch._id });
        return errorResponse(res, 409, "Admin email already exists");
      }

      const passwordToUse = isBcryptHash(branchRequest.adminPassword)
        ? branchRequest.adminPassword
        : await bcrypt.hash(branchRequest.adminPassword, 10);

      branchAdmin = await User.create({
        name: branchRequest.adminName,
        email: normalizeEmail(branchRequest.adminEmail),
        password: passwordToUse,
        phone: branchRequest.adminPhone || "",
        username: branchRequest.adminUsername,
        role: "branch_admin",
        tenantType: branchRequest.tenantType,
        organizationId,
        organizationName,
        divisionName: branchRequest.divisionName || organizationName || null,
        branchId: createdBranch._id,
        branchName: createdBranch.branchName,
        status: "active",
      });
    }

    branchRequest.status = "approved";
    await branchRequest.save();

    return successResponse(res, 200, "Branch request approved successfully", {
      approvedRequest: {
        id: branchRequest._id,
        status: branchRequest.status,
        tenantType: branchRequest.tenantType,
        branchName: branchRequest.branchName,
        branchCode: branchRequest.branchCode,
        organizationId: branchRequest.organizationId || null,
        organizationName: branchRequest.organizationName || null,
        requestedBy: branchRequest.requestedBy,
        requestedByRole: branchRequest.requestedByRole,
        updatedAt: branchRequest.updatedAt,
      },
      createdBranch: buildBranchResponse(createdBranch),
      ...(branchAdmin && {
        branchAdmin: {
          id: branchAdmin._id,
          name: branchAdmin.name,
          email: branchAdmin.email,
          phone: branchAdmin.phone,
          username: branchAdmin.username,
          role: branchAdmin.role,
          status: branchAdmin.status,
          branchId: branchAdmin.branchId,
        },
      }),
    });
  } catch (error) {
    console.error("approveBranchRequest error:", error);
    return errorResponse(res, 500, "Server error while approving branch request", {
      error: error?.message || error,
    });
  }
};

export const rejectBranchRequest = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    if (!isSuperAdmin(req.user)) {
      return errorResponse(res, 403, "Only super_admin can reject branch requests");
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid branch request id");
    }

    const branchRequest = await BranchRequest.findById(id);
    if (!branchRequest) {
      return errorResponse(res, 404, "Branch request not found");
    }

    const role = normalizeText(req.user.role).toLowerCase();
    const requestTenantType = normalizeTenantType(branchRequest.tenantType);
    const userTenantType = normalizeTenantType(req.user.tenantType);

    let canManageTenant = false;

    if (role === "company_super_admin") {
      canManageTenant = ["bank", "supermarket"].includes(requestTenantType);
    } else if (role === "hospital_super_admin") {
      canManageTenant = requestTenantType === "hospital";
    } else if (role === "police_super_admin") {
      canManageTenant = requestTenantType === "police";
    } else {
      canManageTenant = requestTenantType === userTenantType;
    }

    if (!canManageTenant) {
      return errorResponse(res, 403, "super_admin can only manage branch requests within their allowed tenant scope");
    }

    if (branchRequest.status !== "pending") {
      return errorResponse(res, 400, "Only pending branch requests can be rejected");
    }

    branchRequest.status = "rejected";
    await branchRequest.save();

    return successResponse(res, 200, "Branch request rejected successfully", {
      updatedRequest: {
        id: branchRequest._id,
        status: branchRequest.status,
        tenantType: branchRequest.tenantType,
        branchName: branchRequest.branchName,
        branchCode: branchRequest.branchCode,
        organizationId: branchRequest.organizationId || null,
        organizationName: branchRequest.organizationName || null,
        requestedBy: branchRequest.requestedBy,
        requestedByRole: branchRequest.requestedByRole,
        updatedAt: branchRequest.updatedAt,
      },
    });
  } catch (error) {
    console.error("rejectBranchRequest error:", error);
    return errorResponse(res, 500, "Server error while rejecting branch request", {
      error: error?.message || error,
    });
  }
};

// Legacy aliases retained for migration safety.
export const getPendingPoliceBranchRequests = getPendingBranchRequests;
