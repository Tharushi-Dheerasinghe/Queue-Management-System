import Branch from "../models/Branch.js";
import Service from "../models/Service.js";
import {
  getBranchScope,
  getOrganizationScope,
  isBranchAdmin,
  isOrganizationAdmin,
  isStaff,
  isSuperAdmin,
  normalizeTenantType,
} from "../utils/scopeHelpers.js";
import { errorResponse, successResponse } from "../utils/responseHelpers.js";
import { isValidObjectId, requireFields } from "../utils/validationHelpers.js";

const ALLOWED_TENANT_TYPES = new Set(["police", "hospital", "bank", "supermarket"]);
const ALLOWED_STATUS = new Set(["active", "inactive"]);

const normalizeText = (value = "") => String(value || "").trim();

const buildServiceResponse = (service) => ({
  id: service._id,
  tenantType: service.tenantType,
  organizationId: service.organizationId || null,
  branchIds: service.branchIds || [],
  serviceName: service.serviceName,
  description: service.description || "",
  status: service.status,
  createdBy: service.createdBy || null,
  createdAt: service.createdAt,
  updatedAt: service.updatedAt,
});

const normalizeServiceTenantScope = (tenantType, organizationScope, branch) => {
  return {
    organizationId: organizationScope.organizationId || branch.organizationId || null,
  };
};

