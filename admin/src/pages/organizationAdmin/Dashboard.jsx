import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
// භාවිතයට නොගන්නා getOrganizationAdminCounts ඉවත් කළා
import { getBranchesByTenant, getServicesByTenant, getUsersByTenant } from "../../services/tenantService";

export default function SharedOrganizationAdminDashboard() {
  const { user, tenantType, organizationId, divisionId } = useAuth();

  const [counts, setCounts] = useState({
    branches: 0,
    services: 0,
    branchAdmins: 0,
    staff: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [branches, services, users] = await Promise.all([
          getBranchesByTenant(tenantType),
          getServicesByTenant(tenantType),
          getUsersByTenant(tenantType),
        ]);

        const isPolice = tenantType === "police";
        
        const filteredBranches = branches.filter((b) =>
          isPolice ? b.divisionId === divisionId : b.organizationId === organizationId
        );

        const filteredServices = services.filter((s) =>
          isPolice ? s.divisionId === divisionId : s.organizationId === organizationId
        );

        const filteredUsers = users.filter((u) =>
          isPolice ? u.divisionId === divisionId : u.organizationId === organizationId
        );

        const uniqueServiceNames = new Set(
          filteredServices.map((s) => s.serviceName?.trim().toLowerCase())
        );

        setCounts({
          branches: filteredBranches.length,
          services: uniqueServiceNames.size,
          branchAdmins: filteredUsers.filter(u => u.role === "branch_admin").length,
          staff: filteredUsers.filter(u => u.role === "staff").length,
        });

        const activities = [
          ...filteredBranches.slice(0, 2).map((b) => ({ text: `Branch "${b.branchName}" created` })),
          ...filteredServices.slice(0, 2).map((s) => ({ text: `Service "${s.serviceName}" added` })),
          ...filteredUsers.slice(0, 2).map((u) => ({ text: `User "${u.name || u.email}" added` })),
        ];

        setRecentActivities(activities);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tenantType, organizationId, divisionId]);

  // JSX අඩංගු function එක component එක ඇතුළතම පවතිනවා
  const countItem = (label, value) => (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">
        {loading ? "..." : value}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Organization Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your organization's branches and services</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {countItem("Branches", counts.branches)}
          {countItem("Branch Admins", counts.branchAdmins)}
          {countItem("Services (Unique)", counts.services)}
          {countItem("Staff", counts.staff)}
        </div>

        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : recentActivities.length === 0 ? (
            <p className="text-sm text-gray-500">No recent activities</p>
          ) : (
            <ul className="space-y-2">
              {recentActivities.map((a, i) => (
                <li key={i} className="text-sm text-gray-600">• {a.text}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}