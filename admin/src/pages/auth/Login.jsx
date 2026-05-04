import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDefaultDashboardPath } from "../../utils/permissions";
import { loginUser } from "../../services/authService";

const LOGIN_TYPES = {
  DEFAULT: "default",
  POLICE_SUPER_ADMIN: "police_super_admin",
  HOSPITAL_SUPER_ADMIN: "hospital_super_admin",
  COMPANY_SUPER_ADMIN: "company_super_admin",
  ORGANIZATION_ADMIN: "organization_admin",
  BRANCH_ADMIN: "branch_admin",
  STAFF: "staff",
};

// Dummy user database - mimics backend auth.
// Shared organization-admin accounts must always carry tenantType + organizationId for tenant isolation.
const DUMMY_USERS = {
  // Police Super Admin - /police-login
  "policeadmin@gmail.com": {
    password: "123456",
    name: "Police Admin",
    role: "police_super_admin",
    tenantType: "police",
    organizationId: "org_police_001",
  },
  
  // Hospital Super Admin - /hospital-login
  "hospitaladmin@gmail.com": {
    password: "123456",
    name: "Hospital Admin",
    role: "hospital_super_admin",
    tenantType: "hospital",
    organizationId: "org_hospital_001",
  },
  
  // Company Super Admin - /company-login
  "companyadmin@gmail.com": {
    password: "123456",
    name: "Company Admin",
    role: "company_super_admin",
    tenantType: "company",
    organizationId: "org_company_001",
  },
  
  // Shared organization-admin panel - bank tenant - /admin-login
  "bankorg@gmail.com": {
    password: "123456",
    name: "Bank Organization Admin",
    role: "organization_admin",
    tenantType: "bank",
    organizationId: "org_bank_001",
  },
  
  // Shared organization-admin panel - supermarket tenant - /admin-login
  "marketorg@gmail.com": {
    password: "123456",
    name: "Supermarket Organization Admin",
    role: "organization_admin",
    tenantType: "supermarket",
    organizationId: "org_market_001",
  },
  
  // Branch Admin (Hospital) - /admin-login
  "hospitalbranch@gmail.com": {
    password: "123456",
    name: "Hospital Branch Admin",
    role: "branch_admin",
    tenantType: "hospital",
    organizationId: "org_hospital_001",
    branchId: "branch_hospital_001",
  },
  
  // Branch Admin (Police) - /admin-login
  "policebranch@gmail.com": {
    password: "123456",
    name: "Police Branch Admin",
    role: "branch_admin",
    tenantType: "police",
    organizationId: "org_police_001",
    branchId: "branch_police_001",
  },
  
  // Staff - /admin-login
  "staff@gmail.com": {
    password: "123456",
    name: "Staff Member",
    role: "staff",
    tenantType: "hospital",
    organizationId: "org_hospital_001",
    branchId: "branch_hospital_001",
  },
};

// Login page configs per login type
const LOGIN_CONFIG = {
  [LOGIN_TYPES.POLICE_SUPER_ADMIN]: {
    title: "Police Super Admin Login",
    subtitle: "Manage police departments and branches",
    subtitle2: "Demo: policeadmin@gmail.com / 123456",
  },
  [LOGIN_TYPES.HOSPITAL_SUPER_ADMIN]: {
    title: "Hospital Super Admin Login",
    subtitle: "Manage hospitals and healthcare services",
    subtitle2: "Demo: hospitaladmin@gmail.com / 123456",
  },
  [LOGIN_TYPES.COMPANY_SUPER_ADMIN]: {
    title: "Company Super Admin Login",
    subtitle: "Manage companies and organizations",
    subtitle2: "Demo: companyadmin@gmail.com / 123456",
  },
  [LOGIN_TYPES.ORGANIZATION_ADMIN]: {
    title: "Organization Admin Login",
    subtitle: "Shared organization admin access for all tenants",
    subtitle2: "Use organization admin credentials",
  },
  [LOGIN_TYPES.BRANCH_ADMIN]: {
    title: "Branch Admin Login",
    subtitle: "Shared branch admin access for all tenants",
    subtitle2: "Use branch admin credentials",
  },
  [LOGIN_TYPES.STAFF]: {
    title: "Staff Login",
    subtitle: "Shared staff access for all tenants",
    subtitle2: "Use staff credentials",
  },
  [LOGIN_TYPES.DEFAULT]: {
    title: "Admin Login",
    subtitle: "Select admin type or use general login",
    subtitle2: "Demo: companyadmin@gmail.com / 123456",
  },
};