const getTenantFilter = (reqUser, tenantType) => {
  if (isSuperAdmin(reqUser)) {
    const superTenantType = normalizeTenantType(reqUser?.tenantType);
    return superTenantType && tenantType ? { tenantType: superTenantType } : null;
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

  if (isBranchAdmin(reqUser) || isStaff(reqUser)) {
    const scope = getBranchScope(reqUser);
    if (!scope.branchId) {
      return null;
    }

    return {
      tenantType,
      branchId: scope.branchId,
    };
  }

  return null;
};

const canManageBranch = (reqUser, branch) => {
  const tenantType = normalizeTenantType(reqUser?.tenantType);

  if (isSuperAdmin(reqUser)) {
    return branch.tenantType === tenantType;
  }

  if (isOrganizationAdmin(reqUser)) {
    const organizationScope = getOrganizationScope(reqUser);
    if (!organizationScope.organizationId) {
      return false;
    }

    return String(branch.organizationId || "") === String(organizationScope.organizationId);
  }

  return false;
};

const canReadBranchServices = (reqUser, branch) => {
  if (isSuperAdmin(reqUser)) {
    return branch.tenantType === normalizeTenantType(reqUser?.tenantType);
  }

  if (isOrganizationAdmin(reqUser)) {
    return canManageBranch(reqUser, branch);
  }

  if (isBranchAdmin(reqUser) || isStaff(reqUser)) {
    const branchScope = getBranchScope(reqUser);
    return String(branch._id || "") === String(branchScope.branchId || "");
  }

  return false;
};

const getBranchForTenant = async (branchId, tenantType, scope) => {
  const query = {
    _id: branchId,
    tenantType,
  };

  if (scope?.organizationId) {
    query.organizationId = scope.organizationId;
  }

  return Branch.findOne(query)
    .select("_id tenantType organizationId organizationName divisionId divisionName branchName status isMain")
    .lean();
};

export const createService = async (req, res) => {
  try {
    if (!req.user || !isOrganizationAdmin(req.user)) {
      return errorResponse(res, 403, "Only organization_admin can create services");
    }

    const { branchId, serviceName, description, status, tenantType: bodyTenantType } = req.body;
    
    if (!branchId || !serviceName) {
      return errorResponse(res, 400, "Missing required fields: branchId, serviceName");
    }

    const tenantType = normalizeTenantType(bodyTenantType || req.user.tenantType);
    const organizationScope = getOrganizationScope(req.user);

    // 1. අදාළ Branch එක සොයාගැනීම
    const branch = await Branch.findOne({ _id: branchId, organizationId: organizationScope.organizationId });
    if (!branch) {
      return errorResponse(res, 404, "Branch not found in your organization scope");
    }

    // 2. Atomic Upsert Logic: සේවාව තිබේ නම් ලබාගන්න, නැතිනම් සාදන්න.
    // මෙය Race conditions වළක්වයි.
    const service = await Service.findOneAndUpdate(
      { serviceName: { $regex: new RegExp(`^${serviceName.trim()}$`, "i") } }, // නම පරීක්ෂාව
      { 
        $setOnInsert: { // සේවාව අලුතින් සාදන විට පමණක් මේවා ඇතුළත් වේ
          tenantType,
          organizationId: organizationScope.organizationId,
          serviceName: serviceName.trim(),
          description: description || "",
          status: status || "active",
          createdBy: req.user.id || req.user._id,
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 3. Branch එකේ 'services' array එකට ID එක එක් කිරීම
    await Branch.findByIdAndUpdate(branchId, {
      $addToSet: { services: service._id }
    });

    return successResponse(res, 201, "Service linked to branch successfully", {
      service: {
        id: service._id,
        serviceName: service.serviceName,
        linkedToBranch: branchId
      }
    });

  } catch (error) {
    // සේවාවන් දෙකක් එකම වෙලාවේ නිර්මාණය වීමට ගොස් Database එකෙන් error එකක් ආවොත් (Unique index error)
    if (error.code === 11000) {
       // නැවත වරක් සේවාව සොයාගෙන link කිරීමට උත්සාහ කරන්න (Retry logic වැනි)
       const retryService = await Service.findOne({ serviceName: { $regex: new RegExp(`^${req.body.serviceName.trim()}$`, "i") } });
       if (retryService) {
          await Branch.findByIdAndUpdate(req.body.branchId, { $addToSet: { services: retryService._id } });
          return successResponse(res, 201, "Service linked successfully on retry");
       }
    }
    
    console.error("createService error:", error);
    return errorResponse(res, 500, "Server error while creating/linking service");
  }
};

export const getServices = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    const tenantType = normalizeTenantType(req.query.tenantType || req.user.tenantType);
    if (!ALLOWED_TENANT_TYPES.has(tenantType)) {
      return errorResponse(res, 400, "tenantType must be one of police, hospital, bank, or supermarket");
    }

    if (isSuperAdmin(req.user)) {
      if (tenantType !== normalizeTenantType(req.user.tenantType)) {
        return errorResponse(res, 403, "super_admin can only list services within their tenantType");
      }

      const services = await Service.find({ tenantType }).sort({ createdAt: -1 });
      return successResponse(res, 200, "Services fetched successfully", {
        count: services.length,
        services: services.map(buildServiceResponse),
      });
    }

    if (isOrganizationAdmin(req.user)) {
      const scope = getOrganizationScope(req.user);
      if (!scope.organizationId) {
        return errorResponse(res, 400, "organizationId is required for organization_admin scope");
      }

      const query = { tenantType, organizationId: scope.organizationId };

      const services = await Service.find(query).sort({ createdAt: -1 });
      return successResponse(res, 200, "Services fetched successfully", {
        count: services.length,
        services: services.map(buildServiceResponse),
      });
    }

    if (isBranchAdmin(req.user) || isStaff(req.user)) {
      const scope = getBranchScope(req.user);
      if (!scope.branchId) {
        return errorResponse(res, 400, "branchId is required for branch scope");
      }

      const services = await Service.find({ tenantType, branchIds: { $in: [scope.branchId] } }).sort({ createdAt: -1 });
      return successResponse(res, 200, "Services fetched successfully", {
        count: services.length,
        services: services.map(buildServiceResponse),
      });
    }

    return errorResponse(res, 403, "You are not allowed to list services");
  } catch (error) {
    console.error("getServices error:", error);
    return errorResponse(res, 500, "Server error while fetching services", {
      error: error?.message || error,
    });
  }
};

export const getBranchServices = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    const { branchId } = req.params;
    if (!isValidObjectId(branchId)) {
      return errorResponse(res, 400, "Invalid branchId");
    }

    const branch = await Branch.findById(branchId)
      .select("_id tenantType organizationId organizationName divisionId divisionName branchName")
      .lean();

    if (!branch) {
      return errorResponse(res, 404, "Branch not found");
    }

    const tenantType = normalizeTenantType(branch.tenantType);
    const branchScope = getBranchScope(req.user);
    const organizationScope = getOrganizationScope(req.user);

    const isRequestingOwnBranch = String(branch._id || "") === String(branchScope.branchId || "");
    const isOwnOrganizationBranch =
      String(branch.organizationId || "") === String(organizationScope.organizationId || "");

    if (isSuperAdmin(req.user)) {
      if (tenantType !== normalizeTenantType(req.user.tenantType)) {
        return errorResponse(res, 403, "super_admin can only access services within their tenantType");
      }
    } else if (isOrganizationAdmin(req.user)) {
      if (!isOwnOrganizationBranch) {
        return errorResponse(res, 403, "organization_admin can only access branches in their own organization");
      }
    } else if (isBranchAdmin(req.user) || isStaff(req.user)) {
      if (!isRequestingOwnBranch) {
        return errorResponse(res, 403, "branch_admin and staff can only access their own branch services");
      }
    } else {
      return errorResponse(res, 403, "You are not allowed to access branch services");
    }

    const services = await Service.find({ branchIds: { $in: [branch._id] } }).sort({ createdAt: -1 });

    return successResponse(res, 200, "Branch services fetched successfully", {
      branch: {
        id: branch._id,
        branchName: branch.branchName,
        tenantType: branch.tenantType,
      },
      count: services.length,
      services: services.map(buildServiceResponse),
    });
  } catch (error) {
    console.error("getBranchServices error:", error);
    return errorResponse(res, 500, "Server error while fetching branch services", {
      error: error?.message || error,
    });
  }
};

