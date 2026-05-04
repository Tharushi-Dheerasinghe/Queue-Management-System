import Organization from "../models/Organization.js";
import Branch from "../models/Branch.js";
import User from "../models/User.js";
import Service from "../models/Service.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  isOrganizationAdmin,
  isSuperAdmin,
  normalizeTenantType,
} from "../utils/scopeHelpers.js";
import { errorResponse, successResponse } from "../utils/responseHelpers.js";
import { isValidObjectId, requireFields } from "../utils/validationHelpers.js";

const ALLOWED_TENANT_TYPES = new Set(["police", "hospital", "bank", "supermarket"]);
const ALLOWED_STATUS = new Set(["pending", "approved", "active", "inactive", "rejected"]);
const ALLOWED_BRANCH_STATUS = new Set(["active", "inactive"]);
const NON_POLICE_ORGANIZATION_CODE_PREFIX = {
  bank: "BNK",
  supermarket: "SUP",
  hospital: "HOS",
};
const ORGANIZATION_CODE_GENERATION_MAX_ATTEMPTS = 10;

const normalizeText = (value = "") => String(value || "").trim();

const toValidObjectIdOrNull = (value) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? value : null;
};

const normalizeOptionalOrganizationCode = (value = "") => {
  const organizationCode = normalizeText(value).toUpperCase();
  return organizationCode || undefined;
};

const generateRandom4Digits = () => String(Math.floor(1000 + Math.random() * 9000));

const generateUniqueOrganizationCodeForTenant = async (tenantType = "") => {
  const prefix = NON_POLICE_ORGANIZATION_CODE_PREFIX[tenantType];

  if (!prefix) {
    return undefined;
  }

  for (let attempt = 0; attempt < ORGANIZATION_CODE_GENERATION_MAX_ATTEMPTS; attempt += 1) {
    const candidateCode = `${prefix}-${generateRandom4Digits()}`;
    const exists = await Organization.findOne({ organizationCode: candidateCode }).lean();

    if (!exists) {
      return candidateCode;
    }
  }

  throw new Error("Unable to generate a unique organizationCode at this time");
};

const normalizeServiceEntry = (entry) => {
  if (typeof entry === "string") {
    const serviceName = normalizeText(entry);
    return serviceName ? { serviceName } : null;
  }

  if (!entry || typeof entry !== "object") {
    return null;
  }

  const serviceName = normalizeText(entry.serviceName || entry.name);
  if (!serviceName) {
    return null;
  }

  return {
    serviceName,
    description: normalizeText(entry.description),
    status: normalizeText(entry.status || "active").toLowerCase(),
  };
};

const normalizeServicesInput = (services = []) => {
  const uniqueByName = new Map();

  for (const service of Array.isArray(services) ? services : []) {
    const normalized = normalizeServiceEntry(service);
    if (!normalized) {
      continue;
    }

    uniqueByName.set(normalized.serviceName.toLowerCase(), normalized);
  }

  return Array.from(uniqueByName.values());
};

const normalizeQueueSettings = (queueSettings = {}) => ({
  bookingType: queueSettings?.bookingType || "token",
  tokenPrefix: normalizeText(queueSettings?.tokenPrefix),
  maxDailyTokens: Number(queueSettings?.maxDailyTokens || 0),
  priorityEnabled: Boolean(queueSettings?.priorityEnabled),
});

const resolvePoliceNames = (body = {}) => {
  const explicitDivisionName = normalizeText(body.divisionName || body.branchName);
  const rawOrganizationName = normalizeText(body.organizationName);

  if (explicitDivisionName) {
    return {
      divisionName: explicitDivisionName,
      organizationName: rawOrganizationName || "Sri Lanka Police",
    };
  }

  if (rawOrganizationName) {
    return {
      divisionName: rawOrganizationName,
      organizationName: "Sri Lanka Police",
    };
  }

  return {
    divisionName: "Police Division",
    organizationName: "Sri Lanka Police",
  };
};

