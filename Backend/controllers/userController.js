import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import Branch from "../models/Branch.js";
import {
  getBranchScope,
  getOrganizationScope,
  isBranchAdmin,
  isOrganizationAdmin,
  isSuperAdmin,
  normalizeRole,
  normalizeTenantType,
} from "../utils/scopeHelpers.js";
import { errorResponse, successResponse } from "../utils/responseHelpers.js";
import { isValidObjectId, requireFields } from "../utils/validationHelpers.js";

const COMMON_TENANT_TYPES = new Set(["police", "hospital", "bank", "supermarket"]);

const LEGACY_ROLE_TENANT_ACCESS = {
  police_super_admin: ["police"],
  hospital_super_admin: ["hospital"],
  company_super_admin: ["bank", "supermarket"],
};

const REGISTRATION_ALLOWED_DB_ROLES = new Set([
  "user",
  "organization_admin",
  "branch_admin",
  "staff",
  "hospital_super_admin",
  "police_super_admin",
  "company_super_admin",
  "police_division_admin",
  "police_branch_admin",
  "police_staff",
]);

const normalizeText = (value = "") => String(value || "").trim();
const normalizeEmail = (value = "") => normalizeText(value).toLowerCase();

const buildUserResponse = (user) => ({
  id: String(user._id || user.id || ""),
  name: user.name,
  email: user.email,
  phone: user.phone,
  username: user.username,
  role: user.role,
  tenantType: user.tenantType,
  organizationId: user.organizationId || null,
  organizationName: user.organizationName || null,
  branchId: user.branchId || null,
  branchName: user.branchName || null,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getRequesterAllowedTenantTypes = (reqUser = {}) => {
  if (!isSuperAdmin(reqUser)) {
    return [];
  }

  const role = normalizeRole(reqUser.role);
  if (LEGACY_ROLE_TENANT_ACCESS[role]) {
    return LEGACY_ROLE_TENANT_ACCESS[role];
  }

  const tenantType = normalizeTenantType(reqUser.tenantType);
  if (COMMON_TENANT_TYPES.has(tenantType)) {
    return [tenantType];
  }

  return [];
};

const resolveOrganizationAdminTenantType = (req) => {
  const role = normalizeRole(req.user?.role);
  const requesterTenantType = normalizeTenantType(req.user?.tenantType);
  const bodyTenantType = normalizeTenantType(req.body?.tenantType);
  const allowedTenantTypes = getRequesterAllowedTenantTypes(req.user);

  if (!isSuperAdmin(req.user)) {
    return {
      error: {
        statusCode: 403,
        message: "Only super_admin can create organization_admin",
      },
    };
  }

  // Company legacy super-admin can manage both bank and supermarket, so tenantType may be required.
  if (role === "company_super_admin" && !bodyTenantType) {
    return {
      error: {
        statusCode: 400,
        message: "tenantType is required for company_super_admin and must be bank or supermarket",
      },
    };
  }

  const targetTenantType = bodyTenantType || requesterTenantType || (allowedTenantTypes.length === 1 ? allowedTenantTypes[0] : "");

  if (!COMMON_TENANT_TYPES.has(targetTenantType)) {
    return {
      error: {
        statusCode: 400,
        message: "tenantType must be one of police, hospital, bank, or supermarket",
      },
    };
  }

  if (!allowedTenantTypes.includes(targetTenantType)) {
    return {
      error: {
        statusCode: 403,
        message: "You can only create organization_admin users within your allowed tenant scope",
      },
    };
  }

  return { tenantType: targetTenantType };
};

const createUserRecord = async (userData) => {
  const hashedPassword = await bcrypt.hash(String(userData.password), 10);

  return User.create({
    name: normalizeText(userData.name),
    email: normalizeEmail(userData.email),
    password: hashedPassword,
    phone: normalizeText(userData.phone),
    username: normalizeText(userData.username),
    role: normalizeRole(userData.role),
    tenantType: normalizeTenantType(userData.tenantType),
    organizationId: userData.organizationId || null,
    organizationName: userData.organizationName || null,
    divisionName: userData.divisionName || null,
    branchId: userData.branchId || null,
    branchName: userData.branchName || null,
    status: normalizeText(userData.status || "active").toLowerCase(),
  });
};

const getScopedBranch = async (reqUser, branchId, tenantType) => {
  const organizationScope = getOrganizationScope(reqUser);

  const query = {
    _id: branchId,
    tenantType,
  };

  if (tenantType === "police") {
    if (organizationScope.organizationId) {
      query.organizationId = organizationScope.organizationId;
    }
  } else if (organizationScope.organizationId) {
    query.organizationId = organizationScope.organizationId;
  }

  return Branch.findOne(query)
    .select("_id tenantType organizationId organizationName divisionId divisionName branchName status")
    .lean();
};

const buildUsersQuery = (reqUser) => {
  const tenantType = normalizeTenantType(reqUser?.tenantType);

  if (isSuperAdmin(reqUser)) {
    const allowedTenantTypes = getRequesterAllowedTenantTypes(reqUser);
    if (allowedTenantTypes.length === 0) {
      return null;
    }

    return allowedTenantTypes.length === 1
      ? { tenantType: allowedTenantTypes[0] }
      : { tenantType: { $in: allowedTenantTypes } };
  }

  if (isOrganizationAdmin(reqUser)) {
    const organizationScope = getOrganizationScope(reqUser);
    if (!tenantType || !organizationScope.organizationId) {
      return null;
    }

    return tenantType === "police"
      ? { tenantType, organizationId: organizationScope.organizationId }
      : {
          tenantType,
          organizationId: organizationScope.organizationId,
        };
  }

  if (isBranchAdmin(reqUser)) {
    const branchScope = getBranchScope(reqUser);
    if (!tenantType || !branchScope.branchId) {
      return null;
    }

    return {
      tenantType,
      branchId: branchScope.branchId,
    };
  }

  return null;
};

export const createOrganizationAdmin = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    const missingFields = requireFields(req.body, ["name", "email", "password", "organizationName"]);
    if (missingFields.length > 0) {
      return errorResponse(res, 400, `Missing required fields: ${missingFields.join(", ")}`);
    }

    const tenantResolution = resolveOrganizationAdminTenantType(req);
    if (tenantResolution.error) {
      return errorResponse(res, tenantResolution.error.statusCode, tenantResolution.error.message);
    }

    const tenantType = tenantResolution.tenantType;
    const rawOrganizationId = req.body?.organizationId || null;

    if (rawOrganizationId && !isValidObjectId(rawOrganizationId)) {
      return errorResponse(res, 400, "organizationId must be a valid ObjectId when provided");
    }

    const organizationId = rawOrganizationId || null;
    const organizationName = normalizeText(req.body?.organizationName || req.body?.divisionName || "");

    const existingUser = await User.findOne({ email: normalizeEmail(req.body.email) });
    if (existingUser) {
      return errorResponse(res, 409, "User email already exists");
    }

    const createdUser = await createUserRecord({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone || "",
      username: req.body.username || "",
      role: "organization_admin",
      tenantType,
      organizationId,
      organizationName,
      divisionName: tenantType === "police" ? organizationName : null,
      status: req.body.status || "active",
    });

    return successResponse(res, 201, "Organization admin created successfully", {
      user: buildUserResponse(createdUser),
    });
  } catch (error) {
    console.error("createOrganizationAdmin error:", error);
    return errorResponse(res, 500, "Server error while creating organization admin", {
      error: error?.message || error,
    });
  }
};

