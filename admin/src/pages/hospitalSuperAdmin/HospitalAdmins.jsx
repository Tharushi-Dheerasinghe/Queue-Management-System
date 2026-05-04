import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getOrganizationAdminsByTenant } from "../../services/tenantService";

const formatStatusLabel = (status) => status.charAt(0).toUpperCase() + status.slice(1);

export default function HospitalSuperAdminBranchAdmins() {
  const location = useLocation();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || "");

  useEffect(() => {
    let isMounted = true;

    const loadAdmins = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getOrganizationAdminsByTenant("hospital");
        if (!isMounted) {
          return;
        }

        setAdmins(Array.isArray(response) ? response : []);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setAdmins([]);
        setError(loadError?.message || "Failed to load hospital admins");
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
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900">Registered Admins</h1>
        <p className="mt-2 text-gray-600">Create and manage hospital administrators</p>

        {successMessage && (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-12 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-3">Assignment</div>
            <div className="col-span-3">Status</div>
          </div>

          {loading && (
            <div className="px-4 py-6 text-sm text-gray-600">Loading admins...</div>
          )}

          {!loading && admins.map((admin) => (
            <div key={admin.id} className="grid grid-cols-12 items-center border-b border-gray-100 px-4 py-3 text-sm last:border-b-0">
              <div className="col-span-3 font-medium text-gray-900">{admin.name}</div>
              <div className="col-span-3 text-gray-700">{admin.email}</div>
              <div className="col-span-3 text-gray-700">
                <p>{admin.organizationName || "-"}</p>
                <p className="text-xs text-gray-500">{admin.branchName || "-"}</p>
              </div>
              <div className="col-span-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    admin.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {formatStatusLabel(admin.status)}
                </span>
              </div>
            </div>
          ))}

          {!loading && !error && admins.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-500">No hospital organization admins found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
