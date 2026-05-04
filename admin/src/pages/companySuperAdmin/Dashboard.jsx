import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getOrganizationsByTenant,
  getBranchesByTenant,
  getAllOrganizationAdmins,
  getUsersByTenant,
} from "../../services/tenantService";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const TENANTS = ["bank", "supermarket"];

export default function CompanySuperAdminDashboard() {
  const { user, tenantType } = useAuth();

  const [stats, setStats] = useState({
    companies: 0,
    orgAdmins: 0,
    branches: 0,
    staff: 0,
  });

  const [branchChartData, setBranchChartData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [
          orgResults,
          branchResults,
          orgAdmins,
          userResults,
        ] = await Promise.all([
          Promise.all(TENANTS.map((t) => getOrganizationsByTenant(t))),
          Promise.all(TENANTS.map((t) => getBranchesByTenant(t))),
          getAllOrganizationAdmins(),
          Promise.all(TENANTS.map((t) => getUsersByTenant(t))),
        ]);

        const organizations = orgResults.flat();
        const branches = branchResults.flat();
        const users = userResults.flat();

        const staff = users.filter((u) => u.role !== "organization_admin");

        setStats({
          companies: organizations.length,
          orgAdmins: orgAdmins.length,
          branches: branches.length,
          staff: staff.length,
        });

        // 📊 Chart: branches per organization
        const branchMap = {};

        branches.forEach((b) => {
          const orgName =
            b.organizationName ||
            b.organization?.organizationName ||
            b.organization?.name ||
            "Unknown";

          branchMap[orgName] = (branchMap[orgName] || 0) + 1;
        });

        const chartData = Object.keys(branchMap).map((key) => ({
          name: key,
          branches: branchMap[key],
        }));

        setBranchChartData(chartData);

        // 🕒 Recent activities (mock from branches)
        const activities = branches.slice(0, 5).map((b) => ({
          text: `Branch ${b.branchName} added`,
        }));

        setRecentActivities(activities);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Companies" value={stats.companies} />
        <StatCard title="Org Admins" value={stats.orgAdmins} />
        <StatCard title="Branches" value={stats.branches} />
        <StatCard title="Staff" value={stats.staff} />
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">Branches per Organization</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={branchChartData} barCategoryGap="20%">
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="branches" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activities */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
        <ul className="space-y-2">
          {recentActivities.map((a, i) => (
            <li key={i} className="text-sm text-gray-600">{a.text}</li>
          ))}
        </ul>
      </div>

      {/* User Info */}
      {user && (
        <div className="bg-purple-50 p-4 rounded">
          Logged in as {user.email} ({tenantType})
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