export const createBranchAdmin = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    if (!isOrganizationAdmin(req.user)) {
      return errorResponse(res, 403, "Only organization_admin can create branch_admin");
    }

    const missingFields = requireFields(req.body, ["name", "email", "password", "branchId"]);
    if (missingFields.length > 0) {
      return errorResponse(res, 400, `Missing required fields: ${missingFields.join(", ")}`);
    }

    const tenantType = normalizeTenantType(req.user.tenantType);
    if (!COMMON_TENANT_TYPES.has(tenantType)) {
      return errorResponse(res, 400, "Invalid requester tenantType");
    }

    const branchId = req.body.branchId;
    if (!isValidObjectId(branchId)) {
      return errorResponse(res, 400, "branchId must be a valid ObjectId");
    }

    const organizationScope = getOrganizationScope(req.user);
    if (!organizationScope.organizationId) {
      return errorResponse(res, 400, "organizationId is required for organization_admin scope");
    }

    const branch = await getScopedBranch(req.user, branchId, tenantType);
    if (!branch) {
      return errorResponse(res, 404, "Branch not found in your organization");
    }

    const resolvedOrganizationId = branch.organizationId || organizationScope.organizationId;
    const resolvedOrganizationName =
      branch.organizationName || branch.divisionName || organizationScope.organizationName || "";

    if (String(resolvedOrganizationId || "") !== String(organizationScope.organizationId || "")) {
      return errorResponse(res, 403, "organization_admin can only create branch_admin inside their own organization");
    }

    const existingUser = await User.findOne({ email: normalizeEmail(req.body.email) });
    if (existingUser) {
      return errorResponse(res, 409, "User email already exists");
    }

    const createdUser = await createUserRecord({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone || "",
      username: req.body.username || "",
      role: "branch_admin",
      tenantType,
      organizationId: resolvedOrganizationId,
      organizationName: resolvedOrganizationName,
      divisionName: tenantType === "police" ? resolvedOrganizationName : null,
      branchId: branch._id,
      branchName: normalizeText(req.body.branchName || branch.branchName),
      status: req.body.status || "active",
    });

    return successResponse(res, 201, "Branch admin created successfully", {
      user: buildUserResponse(createdUser),
    });
  } catch (error) {
    console.error("createBranchAdmin error:", error);
    return errorResponse(res, 500, "Server error while creating branch admin", {
      error: error?.message || error,
    });
  }
};

