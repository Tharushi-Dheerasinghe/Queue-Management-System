const LEGACY_SUPER_ADMIN_ROLES = new Set([
  "police_super_admin",
  "hospital_super_admin",
  "company_super_admin",
]);

const normalizeText = (value = "") => String(value || "").trim().toLowerCase();

export const normalizeTenantType = (value) => {
  const tenantType = normalizeText(value);
  return ["police", "hospital", "bank", "supermarket"].includes(tenantType) ? tenantType : tenantType;
};

export const normalizeRole = (value) => normalizeText(value);

export const isSuperAdmin = (user) => {
  const role = normalizeRole(user?.role);
  return role === "super_admin" || LEGACY_SUPER_ADMIN_ROLES.has(role);
};

export const isOrganizationAdmin = (user) => normalizeRole(user?.role) === "organization_admin";

export const isBranchAdmin = (user) => normalizeRole(user?.role) === "branch_admin";

export const isStaff = (user) => {
  const role = normalizeRole(user?.role);
  return role === "staff";
};

export const getOrganizationScope = (user = {}) => {
  const tenantType = normalizeTenantType(user?.tenantType);
  const organizationId = user?.organizationId || null;
  const organizationName = user?.organizationName || user?.divisionName || "";

  return {
    tenantType,
    organizationId,
    organizationName,
    source: user?.organizationId ? "organization" : null,
  };
};

export const getBranchScope = (user = {}) => {
  const organizationScope = getOrganizationScope(user);

  return {
    ...organizationScope,
    branchId: user?.branchId || null,
    branchName: user?.branchName || "",
  };
};