const buildPoliceCreatePayload = (body = {}) => {
  const names = resolvePoliceNames(body);
  const payload = {
    tenantType: "police",
    organizationName: names.organizationName,
    divisionName: names.divisionName,
    shortName: normalizeText(body.shortName),
    district: normalizeText(body.district),
    province: normalizeText(body.province),
    city: normalizeText(body.city),
    address: normalizeText(body.address),
    contactNumber: normalizeText(body.contactNumber),
    email: normalizeText(body.email).toLowerCase(),
    category: normalizeText(body.category),
    queueSettings: normalizeQueueSettings(body.queueSettings || {}),
    status: normalizeText(body.status || "pending").toLowerCase(),
    approvedAt: body.approvedAt || null,
  };

  const organizationCode = normalizeOptionalOrganizationCode(
    body.organizationCode || body.stationCode
  );

  if (organizationCode) {
    payload.organizationCode = organizationCode;
  }

  return payload;
};

const toLegacyPoliceDivisionShape = (organization = {}, services = [], admin = null, isMain = false) => ({
  ...(() => {
    const { divisionName: _divisionName, ...organizationData } = organization || {};
    return organizationData;
  })(),
  id: organization?._id || organization?.id || null,
  organizationId: organization?._id || organization?.organizationId || null,
  organizationName: normalizeText(organization?.organizationName) || "Sri Lanka Police",
  branchName: normalizeText(organization?.organizationName) || "Police Division",
  stationCode: normalizeText(organization?.organizationCode),
  services,
  admin,
  isMain: Boolean(isMain),
  branchCount: 0,
  branchAdminAccess: false,
});

const validateOrganizationAdminInput = (admin = {}, options = {}) => {
  const { required = false } = options;
  const name = normalizeText(admin?.name);
  const email = normalizeText(admin?.email).toLowerCase();
  const username = normalizeText(admin?.username);
  const password = String(admin?.password || "").trim();
  const phone = normalizeText(admin?.phone);

  const hasAnyField = Boolean(name || email || username || password || phone);

  if (!hasAnyField) {
    if (required) {
      throw new Error("Admin details are required");
    }

    return null;
  }

  if (!name || !email || !username || !password) {
    throw new Error("Please fill all required admin fields");
  }

  return {
    name,
    email,
    username,
    password,
    phone,
  };
};

const buildCreatePayload = (body = {}) => ({
  tenantType: normalizeTenantType(body.tenantType),
  organizationName: normalizeText(body.organizationName),
  shortName: normalizeText(body.shortName),
  district: normalizeText(body.district),
  province: normalizeText(body.province),
  city: normalizeText(body.city),
  address: normalizeText(body.address),
  contactNumber: normalizeText(body.contactNumber),
  email: normalizeText(body.email).toLowerCase(),
  category: normalizeText(body.category),
  queueSettings: body.queueSettings || {},
  status: normalizeText(body.status || "pending").toLowerCase(),
  approvedAt: body.approvedAt || null,
});

const buildCreatePayloadByTenant = (body = {}, tenantType = "") => {
  const payload = tenantType === "police"
    ? buildPoliceCreatePayload(body)
    : buildCreatePayload(body);

  if (tenantType !== "police") {
    const organizationCode = normalizeOptionalOrganizationCode(body.organizationCode);

    if (organizationCode) {
      payload.organizationCode = organizationCode;
    }
  }

  return payload;
};

const checkDuplicateAdminEmail = async (email = "") => {
  const normalizedEmail = normalizeText(email).toLowerCase();
  if (!normalizedEmail) {
    return;
  }

  const existingUser = await User.findOne({ email: normalizedEmail }).lean();
  if (existingUser) {
    throw new Error("Admin email already exists");
  }
};

