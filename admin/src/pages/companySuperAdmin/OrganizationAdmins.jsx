import { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/api";

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

const ITEMS_PER_PAGE = 5;

function AdminTable({ title, data }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filteredData = useMemo(() => {
    return data.filter((admin) => {
      const matchSearch =
        (admin.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (admin.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (admin.organizationName || "").toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "all" || String(admin.status || "").toLowerCase() === statusFilter;

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
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search admin name, email or organization..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border border-slate-200 px-3 py-2 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-slate-200 px-3 py-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-t border-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-900">Name</th>
              <th className="px-4 py-3 font-semibold text-slate-900">Email</th>
              <th className="px-4 py-3 font-semibold text-slate-900">Organization</th>
              <th className="px-4 py-3 font-semibold text-slate-900">Status</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No admins found matching criteria
                </td>
              </tr>
            ) : (
              paginatedData.map((admin) => (
                <tr key={admin._id || admin.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">{admin.name || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{admin.email || "-"}</td>
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-sm text-slate-600">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
          >
            Prev
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}

export default function CompanySuperAdminOrganizationAdmins() {
  const location = useLocation();
  const [groupedAdmins, setGroupedAdmins] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage] = useState(location.state?.successMessage || "");

  useEffect(() => {
    let isMounted = true;

    const loadAdmins = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/users");
        const allUsers = res.data.users || [];
        const orgAdmins = allUsers.filter((u) => u.role === "organization_admin");

        if (!isMounted) {
          return;
        }

        const grouped = orgAdmins.reduce((acc, admin) => {
          const type = admin.tenantType || "other";
          if (!acc[type]) acc[type] = [];
          acc[type].push(admin);
          return acc;
        }, {});

        setGroupedAdmins(grouped);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setGroupedAdmins({});
        setError(loadError?.response?.data?.message || loadError?.message || "Failed to load organization admins");
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
          Manage organization administrators grouped by tenant type.
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

      {!loading && !error && Object.keys(groupedAdmins).length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">No organization admins yet</p>
        </div>
      )}

      {!loading && !error && Object.keys(groupedAdmins).length > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedAdmins).map(([type, admins]) => (
            <AdminTable
              key={type}
              title={`${type.charAt(0).toUpperCase() + type.slice(1)} Admins`}
              data={admins}
            />
          ))}
        </div>
      )}
    </div>
  );
}