export const createStaffUser = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    if (!isBranchAdmin(req.user)) {
      return errorResponse(res, 403, "Only branch_admin can create staff");
    }

    const missingFields = requireFields(req.body, ["name", "email", "password"]);
    if (missingFields.length > 0) {
      return errorResponse(res, 400, `Missing required fields: ${missingFields.join(", ")}`);
    }

    const tenantType = normalizeTenantType(req.user.tenantType);
    if (!COMMON_TENANT_TYPES.has(tenantType)) {
      return errorResponse(res, 400, "Invalid requester tenantType");
    }

    const branchScope = getBranchScope(req.user);
    if (!branchScope.branchId) {
      return errorResponse(res, 400, "branchId is required for branch_admin scope");
    }

    const branch = await getScopedBranch(req.user, branchScope.branchId, tenantType);
    if (!branch) {
      return errorResponse(res, 404, "Branch not found in your scope");
    }

    const organizationScope = getOrganizationScope(req.user);
    const resolvedOrganizationId = organizationScope.organizationId || branch.organizationId || null;
    const resolvedOrganizationName =
      organizationScope.organizationName || branch.organizationName || branch.divisionName || "";

    const existingUser = await User.findOne({ email: normalizeEmail(req.body.email) });
    if (existingUser) {
      return errorResponse(res, 409, "User email already exists");
    }

    const createdUser = await createUserRecord({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone || "",
      username: req.body.username || "",
      role: "staff",
      tenantType,
      organizationId: resolvedOrganizationId,
      organizationName: resolvedOrganizationName,
      divisionName: tenantType === "police" ? resolvedOrganizationName : null,
      branchId: branch._id,
      branchName: normalizeText(branchScope.branchName || branch.branchName),
      status: req.body.status || "active",
    });

    return successResponse(res, 201, "Staff user created successfully", {
      user: buildUserResponse(createdUser),
    });
  } catch (error) {
    console.error("createStaffUser error:", error);
    return errorResponse(res, 500, "Server error while creating staff user", {
      error: error?.message || error,
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    const query = buildUsersQuery(req.user);
    if (!query) {
      return errorResponse(res, 403, "You are not allowed to list users");
    }

    const users = await User.find(query).select("-password").sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      count: users.length,
      users: users.map(buildUserResponse),
    });
  } catch (error) {
    console.error("getUsers error:", error);
    return errorResponse(res, 500, "Server error while fetching users", {
      error: error?.message || error,
    });
  }
};

