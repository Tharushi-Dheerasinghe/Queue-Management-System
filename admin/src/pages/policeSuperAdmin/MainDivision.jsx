import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getBranchesByTenant, getOrganizationsByTenant } from "../../services/tenantService";

const asId = (value) => String(value || "");

const mapDivision = (organization, branches) => {
  const organizationId = organization?._id || organization?.id || null;
  const branchCount = branches.filter(
    (branch) => asId(branch?.organizationId || branch?.divisionId) === asId(organizationId)
  ).length;

  return {
    id: organizationId,
    divisionId: organizationId,
    organizationId,
    divisionName: organization?.divisionName || organization?.organizationName || "Unnamed Division",
    branchName: organization?.organizationName || organization?.divisionName || "Unnamed Division",
    type: organization?.category || "-",
    category: organization?.category || "-",
    city: organization?.city || "-",
    status: organization?.status || "pending",
    branchCount,
  };
};

const formatStatusLabel = (status = "") =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : "-";

export default function PoliceSuperAdminMainDivision() {
  const navigate = useNavigate();
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const [organizations, branches] = await Promise.all([
          getOrganizationsByTenant("police"),
          getBranchesByTenant("police"),
        ]);

        const mappedDivisions = (Array.isArray(organizations) ? organizations : []).map((organization) =>
          mapDivision(organization, Array.isArray(branches) ? branches : [])
        );

        setDivisions(mappedDivisions);
      } catch (error) {
        console.error("Failed to fetch police divisions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDivisions();
  }, []);

  const activeCount = divisions.filter((item) => item.status === "active").length;
  const pendingCount = divisions.filter((item) => item.status === "pending").length;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">District Main Police Stations</h1>
          <button
            type="button"
            onClick={() => navigate("/police-super-admin/add-main-division")}
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Add Main Division
          </button>
        </div>

        <p className="mt-2 text-gray-600">Manage and view registered police main divisions</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">Main Divisions</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{divisions.length}</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">Active Divisions</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{activeCount}</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">Pending Divisions</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{pendingCount}</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-12 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <div className="col-span-3">Division Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">City</div>
            <div className="col-span-1">Branches</div>
          </div>

          {loading ? (
            <p className="px-4 py-6 text-sm text-gray-500">Loading...</p>
          ) : divisions.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">No divisions found.</p>
          ) : (
            divisions.map((division) => (
              <div
                key={division.divisionId || division._id || division.id}
                className="grid grid-cols-12 items-center border-b border-gray-100 px-4 py-3 text-sm last:border-b-0"
              >
                <div className="col-span-3 font-medium text-gray-900">
                  {division.branchName || division.divisionName || "-"}
                </div>
                <div className="col-span-2 text-gray-700">{division.type || division.category || "-"}</div>
                <div className="col-span-2 text-gray-700">{division.city || "-"}</div>
                <div className="col-span-1 text-gray-700">{Array.isArray(division.branches) ? division.branches.length : division.branchCount ?? 0}</div>
                <div className="col-span-2">

                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}