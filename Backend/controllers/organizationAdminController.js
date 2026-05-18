import User from "../models/User.js";
import Organization from "../models/Organization.js";
import Branch from "../models/Branch.js";
import Service from "../models/Service.js";

/**
 * Get organization admin dashboard counts.
 * org_admin users are scoped by:
 * - organizationId for all tenant types
 */
export const getOrganizationAdminCounts = async (req, res) => {
  try {
    const { tenantType, organizationId } = req.query;

    if (!tenantType) {
      return res.status(400).json({
        success: false,
        message: "tenantType query parameter is required",
      });
    }

    const scopeTenantType = String(tenantType).trim().toLowerCase();
    let scopeFilter = {};

    if (["police", "bank", "supermarket", "hospital"].includes(scopeTenantType)) {
      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message: "organizationId is required for this tenant",
        });
      }
      scopeFilter = { organizationId };
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid tenantType",
      });
    }

    // Count total branch admins scoped to this tenant/org
    const branchAdminCount = await User.countDocuments({
      ...scopeFilter,
      role: "branch_admin",
    });

    // Count total staff scoped to this tenant/org
    const staffCount = await User.countDocuments({
      ...scopeFilter,
      role: "staff",
    });

    // Branches: for police, count scoped police divisions (stored in Organization)
    // For others, count branches (when that model/data exists)
    let branchesCount = 0;
    if (scopeTenantType === "police") {
      branchesCount = await Organization.countDocuments({
        _id: organizationId,
        tenantType: "police",
      });
    }
    // TODO: Add similar branch counting logic for bank/supermarket/hospital when those models exist

    // Services: For now placeholder. TODO: count services when Service model exists
    let servicesCount = 0;
    // Count unique services for the organization
    try {
      servicesCount = await Service.countDocuments({ organizationId, tenantType: scopeTenantType });
    } catch (e) {
      servicesCount = 0;
    }

    return res.status(200).json({
      success: true,
      counts: {
        branches: branchesCount,
        services: servicesCount,
        branchAdmins: branchAdminCount,
        staff: staffCount,
      },
    });
  } catch (error) {
    console.error("getOrganizationAdminCounts error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching organization admin counts",
    });
  }
};

export const getOrganizationBranchAdminsGrouped = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const role = String(req.user.role || "").trim().toLowerCase();
    if (role !== "organization_admin") {
      return res.status(403).json({
        success: false,
        message: "Only organization_admin can access branch admins",
      });
    }

    const tenantType = String(req.user.tenantType || "").trim().toLowerCase();
    const scopeFilter = {
      role: "branch_admin",
      branchId: { $ne: null },
    };

    if (["police", "bank", "supermarket", "hospital"].includes(tenantType)) {
      if (!req.user.organizationId) {
        return res.status(400).json({
          success: false,
          message: "organizationId is required for tenant scope",
        });
      }
      scopeFilter.organizationId = req.user.organizationId;
    } else {
      return res.status(400).json({
        success: false,
        message: "Unsupported tenantType for organization admin",
      });
    }

    const branchAdmins = await User.find(scopeFilter)
      .select("_id name email username phone status branchId branchName createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const branchIds = [
      ...new Set(
        branchAdmins
          .map((admin) => (admin.branchId ? String(admin.branchId) : null))
          .filter(Boolean)
      ),
    ];

    const branches = branchIds.length
      ? await Branch.find({ _id: { $in: branchIds } }).select("_id branchName").lean()
      : [];

    const branchNameById = new Map(
      branches.map((branch) => [String(branch._id), branch.branchName || "Unknown Branch"])
    );

    const groupedMap = new Map();

    for (const admin of branchAdmins) {
      const branchId = String(admin.branchId);
      const branchName = branchNameById.get(branchId) || admin.branchName || "Unknown Branch";

      if (!groupedMap.has(branchId)) {
        groupedMap.set(branchId, {
          branchId,
          branchName,
          admins: [],
          latestCreatedAt: admin.createdAt || null,
        });
      }

      const group = groupedMap.get(branchId);
      group.admins.push({
        id: admin._id,
        name: admin.name || "",
        email: admin.email || "",
        username: admin.username || "",
        phone: admin.phone || "",
        status: admin.status || "inactive",
      });

      if (
        admin.createdAt &&
        (!group.latestCreatedAt || new Date(admin.createdAt) > new Date(group.latestCreatedAt))
      ) {
        group.latestCreatedAt = admin.createdAt;
      }
    }

    const grouped = Array.from(groupedMap.values())
      .sort((a, b) => new Date(b.latestCreatedAt || 0) - new Date(a.latestCreatedAt || 0))
      .map(({ latestCreatedAt, ...group }) => group);

    return res.status(200).json(grouped);
  } catch (error) {
    console.error("getOrganizationBranchAdminsGrouped error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching grouped branch admins",
    });
  }
};

