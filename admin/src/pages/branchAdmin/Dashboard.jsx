import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getBranchAdminCounts } from "../../services/branchAdminService";

export default function BranchAdminDashboard() {
  const { user, tenantType, organizationId, divisionId, branchId } = useAuth();
  const [counts, setCounts] = useState({
    staff: 0,
    operations: 0,
    tokens: 0,
    tasks: 0,
  });

  useEffect(() => {
    const loadCounts = async () => {
      const nextCounts = await getBranchAdminCounts({
        tenantType,
        organizationId,
        divisionId,
        branchId,
      });
      setCounts(nextCounts);
    };

    loadCounts();
  }, [tenantType, organizationId, divisionId, branchId]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Branch Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your branch operations</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Staff</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{counts.staff}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Operations</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{counts.operations}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Tokens</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{counts.tokens}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Tasks</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{counts.tasks}</p>
          </div>
        </div>

        {user && (
          <div className="mt-8 rounded-lg border border-orange-200 bg-orange-50 p-6">
            <p className="text-sm text-gray-600">
              Logged in as <strong>{user.email}</strong> ({tenantType || "branch"})
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
