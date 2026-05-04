import { useEffect, useState } from "react";
import {
  getBranchesByTenant,
  getOrganizationsByTenant,
  getUsersByTenant,
} from "../../services/tenantService";

const asId = (value) => String(value || "");
const asRole = (value) => String(value || "").trim().toLowerCase();

const mapBranch = (branch) => ({
  branchId: branch?._id || branch?.id || null,
  organizationId: branch?.organizationId || branch?.divisionId || null,
  branchName: branch?.branchName || "Unnamed Branch",
  branchCode: branch?.branchCode || "-",
  city: branch?.city || "-",
  status: branch?.status || "-",
});

const mapAdmin = (user) => ({
  id: user?._id || user?.id || null,
  organizationId: user?.organizationId || user?.divisionId || null,
  branchId: user?.branchId || null,
  name: user?.name || "-",
  email: user?.email || "-",
  username: user?.username || "-",
  phone: user?.phone || "-",
  role: user?.role || "",
  status: user?.status || "active",
});

const mapDivisionWithAdmins = (organization, branches, users) => {
  const organizationId = organization?._id || organization?.id || null;

  const branchRows = branches
    .filter((branch) => asId(branch?.organizationId || branch?.divisionId) === asId(organizationId))
    .map(mapBranch);

  const mappedUsers = users.map(mapAdmin);

  return {
    divisionId: organizationId,
    organizationId,
    divisionName: organization?.divisionName || organization?.organizationName || "Unnamed Division",
    branchName: organization?.organizationName || organization?.divisionName || "Unnamed Division",
    divisionAdmins: mappedUsers.filter(
      (user) => asRole(user?.role) === "organization_admin" &&
        asId(user?.organizationId) === asId(organizationId)
    ),
    branches: branchRows.map((branch) => ({
      ...branch,
      admins: mappedUsers.filter((user) =>
        asRole(user?.role) === "branch_admin" &&
        asId(user?.branchId) === asId(branch.branchId)
      ),
    })),
  };
};

const formatStatusLabel = (status = "") => status.charAt(0).toUpperCase() + status.slice(1);

const getStatusBadgeClass = (status = "") => {
  const normalizedStatus = String(status).toLowerCase();

  if (normalizedStatus === "active") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (normalizedStatus === "inactive") {
    return "bg-slate-200 text-slate-700";
  }

  if (normalizedStatus === "pending") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-blue-100 text-blue-700";
};

export default function PoliceSuperAdminBranchAdmins() {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchDivisionsBranchesAdmins = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [organizations, branches, users] = await Promise.all([
          getOrganizationsByTenant("police"),
          getBranchesByTenant("police"),
          getUsersByTenant("police"),
        ]);

        if (!isMounted) {
          return;
        }

        const mapped = (Array.isArray(organizations) ? organizations : []).map((organization) =>
          mapDivisionWithAdmins(organization, Array.isArray(branches) ? branches : [], Array.isArray(users) ? users : [])
        );

        setDivisions(mapped);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error?.response?.data?.message || error?.message || "Failed to load branch admins"
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDivisionsBranchesAdmins();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900">Branch Admins</h1>
        <p className="mt-2 text-gray-600">View police branch administrators by division and branch</p>

        {loading && (
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Loading divisions, branches, and admins...
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
                <h3 className="text-sm font-semibold text-gray-900">Division Admins</h3>

                {!Array.isArray(division.divisionAdmins) || division.divisionAdmins.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">No division admins</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {division.divisionAdmins.map((admin) => (
                      <div
                        key={admin.id}
                        className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-0.5 text-sm text-gray-700">
                          <p className="font-medium text-gray-900">{admin.name || "-"}</p>
                          <p>{admin.email || "-"}</p>
                          <p>Username: {admin.username || "-"}</p>
                          <p>Phone: {admin.phone || "-"}</p>
                        </div>
                        <span
                          className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                            admin.status
                          )}`}
                        >
                          {formatStatusLabel(admin.status || "unknown")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!Array.isArray(division.branches) || division.branches.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-500">No branches under this division</p>
              ) : (
                <div className="space-y-5 p-4">
                  {division.branches.map((branch) => (
                    <article key={branch.branchId} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <div className="flex items-center justify-between border-b border-gray-100 bg-slate-50 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-900">{branch.branchName || "Unnamed Branch"}</h3>
                        <span className="text-xs font-medium text-gray-600">
                          Branch Code: {branch.branchCode || "-"}
                        </span>
                      </div>

                      {!Array.isArray(branch.admins) || branch.admins.length === 0 ? (
                        <p className="px-4 py-5 text-sm text-gray-500">No admins for this branch</p>
                      ) : (
                        <>
                          <div className="grid grid-cols-12 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <div className="col-span-2">Name</div>
                            <div className="col-span-3">Email</div>
                            <div className="col-span-2">Username</div>
                            <div className="col-span-2">Phone</div>
                            <div className="col-span-3">Status</div>
                          </div>

                          {branch.admins.map((admin) => (
                            <div
                              key={admin.id}
                              className="grid grid-cols-12 items-center border-b border-gray-100 px-4 py-3 text-sm last:border-b-0"
                            >
                              <div className="col-span-2 font-medium text-gray-900">{admin.name || "-"}</div>
                              <div className="col-span-3 text-gray-700">{admin.email || "-"}</div>
                              <div className="col-span-2 text-gray-700">{admin.username || "-"}</div>
                              <div className="col-span-2 text-gray-700">{admin.phone || "-"}</div>
                              <div className="col-span-3">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                                    admin.status
                                  )}`}
                                >
                                  {formatStatusLabel(admin.status || "unknown")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </>
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