export const addOrganizationBranchService = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "User authentication required" });
    }

    const role = String(req.user.role || "").trim().toLowerCase();
    if (role !== "organization_admin") {
      return res.status(403).json({ success: false, message: "Only organization_admin can add branch services" });
    }

    const { branchId, serviceName, description = "", status = "active", availableDates = [] } = req.body || {};

    if (!branchId || !serviceName || !status) {
      return res.status(400).json({ success: false, message: "branchId, serviceName, and status are required" });
    }

    const normalizedTenantType = String(req.user.tenantType || "").trim().toLowerCase();
    const normalizedStatus = String(status).trim().toLowerCase();

    // ශාඛාව පරීක්ෂා කිරීමේ query එක
    const branchScopeFilter = {
      _id: branchId,
      tenantType: normalizedTenantType,
      organizationId: req.user.organizationId // Organization Admin ගේ scope එක පමණක් බලයි
    };

    const branch = await Branch.findOne(branchScopeFilter).select("_id branchName organizationId isMain");

    if (!branch) {
      return res.status(404).json({ success: false, message: "Branch not found in your scope" });
    }

    
    const normalizedServiceName = String(serviceName || "").trim();

    // 1. පද්ධතියේ දැනටමත් මෙම නමින් සේවාවක් තිබේදැයි පරීක්ෂා කිරීම (Global Search)
    let service = await Service.findOne({
      serviceName: { $regex: new RegExp(`^${normalizedServiceName}$`, "i") },
    });

    let isNewService = false;

    if (!service) {
      // 2. සේවාව පද්ධතියේ නැතිනම් අලුතින් නිර්මාණය කිරීම
      // මෙහිදී 'unique: true' index එකක් තිබේ නම් Race condition එකකදී Catch block එකට යොමු වේ
      service = await Service.create({
        tenantType: normalizedTenantType,
        organizationId: branch.organizationId || null,
        isDivisionService: Boolean(branch.isMain),
        serviceName: normalizedServiceName,
        description: String(description || "").trim(),
        availableDates: Array.isArray(availableDates) ? availableDates : [],
        status: normalizedStatus,
        createdBy: req.user.id || req.user._id || null,
        branchIds: [branch._id]
      });
      isNewService = true;
    }else {

      await Service.findByIdAndUpdate(service._id, {
        $addToSet: { branchIds: branch._id }
      });
    }

    // 3. සේවාව අලුතින් හැදුණත්, පරණ එකක් වුණත් අනිවාර්යයෙන්ම Branch එකේ Array එකට ID එක දමයි
    // $addToSet භාවිතා කරන්නේ එකම ID එක දෙපාරක් වැටීම වැළැක්වීමටයි
    await Branch.findByIdAndUpdate(branchId, {
      $addToSet: { services: service._id },
    });

    return res.status(isNewService ? 201 : 200).json({
      success: true,
      message: isNewService ? "Service created and linked successfully" : "Existing service linked to this branch",
      service: {
        id: service._id,
        serviceName: service.serviceName,
      },
    });

  } catch (error) {
    if (error.code === 11000) {
      const { serviceName, branchId } = req.body;
      
      const existingService = await Service.findOne({
        serviceName: { $regex: new RegExp(`^${String(serviceName).trim()}$`, "i") },
      });

      if (existingService) {
        // 1. Service model එකේ branchIds array එකට මෙම branch එක එකතු කරන්න (මෙය අමතක වී තිබුණි)
        await Service.findByIdAndUpdate(existingService._id, {
          $addToSet: { branchIds: branchId }
        });

        // 2. Branch model එකේ services array එකට මෙම service එක එකතු කරන්න
        await Branch.findByIdAndUpdate(branchId, {
          $addToSet: { services: existingService._id },
        });

        return res.status(200).json({
          success: true,
          message: "Existing service linked on collision retry",
          service: { id: existingService._id, serviceName: existingService.serviceName }
        });
      }
    }

    console.error("addOrganizationBranchService error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrganizationBranchServices = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const role = String(req.user.role || "").trim().toLowerCase();
    if (role !== "organization_admin") {
      return res.status(403).json({
        success: false,
        message: "Only organization_admin can access branch services",
      });
    }

    const tenantType = String(req.user.tenantType || "").trim().toLowerCase();
    const branchScopeFilter = {
      tenantType,
    };

    if (["police", "bank", "supermarket", "hospital"].includes(tenantType)) {
      if (!req.user.organizationId) {
        return res.status(400).json({
          success: false,
          message: "organizationId is required for tenant scope",
        });
      }
      branchScopeFilter.organizationId = req.user.organizationId;
    }

    const branches = await Branch.find(branchScopeFilter)
      .select("_id branchName")
      .sort({ createdAt: -1 })
      .lean();

    if (!branches.length) {
      return res.status(200).json([]);
    }

    const branchIds = branches.map((branch) => branch._id);

    const services = await Service.find({ branchIds: { $in: branchIds } })
      .select("_id branchIds serviceName description status availableDates createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // Prepare map of branchId -> services
    const servicesByBranchId = new Map();
    for (const branchId of branchIds) {
      servicesByBranchId.set(String(branchId), []);
    }

    for (const service of services) {
      const linkedBranchIds = Array.isArray(service.branchIds) ? service.branchIds.map(String) : [];
      for (const bId of linkedBranchIds) {
        if (servicesByBranchId.has(bId)) {
          servicesByBranchId.get(bId).push({
            id: service._id,
            branchIds: linkedBranchIds,
            serviceName: service.serviceName,
            description: service.description || "",
            availableDates: service.availableDates || [],
            status: service.status,
            createdAt: service.createdAt,
          });
        }
      }
    }

    const response = branches.map((branch) => ({
      branchId: branch._id,
      branchName: branch.branchName,
      services: servicesByBranchId.get(String(branch._id)) || [],
    }));

    return res.status(200).json(response);
  } catch (error) {
    console.error("getOrganizationBranchServices error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching organization branch services",
    });
  }
};