const resolveMainBranchPayload = ({ tenantType, organization, body = {}, requestedBy = null }) => {
  const branchInput = body.branch || {};
  const divisionName = normalizeText(organization.divisionName || organization.organizationName);
  const organizationName = normalizeText(organization.organizationName);
  const fallbackBranchName = tenantType === "police"
    ? `${divisionName || "Police Division"} Main Branch`
    : `${organizationName || "Organization"} Main Branch`;

  const branchName = normalizeText(
    branchInput.branchName ||
      branchInput.name ||
      body.branchName ||
      body.divisionName ||
      fallbackBranchName
  );

  const branchCode = normalizeText(
    branchInput.branchCode ||
      body.branchCode ||
      body.stationCode
  );

  const status = normalizeText(branchInput.status || "active").toLowerCase();

  return {
    tenantType,
    organizationId: organization._id,
    organizationName,
    divisionId: tenantType === "police" ? organization._id : null,
    divisionName: tenantType === "police" ? divisionName || "Police Division" : null,
    branchName,
    shortName: normalizeText(branchInput.shortName || body.shortName),
    branchCode: branchCode || null,
    city: normalizeText(branchInput.city || body.city),
    address: normalizeText(branchInput.address || body.address),
    contactNumber: normalizeText(branchInput.contactNumber || body.contactNumber),
    email: normalizeText(branchInput.email || body.email).toLowerCase(),
    status: ALLOWED_BRANCH_STATUS.has(status) ? status : "active",
    createdBy: requestedBy,
    branchAdminAccess: false,
    isMain: true,
  };
};

const createMainBranchForOrganization = async ({ tenantType, organization, body = {}, requestedBy = null }) => {
  const payload = resolveMainBranchPayload({
    tenantType,
    organization,
    body,
    requestedBy,
  });

  if (tenantType === "police") {
    const existingMainBranch = await Branch.findOne({
      tenantType,
      divisionId: organization._id,
      isMain: true,
    });

    if (existingMainBranch) {
      return existingMainBranch;
    }
  }

  return Branch.create(payload);
};

