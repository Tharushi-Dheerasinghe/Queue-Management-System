import api from "./api";

const ALLOWED_TENANT_TYPES = new Set(["police", "hospital", "bank", "supermarket"]);
const ORGANIZATION_ADMIN_ROLE = "organization_admin";
const ALL_SHARED_TENANTS = ["bank", "supermarket", "hospital", "police"];

const toArray = (value) => (Array.isArray(value) ? value : []);

export const normalizeTenantType = (value = "") => String(value || "").trim().toLowerCase();

const assertTenantType = (tenantType) => {
  const normalized = normalizeTenantType(tenantType);

  if (!ALLOWED_TENANT_TYPES.has(normalized)) {
    throw { success: false, message: `Unsupported tenantType: ${tenantType}` };
  }

  return normalized;
};

const getCollection = (data, primaryKey, secondaryKey) => {
  if (Array.isArray(data?.[primaryKey])) {
    return data[primaryKey];
  }

  if (Array.isArray(data?.[secondaryKey])) {
    return data[secondaryKey];
  }

  return toArray(data);
};

export const getOrganizationsByTenant = async (tenantType) => {
  const normalized = assertTenantType(tenantType);
  const response = await api.get("/organizations", {
    params: { tenantType: normalized },
  });

  return getCollection(response.data, "organizations", "organization").filter(
    (item) => normalizeTenantType(item?.tenantType) === normalized
  );
};

export const createOrganizationByTenant = async (tenantType, payload = {}) => {
  const normalized = assertTenantType(tenantType);
  const response = await api.post("/organizations", {
    ...payload,
    tenantType: normalized,
  });

  return response.data;
};

export const getBranchesByTenant = async (tenantType) => {
  const normalized = assertTenantType(tenantType);
  const response = await api.get("/branches", {
    params: { tenantType: normalized },
  });

  return getCollection(response.data, "branches", "branch").filter(
    (item) => normalizeTenantType(item?.tenantType) === normalized
  );
};

export const getServicesByTenant = async (tenantType) => {
  const normalized = assertTenantType(tenantType);
  const response = await api.get("/services", {
    params: { tenantType: normalized },
  });

  return getCollection(response.data, "services", "service").filter(
    (item) => normalizeTenantType(item?.tenantType) === normalized
  );
};

export const getUsersByTenant = async (tenantType) => {
  const normalized = assertTenantType(tenantType);
  const response = await api.get("/users", {
    params: { tenantType: normalized },
  });

  return getCollection(response.data, "users", "user").filter(
    (item) => normalizeTenantType(item?.tenantType) === normalized
  );
};

export const createOrganizationAdminByTenant = async (tenantType, payload = {}) => {
  const normalized = assertTenantType(tenantType);
  const response = await api.post("/users/organization-admins", {
    ...payload,
    tenantType: normalized,
  });

  return response.data;
};

export const getOrganizationAdminsByTenant = async (tenantType) => {
  const users = await getUsersByTenant(tenantType);

  return users.filter(
    (user) => normalizeTenantType(user?.role) === ORGANIZATION_ADMIN_ROLE
  );
};

export const getAllOrganizationAdmins = async () => {
  const results = await Promise.all(
    ALL_SHARED_TENANTS.map((tenantType) => getOrganizationAdminsByTenant(tenantType))
  );

  return results.flat();
};

export const updateOrganizationStatus = async (organizationId, status, tenantType) => {
  if (!organizationId) {
    throw { success: false, message: "organizationId is required" };
  }

  const normalizedStatus = normalizeTenantType(status);
  const patch = {
    status: normalizedStatus,
  };

  if (normalizedStatus === "approved") {
    patch.approvedAt = new Date().toISOString();
  }

  if (normalizedStatus === "pending") {
    patch.approvedAt = null;
  }

  if (tenantType !== undefined) {
    patch.tenantType = assertTenantType(tenantType);
  }

  const response = await api.patch(`/organizations/${organizationId}`, patch);
  return response.data;
};
