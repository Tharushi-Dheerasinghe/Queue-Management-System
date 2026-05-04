const SHARED_ORGANIZATION_TENANTS = new Set(["bank", "supermarket", "hospital"]);

const normalizeTenantType = (tenantType = "") => String(tenantType).trim().toLowerCase();

export const isOrganizationAdmin = (user) => String(user?.role || "").trim().toLowerCase() === "organization_admin";

export const getTenantIsolationFilter = (user) => {
  if (!isOrganizationAdmin(user)) {
    return {};
  }

  const tenantType = normalizeTenantType(user?.tenantType);

  if (tenantType === "police" || SHARED_ORGANIZATION_TENANTS.has(tenantType)) {
    if (!user?.organizationId) {
      return { _id: null };
    }

    return { organizationId: user.organizationId };
  }

  return { _id: null };
};

// Reusable helper for controller queries that must stay tenant-isolated.
// organization_admin users are scoped by organizationId for all tenant types.
export const applyTenantIsolationFilter = (query = {}, user) => ({
  ...query,
  ...getTenantIsolationFilter(user),
});