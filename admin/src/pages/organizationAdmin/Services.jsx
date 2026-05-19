import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getOrganizationBranchServices } from "../../services/organizationAdminService";
import api from "../../services/api";
import { Calendar, CalendarDays, X, Plus } from "lucide-react";

const DAYS_OF_WEEK = [
  { val: 0, label: "Sunday" },
  { val: 1, label: "Monday" },
  { val: 2, label: "Tuesday" },
  { val: 3, label: "Wednesday" },
  { val: 4, label: "Thursday" },
  { val: 5, label: "Friday" },
  { val: 6, label: "Saturday" },
];

const DAY_NAMES = DAYS_OF_WEEK.map((day) => day.label);

const workingDaysToNumbers = (days) => {
  if (!Array.isArray(days) || days.length === 0) {
    return [0, 1, 2, 3, 4, 5, 6];
  }

  const indices = days
    .map((day) => {
      if (typeof day === "number" && day >= 0 && day <= 6) {
        return day;
      }

      if (typeof day === "string") {
        const trimmed = day.trim();
        if (/^\d+$/.test(trimmed)) {
          const index = Number(trimmed);
          return index >= 0 && index <= 6 ? index : null;
        }

        const lower = trimmed.toLowerCase();
        const exactIndex = DAY_NAMES.findIndex((name) => name.toLowerCase() === lower);
        if (exactIndex >= 0) return exactIndex;

        const shortIndex = DAY_NAMES.findIndex((name) =>
          name.toLowerCase().startsWith(lower.slice(0, 3))
        );
        if (shortIndex >= 0) return shortIndex;
      }

      return null;
    })
    .filter((index) => index !== null && index >= 0 && index <= 6);

  return indices.length > 0 ? Array.from(new Set(indices)) : [0, 1, 2, 3, 4, 5, 6];
};

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

