import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getOrganizationAdminsByTenant } from "../../services/tenantService";

const formatStatusLabel = (status = "") => {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) {
    return "Unknown";
  }
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

export default function CompanySuperAdminOrganizationAdmins() {
  const location = useLocation();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage] = useState(location.state?.successMessage || "");

  useEffect(() => {
    let isMounted = true;

    const loadAdmins = async () => {
      try {
        setLoading(true);
        setError("");

        const [bankAdmins, supermarketAdmins] = await Promise.all([
          getOrganizationAdminsByTenant("bank"),
          getOrganizationAdminsByTenant("supermarket"),
        ]);

        if (!isMounted) {
          return;
        }

        setAdmins([...(Array.isArray(bankAdmins) ? bankAdmins : []), ...(Array.isArray(supermarketAdmins) ? supermarketAdmins : [])]);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setAdmins([]);
        setError(loadError?.message || "Failed to load organization admins");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAdmins();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Organization Admins</h1>
        <p className="mt-2 text-sm text-slate-500">
          Create and manage organization administrators for banks and supermarkets
        </p>
      </div>

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="text-emerald-700">{successMessage}</p>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">Loading organization admins...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && admins.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">No organization admins yet</p>
        </div>
      )}

      {!loading && !error && admins.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Tenant</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Organization</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin._id || admin.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{admin.name || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{admin.email || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{admin.tenantType || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{admin.organizationName || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(
                          admin.status
                        )}`}
                      >
                        {formatStatusLabel(admin.status)}
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
