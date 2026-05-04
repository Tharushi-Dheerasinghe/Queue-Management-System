import { createContext, useContext, useMemo, useState } from "react";
import { clearAuthState, getStoredAuthState, saveAuthState } from "../services/authService";

// Canonical role hierarchy (no normalization - each role is distinct).
// organization_admin is a shared role for police, bank, supermarket, and hospital tenants.
// Tenant isolation is represented through tenantType + organizationId + branchId.
export const CANONICAL_ROLES = {
  POLICE_SUPER_ADMIN: "police_super_admin",
  HOSPITAL_SUPER_ADMIN: "hospital_super_admin",
  COMPANY_SUPER_ADMIN: "company_super_admin",
  ORGANIZATION_ADMIN: "organization_admin",
  BRANCH_ADMIN: "branch_admin",
  STAFF: "staff",
};

export const normalizeRole = (role) => {
  if (!role) {
    return null;
  }

  const lowerRole = String(role).toLowerCase();

  // Map role to canonical form
  const roleMap = {
    police_super_admin: CANONICAL_ROLES.POLICE_SUPER_ADMIN,
    hospitaladmin: CANONICAL_ROLES.HOSPITAL_SUPER_ADMIN,
    hospital_super_admin: CANONICAL_ROLES.HOSPITAL_SUPER_ADMIN,
    companyadmin: CANONICAL_ROLES.COMPANY_SUPER_ADMIN,
    company_super_admin: CANONICAL_ROLES.COMPANY_SUPER_ADMIN,
    superadmin: CANONICAL_ROLES.COMPANY_SUPER_ADMIN,
    organization_admin: CANONICAL_ROLES.ORGANIZATION_ADMIN,
    org_admin: CANONICAL_ROLES.ORGANIZATION_ADMIN,
    branch_admin: CANONICAL_ROLES.BRANCH_ADMIN,
    branchadmin: CANONICAL_ROLES.BRANCH_ADMIN,
    staff: CANONICAL_ROLES.STAFF,
  };

  return roleMap[lowerRole] || role;
};

const parseStoredAuth = () => {
  const parsed = getStoredAuthState();
  if (!parsed) {
    return { 
      user: null, 
      role: null,
      tenantType: null,
      organizationId: null,
      organizationName: null,
      divisionId: null,
      divisionName: null,
      branchId: null,
      branchName: null,
      status: null,
    };
  }

  return {
    user: parsed?.user || null,
    role: normalizeRole(parsed?.role) || null,
    tenantType: parsed?.tenantType || null,
    organizationId: parsed?.organizationId || null,
    organizationName: parsed?.organizationName || null,
    divisionId: parsed?.divisionId || null,
    divisionName: parsed?.divisionName || null,
    branchId: parsed?.branchId || null,
    branchName: parsed?.branchName || null,
    status: parsed?.status || null,
  };
};

const AuthContext = createContext({
  user: null,
  role: null,
  tenantType: null,
  organizationId: null,
  organizationName: null,
  divisionId: null,
  divisionName: null,
  branchId: null,
  branchName: null,
  status: null,
  isAuthenticated: false,
  hasRole: () => false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(parseStoredAuth);

  const login = ({
    id = null,
    email,
    name = null,
    role,
    tenantType = null,
    organizationId = null,
    organizationName = null,
    divisionId = null,
    divisionName = null,
    branchId = null,
    branchName = null,
    status = null,
  }) => {
    const user = {
      id: id || Date.now().toString(),
      email,
      name: name || (email || "User").split("@")[0] || "User",
    };

    // Persist the shared org-admin scope alongside the role so future backend auth can isolate tenant data.
    const nextState = {
      user,
      role: normalizeRole(role),
      tenantType,
      organizationId,
      organizationName,
      divisionId,
      divisionName,
      branchId,
      branchName,
      status,
    };
    saveAuthState(nextState);
    setAuthState(nextState);
  };

  const logout = () => {
    clearAuthState();
    setAuthState({ 
      user: null, 
      role: null,
      tenantType: null,
      organizationId: null,
      organizationName: null,
      divisionId: null,
      divisionName: null,
      branchId: null,
      branchName: null,
      status: null,
    });
  };

  const value = useMemo(
    () => {
      const isAuthenticated = Boolean(authState.user && authState.role);
      const hasRole = (requiredRole) => authState.role === normalizeRole(requiredRole);

      return {
        user: authState.user,
        role: authState.role,
        tenantType: authState.tenantType,
        organizationId: authState.organizationId,
        organizationName: authState.organizationName,
        divisionId: authState.divisionId,
        divisionName: authState.divisionName,
        branchId: authState.branchId,
        branchName: authState.branchName,
        status: authState.status,
        isAuthenticated,
        hasRole,
        login,
        logout,
      };
    },
    [
      authState.user,
      authState.role,
      authState.tenantType,
      authState.organizationId,
      authState.organizationName,
      authState.divisionId,
      authState.divisionName,
      authState.branchId,
      authState.branchName,
      authState.status,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