const createServicesForBranch = async ({
  tenantType,
  organization,
  mainBranch,
  services = [],
  requestedBy = null,
}) => {
  const normalizedServices = normalizeServicesInput(services);
  const createdByObjectId = toValidObjectIdOrNull(requestedBy);

  if (normalizedServices.length === 0) {
    return [];
  }

  const createdServices = [];

  for (const service of normalizedServices) {
    const filter = {
      branchId: mainBranch._id,
      serviceName: service.serviceName,
    };

    const setOnInsert = {
      tenantType,
      organizationId: organization._id,
      divisionId: tenantType === "police" ? organization._id : null,
      branchId: mainBranch._id,
      isDivisionService: tenantType === "police",
      serviceName: service.serviceName,
      description: service.description || "",
      status: service.status === "inactive" ? "inactive" : "active",
      createdBy: createdByObjectId,
    };

    const savedService = await Service.findOneAndUpdate(
      filter,
      { $setOnInsert: setOnInsert },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    createdServices.push(savedService);
  }

  return createdServices;
};

const createOrganizationAdminUser = async ({
  tenantType,
  organization,
  mainBranch,
  admin,
}) => {
  try {
    const hashedPassword = await bcrypt.hash(admin.password, 10);
    const divisionName = normalizeText(organization.divisionName || organization.organizationName) || null;

    const userPayload = {
      name: admin.name,
      email: admin.email,
      password: hashedPassword,
      phone: admin.phone,
      username: admin.username,
      role: "organization_admin",
      tenantType,
      organizationId: organization._id,
      organizationName: organization.organizationName,
      divisionName: tenantType === "police" ? divisionName : null,
      branchId: null,
      branchName: null,
      status: "active",
    };

    console.log("createOrganizationAdminUser payload:", {
      ...userPayload,
      password: "[REDACTED]",
      adminSource: {
        email: admin?.email,
        username: admin?.username,
      },
      organizationContext: {
        organizationId: organization?._id,
        organizationName: organization?.organizationName,
      },
      mainBranchContext: {
        branchId: mainBranch?._id,
        branchName: mainBranch?.branchName,
      },
    });

    return await User.create(userPayload);
  } catch (error) {
    console.log(error);
  }
};

const buildOrganizationAdminResponse = (organizationAdmin = null) => {
  if (!organizationAdmin) {
    return null;
  }

  return {
    id: organizationAdmin._id,
    name: organizationAdmin.name,
    email: organizationAdmin.email,
    phone: organizationAdmin.phone,
    username: organizationAdmin.username,
    role: organizationAdmin.role,
    organizationId: organizationAdmin.organizationId || null,
    organizationName: organizationAdmin.organizationName || null,
    tenantType: organizationAdmin.tenantType || null,
  };
};

const buildMainBranchResponse = (mainBranch = null) => {
  if (!mainBranch) {
    return null;
  }

  return {
    id: mainBranch._id,
    branchName: mainBranch.branchName,
    branchCode: mainBranch.branchCode,
    tenantType: mainBranch.tenantType,
    organizationId: mainBranch.organizationId || null,
    organizationName: mainBranch.organizationName || null,
    isMain: Boolean(mainBranch.isMain),
    status: mainBranch.status,
    createdBy: mainBranch.createdBy || null,
  };
};

const buildServicesResponse = (services = []) =>
  (Array.isArray(services) ? services : []).map((service) => ({
    id: service._id,
    serviceName: service.serviceName,
    description: service.description,
    status: service.status,
    branchId: service.branchId,
    organizationId: service.organizationId || null,
    tenantType: service.tenantType,
  }));

const buildPatchPayload = (body = {}) => {
  const updates = {};

  if (body.organizationName !== undefined) {
    updates.organizationName = normalizeText(body.organizationName);
  }
  if (body.shortName !== undefined) {
    updates.shortName = normalizeText(body.shortName);
  }
  if (body.organizationCode !== undefined) {
    updates.organizationCode = normalizeText(body.organizationCode).toUpperCase() || null;
  }
  if (body.district !== undefined) {
    updates.district = normalizeText(body.district);
  }
  if (body.province !== undefined) {
    updates.province = normalizeText(body.province);
  }
  if (body.city !== undefined) {
    updates.city = normalizeText(body.city);
  }
  if (body.address !== undefined) {
    updates.address = normalizeText(body.address);
  }
  if (body.contactNumber !== undefined) {
    updates.contactNumber = normalizeText(body.contactNumber);
  }
  if (body.email !== undefined) {
    updates.email = normalizeText(body.email).toLowerCase();
  }
  if (body.category !== undefined) {
    updates.category = normalizeText(body.category);
  }
  if (body.queueSettings !== undefined) {
    updates.queueSettings = body.queueSettings || {};
  }
  if (body.status !== undefined) {
    updates.status = normalizeText(body.status).toLowerCase();
  }
  if (body.approvedAt !== undefined) {
    updates.approvedAt = body.approvedAt || null;
  }

  return updates;
};

const getUserTenantType = (user = {}) => normalizeTenantType(user.tenantType);

const getOrganizationAdminId = (user = {}) => user.organizationId || null;

// DEPRECATED compatibility note: legacy police endpoints still use division naming.

export const createOrganization = async (req, res) => {
  try {
    
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    if (!isSuperAdmin(req.user)) {
      return errorResponse(res, 403, "Only super_admin can create organizations");
    }

    const requestedTenantType = normalizeTenantType(req.body.tenantType);

    const requiredFields = requestedTenantType === "police"
      ? ["tenantType"]
      : ["tenantType", "organizationName"];

    const missingFields = requireFields(req.body, requiredFields);
    if (missingFields.length > 0) {
      return errorResponse(res, 400, `Missing required fields: ${missingFields.join(", ")}`);
    }

    const tenantType = requestedTenantType;
    if (!ALLOWED_TENANT_TYPES.has(tenantType)) {
      return errorResponse(res, 400, "tenantType must be one of police, hospital, bank, or supermarket");
    }

    const requesterRole = String(req.user?.role || "").trim().toLowerCase();
    const requesterTenantType = normalizeTenantType(req.user.tenantType);

    const allowedTenantTypesByRole = {
      company_super_admin: ["bank", "supermarket"],
      police_super_admin: ["police"],
      hospital_super_admin: ["hospital"],
    };

    const allowedTenantTypes = allowedTenantTypesByRole[requesterRole] || [requesterTenantType];

    if (!allowedTenantTypes.length || !allowedTenantTypes[0]) {
      return errorResponse(res, 400, "Logged-in user tenantType is required");
    }

    if (!allowedTenantTypes.includes(tenantType)) {
      return errorResponse(res, 403, "super_admin can only manage organizations within their tenant scope");
    }

    const payload = buildCreatePayloadByTenant(req.body, tenantType);

    if (tenantType !== "police" && !payload.organizationCode) {
      payload.organizationCode = await generateUniqueOrganizationCodeForTenant(tenantType);
    }

    if (payload.status && !ALLOWED_STATUS.has(payload.status)) {
      return errorResponse(res, 400, "Invalid status value");
    }

    if (payload.organizationCode) {
      const existingByCode = await Organization.findOne({ organizationCode: payload.organizationCode }).lean();
      if (existingByCode) {
        return errorResponse(res, 409, "organizationCode already exists");
      }
    }

    let parsedAdmin = null;

    try {
      parsedAdmin = validateOrganizationAdminInput(req.body?.admin || {}, {
        required: true,
      });
      await checkDuplicateAdminEmail(parsedAdmin.email);
    } catch (adminValidationError) {
      return errorResponse(res, 400, adminValidationError.message || "Invalid admin details");
    }

    const organization = await Organization.create(payload);
    const organizationId = organization._id;
    const requestedBy = req.user.id || req.user._id || null;
    const mainBranch = await createMainBranchForOrganization({
      tenantType,
      organization,
      body: req.body || {},
      requestedBy,
    });

    const createdServices = await createServicesForBranch({
      tenantType,
      organization,
      mainBranch,
      services: req.body?.services,
      requestedBy,
    });

    const organizationAdmin = await createOrganizationAdminUser({
      tenantType,
      organization,
      mainBranch,
      admin: parsedAdmin,
    });

    const responseData = {
      organization,
      mainBranch: buildMainBranchResponse(mainBranch),
      organizationAdmin: buildOrganizationAdminResponse(organizationAdmin),
      services: buildServicesResponse(createdServices),
    };

    if (tenantType === "police") {
      responseData.division = toLegacyPoliceDivisionShape(
        organization.toObject(),
        responseData.services.map((service) => service.serviceName),
        {
          name: parsedAdmin.name,
          email: parsedAdmin.email,
          phone: parsedAdmin.phone,
          username: parsedAdmin.username,
          role: "organization_admin",
        },
        req.body?.isMain
      );
      responseData.divisionAdmin = responseData.organizationAdmin;
    }

    return successResponse(
      res,
      201,
      "Organization, main branch, services, and organization admin created successfully",
      responseData
    );
  } catch (error) {
    if (error?.name === "ValidationError") {
      return errorResponse(res, 400, error.message);
    }

    console.error("createOrganization error:", error);
    return errorResponse(res, 500, "Server error while creating organization", {
      error: error?.message || error,
    });
  }
};

export const getOrganizations = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    const role = String(req.user.role || "").trim().toLowerCase();
    const requestedTenantType = normalizeTenantType(req.query?.tenantType);

    const allowedTenantTypesByRole = {
      company_super_admin: ["bank", "supermarket"],
      hospital_super_admin: ["hospital"],
      police_super_admin: ["police"],
    };

    if (isSuperAdmin(req.user)) {
      const allowedTenantTypes = allowedTenantTypesByRole[role] || [];

      if (requestedTenantType && !allowedTenantTypes.includes(requestedTenantType)) {
        return errorResponse(
          res,
          403,
          `Role ${role || "unknown"} can only request organizations within its tenant scope`
        );
      }

      const tenantType = requestedTenantType || getUserTenantType(req.user);
      if (!tenantType) {
        return errorResponse(res, 400, "Logged-in user tenantType is required");
      }

      if (allowedTenantTypes.length && !allowedTenantTypes.includes(tenantType)) {
        return errorResponse(
          res,
          403,
          `Role ${role || "unknown"} can only request organizations within its tenant scope`
        );
      }

      const organizations = await Organization.find({ tenantType }).sort({ createdAt: -1 });
      return successResponse(res, 200, "Organizations fetched successfully", {
        organizations,
      });
    }

    if (isOrganizationAdmin(req.user)) {
      const organizationId = getOrganizationAdminId(req.user);
      if (!organizationId) {
        return errorResponse(res, 400, "organizationId is required for organization_admin scope");
      }

      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return errorResponse(res, 404, "Organization not found");
      }

      return successResponse(res, 200, "Organization fetched successfully", {
        organizations: [organization],
      });
    }

    return errorResponse(res, 403, `Role ${role || "unknown"} is not allowed to list organizations`);
  } catch (error) {
    console.error("getOrganizations error:", error);
    return errorResponse(res, 500, "Server error while fetching organizations", {
      error: error?.message || error,
    });
  }
};

