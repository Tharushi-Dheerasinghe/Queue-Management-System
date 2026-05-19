import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { tenantConfig, getTenantConfig } from "../../configs/tenantConfig";
import { HOSPITAL_MODULES, resolveHospitalModule } from "../../utils/hospitalModuleHelpers";
import { useTenant } from "../../context/TenantContext";
import { getOrganizationsForTenant } from "../../services/tenantSelectionService";
import { getOrganizationName } from "../../utils/tenantHelpers";
import { useTranslation } from "react-i18next";

const headingMap = {
  bank: "Select Your Bank",
  hospital: "Select Your Hospital",
  police: "Sri Lanka Police - Select Your Division",
  supermarket: "Select Your Supermarket",
};

export default function SelectOrganization() {
  const { tenantType } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [organizationsError, setOrganizationsError] = useState("");
  const tenant = getTenantConfig(tenantType);
  const { setSelectedOrganization } = useTenant();
  const { t } = useTranslation();
  // Access theme from document element to decide icon color
  const isDarkMode = document.documentElement.classList.contains("dark");



  const heading = useMemo(() => {
    if (!tenantType) return t("Select Organization");
    return t(headingMap[tenantType]) || `${t("Select Your")} ${tenant?.shortName ? t(tenant.shortName) : t("Organization")}`;
  }, [tenantType, tenant?.shortName, t]);

  useEffect(() => {
    let isMounted = true;

    const loadOrganizations = async () => {
      try {
        setLoadingOrganizations(true);
        setOrganizationsError("");

        const fetchedOrganizations = await getOrganizationsForTenant({
          tenantType,
        });

        if (!isMounted) {
          return;
        }

        setOrganizations(fetchedOrganizations);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setOrganizations([]);
        setOrganizationsError(
          error?.response?.data?.message || error?.message || "Failed to load organizations"
        );
      } finally {
        if (isMounted) {
          setLoadingOrganizations(false);
        }
      }
    };

    loadOrganizations();

    return () => {
      isMounted = false;
    };
  }, [tenantType]);

  if (!tenant) {
    return <Navigate to="/" replace />;
  }

  const filteredOrganizations = organizations.filter((organization) => {
    const organizationLabel = getOrganizationName(organization);

    return organizationLabel.toLowerCase().includes(searchTerm.trim().toLowerCase());
  });

  const helperChips = [
    `${organizations.length} ${t("Organizations")}`,
    t("Search and Select"),
    t("Fast Queue Access"),
  ];

  const handleSelectOrganization = (organization) => {

    const organizationValue = getOrganizationName(organization);
    const organizationId = organization?.id || organization?._id || "";

    if (!organizationId) {
      console.error("Organization ID is missing in organization object:", organization);
      alert("Error: Organization ID not found!");
      return;
    }

    setSelectedOrganization(organizationValue, organizationId, organization?.branding);
    
    setTimeout(() => {
      navigate(`/${tenantType}/org/${organizationId}`);
    }, 100); 
  };

  const primaryColor = "#0ea5e9"; // Default primary

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-10 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8 lg:py-14 transition-colors duration-300">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8 lg:col-span-5 transition-colors duration-300">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
              {tenant.icon ? (
                <img src={tenant.icon} alt={tenant.shortName} className="h-8 w-8 object-contain dark:invert" style={{ filter: isDarkMode && tenant.icon.includes('svg') ? 'invert(1)' : 'none' }} />
              ) : (
                <div className="text-2xl font-bold" style={{ color: primaryColor }}>{tenant.shortName[0]}</div>
              )}
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {t("Organization Selection")}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {heading}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
              {t("Choose your organization to continue into a premium queue experience with the correct branch and service flow.")}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {helperChips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  {chip}
                </span>
              ))}
            </div>

            <p className="mt-8 text-xs leading-6 text-slate-400 dark:text-slate-500 font-medium">
              {t("Tip: Use the search panel to quickly find your preferred location.")}
            </p>
          </section>

          <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8 lg:col-span-7 transition-colors duration-300">
            <label htmlFor="organization-search" className="sr-only">
              Search organization
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-slate-900 transition-all" style={{ '--tw-ring-color': primaryColor }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5 text-slate-400"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3m1.3-5.2a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
              </svg>
              <input
                id="organization-search"
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={`${t("Search")} ${tenant.shortName ? t(tenant.shortName).toLowerCase() : ''} ${t("organizations")}...`}
                className="w-full border-0 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="mt-6 space-y-3">
              {loadingOrganizations ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 py-10 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent" style={{ borderColor: primaryColor, borderRightColor: 'transparent' }} role="status"></div>
                  <p className="mt-4 text-sm font-bold text-slate-900 dark:text-white">{t("Loading organizations...")}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("Please wait.")}</p>
                </div>
              ) : organizationsError ? (
                <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 px-4 py-8 text-center">
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">{t(organizationsError)}</p>
                  <p className="mt-1 text-xs text-red-500">{t("Try refreshing the page.")}</p>
                </div>
              ) : filteredOrganizations.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 py-10 text-center">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{t("No organizations found")}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {t("Try a different keyword.")}
                  </p>
                </div>
              ) : (
                filteredOrganizations.map((organization) => {
                  const organizationLabel = getOrganizationName(organization);
                  const organizationId = organization?.id || organization?._id || organizationLabel;
                  const orgColor = organization?.branding?.primaryColor || primaryColor;

                  return (
                  <button
                    key={organizationId}
                    type="button"
                    onClick={() => handleSelectOrganization(organization)}
                    className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    style={{ '--tw-ring-color': orgColor }}
                  >
                    <div className="flex items-center gap-4">
                      {organization?.branding?.logoUrl ? (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden p-1">
                          <img src={organization.branding.logoUrl} alt={organizationLabel} className="h-full w-full object-contain" />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm" style={{ backgroundColor: `${orgColor}15`, color: orgColor }}>
                          <span className="text-xl font-bold">{organizationLabel.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-base font-bold text-slate-900 dark:text-white">{organizationLabel}</p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t("Select to continue")}</p>
                      </div>
                    </div>
                    <span 
                      className="rounded-full px-4 py-2 text-xs font-bold transition-colors opacity-0 group-hover:opacity-100 uppercase"
                      style={{ backgroundColor: `${orgColor}15`, color: orgColor }}
                    >
                      {t("ENTER")}
                    </span>
                  </button>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
