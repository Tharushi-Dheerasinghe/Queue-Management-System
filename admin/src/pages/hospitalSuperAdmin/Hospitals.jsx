import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOrganizationsByTenant, getBranchesByTenant } from "../../services/tenantService";

const formatStatusLabel = (status) => status.charAt(0).toUpperCase() + status.slice(1);

export default function HospitalSuperAdminMainCategories() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [branchCountMap, setBranchCountMap] = useState({});

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

        // Build branch count map: organizationId -> count of branches
        const branchMap = {};
        (branchesData || []).forEach((branch) => {
          const orgId = String(branch?.organizationId || "");
          if (orgId) {
            branchMap[orgId] = (branchMap[orgId] || 0) + 1;
          }
        });

        setBranchCountMap(branchMap);
        setOrganizations(hospitalsData || []);
      } catch (err) {
        console.error("Failed to fetch hospital data:", err);
        setError("Failed to load hospital data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeCount = organizations.filter((org) => org.status === "active").length;
  const pendingCount = organizations.length - activeCount;

  const getBranchCount = (organizationId) => {
    return branchCountMap[String(organizationId || "")] || 0;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="mt-8 flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
            <p className="mt-4 text-gray-600">Loading hospital data...</p>
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

    if (organizations.length === 0) {
      return (
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-600">No hospitals registered yet.</p>
        </div>
      );
    }

    return (
      <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <div className="col-span-4">Category</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">City</div>
          <div className="col-span-2">Branches</div>
          <div className="col-span-2">Status</div>
        </div>
        {organizations.map((org) => (
          <div key={org._id} className="grid grid-cols-12 items-center border-b border-gray-100 px-4 py-3 text-sm last:border-b-0">
            <div className="col-span-4 font-medium text-gray-900">{org.organizationName || "Unnamed Hospital"}</div>
            <div className="col-span-2 text-gray-700">{org.organizationType || "N/A"}</div>
            <div className="col-span-2 text-gray-700">{org.city || "N/A"}</div>
            <div className="col-span-2 text-gray-700">{getBranchCount(org._id)}</div>
            <div className="col-span-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  org.status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {formatStatusLabel(org.status)}
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
          <h1 className="text-3xl font-bold text-gray-900">Hospitals Status</h1>
        </div>
        <p className="mt-2 text-gray-600">Manage and view the status of all registered hospitals</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">Total Hospitals</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{organizations.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">Active</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{activeCount}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{pendingCount}</p>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
