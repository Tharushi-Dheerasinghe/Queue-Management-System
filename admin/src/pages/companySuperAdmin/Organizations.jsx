import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getBranchesByTenant, getOrganizationsByTenant, getSystemLinks } from "../../services/tenantService";
import api from "../../services/api";

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

function OrganizationTable({ title, data, onAdd, addLabel, onEdit, onDelete, onViewDetails, onToggleStatus, onViewLinks }) {
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
              <th className="p-3 text-right">Actions</th>
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
                <td className="p-3 text-right space-x-2">
                  <button 
                    onClick={() => onToggleStatus(org.id, org.status)}
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      org.status === 'active' 
                        ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                        : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    {org.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => onViewLinks(org.id)}
                    className="text-xs font-semibold px-2 py-1 rounded text-blue-600 bg-blue-50 hover:bg-blue-100"
                  >
                    View Links
                  </button>
                  <button 
                    onClick={() => onToggleStatus(org.id, org.status)}
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      org.status === 'active' 
                        ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                        : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    {org.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => onDelete(org.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded bg-red-50 hover:bg-red-100"
                  >
                    Delete
                  </button>
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
  const [groupedOrganizations, setGroupedOrganizations] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedLinksData, setSelectedLinksData] = useState(null);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allOrgs, allBranches] = await Promise.all([
          getOrganizationsByTenant(""), 
          getBranchesByTenant(""),
        ]);

        const branchCountMap = {};
        allBranches.forEach((b) => {
          const key = String(b.organizationId);
          branchCountMap[key] = (branchCountMap[key] || 0) + 1;
        });

        const grouped = {};
        allOrgs.forEach(o => {
          const type = o.tenantType ? o.tenantType.toLowerCase() : "other";
          if (!grouped[type]) grouped[type] = [];
          grouped[type].push(normalizeOrganization(o, branchCountMap));
        });

        setGroupedOrganizations(grouped);
      } catch (err) {
        console.error("Failed to fetch organizations", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <button
          onClick={() => navigate("/company-super-admin/system-builder")}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow hover:bg-emerald-700 transition font-bold"
        >
          + Open System Builder
        </button>
      </div>

      {Object.keys(groupedOrganizations).length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border text-center text-slate-500">
          No organizations found. Use the System Builder to create one.
        </div>
      ) : (
        Object.entries(groupedOrganizations).map(([type, orgs]) => (
          <OrganizationTable
            key={type}
            title={`${type.charAt(0).toUpperCase() + type.slice(1)} Organizations`}
            data={orgs}
            addLabel={`+ Add ${type.charAt(0).toUpperCase() + type.slice(1)}`}
            onAdd={() => navigate("/company-super-admin/system-builder")}
            onEdit={(o) => console.log(o)}
            onDelete={async (id) => {
              if (window.confirm("WARNING: Are you sure you want to permanently delete this organization? This will hard-delete all associated branches, services, and tokens.")) {
                try {
                  await api.delete(`/organizations/${id}`);
                  setGroupedOrganizations(prev => ({
                    ...prev,
                    [type]: prev[type].filter(i => i.id !== id)
                  }));
                  alert("Organization deleted successfully.");
                } catch (err) {
                  alert(err?.response?.data?.message || "Failed to delete organization");
                }
              }
            }}
            onToggleStatus={async (id, currentStatus) => {
              const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
              if (window.confirm(`Are you sure you want to ${newStatus === 'inactive' ? 'deactivate' : 'activate'} this organization?`)) {
                try {
                  await api.patch(`/organizations/${id}`, { status: newStatus });
                  setGroupedOrganizations(prev => ({
                    ...prev,
                    [type]: prev[type].map(i => i.id === id ? { ...i, status: newStatus } : i)
                  }));
                } catch (err) {
                  alert(err?.response?.data?.message || `Failed to ${newStatus === 'inactive' ? 'deactivate' : 'activate'} organization`);
                }
              }
            }}
            onViewDetails={(o) => console.log(o)}
            onViewLinks={async (id) => {
              try {
                setLoadingLinks(true);
                setIsLinksModalOpen(true);
                const res = await getSystemLinks(id);
                if (res.success) {
                  setSelectedLinksData(res);
                } else {
                  alert("Failed to fetch links.");
                  setIsLinksModalOpen(false);
                }
              } catch (err) {
                alert(err?.response?.data?.message || "Failed to fetch links.");
                setIsLinksModalOpen(false);
              } finally {
                setLoadingLinks(false);
              }
            }}
          />
        ))
      )}

      {/* View Links Modal */}
      {isLinksModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => { setIsLinksModalOpen(false); setSelectedLinksData(null); }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              ✕
            </button>
            <div className="p-8">
              {loadingLinks ? (
                <div className="text-center text-slate-500 py-12">Loading system links...</div>
              ) : selectedLinksData ? (
                <div className="space-y-6 animate-in fade-in">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-800">System Links & Credentials</h2>
                    <p className="text-slate-500">Access URLs and credentials for {selectedLinksData.organizationName}.</p>
                  </div>
                  
                  {selectedLinksData.adminCredentials && (
                    <div className="p-6 border border-blue-200 bg-blue-50 rounded-2xl relative overflow-hidden mb-6">
                       <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                       <h3 className="font-bold text-blue-900 text-lg mb-2">Organization Admin Credentials</h3>
                       <p className="text-sm text-blue-700 mb-4">Use these to log into the main admin portal to manage all branches.</p>
                       <div className="mb-4">
                          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">🔗 Admin Portal URL</p>
                          <code className="block w-full bg-white border border-blue-200 p-2 rounded text-xs text-slate-800 break-all select-all">
                            http://localhost:5174/admin-login
                          </code>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Email</p>
                            <code className="block w-full bg-white border border-blue-200 p-2 rounded text-sm text-slate-800 select-all">{selectedLinksData.adminCredentials.email}</code>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Password</p>
                            <code className="block w-full bg-white border border-blue-200 p-2 rounded text-sm text-slate-800 select-all">{selectedLinksData.adminCredentials.password}</code>
                          </div>
                       </div>
                    </div>
                  )}
                  
                  <div className="space-y-6">
                    {selectedLinksData.results.map((res, i) => {
                      const actualTenantType = selectedLinksData.tenantType;
                      const tvLink = `http://localhost:5173/${actualTenantType}/display/${res.branch.id}`;
                      const kioskLink = `http://localhost:5174/staff-login`;
                      const iotWebhook = `http://localhost:5000/api/tokens/iot/complete-and-next`;
                      
                      return (
                        <div key={i} className="p-6 border border-emerald-200 bg-emerald-50 rounded-2xl relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                          <h3 className="font-bold text-emerald-900 text-lg mb-4">{res.branch.branchName}</h3>
                          
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">📺 TV Monitor URL</p>
                              <code className="block w-full bg-white border border-emerald-200 p-2 rounded text-xs text-slate-800 break-all select-all">
                                {tvLink}
                              </code>
                            </div>
                            
                            <div>
                              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">🖥️ Kiosk / Staff Dashboard</p>
                              <code className="block w-full bg-white border border-emerald-200 p-2 rounded text-xs text-slate-800 break-all select-all">
                                {kioskLink}
                              </code>
                              <p className="text-[10px] text-emerald-600 mt-1">Note: Staff must log in to the admin portal.</p>
                            </div>
      
                            <div>
                              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">🔌 ESP32 Button Webhooks (Per Unit)</p>
                              {res.services && res.services.map((svc, sIdx) => (
                                <div key={svc.id || sIdx} className="mb-3 pl-3 border-l-2 border-emerald-300">
                                  <p className="text-xs font-bold text-slate-700">{svc.serviceName} Unit</p>
                                  <code className="block w-full bg-white border border-emerald-200 p-2 mt-1 rounded text-xs text-slate-800 break-all select-all">
                                    POST {iotWebhook}
                                  </code>
                                  <p className="text-[10px] text-emerald-600 mt-1">Payload: {`{"counterId": "${svc.counterId || 'unknown'}"}`}</p>
                                </div>
                              ))}
                            </div>
      
                            {res.staffCredentials && (
                              <div className="mt-4 pt-4 border-t border-emerald-200 grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Staff Email</p>
                                  <code className="block w-full bg-white border border-emerald-200 p-2 rounded text-sm text-slate-800 select-all">{res.staffCredentials.email}</code>
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Staff Password</p>
                                  <code className="block w-full bg-white border border-emerald-200 p-2 rounded text-sm text-slate-800 select-all">{res.staffCredentials.password}</code>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center text-red-500 py-12">No data available.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}