export const getOrganizationsList = async (req, res) => {
  try {
    const tenantType = normalizeTenantType(req.query?.tenantType);

    if (!tenantType) {
      return errorResponse(res, 400, "tenantType query parameter is required");
    }

    if (!ALLOWED_TENANT_TYPES.has(tenantType)) {
      return errorResponse(res, 400, "tenantType must be one of police, hospital, bank, or supermarket");
    }

    const organizations = await Organization.find({
      tenantType,
      status: { $in: ["approved", "active"] },
    })
      .select("_id organizationName divisionName")
      .sort({ organizationName: 1 })
      .lean();

    const mappedOrganizations = organizations
      .map((organization) => {
        const divisionName = normalizeText(organization?.divisionName);
        const organizationName = normalizeText(organization?.organizationName);
        const name = tenantType === "police"
          ? divisionName || organizationName
          : organizationName || divisionName;

        if (!name) {
          return null;
        }

        return {
          _id: organization?._id,
          name,
        };
      })
      .filter(Boolean);

    return successResponse(res, 200, "Organizations fetched successfully", {
      organizations: mappedOrganizations,
    });
  } catch (error) {
    console.error("getOrganizationsList error:", error);
    return errorResponse(res, 500, "Server error while fetching organizations list", {
      error: error?.message || error,
    });
  }
};

