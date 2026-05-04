import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBranchStaffUsers } from "../../services/branchAdminService";

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

export default function BranchAdminStaff() {
  const navigate = useNavigate();
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadStaffUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getBranchStaffUsers();
        if (!isMounted) {
          return;
        }

        setStaffUsers(Array.isArray(data?.staff) ? data.staff : []);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setError(err?.message || "Failed to load staff users");
        setStaffUsers([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStaffUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff Management</h1>
          <p className="mt-2 text-sm text-slate-500">Manage staff members for your branch</p>
        </div>

        <button
          onClick={() => navigate("/branch-admin/add-staff")}
          className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          + Add Staff
        </button>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">Loading staff users...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && staffUsers.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">No staff users found</p>
        </div>
      )}

      {!loading && !error && staffUsers.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Username</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {staffUsers.map((staff) => (
                  <tr key={staff.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{staff.name || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{staff.email || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{staff.username || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{staff.phone || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(
                          staff.status
                        )}`}
                      >
                        {formatStatusLabel(staff.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
