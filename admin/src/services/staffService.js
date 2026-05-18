import api from "./api";

export const getCurrentStaffTask = async () => {
  try {
    const response = await api.get("/work-sessions/current");
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: "Error fetching current staff task" };
  }
};

export const getStaffBranchServices = async () => {
  try {
    const response = await api.get("/work-sessions/services");
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: "Error fetching branch services" };
  }
};

export const getStaffBranchCounters = async () => {
  try {
    const response = await api.get("/work-sessions/counters");
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: "Error fetching branch counters" };
  }
};

export const startStaffTask = async (payload) => {
  try {
    const response = await api.post("/work-sessions/start", payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: "Error starting staff task" };
  }
};

export const endStaffTask = async () => {
  try {
    const response = await api.patch("/work-sessions/end");
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: "Error ending staff task" };
  }
};

// Smart Routing සඳහා අලුත් API calls
export const callNextToken = async (counterId) => {
  try {
    const response = await api.post("/tokens/call-next", { counterId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: "Error calling next token" };
  }
};

export const skipAndCallNextToken = async (counterId) => {
  try {
    const response = await api.post("/tokens/skip-and-call-next", { counterId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: "Error skipping current token" };
  }
};

export const recallTokenAPI = async (tokenId, counterId) => {
  try {
    const response = await api.post(`/tokens/${tokenId}/recall`, { counterId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: "Error recalling token" };
  }
};

// පෝලිමේ ඉන්න ගණන බලාගන්න (මේකට backend එකේ endpoint එකක් පසුව හදමු, දැනට fetchTokens පාවිච්චි කළ හැකියි)
export const getWaitingTokenCount = async (params) => {
  try {
    const response = await api.get("/tokens/waiting-count", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: "Error fetching waiting count" };
  }
};

export const getNextWaitingToken = async (serviceId, branchId) => {
  try {
    const response = await api.get("/tokens/next-waiting", {
      params: { serviceId, branchId }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: "Error fetching next token" };
  }
};

export const getWaitingTokensList = async (branchId, serviceId = "") => {
  try {
    const params = { branchId };
    if (serviceId) params.serviceId = serviceId;
    const response = await api.get("/tokens/waiting-list", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: "Error fetching waiting list" };
  }
};

export const getProcessedTokens = async (counterId, limit = 20) => {
  try {
    const response = await api.get("/tokens/processed-history", {
      params: { counterId, limit }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: "Error fetching processed tokens" };
  }
};

export const getActiveTokens = async (branchId, serviceId = "") => {
  try {
    const params = { branchId };
    if (serviceId) params.serviceId = serviceId;
    const response = await api.get("/tokens/active-tokens", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: "Error fetching active tokens" };
  }
};

export const getWaitRejectedList = async (branchId, serviceId = "") => {
  try {
    const params = { branchId };
    if (serviceId) params.serviceId = serviceId;
    const response = await api.get("/tokens/wait-rejected-list", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: "Error fetching wait/rejected list" };
  }
};

export const updateTokenStatus = async (tokenId, status) => {
  try {
    const response = await api.patch(`/tokens/${tokenId}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: "Error updating token status" };
  }
};

export const createWalkInToken = async (payload) => {
  try {
    const response = await api.post("/tokens", payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: "Error creating walk-in token" };
  }
};