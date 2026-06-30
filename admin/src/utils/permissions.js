import { CANONICAL_ROLES, normalizeRole } from "../context/AuthContext";

// Role hierarchy and capabilities
export const roleHierarchy = {
  [CANONICAL_ROLES.POLICE_SUPER_ADMIN]: {
    label: "Police Super Admin",
    dashboardPath: "/police-super-admin/dashboard",
    canManageOrganizations: true,
    canManageBranches: true,
    canCreateBranchAdmins: true,
    canCreateOrgAdmins: false,
    canViewReports: true,
  },
  [CANONICAL_ROLES.HOSPITAL_SUPER_ADMIN]: {
    label: "Hospital Super Admin",
    dashboardPath: "/hospital-super-admin/dashboard",
    canManageOrganizations: true,
    canManageBranches: true,
    canCreateBranchAdmins: true,
    canCreateOrgAdmins: false,
    canViewReports: true,
  },
  [CANONICAL_ROLES.COMPANY_SUPER_ADMIN]: {
    label: "Company Super Admin",
    dashboardPath: "/company-super-admin/dashboard",
    canManageOrganizations: true,
    canManageBranches: false,
    canCreateBranchAdmins: false,
    canCreateOrgAdmins: true,
    canViewReports: true,
  },
  [CANONICAL_ROLES.ORGANIZATION_ADMIN]: {
    label: "Organization Admin",
    dashboardPath: "/organization-admin/dashboard",
    canManageOrganizations: false,
    canManageBranches: true,
    canCreateBranchAdmins: true,
    canCreateOrgAdmins: false,
    canViewReports: true,
  },
  [CANONICAL_ROLES.BRANCH_ADMIN]: {
    label: "Branch Admin",
    dashboardPath: "/branch-admin/dashboard",
    canManageOrganizations: false,
    canManageBranches: false,
    canCreateBranchAdmins: false,
    canCreateOrgAdmins: false,
    canViewReports: false,
  },
  [CANONICAL_ROLES.STAFF]: {
    label: "Staff",
    dashboardPath: "/staff/dashboard",
    canManageOrganizations: false,
    canManageBranches: false,
    canCreateBranchAdmins: false,
    canCreateOrgAdmins: false,
    canViewReports: false,
  },
};

// Route-level access control
const routeRoleMap = {
  "/police-super-admin": [CANONICAL_ROLES.POLICE_SUPER_ADMIN],
  "/hospital-super-admin": [CANONICAL_ROLES.HOSPITAL_SUPER_ADMIN],
  "/company-super-admin": [CANONICAL_ROLES.COMPANY_SUPER_ADMIN],
  "/organization-admin": [CANONICAL_ROLES.ORGANIZATION_ADMIN],
  "/branch-admin": [CANONICAL_ROLES.BRANCH_ADMIN],
  "/staff": [CANONICAL_ROLES.STAFF],
};

export const isSuperAdmin = (role) => 
  role === CANONICAL_ROLES.POLICE_SUPER_ADMIN ||
  role === CANONICAL_ROLES.HOSPITAL_SUPER_ADMIN ||
  role === CANONICAL_ROLES.COMPANY_SUPER_ADMIN;

export const isOrgAdmin = (role) => role === CANONICAL_ROLES.ORGANIZATION_ADMIN;

export const isBranchAdmin = (role) => role === CANONICAL_ROLES.BRANCH_ADMIN;

export const isStaff = (role) => role === CANONICAL_ROLES.STAFF;

export const canAccessRoute = (role, path) => {
  if (!role || !path) {
    return false;
  }

  const matchedPrefix = Object.keys(routeRoleMap).find((prefix) => path.startsWith(prefix));
  if (!matchedPrefix) {
    return true;
  }

  return routeRoleMap[matchedPrefix].includes(role);
};

export const getDefaultDashboardPath = (role) => {
  const normalizedRole = normalizeRole(role);
  const config = roleHierarchy[normalizedRole];
  if (config) {
    return config.dashboardPath;
  }
  return "/login";
};

export const getRoleLabel = (role) => {
  const config = roleHierarchy[role];
  return config ? config.label : "Unknown Role";
};

export const hasCapability = (role, capability) => {
  const config = roleHierarchy[role];
  return config ? config[capability] : false;
};

export const roleSidebarLinks = {
  [CANONICAL_ROLES.HOSPITAL_SUPER_ADMIN]: [
    { label: "Dashboard", to: "/hospital-super-admin/dashboard" },
    { label: "Hospitals", to: "/hospital-super-admin/hospitals" },
    { label: "Services", to: "/hospital-super-admin/services" },
    { label: "Hospitals Registration", to: "/hospital-super-admin/registered-hospitals" },
    { label: "Registered Admins", to: "/hospital-super-admin/hospital-admins" },
  ],
  [CANONICAL_ROLES.POLICE_SUPER_ADMIN]: [
    { label: "Dashboard", to: "/police-super-admin/dashboard" },
    { label: "Main Division", to: "/police-super-admin/main-division" },
    { label: "Services", to: "/police-super-admin/services" },
    { label: "Branches", to: "/police-super-admin/branches" },
    { label: "Branch Admins", to: "/police-super-admin/branch-admins" },
  ],
  [CANONICAL_ROLES.COMPANY_SUPER_ADMIN]: [
    { label: "Dashboard", to: "/company-super-admin/dashboard" },
    { label: "System Builder", to: "/company-super-admin/system-builder" },
    { label: "Organizations", to: "/company-super-admin/organizations" },
    { label: "Branches", to: "/company-super-admin/branches" },
    { label: "Organization Admins", to: "/company-super-admin/organization-admins" },
  ],
  [CANONICAL_ROLES.ORGANIZATION_ADMIN]: [
    { label: "Dashboard", to: "/organization-admin/dashboard" },
    { label: "Branches", to: "/organization-admin/branches" },
    { label: "Branch Admins", to: "/organization-admin/branch-admins" },
    { label: "Services", to: "/organization-admin/services" },
  ],
  [CANONICAL_ROLES.BRANCH_ADMIN]: [
    { label: "Dashboard", to: "/branch-admin/dashboard" },
    { label: "Staff", to: "/branch-admin/staff" },
    { label: "Operations", to: "/branch-admin/operations" },
    { label: "Branch Details", to: "/branch-admin/branch-details" },
  ],
  [CANONICAL_ROLES.STAFF]: [
    { label: "Dashboard", to: "/staff/dashboard" },
    { label: "Profile", to: "/staff/profile" },
    { label: "Tasks", to: "/staff/tasks" },
  ],
};

export const getSidebarLinksByRole = (role) => {
  const normalizedRole = normalizeRole(role);
  return roleSidebarLinks[normalizedRole] || [];
};
