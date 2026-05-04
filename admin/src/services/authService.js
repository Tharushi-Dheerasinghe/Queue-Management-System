import { STORAGE_KEYS } from "../utils/storageKeys";
import api from "./api";

const toNullable = (value) => (value === undefined ? null : value);

const normalizeLoginUser = (user) => {
  const source = user && typeof user === "object" ? user : {};

  return {
    ...source,
    role: toNullable(source.role),
    tenantType: toNullable(source.tenantType),
    organizationId: toNullable(source.organizationId),
    branchId: toNullable(source.branchId),
  };
};

export function saveAuthToken(token) {
  if (!token) {
    return;
  }

  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, String(token));
}

export function getStoredAuthToken() {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}

export function clearAuthToken() {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
}

export const loginUser = async (payload) => {
  const { data } = await api.post("/auth/login", payload);

  if (data?.token) {
    saveAuthToken(data.token);
  }

  return {
    ...data,
    user: normalizeLoginUser(data?.user),
  };
};

export function getStoredAuthState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveAuthState(authState) {
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(authState));
}

export function clearAuthState() {
  localStorage.removeItem(STORAGE_KEYS.AUTH);
  clearAuthToken();
}
