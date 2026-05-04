import { useCallback, useEffect, useState } from "react";
import {
  approveBranchRequest,
  getPendingBranchRequests,
  rejectBranchRequest,
} from "../../services/branchRequestService";

const normalizeTenantType = (request) =>
  String(request?.tenantType || request?.tenant || "")
    .trim()
    .toLowerCase();

const getRequestedByLabel = (requestedBy) => {
  if (!requestedBy) return "-";
  if (typeof requestedBy === "string") return requestedBy;

  return (
    requestedBy?.name ||
    requestedBy?.username ||
    requestedBy?.email ||
    requestedBy?.fullName ||
    "-"
  );
};

const getOrganizationName = (request) =>
  request?.organizationName ||
  request?.organization?.organizationName ||
  request?.organization?.name ||
  request?.organizationId?.organizationName ||
  request?.organizationId?.name ||
  "-";

const getBranchName = (request) =>
  request?.branchName || request?.branch?.branchName || request?.name || "-";

const getCity = (request) => request?.city || request?.branch?.city || "-";

export default function HospitalSuperAdminBranchRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getPendingBranchRequests();
      const rawRequests = Array.isArray(response?.branchRequests) ? response.branchRequests : [];

      const filteredRequests = rawRequests.filter(
        (request) => normalizeTenantType(request) === "hospital"
      );

      setRequests(filteredRequests);
    } catch (err) {
      setError(err?.message || "Failed to fetch pending branch requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (requestId) => {
    setActionLoadingId(requestId);
    setError("");

    try {
      await approveBranchRequest(requestId);
      await fetchRequests();
    } catch (err) {
      setError(err?.message || "Failed to approve branch request.");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleReject = async (requestId) => {
    setActionLoadingId(requestId);
    setError("");

    try {
      await rejectBranchRequest(requestId);
      await fetchRequests();
    } catch (err) {
      setError(err?.message || "Failed to reject branch request.");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Branch Requests</h1>
        <p className="mt-2 text-sm text-slate-500">
          Review and process pending hospital branch requests.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading pending branch requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No pending hospital branch requests found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Branch Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Organization Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">City</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Requested By</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {requests.map((request) => {
                  const requestId = request?._id || request?.id;
                  const actionBusy = actionLoadingId === requestId;
                  const status = String(request?.status || "pending").trim().toLowerCase();

                  return (
                    <tr key={requestId}>
                      <td className="px-4 py-3 text-slate-900">{getBranchName(request)}</td>
                      <td className="px-4 py-3 text-slate-700">{getOrganizationName(request)}</td>
                      <td className="px-4 py-3 text-slate-700">{getCity(request)}</td>
                      <td className="px-4 py-3 text-slate-700">{getRequestedByLabel(request?.requestedBy)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(requestId)}
                            disabled={actionBusy}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {actionBusy ? "Processing..." : "Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(requestId)}
                            disabled={actionBusy}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {actionBusy ? "Processing..." : "Reject"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}