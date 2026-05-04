import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getOrganizationsByTenant, getBranchesByTenant } from "../../services/tenantService";

const formatStatusLabel = (status) => status.charAt(0).toUpperCase() + status.slice(1);

export default function HospitalSuperAdminBranches() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch hospitals and branches in parallel
        const [hospitalsData, branchesData] = await Promise.all([
          getOrganizationsByTenant("hospital"),
          getBranchesByTenant("hospital"),
        ]);

        setHospitals(hospitalsData || []);
        setBranches(branchesData || []);
      } catch (err) {
        console.error("Failed to fetch hospital data:", err);
        setError("Failed to load hospital and branch data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getOrganizationName = (branch) => {
    const hospital = hospitals.find((h) => String(h._id) === String(branch.organizationId));
    return hospital?.organizationName || branch.organizationName || "Unknown Hospital";
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
            <p className="mt-4 text-gray-600">Loading hospital data...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
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

    if (branches.length === 0) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-600">No hospital branches registered yet.</p>
          <button
            type="button"
            onClick={() => navigate("/hospital-super-admin/add-hospital")}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Register First Hospital
          </button>
        </div>
      );
    }

    return (
      <div className="mt-8 grid grid-cols-1 gap-4">
        {branches.map((branch) => (
          <div key={branch._id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{branch.branchName}</h3>
                <p className="text-sm text-gray-600">{getOrganizationName(branch)}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  branch.status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {formatStatusLabel(branch.status)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">City</p>
                <p className="font-medium text-gray-900">{branch.city || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Branch Code</p>
                <p className="font-medium text-gray-900">{branch.branchCode || "—"}</p>
              </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Registered Hospitals</h1>
          <button
            type="button"
            onClick={() => navigate("/hospital-super-admin/add-hospital")}
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Register New Hospital
          </button>
        </div>
        <p className="mt-2 text-gray-600">View Hospitals Under Your Management</p>

        {renderContent()}
      </div>
    </div>
  );
}
