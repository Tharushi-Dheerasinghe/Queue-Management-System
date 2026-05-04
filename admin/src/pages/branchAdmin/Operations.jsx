import { useEffect, useState } from "react";
import { createBranchCounter, getBranchAdminOperationsDashboard } from "../../services/branchAdminService";

const formatStatusLabel = (status = "") => {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) return "Unknown";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getStatusBadgeClass = (status = "") => {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized === "active") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (normalized === "inactive") {
    return "bg-slate-200 text-slate-700";
  }

  if (normalized === "pending") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-blue-100 text-blue-700";
};

const StaffListBlock = ({ title, staff = [] }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>

    {staff.length === 0 ? (
      <p className="mt-3 text-sm text-slate-500">No staff</p>
    ) : (
      <div className="mt-3 space-y-2">
        {staff.map((member) => (
          <div
            key={member.id}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          >
            <p className="font-medium text-slate-900">{member.name || "-"}</p>
            <p className="text-slate-600">{member.email || "-"}</p>
          </div>
        ))}
      </div>
    )}
  </section>
);

export default function BranchAdminOperations() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openCounterFormServiceId, setOpenCounterFormServiceId] = useState("");
  const [counterForms, setCounterForms] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getBranchAdminOperationsDashboard();
        if (!isMounted) {
          return;
        }

        setDashboard(data || null);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setError(err?.message || "Failed to load branch operations");
        setDashboard(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const branchName = dashboard?.branch?.branchName || "-";
  const services = Array.isArray(dashboard?.services) ? dashboard.services : [];
  const activeStaff = Array.isArray(dashboard?.staffSummary?.activeStaff)
    ? dashboard.staffSummary.activeStaff
    : [];
  const inactiveStaff = Array.isArray(dashboard?.staffSummary?.inactiveStaff)
    ? dashboard.staffSummary.inactiveStaff
    : [];
  const unassignedStaff = Array.isArray(dashboard?.staffSummary?.unassignedStaff)
    ? dashboard.staffSummary.unassignedStaff
    : [];
  const unassignedCounters = Array.isArray(dashboard?.unassignedCounters)
  ? dashboard.unassignedCounters
  : [];

  const toggleCounterForm = (serviceId) => {
    setError("");
    setOpenCounterFormServiceId((current) => (current === serviceId ? "" : serviceId));
  };

  const handleCounterFormChange = (serviceId, value) => {
    setCounterForms((current) => ({
      ...current,
      [serviceId]: {
        ...current[serviceId],
        counterName: value,
      },
    }));
  };

  const handleCreateCounter = async (service) => {
    const serviceId = String(service.serviceId || "");
    const formState = counterForms[serviceId] || {};
    const counterName = String(formState.counterName || "").trim();

    if (!counterName) {
      setCounterForms((current) => ({
        ...current,
        [serviceId]: {
          ...current[serviceId],
          error: "Counter name is required",
          success: "",
        },
      }));
      return;
    }

    try {
      setCounterForms((current) => ({
        ...current,
        [serviceId]: {
          ...current[serviceId],
          loading: true,
          error: "",
          success: "",
        },
      }));

      const response = await createBranchCounter({
        counterName,
        serviceId,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to create counter");
      }

      const createdCounter = response.counter;

      setDashboard((current) => {
        if (!current) {
          return current;
        }

        const nextServices = Array.isArray(current.services)
          ? current.services.map((item) => {
              if (String(item.serviceId) !== serviceId) {
                return item;
              }

              const nextCounters = Array.isArray(item.counters) ? item.counters : [];

              return {
                ...item,
                counters: [
                  ...nextCounters,
                  {
                    counterId: createdCounter?.id,
                    counterName: createdCounter?.counterName || counterName,
                    status: createdCounter?.status || "inactive",
                    assignedStaff: null,
                  },
                ],
                inactiveCounterCount: Number(item.inactiveCounterCount || 0) + 1,
              };
            })
          : [];

        return {
          ...current,
          services: nextServices,
        };
      });

      setCounterForms((current) => ({
        ...current,
        [serviceId]: {
          counterName: "",
          loading: false,
          error: "",
          success: "Counter created successfully",
        },
      }));
      setOpenCounterFormServiceId("");
    } catch (err) {
      setCounterForms((current) => ({
        ...current,
        [serviceId]: {
          ...current[serviceId],
          loading: false,
          error: err?.message || "Failed to create counter",
          success: "",
        },
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Branch Operations</h1>
        <p className="mt-2 text-sm text-slate-500">Operations dashboard for {branchName}</p>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">Loading operations dashboard...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Services</h2>

          {services.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No services found for this branch</p>
          ) : (
            <div className="mt-4 space-y-4">
              {services.map((service) => {
                const counters = Array.isArray(service.counters) ? service.counters : [];
                const serviceId = String(service.serviceId || "");
                const formState = counterForms[serviceId] || {};
                const isFormOpen = openCounterFormServiceId === serviceId;
                const isCreating = Boolean(formState.loading);

                return (
                  <article
                    key={service.serviceId}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {service.serviceName || "Unnamed Service"}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                          <span className="rounded-full bg-slate-200 px-2.5 py-1">
                            Active Counters: {service.activeCounterCount || 0}
                          </span>
                          <span className="rounded-full bg-slate-200 px-2.5 py-1">
                            Inactive Counters: {service.inactiveCounterCount || 0}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(
                          service.status
                        )}`}
                      >
                        {formatStatusLabel(service.status)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleCounterForm(serviceId)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        {isFormOpen ? "Hide Counter Form" : "+ Add Counter"}
                      </button>

                      {formState.success && !isFormOpen && (
                        <p className="text-sm font-medium text-emerald-700">{formState.success}</p>
                      )}
                    </div>

                    {isFormOpen && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
                          <div>
                            <label
                              htmlFor={`counter-name-${serviceId}`}
                              className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                              Counter Name
                            </label>
                            <input
                              id={`counter-name-${serviceId}`}
                              type="text"
                              value={formState.counterName || ""}
                              onChange={(event) => handleCounterFormChange(serviceId, event.target.value)}
                              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
                              placeholder="e.g., Counter A"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCreateCounter(service)}
                            disabled={isCreating}
                            className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
                          >
                            {isCreating ? "Creating..." : "Create"}
                          </button>
                        </div>

                        {formState.error && (
                          <p className="mt-3 text-sm text-red-700">{formState.error}</p>
                        )}

                        {formState.success && (
                          <p className="mt-3 text-sm text-emerald-700">{formState.success}</p>
                        )}
                      </div>
                    )}

                    {counters.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-500">No counters yet</p>
                    ) : (
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="px-3 py-2 text-left font-semibold text-slate-900">Counter</th>
                              <th className="px-3 py-2 text-left font-semibold text-slate-900">Status</th>
                              <th className="px-3 py-2 text-left font-semibold text-slate-900">Assigned Staff</th>
                            </tr>
                          </thead>
                          <tbody>
                            {counters.map((counter) => (
                              <tr key={counter.counterId} className="border-b border-slate-100">
                                <td className="px-3 py-2 font-medium text-slate-900">
                                  {counter.counterName || "-"}
                                </td>
                                <td className="px-3 py-2">
                                  <span
                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(
                                      counter.status
                                    )}`}
                                  >
                                    {formatStatusLabel(counter.status)}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-slate-600">
                                  {counter.assignedStaff?.name || "No staff assigned"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {!loading && !error && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Staff Summary</h2>
          

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <StaffListBlock title="Active Staff" staff={activeStaff} />
            <StaffListBlock title="Inactive Staff" staff={inactiveStaff} />
            <StaffListBlock title="Unassigned Staff" staff={unassignedStaff} />
          </div>
        </section>
      )}
    </div>
  );
}
