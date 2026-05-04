import api from "./api";

export const getMyBranchRequests = async () => {
  try {
    const response = await api.get("/branch-requests/my");
    return response.data;
  } catch (error) {
    console.error("getMyBranchRequests error:", error.response?.data || error.message);
    throw (
      error.response?.data || {
        success: false,
        message: "Error fetching my branch requests",
        branchRequests: [],
      }
    );
  }
};

export const getPendingBranchRequests = async () => {
  try {
    const response = await api.get("/branch-requests/pending");
    return response.data;
  } catch (error) {
    console.error("getPendingBranchRequests error:", error.response?.data || error.message);
    throw (
      error.response?.data || {
        success: false,
        message: "Error fetching pending police branch requests",
        branchRequests: [],
      }
    );
  }
};

// TODO: remove legacy endpoint after migration
export const getPendingPoliceBranchRequests = getPendingBranchRequests;

export const approveBranchRequest = async (requestId) => {
  try {
    const response = await api.patch(`/branch-requests/${requestId}/approve`);
    return response.data;
  } catch (error) {
    console.error("approveBranchRequest error:", error.response?.data || error.message);
    throw (
      error.response?.data || {
        success: false,
        message: "Error approving branch request",
      }
    );
  }
};

export const rejectBranchRequest = async (requestId) => {
  try {
    const response = await api.patch(`/branch-requests/${requestId}/reject`);
    return response.data;
  } catch (error) {
    console.error("rejectBranchRequest error:", error.response?.data || error.message);
    throw (
      error.response?.data || {
        success: false,
        message: "Error rejecting branch request",
      }
    );
  }
};
