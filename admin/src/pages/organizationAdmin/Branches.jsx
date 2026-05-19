import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getBranches } from "../../services/branchService";
import { getMyBranchRequests } from "../../services/branchRequestService";
import api from "../../services/api";

// Shared organization-admin page for tenant-scoped branch management.
export default function SharedOrganizationAdminBranches() {
  const navigate = useNavigate();
  const { tenantType, organizationId, divisionId } = useAuth();
  const [branches, setBranches] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        setLoading(true);
        setError(null);
        const [branchesResponse, pendingResponse] = await Promise.all([
          getBranches(),
          getMyBranchRequests(),
        ]);

        if (branchesResponse.success) {
          setBranches(branchesResponse.branches || []);
        } else {
          setError(branchesResponse.message || "Failed to load branches");
        }

        if (pendingResponse.success) {
          setPendingRequests(pendingResponse.branchRequests || []);
        } else {
          setError(
            pendingResponse.message ||
              branchesResponse.message ||
              "Failed to load pending branch requests"
          );
        }
      } catch (err) {
        setError(err?.message || "Error loading branches and pending requests");
        setBranches([]);
        setPendingRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadBranches();
  }, []);

  const handleAddBranch = () => {
    navigate("/organization-admin/add-branch");
  };

  const handleDeleteBranch = async (id) => {
    if (window.confirm("WARNING: Are you sure you want to delete this branch? Pending tokens will be cancelled and notified via SMS.")) {
      try {
        await api.delete(`/branches/${id}`);
        setBranches((prev) => prev.filter((b) => b.id !== id));
        alert("Branch deleted successfully.");
      } catch (err) {
        alert(err?.response?.data?.message || "Failed to delete branch");
      }
    }
  };

  const formatStatusLabel = (status) => status?.charAt(0).toUpperCase() + status?.slice(1);
  const formatCreatedAt = (dateValue) => {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Branches</h1>
          <p className="mt-2 text-sm text-slate-500">Manage branches in your organization</p>
        </div>
        <button
          onClick={handleAddBranch}
          className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          + Add Branch
        </button>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">Loading branches...</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!loading && branches.length === 0 && !error && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">No branches yet. Create one to get started.</p>
        </div>
      )}

      {!loading && branches.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Active Branches</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Branch Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Code</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">City</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Contact</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{branch.branchName}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <code className="rounded bg-slate-100 px-2 py-1 text-xs">{branch.branchCode || "—"}</code>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{branch.city || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          branch.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {formatStatusLabel(branch.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{branch.contactNumber || "—"}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <a
                        href={`${import.meta.env.VITE_CUSTOMER_URL || "https://queue-management-system-teal.vercel.app"}/${tenantType}/display/${branch.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-lg bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                      >
                        📺 TV
                      </a>
                      <a
                        href="/staff/dashboard"
                        className="inline-flex items-center rounded-lg bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                      >
                        🖥️ Kiosk
                      </a>
                      <button
                        onClick={() => handleDeleteBranch(branch.id)}
                        className="inline-flex items-center rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!loading && !error && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Pending Branch Requests</h2>
          </div>

          {pendingRequests.length === 0 ? (
            <p className="text-slate-500">No pending requests</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Branch Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Code</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">City</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((request) => (
                    <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{request.branchName || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <code className="rounded bg-slate-100 px-2 py-1 text-xs">{request.branchCode || "-"}</code>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{request.city || "-"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                          {formatStatusLabel(request.status || "pending")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatCreatedAt(request.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
