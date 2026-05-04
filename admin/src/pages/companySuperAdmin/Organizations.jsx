import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getBranchesByTenant, getOrganizationsByTenant } from "../../services/tenantService";

const formatStatusLabel = (status) => status.charAt(0).toUpperCase() + status.slice(1);

const normalizeOrganization = (organization = {}, branchCountMap = {}) => {
  const id = organization?._id || organization?.id || null;

  return {
    id,
    name: organization?.organizationName || "Unnamed Organization",
    address: organization?.address || "N/A",
    branches: branchCountMap[String(id || "")] || 0,
    status: organization?.status || "inactive",
  };
};

const ITEMS_PER_PAGE = 5;

function OrganizationTable({ title, data, onAdd, addLabel, onEdit, onDelete, onViewDetails }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filteredData = useMemo(() => {
    return data.filter((org) => {
      const matchesSearch = org.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || org.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const paginatedData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onAdd}
            className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm"
          >
            {addLabel}
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search organization..."
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
              <th className="p-3">Name</th>
              <th className="p-3">Location</th>
              <th className="p-3">Branches</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((org) => (
              <tr key={org.id} className="border-b">
                <td className="p-3 font-medium">{org.name}</td>
                <td className="p-3">{org.address}</td>
                <td className="p-3">{org.branches}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      org.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {formatStatusLabel(org.status)}
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

        <span>Page {page} of {totalPages || 1}</span>

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

export default function Organizations() {
  const navigate = useNavigate();
  const [bankOrganizations, setBankOrganizations] = useState([]);
  const [supermarketOrganizations, setSupermarketOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [bankOrgs, supermarketOrgs, bankBranches, supermarketBranches] = await Promise.all([
        getOrganizationsByTenant("bank"),
        getOrganizationsByTenant("supermarket"),
        getBranchesByTenant("bank"),
        getBranchesByTenant("supermarket"),
      ]);

      const branchCountMap = {};
      [...bankBranches, ...supermarketBranches].forEach((b) => {
        const key = String(b.organizationId);
        branchCountMap[key] = (branchCountMap[key] || 0) + 1;
      });

      setBankOrganizations(bankOrgs.map((o) => normalizeOrganization(o, branchCountMap)));
      setSupermarketOrganizations(supermarketOrgs.map((o) => normalizeOrganization(o, branchCountMap)));
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Organizations</h1>

      <OrganizationTable
        title="Bank Organizations"
        data={bankOrganizations}
        addLabel="Add Bank"
        onAdd={() => navigate("/company-super-admin/add-bank")}
        onEdit={(o) => console.log(o)}
        onDelete={(id) => setBankOrganizations((prev) => prev.filter((i) => i.id !== id))}
        onViewDetails={(o) => console.log(o)}
      />

      <OrganizationTable
        title="Supermarket Organizations"
        data={supermarketOrganizations}
        addLabel="Add Supermarket"
        onAdd={() => navigate("/company-super-admin/add-supermarket")}
        onEdit={(o) => console.log(o)}
        onDelete={(id) => setSupermarketOrganizations((prev) => prev.filter((i) => i.id !== id))}
        onViewDetails={(o) => console.log(o)}
      />
    </div>
  );
}