export const updateService = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "User authentication required");
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid service id");
    }

    const service = await Service.findById(id);
    if (!service) {
      return errorResponse(res, 404, "Service not found");
    }

    // Pick any branch linked to this service to determine its organization/tenant context
    const branch = await Branch.findOne({ _id: { $in: service.branchIds || [] } })
      .select("_id tenantType organizationId organizationName divisionId divisionName branchName")
      .lean();

    if (!branch) {
      return errorResponse(res, 404, "Branch not found for this service");
    }

    if (isSuperAdmin(req.user)) {
      if (normalizeTenantType(req.user.tenantType) !== normalizeTenantType(service.tenantType)) {
        return errorResponse(res, 403, "super_admin can only update services within their tenantType");
      }
    } else if (isOrganizationAdmin(req.user)) {
      if (!canManageBranch(req.user, branch)) {
        return errorResponse(res, 403, "organization_admin can only update services in their own organization");
      }
    } else {
      return errorResponse(res, 403, "Only super_admin or organization_admin can update services");
    }

    const updates = {};
    const allowedFields = ["serviceName", "description", "status"];
    for (const field of allowedFields) {
      if (req.body?.[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.serviceName !== undefined) {
      updates.serviceName = normalizeText(updates.serviceName);
      if (!updates.serviceName) {
        return errorResponse(res, 400, "serviceName cannot be empty");
      }
    }

    if (updates.description !== undefined) {
      updates.description = normalizeText(updates.description);
    }

    if (updates.status !== undefined) {
      updates.status = normalizeText(updates.status).toLowerCase();
      if (!ALLOWED_STATUS.has(updates.status)) {
        return errorResponse(res, 400, "status must be active or inactive");
      }
    }

    if (updates.serviceName && updates.serviceName !== service.serviceName) {
      // Ensure no other service with same name exists within the same organization
      const duplicateService = await Service.findOne({
        organizationId: service.organizationId,
        serviceName: { $regex: new RegExp(`^${updates.serviceName}$`, "i") },
        _id: { $ne: service._id },
      }).lean();

      if (duplicateService) {
        return errorResponse(res, 409, "Service with the same name already exists in this organization");
      }
    }

    Object.assign(service, updates);
    await service.save();

    return successResponse(res, 200, "Service updated successfully", {
      service: buildServiceResponse(service),
    });
  } catch (error) {
    console.error("updateService error:", error);
    return errorResponse(res, 500, "Server error while updating service", {
      error: error?.message || error,
    });
  }
};
