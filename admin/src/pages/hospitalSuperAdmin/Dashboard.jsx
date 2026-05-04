import { useAuth } from "../../context/AuthContext";

const organizations = [
  { id: "org_hospital_001", name: "City General Hospital", type: "General", branches: 3 },
  { id: "org_hospital_002", name: "Metro Care Hospital", type: "Specialty", branches: 2 },
  { id: "org_hospital_003", name: "Lakeside Medical Center", type: "Teaching", branches: 1 },
];

const services = [
  { id: "svc_001", name: "OPD", category: "Clinical", status: "active" },
  { id: "svc_002", name: "Laboratory", category: "Diagnostics", status: "active" },
  { id: "svc_003", name: "Pharmacy", category: "Support", status: "active" },
  { id: "svc_004", name: "MRI Scan", category: "Diagnostics", status: "inactive" },
];

const branches = [
  { id: "branch_hospital_001", name: "City General - Main", city: "Colombo", status: "active" },
  { id: "branch_hospital_002", name: "City General - North", city: "Kandy", status: "active" },
  { id: "branch_hospital_003", name: "Metro Care - Central", city: "Galle", status: "active" },
  { id: "branch_hospital_004", name: "Lakeside - East", city: "Kurunegala", status: "inactive" },
];

const branchAdmins = [
  { id: "ba_001", name: "Nimal Perera", email: "hospitalbranch@gmail.com", branchId: "branch_hospital_001" },
  { id: "ba_002", name: "Kasuni Silva", email: "kasuni.branch@demo.com", branchId: "branch_hospital_002" },
];

const formatStatusLabel = (status) => status.charAt(0).toUpperCase() + status.slice(1);

export default function HospitalSuperAdminDashboard() {
  const { user, tenantType } = useAuth();

  const activeBranches = branches.filter((branch) => branch.status === "active").length;
  const activeServices = services.filter((service) => service.status === "active").length;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Hospital Super Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage hospitals, branches, and healthcare services</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Main Hospitals Types</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{organizations.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Registered Hospitals</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{activeBranches}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Active Admins</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{branchAdmins.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Active Services</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{activeServices}</p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Recent Branch Activity (Dummy)</h2>
          <div className="mt-4 space-y-3">
            {branches.slice(0, 3).map((branch) => (
              <div key={branch.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{branch.name}</p>
                  <p className="text-xs text-gray-500">{branch.city}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    branch.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {formatStatusLabel(branch.status)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {user && (
          <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-6">
            <p className="text-sm text-gray-600">
              Logged in as <strong>{user.email}</strong> ({tenantType || "hospital"})
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
