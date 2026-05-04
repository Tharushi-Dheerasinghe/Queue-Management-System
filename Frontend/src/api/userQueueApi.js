export const cancelTokenRequest = (tokenId) =>
  client.patch(`/tokens/${encodeURIComponent(tokenId)}/status`, { status: "Cancelled" });
import client from "./client";

export const getPoliceDivisionsRequest = () => client.get("/user/police-divisions");

export const getBranchesRequest = ({ tenantType, organization }) =>
  client.get("/user/branches", {
    params: {
      tenantType,
      organization,
    },
  });

export const getServicesRequest = ({ tenantType, branchId }) =>
  client.get("/user/services", {
    params: {
      tenantType,
      branchId,
    },
  });

export const createTokenRequest = (payload) => client.post("/tokens", payload);

export const trackTokenByNumberRequest = (tokenNumber) =>
  client.get(`/tokens/track/${encodeURIComponent(tokenNumber)}`);