const ALLOWED_ROLES_BY_LOGIN_TYPE = {
  [LOGIN_TYPES.POLICE_SUPER_ADMIN]: ["police_super_admin"],
  [LOGIN_TYPES.HOSPITAL_SUPER_ADMIN]: ["hospital_super_admin"],
  [LOGIN_TYPES.COMPANY_SUPER_ADMIN]: ["company_super_admin"],
  [LOGIN_TYPES.ORGANIZATION_ADMIN]: ["organization_admin"],
  [LOGIN_TYPES.BRANCH_ADMIN]: ["branch_admin"],
  [LOGIN_TYPES.STAFF]: ["staff"],
  [LOGIN_TYPES.DEFAULT]: [],
};

export default function Login({ loginType = LOGIN_TYPES.DEFAULT }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, login } = useAuth();
  const [error, setError] = useState("");
  const [showDemoUsers, setShowDemoUsers] = useState(false);

  const allowedRoles = useMemo(
    () => ALLOWED_ROLES_BY_LOGIN_TYPE[loginType] || ALLOWED_ROLES_BY_LOGIN_TYPE[LOGIN_TYPES.DEFAULT],
    [loginType]
  );

  const allUsers = useMemo(() => DUMMY_USERS, []);

  const filteredUsers = useMemo(() => {
    if (!allowedRoles.length) {
      return allUsers;
    }

    return Object.fromEntries(Object.entries(allUsers).filter(([, user]) => allowedRoles.includes(user.role)));
  }, [allUsers, allowedRoles]);

  const pageConfig = useMemo(() => LOGIN_CONFIG[loginType] || LOGIN_CONFIG[LOGIN_TYPES.DEFAULT], [loginType]);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // Redirect if already logged in (and on login page)
  useEffect(() => {
    if (role && location.pathname.includes("login")) {
      navigate(getDefaultDashboardPath(role), { replace: true });
    }
  }, [role, location.pathname, navigate]);

  // Clear form when page route changes
  useEffect(() => {
    setForm({ email: "", password: "" });
    setError("");
  }, [location.pathname]);

  // Log available demo users on mount
  useEffect(() => {
    console.log("=== DUMMY LOGIN USERS ===");
    console.log(filteredUsers);
    console.log("========================");
  }, [filteredUsers]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const response = await loginUser({
        email: form.email,
        password: form.password,
      });

      if (!response.success) {
        setError(response.message || "Login failed");
        return;
      }

      const user = response.user;

      if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        setError("This account is not allowed for this login page");
        return;
      }

      // save to AuthContext
      login({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantType: user.tenantType,
        organizationId: user.organizationId,
        organizationName: user.organizationName,
        divisionId: user.divisionId,
        divisionName: user.divisionName,
        branchId: user.branchId,
        branchName: user.branchName,
        status: user.status,
      });

      // redirect
      navigate(getDefaultDashboardPath(user.role), { replace: true });

    } catch (error) {
      console.error(error);
      setError("Invalid email or password");
    }
  };

  const handleDemoClick = (email) => {
    setForm({ email, password: "123456" });
    setError("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">Admin Access</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{pageConfig.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{pageConfig.subtitle}</p>
        <p className="mt-1 text-xs text-slate-400">{pageConfig.subtitle2}</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Login
          </button>
        </form>

        {/* Quick Demo Users */}
        <div className="mt-6 border-t border-slate-200 pt-6">
          <button
            type="button"
            onClick={() => setShowDemoUsers(!showDemoUsers)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            {showDemoUsers ? "Hide" : "Show"} Demo Users
          </button>

          {showDemoUsers && (
            <div className="mt-3 space-y-2">
              {Object.entries(filteredUsers).map(([email, user]) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => handleDemoClick(email)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs hover:bg-slate-100"
                >
                  <p className="font-medium text-slate-900">{email}</p>
                  <p className="text-slate-500">{user.role}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
