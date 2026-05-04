import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getServicesByTenant } from "../../services/tenantService";

const formatStatusLabel = (status) => status.charAt(0).toUpperCase() + status.slice(1);

const groupServicesByName = (services) => {
  const grouped = {};

  services.forEach((service) => {
    const serviceName = service?.serviceName || "Unnamed Service";
    if (!grouped[serviceName]) {
      grouped[serviceName] = {
        name: serviceName,
        category: service?.category || "General",
        organizationIds: new Set(),
        branchIds: new Set(),
        statuses: [],
      };
    }

    const organizationId = service?.organizationId || null;
    const branchId = service?.branchId || null;

    if (organizationId) {
      grouped[serviceName].organizationIds.add(String(organizationId));
    }
    if (branchId) {
      grouped[serviceName].branchIds.add(String(branchId));
    }

    if (service?.status) {
      grouped[serviceName].statuses.push(service.status);
    }
  });

  // Convert grouped object to array and calculate final values
  return Object.values(grouped).map((group) => ({
    name: group.name,
    category: group.category,
    hospitals: group.organizationIds.size,
    branches: group.branchIds.size,
    status: group.statuses.includes("active") ? "active" : group.statuses[0] || "inactive",
  }));
};

export default function HospitalSuperAdminServices() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError("");

        const fetchedServices = await getServicesByTenant("hospital");
        const groupedServices = groupServicesByName(fetchedServices || []);

        setServices(groupedServices);
      } catch (err) {
        console.error("Failed to fetch hospital services:", err);
        setError("Failed to load hospital services. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="mt-8 flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
            <p className="mt-4 text-gray-600">Loading services...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      );
    }

    if (services.length === 0) {
      return (
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-600">No services registered yet.</p>
          <button
            type="button"
            onClick={() => navigate("/hospital-super-admin/add-service")}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Add First Service
          </button>
        </div>
      );
    }

    return (
      <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <div className="col-span-3">Service</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Hospitals</div>
          <div className="col-span-2">Branches</div>
          <div className="col-span-3">Status</div>
        </div>

        {services.map((service, index) => (
          <div key={index} className="grid grid-cols-12 items-center border-b border-gray-100 px-4 py-3 text-sm last:border-b-0">
            <div className="col-span-3 font-medium text-gray-900">{service.name}</div>
            <div className="col-span-2 text-gray-700">{service.category}</div>
            <div className="col-span-2 text-gray-700">{service.hospitals}</div>
            <div className="col-span-2 text-gray-700">{service.branches}</div>
            <div className="col-span-3">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  service.status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-violet-100 text-violet-700"
                }`}
              >
                {formatStatusLabel(service.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <button
            type="button"
            onClick={() => navigate("/hospital-super-admin/add-service")}
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Add Service
          </button>
        </div>
        <p className="mt-2 text-gray-600">Manage hospital-level services and availability</p>

        {renderContent()}
      </div>
    </div>
  );
}
