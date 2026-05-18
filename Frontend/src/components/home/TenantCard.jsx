import { useNavigate } from "react-router-dom";
import { tenantConfig } from "../../configs/tenantConfig";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function TenantCard({ title, description, routeKey, entryPath }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tenant = tenantConfig[routeKey] || {};
  
  const targetPath = entryPath || `/${routeKey}/select-organization`;
  const displayTitle = title ? t(title) : `${t(routeKey.charAt(0).toUpperCase() + routeKey.slice(1))} ${t("Queue System")}`;
  const displayDesc = description ? t(description) : tenant.description ? t(tenant.description) : `${t("Queue management services for")} ${t(routeKey)}s.`;
  const shortName = tenant.shortName ? t(tenant.shortName) : t(routeKey.charAt(0).toUpperCase() + routeKey.slice(1));

  // Determine a primary color for the icon/button accent
  let primaryColor = "#0ea5e9"; // Default sky blue
  if (routeKey === "hospital") primaryColor = "#10b981"; // Emerald
  if (routeKey === "bank") primaryColor = "#3b82f6"; // Blue
  if (routeKey === "police") primaryColor = "#6366f1"; // Indigo
  if (routeKey === "supermarket") primaryColor = "#f97316"; // Orange

  const isDarkMode = document.documentElement.classList.contains("dark");

  return (
    <div onClick={() => navigate(targetPath)} className="group flex h-full cursor-pointer flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:hover:shadow-slate-900/50 relative overflow-hidden">
      
      {/* Decorative gradient blob */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.03] dark:opacity-5 transition-transform duration-500 group-hover:scale-150" style={{ backgroundColor: primaryColor }}></div>

      <div className="flex-1 relative z-10">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-1"
          >
            {tenant.icon ? (
              <img src={tenant.icon} alt={shortName} className="h-full w-full object-contain dark:invert" style={{ filter: isDarkMode && tenant.icon.includes('svg') ? 'invert(1)' : 'none' }} />
            ) : (
              <div className="text-2xl font-bold" style={{ color: primaryColor }}>{shortName[0]}</div>
            )}
          </div>

          <span
            className="inline-flex rounded-full px-3 py-1 text-xs font-bold"
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
          >
            {shortName}
          </span>
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{displayTitle}</h3>
        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium">{displayDesc}</p>
      </div>

      <div className="mt-8 relative z-10">
        <button
          className="inline-flex items-center justify-center w-full rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform group-hover:scale-[1.02] gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          {t("Select Domain")} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}