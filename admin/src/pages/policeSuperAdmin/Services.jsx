import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getBranchesByTenant,
  getOrganizationsByTenant,
  getServicesByTenant,
} from "../../services/tenantService";

const asId = (value) => String(value || "");

const mapBranch = (branch) => ({
  branchId: branch?._id || branch?.id || null,
  organizationId: branch?.organizationId || branch?.divisionId || null,
  branchName: branch?.branchName || "Unnamed Branch",
  branchCode: branch?.branchCode || "-",
  city: branch?.city || "-",
  status: branch?.status || "-",
});

const mapService = (service) => ({
  serviceId: service?._id || service?.id || null,
  organizationId: service?.organizationId || service?.divisionId || null,
  branchId: service?.branchId || null,
  serviceName: service?.serviceName || "-",
  description: service?.description || "",
  status: service?.status || "active",
});

const mapDivisionWithServices = (organization, branches, services) => {
  const organizationId = organization?._id || organization?.id || null;
  const branchRows = branches
    .filter((branch) => asId(branch?.organizationId || branch?.divisionId) === asId(organizationId))
    .map(mapBranch);

  const serviceRows = services.map(mapService);

  return {
    divisionId: organizationId,
    organizationId,
    divisionName: organization?.divisionName || organization?.organizationName || "Unnamed Division",
    branchName: organization?.organizationName || organization?.divisionName || "Unnamed Division",
    divisionServices: serviceRows.filter(
      (service) =>
        asId(service.organizationId) === asId(organizationId) && !service.branchId
    ),
    branches: branchRows.map((branch) => ({
      ...branch,
      branchServices: serviceRows.filter((service) => asId(service.branchId) === asId(branch.branchId)),
    })),
  };
};

export default function PoliceSuperAdminServices() {
  const navigate = useNavigate();
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchDivisionsBranchesServices = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [organizations, branches, services] = await Promise.all([
          getOrganizationsByTenant("police"),
          getBranchesByTenant("police"),
          getServicesByTenant("police"),
        ]);
        if (!isMounted) {
          return;
        }

        const mapped = (Array.isArray(organizations) ? organizations : []).map((organization) =>
          mapDivisionWithServices(
            organization,
            Array.isArray(branches) ? branches : [],
            Array.isArray(services) ? services : []
          )
        );

        setDivisions(mapped);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error?.response?.data?.message || error?.message || "Failed to load division and branch services"
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDivisionsBranchesServices();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
        </div>
        <p className="mt-2 text-gray-600">Manage police services and branch availability</p>

        {loading && (
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Loading division and branch services...
          </div>
        )}

        {!loading && errorMessage && (
          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
            {errorMessage}
          </div>
        )}

        {!loading && !errorMessage && divisions.length === 0 && (
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            No police divisions found.
          </div>
        )}

        {!loading &&
          !errorMessage &&
          divisions.map((division) => (
            <section key={division.divisionId} className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h2 className="text-lg font-semibold text-gray-900">{division.divisionName || "Unnamed Division"}</h2>
              </div>

              <div className="border-b border-gray-200 px-4 py-4">
                <h3 className="text-sm font-semibold text-gray-900">Division Services</h3>

                {!Array.isArray(division.divisionServices) || division.divisionServices.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">No division services</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {division.divisionServices.map((service) => (
                      <li key={service.serviceId} className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-3">
                        <p className="text-sm font-medium text-gray-900">{service.serviceName || "-"}</p>
                        {service.description ? (
                          <p className="mt-1 text-xs text-gray-600">{service.description}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {!Array.isArray(division.branches) || division.branches.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-500">No branches under this division</p>
              ) : (
                <div className="space-y-5 p-4">
                  {division.branches.map((branch) => (
                    <article key={branch.branchId} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <div className="border-b border-gray-100 bg-slate-50 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-900">{branch.branchName || "Unnamed Branch"}</h3>
                      </div>

                      {!Array.isArray(branch.branchServices) || branch.branchServices.length === 0 ? (
                        <p className="px-4 py-5 text-sm text-gray-500">No branch services</p>
                      ) : (
                        <ul className="space-y-3 px-4 py-4">
                          {branch.branchServices.map((service) => (
                            <li key={`${branch.branchId}_${service.serviceId}`} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                              <p className="text-sm font-medium text-gray-900">{service.serviceName || "-"}</p>
                              {service.description ? (
                                <p className="mt-1 text-xs text-gray-600">{service.description}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
      </div>
    </div>
  );
}
