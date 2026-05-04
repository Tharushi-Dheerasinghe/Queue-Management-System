import { Link, NavLink, useNavigate } from "react-router-dom";
import { Building, Hospital, Shield, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { resolveHospitalModule } from "../../utils/hospitalModuleHelpers";
import { legacyStorageKeys, removeItem, storageKeys } from "../../utils/storage";

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
  const theme = tenant.theme;
  const hospitalModule = resolveHospitalModule(sessionStorage);

  // Auth state
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const clearQueueFlow = () => {
    removeItem(sessionStorage, storageKeys.queueFlowStarted(tenantType));
    removeItem(sessionStorage, legacyStorageKeys.queueFlowStarted);
  };

  const defaultNavLinks = [
    { label: "Home", to: `/${tenantType}`, end: true },
    { label: "Branches", to: `/${tenantType}/branches`, onClick: clearQueueFlow },
    { label: "Services", to: `/${tenantType}/services`, onClick: clearQueueFlow },
    { label: "Book Token", to: `/${tenantType}/book-token` },
    { label: "Queue Status", to: `/${tenantType}/queue-status` },
    { label: "Notifications", to: `/${tenantType}/notifications` },
    { label: "My Booking", to: `/${tenantType}/my-booking` },
  ];

  const hospitalDoctorChannelingLinks = [
    { label: "Home", to: `/${tenantType}/doctor-channeling` },
    { label: "Find Doctor", to: `/${tenantType}/find-doctor` },
    { label: "My Appointment", to: `/${tenantType}/my-appointment` },
    { label: "Notifications", to: `/${tenantType}/notifications` },
  ];

  const hospitalPharmacyLinks = [
    { label: "Pharmacy Queue", to: `/${tenantType}/pharmacy` },
    { label: "My Booking", to: `/${tenantType}/my-booking` },
    { label: "Notifications", to: `/${tenantType}/notifications` },
  ];

  const navLinks =
    tenantType === "hospital" && hospitalModule === "doctor-channeling"
      ? hospitalDoctorChannelingLinks
      : tenantType === "hospital" && hospitalModule === "pharmacy-queue"
        ? hospitalPharmacyLinks
        : defaultNavLinks;

  const navLinkClass = ({ isActive }) =>
    `rounded-full px-3 py-1.5 transition ${
      isActive
        ? `${theme.light} ${theme.text} font-semibold`
        : "text-slate-600 hover:text-slate-900"
    }`;

  const handleProfileClick = () => {
    setShowDropdown((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setShowDropdown(false);
    navigate("/user/login");
  };

  // Close dropdown on outside click (optional, not implemented for brevity)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            to={`/${tenantType}`}
            className="flex items-center justify-center rounded-lg p-1.5 transition hover:bg-slate-100"
            title={`Go to ${tenant.name}`}
          >
            {getTenantIcon(tenantType)}
          </Link>
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.primary} text-white shadow-sm`}>
              Q
            </span>
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
          <div className={`rounded-full ${theme.light} px-3 py-1 text-xs font-semibold ${theme.text}`}>
            {tenant.shortName}
          </div>
          {/* Auth section */}
          {!user ? (
            <Link
              to="/user/login"
              className={`ml-2 flex items-center rounded-xl px-4 py-2 font-semibold text-white transition ${theme.primary} hover:opacity-90`}
              style={{ background: theme.primary }}
            >
              Login
            </Link>
          ) : (
            <div className="relative">
              <button
                className={`flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition p-2 focus:outline-none border border-slate-200`}
                onClick={handleProfileClick}
                aria-label="Profile menu"
                type="button"
              >
                <User className="text-slate-700" size={24} />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg z-50 py-2">
                  <div className="px-4 py-2 text-slate-700 text-sm font-medium border-b border-slate-100">
                    Hi, {user.name}
                  </div>
                  <button
                    className={`w-full text-left px-4 py-2 text-red-600 hover:bg-slate-50 font-semibold`}
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}