export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      username,
      role,
      tenantType,
      organizationId,
      organizationName,
      divisionId,
      divisionName,
      branchId,
      branchName,
    } = req.body || {};

    const missingFields = requireFields(req.body || {}, ["name", "email", "password"]);
    if (missingFields.length > 0) {
      return errorResponse(res, 400, `Missing required fields: ${missingFields.join(", ")}`);
    }

    // Keep customer registration working while user model still stores customer as "user".
    const requestedRole = normalizeRole(role || "customer");
    const persistedRole = requestedRole === "customer" ? "user" : requestedRole;

    if (!REGISTRATION_ALLOWED_DB_ROLES.has(persistedRole)) {
      return errorResponse(res, 400, "Invalid role");
    }

    if (persistedRole === "super_admin") {
      return errorResponse(res, 400, "super_admin registration is not allowed");
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return errorResponse(res, 400, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const newUser = await User.create({
      name: normalizeText(name),
      email: normalizedEmail,
      password: hashedPassword,
      phone: normalizeText(phone),
      username: normalizeText(username),
      role: persistedRole,
      tenantType: normalizeTenantType(tenantType) || null,
      organizationId: organizationId || null,
      organizationName: normalizeText(organizationName) || null,
      divisionName: normalizeText(divisionName) || null,
      branchId: branchId || null,
      branchName: normalizeText(branchName) || null,
    });

    return successResponse(res, 201, "User created successfully", {
      user: buildUserResponse(newUser),
    });
  } catch (error) {
    console.error("registerUser error:", error);
    return errorResponse(res, 500, "Server error while creating user", {
      error: error?.message || error,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return errorResponse(res, 400, "Email and password are required");
    }

    const normalizedEmail = normalizeEmail(email);

    // Legacy and migration-safe super-admins continue to authenticate via env credentials.
    const superAdminConfigs = [
      {
        email: process.env.POLICE_ADMIN_EMAIL,
        password: process.env.POLICE_ADMIN_PASSWORD,
        role: "police_super_admin",
        tenantType: "police",
      },
      {
        email: process.env.HOSPITAL_ADMIN_EMAIL,
        password: process.env.HOSPITAL_ADMIN_PASSWORD,
        role: "hospital_super_admin",
        tenantType: "hospital",
      },
      {
        email: process.env.COMPANY_ADMIN_EMAIL,
        password: process.env.COMPANY_ADMIN_PASSWORD,
        role: "company_super_admin",
        tenantType: "company",
      },
      {
        email: process.env.SUPER_ADMIN_EMAIL,
        password: process.env.SUPER_ADMIN_PASSWORD,
        role: "super_admin",
        tenantType: normalizeTenantType(process.env.SUPER_ADMIN_TENANT_TYPE),
      },
    ];

    const matchedSuperAdmin = superAdminConfigs.find((config) => {
      if (!config.email || !config.password) {
        return false;
      }

      return normalizeEmail(config.email) === normalizedEmail && String(config.password) === String(password);
    });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return errorResponse(res, 500, "JWT_SECRET is not configured");
    }

    if (matchedSuperAdmin) {
      const userPayload = {
        id: `env_${matchedSuperAdmin.role}`,
        name: matchedSuperAdmin.role,
        email: normalizeEmail(matchedSuperAdmin.email),
        role: matchedSuperAdmin.role,
        tenantType: matchedSuperAdmin.tenantType || null,
        organizationId: null,
        organizationName: null,
        branchId: null,
        branchName: null,
        status: "active",
      };

      const token = jwt.sign(userPayload, jwtSecret, { expiresIn: "7d" });

      return successResponse(res, 200, "Login successful", {
        token,
        user: userPayload,
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return errorResponse(res, 400, "Invalid email or password");
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return errorResponse(res, 400, "Invalid email or password");
    }

    const userPayload = {
      id: String(user._id),
      name: user.name || null,
      email: user.email || null,
      role: user.role || null,
      tenantType: user.tenantType || null,
      organizationId: user.organizationId || null,
      organizationName: user.organizationName || null,
      branchId: user.branchId || null,
      branchName: user.branchName || null,
      status: user.status || null,
    };

    const token = jwt.sign(userPayload, jwtSecret, { expiresIn: "7d" });

    return successResponse(res, 200, "Login successful", {
      token,
      user: userPayload,
    });
  } catch (error) {
    console.error("loginUser error:", error);
    return errorResponse(res, 500, "Server error while logging in", {
      error: error?.message || error,
    });
  }
};

// Legacy aliases kept for migration safety and routed to common handlers.
export const createHospitalOrganizationAdmin = async (req, res) => {
  req.body = {
    ...(req.body || {}),
    tenantType: "hospital",
  };
  return createOrganizationAdmin(req, res);
};

export const createCompanyOrganizationAdmin = async (req, res) => {
  req.body = {
    ...(req.body || {}),
    // company_super_admin can create both bank and supermarket organization_admin users.
    tenantType: normalizeTenantType(req.body?.tenantType),
  };
  return createOrganizationAdmin(req, res);
};

export const createHospitalBranchAdmin = async (req, res) => createBranchAdmin(req, res);
export const createCompanyBranchAdmin = async (req, res) => createBranchAdmin(req, res);
export const createHospitalStaffUser = async (req, res) => createStaffUser(req, res);
export const createCompanyBranchStaffUser = async (req, res) => createStaffUser(req, res);

export const getAllUsers = getUsers;
