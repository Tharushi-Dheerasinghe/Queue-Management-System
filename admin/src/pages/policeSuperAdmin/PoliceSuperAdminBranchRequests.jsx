import { useEffect, useMemo, useState } from "react";
import {
  approveBranchRequest,
  getPendingPoliceBranchRequests,
  rejectBranchRequest,
} from "../../services/branchRequestService";

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
};

export default function PoliceSuperAdminBranchRequests() {
  const [branchRequests, setBranchRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toast, setToast] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!toast.message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToast({ type: "", message: "" });
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    let isMounted = true;

    const fetchPendingBranchRequests = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getPendingPoliceBranchRequests();
        if (!isMounted) {
          return;
        }

        setBranchRequests(Array.isArray(data?.branchRequests) ? data.branchRequests : []);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setErrorMessage(error?.message || "Failed to load branch requests");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPendingBranchRequests();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedRequests = useMemo(
    () => [...branchRequests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [branchRequests]
  );

  const handleAccept = async (requestId) => {
    try {
      setActionLoadingId(requestId);
      const response = await approveBranchRequest(requestId);

      setBranchRequests((current) => current.filter((request) => request.id !== requestId));
      setToast({
        type: "success",
        message: response?.message || "Branch request approved successfully",
      });
    } catch (error) {
      setToast({
        type: "error",
        message: error?.message || "Failed to approve branch request",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setActionLoadingId(requestId);
      const response = await rejectBranchRequest(requestId);

      setBranchRequests((current) => current.filter((request) => request.id !== requestId));
      setToast({
        type: "success",
        message: response?.message || "Branch request rejected successfully",
      });
    } catch (error) {
      setToast({
        type: "error",
        message: error?.message || "Failed to reject branch request",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Police Branch Requests</h1>
          <p className="mt-2 text-gray-600">Review pending police branch creation requests</p>
        </div>

        {toast.message && (
          <div
            className={`mb-4 rounded-md px-4 py-3 text-sm font-medium ${
              toast.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {toast.message}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Branch Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Division Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">City</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Branch Code</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Requested By</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Created At</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Loading pending branch requests...
                  </td>
                </tr>
              )}

              {!loading && errorMessage && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-red-600">
                    {errorMessage}
                  </td>
                </tr>
              )}

              {!loading && !errorMessage && sortedRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No pending police branch requests found.
                  </td>
                </tr>
              )}

              {!loading &&
                !errorMessage &&
                sortedRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3 text-gray-900">{request.branchName || "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{request.divisionName || "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{request.city || "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{request.branchCode || "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{request.requestedBy || "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDateTime(request.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAccept(request.id)}
                          disabled={actionLoadingId === request.id}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoadingId === request.id ? "Processing..." : "Accept"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(request.id)}
                          disabled={actionLoadingId === request.id}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoadingId === request.id ? "Processing..." : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