// Shared organization-admin page for tenant-scoped service catalog management.
export default function SharedOrganizationAdminServices() {
  const navigate = useNavigate();
  const { tenantType } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingService, setEditingService] = useState(null);
  const [workingDays, setWorkingDays] = useState([0,1,2,3,4,5,6]);
  const [availableDates, setAvailableDates] = useState([]);
  const [newDate, setNewDate] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const [saving, setSaving] = useState(false);

  const normalizedTenantType = String(tenantType || "").trim().toLowerCase();
  const showDivisionServices = normalizedTenantType === "police";

  const divisionServices = branches.flatMap((branch) => {
    const services = Array.isArray(branch.services)
      ? branch.services
      : Array.isArray(branch.branchServices)
        ? branch.branchServices
        : [];

    return services
      .filter((service) => Boolean(service?.isDivisionService))
      .map((service) => ({
        ...service,
        sourceBranchId: branch.branchId,
        sourceBranchName: branch.branchName,
      }));
  });

  useEffect(() => {
    let isMounted = true;

    const loadBranchServices = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getOrganizationBranchServices();
        if (!isMounted) {
          return;
        }

        setBranches(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setError(err?.message || "Failed to load services");
        setBranches([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBranchServices();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDeleteService = async (serviceId, branchId) => {
    if (!serviceId) return;
    if (window.confirm("WARNING: Are you sure you want to delete this service? All pending tokens will be cancelled and notified via SMS.")) {
      try {
        await api.delete(`/services/${serviceId}`);
        // Remove from UI
        setBranches((prevBranches) => prevBranches.map((b) => {
          if (b.branchId === branchId) {
            const list = b.services || b.branchServices || [];
            const filtered = list.filter((s) => (s.id || s.serviceId) !== serviceId);
            return { ...b, services: filtered, branchServices: filtered };
          }
          return b;
        }));
        alert("Service deleted successfully.");
      } catch (err) {
        alert(err?.response?.data?.message || "Failed to delete service");
      }
    }
  };

  const handleEditDays = (service) => {
    setEditingService(service);
    setWorkingDays(workingDaysToNumbers(service.workingDays));
    setAvailableDates(service.availableDates || []);
    setNewDate("");
    setIsClosed(Boolean(service.isClosed));
  };

  const saveWorkingDays = async () => {
    if (!editingService) return;
    try {
      setSaving(true);
      const serviceId = editingService.id || editingService.serviceId;
      await api.patch(`/services/${serviceId}`, {
        workingDays,
        availableDates,
        isClosed
      });
      // Update UI
      setBranches((prevBranches) => prevBranches.map((b) => {
        const list = b.services || b.branchServices || [];
        const updatedList = list.map((s) => {
          if ((s.id || s.serviceId) === serviceId) {
            return { ...s, workingDays, availableDates, isClosed };
          }
          return s;
        });
        return { ...b, services: updatedList, branchServices: updatedList };
      }));
      setEditingService(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to save working days");
    } finally {
      setSaving(false);
    }
  };

  const handleAddDate = () => {
    if (newDate && !availableDates.includes(newDate)) {
      setAvailableDates([...availableDates, newDate].sort());
      setNewDate("");
    }
  };

  const handleRemoveDate = (dateToRemove) => {
    setAvailableDates(availableDates.filter(d => d !== dateToRemove));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Services</h1>
          <p className="mt-2 text-sm text-slate-500">Manage services across your branches</p>
        </div>

        <button
          onClick={() => navigate("/organization-admin/add-service")}
          className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          + Add Service
        </button>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">Loading services...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && branches.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">No branches found</p>
        </div>
      )}

      {!loading && !error && branches.length > 0 && showDivisionServices && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Division Services</h2>

          {divisionServices.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No division services</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Service Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Description</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Branch</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Status</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {divisionServices.map((service) => (
                    <tr
                      key={
                        service.id ||
                        service.serviceId ||
                        `${service.sourceBranchId}_${service.serviceName}`
                      }
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">{service.serviceName || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{service.description || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{service.sourceBranchName || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(
                            service.status
                          )}`}
                        >
                          {formatStatusLabel(service.status)}
                        </span>
                        {service.isClosed && (
                           <span className="ml-2 inline-flex rounded-full bg-red-100 text-red-700 px-2 py-1 text-xs font-semibold">Closed</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleEditDays(service)}
                          className="inline-flex items-center rounded-lg bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                        >
                          🗓️ Days
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id || service.serviceId, service.sourceBranchId)}
                          className="inline-flex items-center rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {!loading &&
        !error &&
        branches.map((branch) => {
          const services = Array.isArray(branch.services)
            ? branch.services
            : Array.isArray(branch.branchServices)
              ? branch.branchServices
              : [];

          const branchServices = services.filter((service) => !Boolean(service?.isDivisionService));

          return (
            <section key={branch.branchId} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">{branch.branchName || "Unnamed Branch"}</h2>

              {branchServices.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No services for this branch</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Service Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Description</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Status</th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchServices.map((service) => (
                        <tr
                          key={service.id || service.serviceId || `${branch.branchId}_${service.serviceName}`}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">{service.serviceName || "-"}</td>
                          <td className="px-4 py-3 text-slate-600">{service.description || "-"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(
                                service.status
                              )}`}
                            >
                              {formatStatusLabel(service.status)}
                            </span>
                            {service.isClosed && (
                               <span className="ml-2 inline-flex rounded-full bg-red-100 text-red-700 px-2 py-1 text-xs font-semibold">Closed</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => handleEditDays(service)}
                              className="inline-flex items-center rounded-lg bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                            >
                              🗓️ Days
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id || service.serviceId, branch.branchId)}
                              className="inline-flex items-center rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}

      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden my-auto border border-slate-200">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-sky-400" />
                  Schedule Manager
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Manage availability for {editingService.serviceName}
                </p>
              </div>
              <button 
                onClick={() => setEditingService(null)}
                className="text-slate-400 hover:text-white transition p-2 rounded-full hover:bg-slate-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              {/* Temporarily Closed Toggle */}
              <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition ${isClosed ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                <input 
                  type="checkbox" 
                  checked={isClosed} 
                  onChange={(e) => setIsClosed(e.target.checked)}
                  className="w-6 h-6 text-red-500 rounded-md border-slate-300 focus:ring-red-500"
                />
                <div>
                  <span className={`block font-bold text-lg ${isClosed ? 'text-red-700' : 'text-slate-700'}`}>Temporarily Closed</span>
                  <span className="text-sm text-slate-500">Check this to temporarily pause all bookings for this service.</span>
                </div>
              </label>

              {/* Weekly Working Days */}
              <div>
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-sky-600" />
                  Weekly Working Days
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DAYS_OF_WEEK.map(day => {
                    const isSelected = workingDays.includes(day.val);
                    return (
                      <button
                        key={day.val}
                        onClick={() => {
                          if (isSelected) {
                            setWorkingDays(workingDays.filter(d => d !== day.val));
                          } else {
                            setWorkingDays([...workingDays, day.val]);
                          }
                        }}
                        className={`p-3 rounded-xl border-2 font-bold transition flex items-center justify-center gap-2 ${
                          isSelected 
                            ? 'bg-sky-50 border-sky-600 text-sky-700 shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300'}`}>
                          {isSelected && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        {day.label.slice(0,3)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Specific Available Dates */}
              <div>
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sky-600" />
                  Specific Dates (Optional)
                </h4>
                <p className="text-sm text-slate-500 mb-4">Add specific dates that should be available even outside regular working days.</p>
                
                <div className="flex items-center gap-3 mb-4">
                  <input 
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 font-medium outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition"
                  />
                  <button 
                    onClick={handleAddDate}
                    disabled={!newDate}
                    className="bg-sky-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-sky-700 transition disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" /> Add
                  </button>
                </div>

                {availableDates.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    {availableDates.map(d => (
                      <div key={d} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm">
                        <span className="font-semibold text-sm text-slate-700">{d}</span>
                        <button onClick={() => handleRemoveDate(d)} className="text-slate-400 hover:text-red-500 transition">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 border border-dashed border-slate-300 rounded-xl text-slate-500 text-sm">
                    No specific dates added.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-5 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={() => setEditingService(null)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                onClick={saveWorkingDays}
                disabled={saving}
                className="px-8 py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-lg shadow-sky-600/20 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
