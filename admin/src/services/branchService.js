import api from "./api";

/**
 * Create a new branch through the backend.
 * Tenant scope is enforced by the backend from req.user.
 */
export const createBranch = async (branchData) => {
  try {
    const response = await api.post("/branches", branchData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: "Error creating branch" };
  }
};

/**
 * Create hospital branch via dedicated hospital hierarchy endpoint.
 * Backend enforces organization scope from authenticated organization_admin user.
 */
export const createHospitalBranch = async (branchData) => {
  return createBranch(branchData);
};

/**
 * Create a bank or supermarket branch via the company hierarchy endpoint.
 * Backend enforces organization scope from authenticated organization_admin user.
 */
export const createCompanyBranch = async (branchData) => {
  return createBranch(branchData);
};

/**
 * Create hospital branch admin user in organization-admin scope.
 */
export const createHospitalBranchAdmin = async (payload) => {
  try {
    const response = await api.post("/users/branch-admins", payload);
    return response.data;
  } catch (error) {
    console.error("createHospitalBranchAdmin error:", error.response?.data || error.message);
    throw error.response?.data || { success: false, message: "Error creating hospital branch admin" };
  }
};

/**
 * Fetch branches for the logged-in user.
 * Backend returns only branches scoped to the user's tenant/organization/division.
 */
export const getBranches = async () => {
  try {
    const response = await api.get("/branches");
    return response.data;
  } catch (error) {
    console.error("getBranches error:", error.response?.data || error.message);
    throw error.response?.data || {
      success: false,
      message: "Error fetching branches",
      branches: [],
    };
  }
};

/**
 * Create a branch request via the branch requests endpoint.
 * Backend will process and handle admin creation on approval.
 */
export const createBranchRequest = async (branchData) => {
  try {
    const response = await api.post("/branch-requests", branchData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: "Error creating branch request" };
  }
};