import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import ServiceCard from "../../components/tenant/ServiceCard";
import { useTenant } from "../../context/TenantContext";
// Home Page එකේ පාවිච්චි කරපු generic service එක මෙතනටත් ගන්නවා
import { getServicesForOrganization } from "../../services/tenantSelectionService";

export default function ServiceSelection() {
  const {
    tenantType,
    theme,
    selectedOrganizationId,
    selectedService,
    setSelectedService,
  } = useTenant();
  
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Storage එකෙන් ID එක fallback එකක් විදිහට ගන්නවා
  const effectiveOrgId = useMemo(() => {
    return selectedOrganizationId || localStorage.getItem(`queueflow_${tenantType}_selectedOrganization_id`) || "";
  }, [selectedOrganizationId, tenantType]);

  useEffect(() => {
    let isMounted = true;

    const loadAllOrgServices = async () => {
      if (!effectiveOrgId || !tenantType) {
        setServices([]);
        setLoadingServices(false);
        return;
      }

      try {
        setLoadingServices(true);
        setFetchError("");

        // මෙතනදී අපි මුළු Organization එකටම අදාළ services fetch කරනවා
        const response = await getServicesForOrganization(tenantType, effectiveOrgId);

        if (!isMounted) return;

        // response එක array එකක් බව තහවුරු කරගන්නවා
        setServices(Array.isArray(response) ? response : []);
      } catch (error) {
        if (!isMounted) return;
        setFetchError(error?.response?.data?.message || error?.message || "Failed to load services");
        setServices([]);
      } finally {
        if (isMounted) {
          setLoadingServices(false);
        }
      }
    };

    loadAllOrgServices();

    return () => {
      isMounted = false;
    };
  }, [tenantType, effectiveOrgId]);

  // Filtering logic
  const filteredServices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return services
      .filter((s) => term === "" || s.serviceName.toLowerCase().includes(term))
      .sort((a, b) => a.serviceName.localeCompare(b.serviceName));
  }, [services, searchTerm]);

  const activeSelectedService = useMemo(() => {
    if (!selectedService?.id) return null;
    return services.find((s) => String(s.id) === String(selectedService.id)) || null;
  }, [services, selectedService]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Search Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <PageHeader
            title="Available Services"
            description="All services offered by this organization across all branches."
          />
          <div className="w-full lg:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search services..."
              className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-4 ${theme?.border} ${theme?.ring}`}
            />
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredServices.map((service) => (
          <ServiceCard
            key={service.id || service.serviceName}
            service={service.serviceName}
            selected={activeSelectedService?.id === service.id}
            onSelect={() => setSelectedService(service)}
            theme={theme}
          />
        ))}
      </div>

      {/* States */}
      {loadingServices && <div className="text-center p-10">Loading all services...</div>}
      {!loadingServices && filteredServices.length === 0 && (
        <div className="text-center p-10 text-slate-500 border border-dashed rounded-2xl">
          No services found for this organization.
        </div>
      )}

      {/* Continue Action */}
      {activeSelectedService && (
        <div className={`rounded-3xl border p-5 flex justify-between items-center ${theme?.border} ${theme?.light}`}>
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Selected Service</p>
            <p className="text-lg font-semibold">{activeSelectedService.serviceName}</p>
          </div>
          <button
            onClick={() => navigate(`/${tenantType}/book-token`)}
            className={`px-6 py-3 rounded-xl text-white font-semibold ${theme?.button}`}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}