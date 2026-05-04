import api from "./api";

const emptyCounts = {
  staff: 0,
  tokens: 0,
  operations: 0,
  tasks: 0,
};

export const getBranchAdminCounts = async (authState) => {
  if (!authState?.branchId) {
    return emptyCounts;
  }

  try {
    const response = await api.get("/branch-admin/counts");

    if (!response.data?.success) {
      return emptyCounts;
    }

    return {
      staff: Number(response.data.counts?.staff || 0),
      tokens: Number(response.data.counts?.tokens || 0),
      operations: Number(response.data.counts?.operations || 0),
      tasks: Number(response.data.counts?.tasks || 0),
    };
  } catch (error) {
    console.error("Error fetching branch admin counts:", error);
    return emptyCounts;
  }
};

export const getBranchStaffUsers = async () => {
  try {
    const response = await api.get("/staff");
    return response.data;
  } catch (error) {
    console.error("getBranchStaffUsers error:", error.response?.data || error.message);
    throw (
      error.response?.data || {
        success: false,
        message: "Error fetching staff users",
        staff: [],
      }
    );
  }
};

export const createBranchStaffUser = async (payload) => {
  try {
    const response = await api.post("/staff", payload);
    return response.data;
  } catch (error) {
    console.error("createBranchStaffUser error:", error.response?.data || error.message);
    throw (
      error.response?.data || {
        success: false,
        message: "Error creating staff user",
      }
    );
  }
};

export const createHospitalBranchStaffUser = async (payload) => {
  try {
    const response = await api.post("/users/staff", payload);
    return response.data;
  } catch (error) {
    console.error("createHospitalBranchStaffUser error:", error.response?.data || error.message);
    throw (
      error.response?.data || {
        success: false,
        message: "Error creating hospital staff user",
      }
    );
  }
};

export const getBranchAdminOperationsDashboard = async () => {
  try {
    const response = await api.get("/branch-admin/operations");
    return response.data;
  } catch (error) {
    console.error("getBranchAdminOperationsDashboard error:", error.response?.data || error.message);
    throw (
      error.response?.data || {
        success: false,
        message: "Error fetching branch operations dashboard",
      }
    );
  }
};

export const createBranchCounter = async (payload) => {
  try {

    const updatedPayload = {
      ...payload,
    };

    const response = await api.post("/counters", updatedPayload);
    return response.data;
  } catch (error) {
    console.error("createBranchCounter error:", error.response?.data || error.message);
    throw (
      error.response?.data || {
        success: false,
        message: "Error creating counter",
      }
    );
  }
};
