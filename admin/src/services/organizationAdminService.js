import api from "./api";

/**
 * Fetch counts for the logged-in organization admin.
 * Counts are scoped by the user's tenantType and ownership identifiers.
 * organizationId is primary for all tenants, with divisionId fallback for migration.
 *
 * Returns { branches, services, branchAdmins, staff }
 */
export const getOrganizationAdminCounts = async (user) => {
  if (!user?.role || user.role !== "organization_admin") {
    return { branches: 0, services: 0, branchAdmins: 0, staff: 0 };
  }

  try {
    const tenantType = String(user.tenantType || "").trim().toLowerCase();
    const organizationId = user.organizationId || null;
    const divisionId = user.divisionId || null;

    const params = {
      tenantType,
    };

    if (organizationId) {
      params.organizationId = organizationId;
    } else if (divisionId) {
      // TODO: remove divisionId fallback after migration
      params.divisionId = divisionId;
    } else {
      return { branches: 0, services: 0, branchAdmins: 0, staff: 0 };
    }

    const response = await api.get("/organization-admin/counts", { params });

    if (response.data?.success) {
      return {
        branches: response.data.counts?.branches || 0,
        services: response.data.counts?.services || 0,
        branchAdmins: response.data.counts?.branchAdmins || 0,
        staff: response.data.counts?.staff || 0,
      };
    }

    return { branches: 0, services: 0, branchAdmins: 0, staff: 0 };
  } catch (error) {
    console.error("Error fetching organization admin counts:", error);
    return { branches: 0, services: 0, branchAdmins: 0, staff: 0 };
  }
};

export const getOrganizationBranchAdmins = async () => {
  try {
    const response = await api.get("/organization/branch-admins");
    return response.data;
  } catch (error) {
    console.error("getOrganizationBranchAdmins error:", error.response?.data || error.message);
    throw (
      error.response?.data || {
        success: false,
        message: "Error fetching organization branch admins",
      }
    );
  }
};

export const createOrganizationBranchAdmin = async (payload) => {
  try {
    const response = await api.post("/users/branch-admins", payload);
    return response.data;
  } catch (error) {
    console.error("createOrganizationBranchAdmin error:", error.response?.data || error.message);
    throw (
      error.response?.data || {
        success: false,
        message: "Error creating organization branch admin",
      }
    );
  }
};

export const getOrganizationBranchServices = async () => {
  try {
    const response = await api.get("/organization/branch-services");
    return response.data;
  } catch (error) {
    console.error("getOrganizationBranchServices error:", error.response?.data || error.message);
    throw (
      error.response?.data || {
        success: false,
        message: "Error fetching organization branch services",
      }
    );
  }
};

export const createOrganizationService = async (payload) => {
  try {
    const response = await api.post("/organization/services", payload);
    return response.data;
  } catch (error) {
    console.error("createOrganizationService error:", error.response?.data || error.message);
    throw (
      error.response?.data || {
        success: false,
        message: "Error creating organization service",
      }
    );
  }
};
