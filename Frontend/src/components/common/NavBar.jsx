import { Link, NavLink, useNavigate } from "react-router-dom";
import { Building, Hospital, Shield, ShoppingCart, User, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { resolveHospitalModule } from "../../utils/hospitalModuleHelpers";
import { legacyStorageKeys, removeItem, storageKeys } from "../../utils/storage";
import { useTranslation } from "react-i18next";
import { useTenant } from "../../context/TenantContext";
import logoImg from "../../assets/logo.jpg";

const getTenantIcon = (tenantType) => {
  const iconProps = { size: 24, className: "text-slate-900" };
  switch (tenantType) {
    case "bank":
      return <Building {...iconProps} />;
    case "hospital":
      return <Hospital {...iconProps} />;
    case "police":
      return <Shield {...iconProps} />;
    case "supermarket":
      return <ShoppingCart {...iconProps} />;
    default:
      return null;
  }
};

export default function Navbar({ tenant, tenantType }) {
  const theme = tenant?.theme || {};
  const hospitalModule = resolveHospitalModule(sessionStorage);
  const { t, i18n } = useTranslation();
  const { orgBranding } = useTenant();

  // Auth state
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check initial theme from localStorage or system preference
    if (localStorage.getItem("theme") === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  const clearQueueFlow = () => {
    removeItem(sessionStorage, storageKeys.queueFlowStarted(tenantType));
    removeItem(sessionStorage, legacyStorageKeys.queueFlowStarted);
  };

  const navLinks = [
    { label: t("Home"), to: `/`, end: true },
    { label: t("Booking"), to: `/` },
    { label: t("About"), to: `/about` },
    { label: t("Contact"), to: `/contact` },
  ];

  if (tenantType) {
    navLinks.push({ label: t("Track Queue"), to: `/${tenantType}/track` });
  }

  const primaryColor = orgBranding?.primaryColor || "#0ea5e9";

  const navLinkClass = ({ isActive }) =>
    `rounded-full px-4 py-2 transition text-sm font-semibold ${
      isActive
        ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
    }`;

  // User login removed based on requirements

  // Close dropdown on outside click (optional, not implemented for brevity)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {tenantType && tenant && (
            <Link
              to={`/${tenantType}`}
              className="flex items-center justify-center rounded-lg p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              title={`Go to ${tenant.name}`}
            >
              {getTenantIcon(tenantType)}
            </Link>
          )}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {orgBranding?.logoUrl ? (
              <img src={orgBranding.logoUrl} alt="Logo" className="h-10 w-10 object-contain dark:bg-white dark:p-1 dark:rounded-lg" />
            ) : (
              <img src={logoImg} alt="QueueFlow Logo" className="h-10 w-10 object-contain dark:bg-white dark:p-1 dark:rounded-lg" />
            )}
            <span>QueueFlow</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-2 text-sm font-medium md:flex">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={item.onClick}
              className={navLinkClass}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4 relative">
          <select 
            value={i18n.language} 
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <option value="en">English</option>
            <option value="si">සිංහල</option>
            <option value="ta">தமிழ்</option>
          </select>

          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {tenant && (
            <div 
              className="rounded-full px-4 py-1 text-xs font-bold transition-colors"
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            >
              {tenant.shortName}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}