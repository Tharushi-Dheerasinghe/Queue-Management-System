import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { tenantConfig } from "../../configs/tenantConfig";
import { HOSPITAL_MODULES, resolveHospitalModule } from "../../utils/hospitalModuleHelpers";
import { useTenant } from "../../context/TenantContext";
import { getOrganizationsForTenant } from "../../services/tenantSelectionService";
import { getOrganizationName } from "../../utils/tenantHelpers";

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
  const tenant = tenantConfig[tenantType];
  const { setSelectedOrganization } = useTenant();

  if (tenantType === "hospital") {
    const hospitalModule = resolveHospitalModule(sessionStorage);

    if (hospitalModule !== HOSPITAL_MODULES.TOKEN_MANAGEMENT) {
      return <Navigate to="/hospital/select-service" replace />;
    }
  }

  const heading = useMemo(() => {
    if (!tenantType) return "Select Organization";
    return headingMap[tenantType] || `Select Your ${tenant?.shortName || "Organization"}`;
  }, [tenantType, tenant?.shortName]);

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
  }, [tenantType, tenant?.organizations]);

  if (!tenant) {
    return <Navigate to="/" replace />;
  }

  const filteredOrganizations = organizations.filter((organization) => {
    const organizationLabel = getOrganizationName(organization);

    return organizationLabel.toLowerCase().includes(searchTerm.trim().toLowerCase());
  });

  const helperChips = [
    `${organizations.length} Organizations`,
    "Search and Select",
    "Fast Queue Access",
  ];

  const handleSelectOrganization = (organization) => {

    const organizationValue = getOrganizationName(organization);
    const organizationId = organization?.id || organization?._id || "";

    if (!organizationId) {
      console.error("Organization ID is missing in organization object:", organization);
      alert("Error: Organization ID not found!");
      return;
    }

    setSelectedOrganization(organizationValue, organizationId);
    
    setTimeout(() => {
      navigate(`/${tenantType}`);
    }, 150); 
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-10 text-slate-900 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <section className={`rounded-3xl border ${tenant.theme.border} ${tenant.theme.light} p-6 shadow-sm sm:p-8 lg:col-span-5`}>
            <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl border ${tenant.theme.border} bg-white shadow-sm`}>
              <img src={tenant.icon} alt={tenant.shortName} className="h-8 w-8 object-contain" />
            </div>

            <p className={`mt-5 text-xs font-semibold uppercase tracking-[0.18em] ${tenant.theme.text}`}>
              Organization Selection
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {heading}
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Choose your organization to continue into a branded queue experience with the
              correct branch and service flow.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {helperChips.map((chip) => (
                <span
                  key={chip}
                  className={`rounded-full border ${tenant.theme.border} ${tenant.theme.soft} px-3 py-1 text-xs font-medium ${tenant.theme.text}`}
                >
                  {chip}
                </span>
              ))}
            </div>

            <p className="mt-6 text-xs leading-6 text-slate-500">
              Tip: Use the search panel to quickly find your preferred location or institution.
            </p>
          </section>

          <section className={`rounded-3xl border ${tenant.theme.border} bg-white p-6 shadow-sm sm:p-8 lg:col-span-7`}>
            <label htmlFor="organization-search" className="sr-only">
              Search organization
            </label>
            <div className={`flex items-center gap-3 rounded-2xl border ${tenant.theme.border} bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-offset-2 ${tenant.theme.ring}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className={`h-5 w-5 ${tenant.theme.text}`}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3m1.3-5.2a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
              </svg>
              <input
                id="organization-search"
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={`Search ${tenant.shortName.toLowerCase()} organizations...`}
                className="w-full border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="mt-5 space-y-2">
              {loadingOrganizations ? (
                <div className={`rounded-2xl border border-dashed ${tenant.theme.border} ${tenant.theme.light} px-4 py-8 text-center`}>
                  <p className="text-sm font-semibold text-slate-900">Loading organizations...</p>
                  <p className="mt-1 text-xs text-slate-500">Please wait while organizations are fetched.</p>
                </div>
              ) : organizationsError ? (
                <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-red-700">{organizationsError}</p>
                  <p className="mt-1 text-xs text-red-600">Try refreshing the page.</p>
                </div>
              ) : filteredOrganizations.length === 0 ? (
                <div className={`rounded-2xl border border-dashed ${tenant.theme.border} ${tenant.theme.light} px-4 py-8 text-center`}>
                  <p className="text-sm font-semibold text-slate-900">No organizations found</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Try a different keyword to find your organization.
                  </p>
                </div>
              ) : (
                filteredOrganizations.map((organization) => {
                  const organizationLabel = getOrganizationName(organization);
                  const organizationId = organization?.id || organization?._id || organizationLabel;

                  return (
                  <button
                    key={organizationId}
                    type="button"
                    onClick={() => handleSelectOrganization(organization)}
                    className={`group flex w-full items-center justify-between rounded-xl border ${tenant.theme.border} px-4 py-3 text-left transition hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${tenant.theme.ring}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{organizationLabel}</p>
                      <p className="text-xs text-slate-500">Select organization</p>
                    </div>
                    <span className={`text-xs font-semibold uppercase tracking-[0.12em] ${tenant.theme.text}`}>
                      Continue
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
