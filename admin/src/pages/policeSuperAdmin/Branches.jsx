import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBranchesByTenant, getOrganizationsByTenant } from "../../services/tenantService";

const asId = (value) => String(value || "");

const mapBranch = (branch) => ({
  branchId: branch?._id || branch?.id || null,
  organizationId: branch?.organizationId || branch?.divisionId || null,
  branchName: branch?.branchName || "-",
  branchCode: branch?.branchCode || "-",
  city: branch?.city || "-",
  status: branch?.status || "-",
});

const mapDivisionWithBranches = (organization, branches) => {
  const organizationId = organization?._id || organization?.id || null;
  const divisionBranches = branches
    .filter((branch) => asId(branch?.organizationId || branch?.divisionId) === asId(organizationId))
    .map(mapBranch);

  return {
    divisionId: organizationId,
    organizationId,
    divisionName: organization?.divisionName || organization?.organizationName || "Unnamed Division",
    branchName: organization?.organizationName || organization?.divisionName || "Unnamed Division",
    branches: divisionBranches,
  };
};

export default function Branches() {
  const navigate = useNavigate();
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchDivisionsWithBranches = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [organizations, branches] = await Promise.all([
          getOrganizationsByTenant("police"),
          getBranchesByTenant("police"),
        ]);
        if (!isMounted) {
          return;
        }

        const mapped = (Array.isArray(organizations) ? organizations : []).map((organization) =>
          mapDivisionWithBranches(organization, Array.isArray(branches) ? branches : [])
        );

        setDivisions(mapped);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setErrorMessage(error?.response?.data?.message || error?.message || "Failed to load divisions");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDivisionsWithBranches();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Branch Management</h1>
            <p className="mt-2 text-gray-600">View police divisions and their grouped branches</p>
          </div>
        </div>

        {loading && (
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Loading police divisions and branches...
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
            <div key={division.divisionId} className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h2 className="text-lg font-semibold text-slate-900">{division.divisionName || "Unnamed Division"}</h2>
              </div>

              {!Array.isArray(division.branches) || division.branches.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-500">No branches under this division</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {division.branches.map((branch) => (
                    <article key={branch.branchId} className="rounded-lg border border-slate-200 bg-white p-4">
                      <h3 className="text-sm font-semibold text-slate-900">{branch.branchName || "-"}</h3>
                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        <p>
                          <span className="font-medium text-slate-700">Branch Code:</span> {branch.branchCode || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-700">City:</span> {branch.city || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-700">Status:</span> {branch.status || "-"}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}