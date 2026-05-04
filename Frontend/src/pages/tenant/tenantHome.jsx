import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTenant } from "../../context/TenantContext";
import { getHospitalHomeRedirectPath, HOSPITAL_MODULES, resolveHospitalModule } from "../../utils/hospitalModuleHelpers";
import { legacyStorageKeys, readValue, storageKeys, writeValue } from "../../utils/storage";
import {
  getBranchesForOrganization,
  getServicesForOrganization,
} from "../../services/tenantSelectionService";

export default function TenantHome() {
  const { tenantType, tenant, theme, clearSelection, selectedOrganizationId } = useTenant();
  const navigate = useNavigate();
  const [expandBranches, setExpandBranches] = useState(false);
  const [expandServices, setExpandServices] = useState(false);
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const selectedOrganization =
    readValue(localStorage, storageKeys.selectedOrganization(tenantType), [legacyStorageKeys.selectedOrganization]) ||
    "";


  useEffect(() => {
    let isMounted = true;

    const loadTenantData = async () => {
      if (!tenantType) return;

      const orgIdKey = `queueflow_${tenantType}_selectedOrganization_id`;
      const idFromStorage = localStorage.getItem(orgIdKey);
      
      const finalOrgId = (selectedOrganizationId || idFromStorage || "").trim();

      if (!finalOrgId || finalOrgId === "undefined" || finalOrgId === "") {
        setBranches([]);
        setServices([]);
        return;
      }

      try {
        const [fetchedBranches, fetchedServices] = await Promise.all([
          getBranchesForOrganization(tenantType, finalOrgId),
          getServicesForOrganization(tenantType, finalOrgId),
        ]);

        if (!isMounted) return;

        setBranches(Array.isArray(fetchedBranches) ? fetchedBranches : []);
        setServices(Array.isArray(fetchedServices) ? fetchedServices : []);
      } catch (error) {
        console.error("Fetch failed:", error);
      }
    };

    loadTenantData();
    return () => { isMounted = false; };
  }, [tenantType, selectedOrganizationId]);

  

  const effectiveBranches = branches
    .map((branch) => {
      if (typeof branch === "string") {
        return branch.trim();
      }

      return (branch?.branchName || branch?.name || "").trim();
    })
    .filter(Boolean);
  const visibleBranches = expandBranches ? effectiveBranches : effectiveBranches.slice(0, 3);
  const hiddenBranchesCount = Math.max(effectiveBranches.length - 3, 0);
  const effectiveServices = services.map((service) => service.serviceName).filter(Boolean);

  const heroTitle = selectedOrganization || tenant.name;

  if (tenantType === "hospital") {
    const hospitalModule = resolveHospitalModule(sessionStorage);

    if (hospitalModule !== HOSPITAL_MODULES.TOKEN_MANAGEMENT) {
      return <Navigate to={getHospitalHomeRedirectPath(hospitalModule)} replace />;
    }
  }

  const handleGetToken = () => {
    writeValue(sessionStorage, storageKeys.queueFlowStarted(tenantType), "true");
    navigate(`/${tenantType}/branches`);
  };

  return (
    <div className="space-y-8">
      <section className={`rounded-3xl bg-gradient-to-r ${theme.gradient} p-8 text-white shadow-lg`}>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/80">
          Welcome
        </p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{heroTitle}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/90 sm:text-base">
          {tenant.description}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGetToken}
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Get Token
          </button>
          <Link
            to={`/${tenantType}/queue-status`}
            className="rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            View Queue
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className={`rounded-2xl border ${theme.border} bg-white p-6 shadow-sm`}>
          <h3 className="text-lg font-semibold text-slate-900">Branches</h3>
          <p className="mt-2 text-sm text-slate-500">
            Available branches for this tenant: {effectiveBranches.length}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleBranches.map((branch, idx) => (
                <span
                  key={idx}
                  className={`rounded-full border ${theme.border} ${theme.soft} ${theme.text} px-3 py-1.5 text-xs font-medium`}
                >
                  {branch}
                </span>
              ))}
            {hiddenBranchesCount > 0 && (
              <button
                type="button"
                onClick={() => setExpandBranches(!expandBranches)}
                className={`rounded-full border ${theme.border} ${theme.soft} ${theme.text} cursor-pointer px-3 py-1.5 text-xs font-medium transition hover:${theme.light}`}
              >
                {expandBranches ? "Show Less" : `Show More (+${hiddenBranchesCount})`}
              </button>
            )}
          </div>
        </div>

        <div className={`rounded-2xl border ${theme.border} bg-white p-6 shadow-sm`}>
          <h3 className="text-lg font-semibold text-slate-900">Services</h3>
          <p className="mt-2 text-sm text-slate-500">
            Available services for this tenant: {effectiveServices.length}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {effectiveServices
              .slice(0, expandServices ? effectiveServices.length : 3)
              .map((service, idx) => (
                <span
                  key={idx}
                  className={`rounded-full border ${theme.border} ${theme.soft} ${theme.text} px-3 py-1.5 text-xs font-medium`}
                >
                  {service}
                </span>
              ))}
            {effectiveServices.length > 3 && (
              <button
                onClick={() => setExpandServices(!expandServices)}
                className={`rounded-full border ${theme.border} ${theme.soft} ${theme.text} cursor-pointer px-3 py-1.5 text-xs font-medium transition hover:${theme.light}`}
              >
                {expandServices
                  ? "Show Less"
                  : `+${effectiveServices.length - 3} more`}
              </button>
            )}
          </div>
        </div>

        <div className={`rounded-2xl border ${theme.border} bg-white p-6 shadow-sm`}>
          <h3 className="text-lg font-semibold text-slate-900">Booking Type</h3>
          <p className={`mt-2 text-sm capitalize ${theme.text}`}>{tenant.bookingType}</p>
        </div>
      </section>
    </div>
  );
}