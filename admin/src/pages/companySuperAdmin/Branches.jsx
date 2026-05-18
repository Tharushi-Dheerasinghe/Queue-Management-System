import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const formatStatusLabel = (status) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const normalizeBranch = (branch) => ({
  id: branch?._id || branch?.id,
  branchName: branch?.branchName || "-",
  organizationName:
    branch?.organizationName ||
    branch?.organization?.organizationName ||
    branch?.organization?.name ||
    "-",
  location: branch?.city || branch?.address || "-",
  branchCode: branch?.branchCode || "-",
  status: String(branch?.status || "inactive").toLowerCase(),
  tenantType: String(branch?.tenantType || "").toLowerCase(),
});

const ITEMS_PER_PAGE = 5;

function BranchTable({ title, addLabel, onAdd, data }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filteredData = useMemo(() => {
    return data.filter((branch) => {
      const matchSearch =
        branch.branchName.toLowerCase().includes(search.toLowerCase()) ||
        branch.organizationName.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "all" || branch.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const paginatedData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onAdd}
            className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-sky-700"
          >
            {addLabel}
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded-lg w-full"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border px-3 py-2 rounded-lg"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-t">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3">Branch Name</th>
              <th className="p-3">Organization</th>
              <th className="p-3">Location</th>
              <th className="p-3">Branch Code</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((branch) => (
              <tr key={branch.id} className="border-b">
                <td className="p-3 font-medium">{branch.branchName}</td>
                <td className="p-3">{branch.organizationName}</td>
                <td className="p-3">{branch.location}</td>
                <td className="p-3">{branch.branchCode}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      branch.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {formatStatusLabel(branch.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1 border rounded"
        >
          Prev
        </button>

        <span>
          Page {page} of {totalPages || 1}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 border rounded"
        >
          Next
        </button>
      </div>
    </section>
  );
}

export default function CompanySuperAdminBranches() {
  const navigate = useNavigate();
  const [groupedBranches, setGroupedBranches] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchBranches = async () => {
      try {
        const response = await api.get("/branches");

        const rawBranches = Array.isArray(response?.data?.branches)
          ? response.data.branches
          : [];

        const normalized = rawBranches.map(normalizeBranch);

        if (!isMounted) return;

        const grouped = normalized.reduce((acc, branch) => {
          const type = branch.tenantType || "other";
          if (!acc[type]) acc[type] = [];
          acc[type].push(branch);
          return acc;
        }, {});

        setGroupedBranches(grouped);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch branches"
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBranches();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Branch Management</h1>
        <button
          onClick={() => navigate("/company-super-admin/system-builder")}
          className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-sky-700 shadow-sm"
        >
          + Open System Builder
        </button>
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {Object.keys(groupedBranches).length === 0 && !error ? (
        <div className="bg-white p-8 rounded-2xl border text-center text-slate-500 shadow-sm">
          No branches found. Use the System Builder to create branches for your organizations.
        </div>
      ) : (
        Object.entries(groupedBranches).map(([type, branches]) => (
          <BranchTable
            key={type}
            title={`${type.charAt(0).toUpperCase() + type.slice(1)} Branches`}
            data={branches}
            addLabel={`Open System Builder`}
            onAdd={() => navigate("/company-super-admin/system-builder")}
          />
        ))
      )}
    </div>
  );
}