export const getOrganizationById = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid organization id");
    }

    const organization = await Organization.findById(id);
    if (!organization) {
      return errorResponse(res, 404, "Organization not found");
    }

    if (isSuperAdmin(req.user)) {
      const tenantType = getUserTenantType(req.user);
      if (tenantType && organization.tenantType !== tenantType) {
        return errorResponse(res, 403, "super_admin can only access organizations within their tenantType");
      }

      return successResponse(res, 200, "Organization fetched successfully", {
        organization,
      });
    }

    if (isOrganizationAdmin(req.user)) {
      const organizationId = getOrganizationAdminId(req.user);
      if (!organizationId) {
        return errorResponse(res, 400, "organizationId is required for organization_admin scope");
      }

      if (String(organizationId) !== String(organization._id)) {
        return errorResponse(res, 403, "organization_admin can only access their own organization");
      }

      return successResponse(res, 200, "Organization fetched successfully", {
        organization,
      });
    }

    return errorResponse(res, 403, "You are not allowed to access this organization");
  } catch (error) {
    console.error("getOrganizationById error:", error);
    return errorResponse(res, 500, "Server error while fetching organization", {
      error: error?.message || error,
    });
  }
};

export const updateOrganization = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    if (!isSuperAdmin(req.user)) {
      return errorResponse(res, 403, "Only super_admin can update organizations");
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid organization id");
    }

    const organization = await Organization.findById(id);
    if (!organization) {
      return errorResponse(res, 404, "Organization not found");
    }

    const requesterTenantType = getUserTenantType(req.user);
    if (requesterTenantType && organization.tenantType !== requesterTenantType) {
      return errorResponse(res, 403, "super_admin can only update organizations within their tenantType");
    }

    const updates = buildPatchPayload(req.body || {});

    if (req.body?.tenantType && normalizeTenantType(req.body.tenantType) !== organization.tenantType) {
      return errorResponse(res, 400, "tenantType cannot be changed");
    }

    if (updates.status && !ALLOWED_STATUS.has(updates.status)) {
      return errorResponse(res, 400, "Invalid status value");
    }

    if (updates.organizationCode) {
      const existingByCode = await Organization.findOne({
        organizationCode: updates.organizationCode,
        _id: { $ne: organization._id },
      }).lean();

      if (existingByCode) {
        return errorResponse(res, 409, "organizationCode already exists");
      }
    }

    Object.assign(organization, updates);
    await organization.save();

    return successResponse(res, 200, "Organization updated successfully", {
      organization,
    });
  } catch (error) {
    if (error?.name === "ValidationError") {
      return errorResponse(res, 400, error.message);
    }

    console.error("updateOrganization error:", error);
    return errorResponse(res, 500, "Server error while updating organization", {
      error: error?.message || error,
    });
  }
};
