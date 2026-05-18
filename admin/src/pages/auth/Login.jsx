import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDefaultDashboardPath } from "../../utils/permissions";
import { loginUser } from "../../services/authService";
import { Eye, EyeOff } from "lucide-react";

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
  },
  [LOGIN_TYPES.HOSPITAL_SUPER_ADMIN]: {
    title: "Hospital Super Admin Login",
    subtitle: "Manage hospitals and healthcare services",
  },
  [LOGIN_TYPES.COMPANY_SUPER_ADMIN]: {
    title: "Company Super Admin Login",
    subtitle: "Manage companies and organizations",
  },
  [LOGIN_TYPES.ORGANIZATION_ADMIN]: {
    title: "Organization Admin Login",
    subtitle: "Shared organization admin access for all tenants",
  },
  [LOGIN_TYPES.BRANCH_ADMIN]: {
    title: "Branch Admin Login",
    subtitle: "Shared branch admin access for all tenants",
  },
  [LOGIN_TYPES.STAFF]: {
    title: "Staff Login",
    subtitle: "Shared staff access for all tenants",
  },
  [LOGIN_TYPES.DEFAULT]: {
    title: "Admin Login",
    subtitle: "Select admin type or use general login",
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
  const [showPassword, setShowPassword] = useState(false);

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



  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">Admin Access</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{pageConfig.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{pageConfig.subtitle}</p>

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
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 pl-4 pr-12 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
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


      </div>
    </div>
  );
}
