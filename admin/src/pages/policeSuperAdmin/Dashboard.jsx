import { useAuth } from "../../context/AuthContext";

export default function PoliceSuperAdminDashboard() {
  const { user, tenantType } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Police Super Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage police departments, branches, and staff</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Organizations</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Branches</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Branch Admins</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Staff</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
          </div>
        </div>

        {user && (
          <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <p className="text-sm text-gray-600">
              Logged in as <strong>{user.email}</strong> ({tenantType || "police"})
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
