import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createBranchRequest } from "../../services/branchService";

const normalizeBranchCodeSource = (value = "") =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

const generateBranchCode = ({ shortName = "", branchName = "" } = {}) => {
  const primarySource = normalizeBranchCodeSource(shortName);
  const fallbackSource = normalizeBranchCodeSource(branchName);
  const prefix = (primarySource || fallbackSource || "BRN").slice(0, 4);
  const randomDigits = String(Math.floor(1000 + Math.random() * 9000));

  return `${prefix}-${randomDigits}`;
};

export default function AddBranch() {
  const navigate = useNavigate();
  const { tenantType } = useAuth();
  const normalizedTenantType = String(tenantType || "").trim().toLowerCase();
  const isCompanyTenant = ["bank", "supermarket"].includes(normalizedTenantType);
  const isHospitalTenant = normalizedTenantType === "hospital";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    branchName: "",
    shortName: "",
    branchCode: "",
    city: "",
    address: "",
    contactNumber: "",
    email: "",
    status: "active",
    branchAdminAccess: false,
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    adminUsername: "",
    adminPassword: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!normalizedTenantType) {
        setError("Tenant type is missing. Please sign in again.");
        return;
      }

      const branchName = String(formData.branchName || "").trim();
      const shortName = String(formData.shortName || "").trim();
      const branchCode = String(formData.branchCode || "").trim() || generateBranchCode({
        shortName,
        branchName,
      });

      if (formData.branchAdminAccess) {
        const missingAdminFields = [];

        if (!String(formData.adminName || "").trim()) missingAdminFields.push("adminName");
        if (!String(formData.adminEmail || "").trim()) missingAdminFields.push("adminEmail");
        if (!String(formData.adminUsername || "").trim()) missingAdminFields.push("adminUsername");
        if (!String(formData.adminPassword || "").trim()) missingAdminFields.push("adminPassword");

        if (missingAdminFields.length > 0) {
          setError(`Please fill all required admin fields: ${missingAdminFields.join(", ")}`);
          return;
        }
      }

      const payload = {
        tenantType: normalizedTenantType,
        branchName,
        shortName,
        branchCode,
        city: String(formData.city || "").trim(),
        address: String(formData.address || "").trim(),
        contactNumber: String(formData.contactNumber || "").trim(),
        email: String(formData.email || "").trim().toLowerCase(),
        status: String(formData.status || "active").trim().toLowerCase(),
        branchAdminAccess: Boolean(formData.branchAdminAccess),
        adminName: String(formData.adminName || "").trim(),
        adminEmail: String(formData.adminEmail || "").trim().toLowerCase(),
        adminPhone: String(formData.adminPhone || "").trim(),
        adminUsername: String(formData.adminUsername || "").trim(),
        adminPassword: String(formData.adminPassword || "").trim(),
      };

      const response = await createBranchRequest(payload);

      if (response.success) {
        navigate("/organization-admin/branches");
      } else {
        setError(response.message || "Failed to create branch request");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error creating branch request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Add Branch</h1>
        <p className="mt-2 text-sm text-slate-500">Create a new branch in your organization</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Branch Name & Short Name */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="branchName" className="mb-1.5 block text-sm font-medium text-slate-700">
                Branch Name <span className="text-red-600">*</span>
              </label>
              <input
                id="branchName"
                name="branchName"
                type="text"
                value={formData.branchName}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="e.g., Main Branch"
              />
            </div>

            <div>
              <label htmlFor="shortName" className="mb-1.5 block text-sm font-medium text-slate-700">
                Short Name
              </label>
              <input
                id="shortName"
                name="shortName"
                type="text"
                value={formData.shortName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="e.g., MB"
              />
            </div>
          </div>

          {/* Branch Code & City */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="branchCode" className="mb-1.5 block text-sm font-medium text-slate-700">
                Branch Code
              </label>
              <input
                id="branchCode"
                name="branchCode"
                type="text"
                value={formData.branchCode}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="e.g., BR-001"
              />
            </div>

            <div>
              <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-slate-700">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="e.g., Colombo"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-slate-700">
              Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
              placeholder="Street address"
            />
          </div>

          {/* Contact Number & Email */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="contactNumber" className="mb-1.5 block text-sm font-medium text-slate-700">
                Contact Number
              </label>
              <input
                id="contactNumber"
                name="contactNumber"
                type="tel"
                value={formData.contactNumber}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="+94 71 234 5678"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="branch@example.com"
              />
            </div>
          </div>

          {/* Status & Admin Access */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="branchAdminAccess"
                  checked={formData.branchAdminAccess}
                  onChange={handleChange}
                  className="rounded border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">Enable Branch Admin Access</span>
              </label>
            </div>
          </div>
        </div>

        {/* Branch Admin Details */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Branch Admin Details (Optional)</h3>
        
          {/* Admin Name & Email */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="adminName" className="mb-1.5 block text-sm font-medium text-slate-700">
                Admin Name
              </label>
              <input
                id="adminName"
                name="adminName"
                type="text"
                value={formData.adminName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="e.g., John Doe"
              />
            </div>

            <div>
              <label htmlFor="adminEmail" className="mb-1.5 block text-sm font-medium text-slate-700">
                Admin Email
              </label>
              <input
                id="adminEmail"
                name="adminEmail"
                type="email"
                value={formData.adminEmail}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          {/* Admin Phone & Username */}
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="adminPhone" className="mb-1.5 block text-sm font-medium text-slate-700">
                Admin Phone
              </label>
              <input
                id="adminPhone"
                name="adminPhone"
                type="tel"
                value={formData.adminPhone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="+94 71 234 5678"
              />
            </div>

            <div>
              <label htmlFor="adminUsername" className="mb-1.5 block text-sm font-medium text-slate-700">
                Admin Username
              </label>
              <input
                id="adminUsername"
                name="adminUsername"
                type="text"
                value={formData.adminUsername}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="e.g., johndoe"
              />
            </div>
          </div>

          {/* Admin Password */}
          <div className="mt-6">
            <label htmlFor="adminPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
              Admin Password
            </label>
            <input
              id="adminPassword"
              name="adminPassword"
              type="password"
              value={formData.adminPassword}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
              placeholder="Enter a secure password"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-8 flex gap-3 border-t border-slate-200 pt-6">
          <button
            type="button"
            onClick={() => navigate("/organization-admin/branches")}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Branch"}
          </button>
        </div>
      </form>
    </div>
  );
}
