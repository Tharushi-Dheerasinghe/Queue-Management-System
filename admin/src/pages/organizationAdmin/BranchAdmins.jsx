import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getBranches } from "../../services/branchService";
import {
  createOrganizationBranchAdmin,
  getOrganizationBranchAdmins,
} from "../../services/organizationAdminService";

const formatStatusLabel = (status = "") => {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) return "Unknown";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getStatusBadgeClass = (status = "") => {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized === "active") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (normalized === "inactive") {
    return "bg-slate-200 text-slate-700";
  }

  if (normalized === "pending") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-blue-100 text-blue-700";
};

// Shared organization-admin page for tenant-scoped branch admin management.
export default function SharedOrganizationAdminBranchAdmins() {
  const { tenantType } = useAuth();
  const normalizedTenantType = String(tenantType || "").trim().toLowerCase();
  const isCompanyTenant = ["bank", "supermarket"].includes(normalizedTenantType);

  const [branches, setBranches] = useState([]);
  const [branchAdmins, setBranchAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    branchId: "",
    name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
  });

  const loadBranches = async () => {
    const response = await getBranches();
    return Array.isArray(response?.branches) ? response.branches : [];
  };

  const loadBranchAdmins = async () => {
    const data = await getOrganizationBranchAdmins();
    return Array.isArray(data) ? data : [];
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccessMessage("");

        const [branchesResult, branchAdminsResult] = await Promise.allSettled([
          loadBranches(),
          loadBranchAdmins(),
        ]);

        if (!isMounted) {
          return;
        }

        if (branchesResult.status === "fulfilled") {
          const fetchedBranches = branchesResult.value;
          setBranches(fetchedBranches);
          setFormData((prev) => ({
            ...prev,
            branchId: prev.branchId || fetchedBranches[0]?.id || "",
          }));
        } else {
          setBranches([]);
          setError(branchesResult.reason?.message || "Failed to load branches");
        }

        if (branchAdminsResult.status === "fulfilled") {
          setBranchAdmins(branchAdminsResult.value);
        } else {
          setBranchAdmins([]);
          setError(branchAdminsResult.reason?.message || "Failed to load branch admins");
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setError(err?.message || "Failed to load branch admins");
        setBranches([]);
        setBranchAdmins([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isCompanyTenant) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const selectedBranch = branches.find((branch) => String(branch.id) === String(formData.branchId));

      if (!selectedBranch) {
        setError("Please select a branch");
        return;
      }

      const response = await createOrganizationBranchAdmin({
        branchId: formData.branchId,
        branchName: selectedBranch.branchName,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        username: formData.username,
        password: formData.password,
      });

      if (response?.success) {
        setSuccessMessage(response?.message || "Branch admin created successfully");
        setFormData((prev) => ({
          ...prev,
          name: "",
          email: "",
          phone: "",
          username: "",
          password: "",
        }));

        const refreshedAdmins = await loadBranchAdmins();
        setBranchAdmins(refreshedAdmins);
      } else {
        setError(response?.message || "Failed to create branch admin");
      }
    } catch (err) {
      setError(err?.message || "Error creating branch admin");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Branch Admins</h1>
        <p className="mt-2 text-sm text-slate-500">View and manage branch administrators grouped by branch</p>
      </div>

      {isCompanyTenant && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Add Branch Admin</h2>
          <p className="mt-2 text-sm text-slate-500">Create a branch administrator for one of your branches</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {successMessage && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm text-emerald-700">{successMessage}</p>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="branchId" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Branch <span className="text-red-600">*</span>
                </label>
                <select
                  id="branchId"
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                  required
                  disabled={loading || branches.length === 0 || submitting}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100 disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {branches.length === 0 ? (
                    <option value="">No branches available</option>
                  ) : (
                    branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branchName}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Admin Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
                  placeholder="e.g., John Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Admin Email <span className="text-red-600">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Admin Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
                  placeholder="+94 71 234 5678"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Admin Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
                  placeholder="e.g., johndoe"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Admin Password <span className="text-red-600">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
                  placeholder="Enter a secure password"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || loading || branches.length === 0}
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Branch Admin"}
              </button>
            </div>
          </form>
        </section>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">Loading branch admins...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && branchAdmins.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">No branch admins yet</p>
        </div>
      )}

      {!loading &&
        !error &&
        branchAdmins.map((branch) => (
          <section key={branch.branchId} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">{branch.branchName || "Unnamed Branch"}</h2>

            {!Array.isArray(branch.admins) || branch.admins.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No branch admins for this branch</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Username</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Phone</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branch.admins.map((admin) => (
                      <tr key={admin.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{admin.name || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{admin.email || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{admin.username || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{admin.phone || "-"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(
                              admin.status
                            )}`}
                          >
                            {formatStatusLabel(admin.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
    </div>
  );
}
