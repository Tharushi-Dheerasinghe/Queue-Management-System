import { createTokenRequest, trackTokenByNumberRequest, cancelTokenRequest } from "../api/userQueueApi";
import client from "../api/client";

export const cancelQueueToken = async (tokenId) => {
  const { data } = await cancelTokenRequest(tokenId);
  return data?.token || null;
};
import { legacyStorageKeys, readValue, removeItem, storageKeys, writeValue } from "../utils/storage";

const normalize = (value = "") => String(value || "").trim();

const getTokenStorageKey = (tenantType) => storageKeys.tokenData(tenantType);

export const createQueueToken = async (payload) => {
  const { data } = await createTokenRequest(payload);
  const token = data?.token || null;
  if (!token?.tokenNumber) {
    throw new Error("Token number not received from server");
  }
  writeValue(localStorage, getTokenStorageKey(payload.tenantType), token.tokenNumber);
  return token;
};

export const trackQueueTokenByNumber = async (tokenNumber) => {
  const normalizedTokenNumber = normalize(tokenNumber).toUpperCase();
  if (!normalizedTokenNumber) {
    return null;
  }

  const { data } = await trackTokenByNumberRequest(normalizedTokenNumber);
  return data?.token || null;
};

export const getStoredTokenNumber = (tenantType) => {
  const rawValue = readValue(localStorage, getTokenStorageKey(tenantType), [legacyStorageKeys.tokenData]);

  if (!rawValue) {
    return "";
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (parsed && typeof parsed === "object") {
      return normalize(parsed.tokenNumber).toUpperCase();
    }
  } catch {
    // value is plain token string
  }

  return normalize(rawValue).toUpperCase();
};

export const clearQueueToken = (tenantType) => {
  removeItem(localStorage, getTokenStorageKey(tenantType));
  removeItem(localStorage, storageKeys.selectedTenant(tenantType));
  removeItem(localStorage, storageKeys.selectedBranch(tenantType));
  removeItem(localStorage, storageKeys.selectedService(tenantType));
  removeItem(localStorage, legacyStorageKeys.tokenData);
  removeItem(localStorage, legacyStorageKeys.selectedBranch);
  removeItem(localStorage, legacyStorageKeys.selectedService);
};

export const getStoredToken = (tenantType) => {
  const tokenNumber = getStoredTokenNumber(tenantType);
  return tokenNumber ? { tokenNumber } : null;
};

export const getMyBookings = async () => {
  try {
    const { data } = await client.get("/tokens/my-bookings");
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Error fetching my bookings:", error);
    return [];
  }
};
