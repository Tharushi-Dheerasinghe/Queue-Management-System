import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrganizationByTenant } from "../../services/tenantService";

const normalizeBranchCodeSource = (value = "") =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

const generateMainBranchCode = ({ shortName = "", organizationName = "" } = {}) => {
  const primarySource = normalizeBranchCodeSource(shortName);
  const fallbackSource = normalizeBranchCodeSource(organizationName);
  const baseCode = (primarySource || fallbackSource).slice(0, 4) || "BRN";
  return `${baseCode}-MAIN`;
};

const initialFormState = {
  organization: {
    name: "",
    shortName: "",
    location: "",
    contactNumber: "",
    email: "",
    status: "active",
  },
  admin: {
    name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
  },
};

export default function CompanyOrganizationForm({ tenantType, title, subtitle, organizationSectionTitle, organizationNameLabel }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleOrganizationChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      organization: {
        ...prev.organization,
        [name]: value,
      },
    }));
  };

  const handleAdminChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      admin: {
        ...prev.admin,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const selectedTenantType = String(tenantType || "").trim().toLowerCase();
      const organizationName = String(formData.organization.name || "").trim();
      const organizationShortName = String(formData.organization.shortName || "").trim();
      const generatedMainBranchCode = generateMainBranchCode({
        shortName: organizationShortName,
        organizationName,
      });

      const payload = {
        tenantType: selectedTenantType,
        organizationName,
        shortName: organizationShortName,
        address: formData.organization.location,
        contactNumber: formData.organization.contactNumber,
        email: formData.organization.email,
        status: formData.organization.status,
        queueSettings: {
          bookingType: "token",
          tokenPrefix: "",
          maxDailyTokens: 0,
          priorityEnabled: false,
        },
        branch: {
          branchName: `${organizationName} Main Branch`,
          shortName: organizationShortName,
          branchCode: generatedMainBranchCode,
          address: String(formData.organization.location || "").trim(),
          contactNumber: String(formData.organization.contactNumber || "").trim(),
          email: String(formData.organization.email || "").trim().toLowerCase(),
          status: "active",
        },
        services: [],
        admin: {
          name: String(formData.admin.name || "").trim(),
          email: String(formData.admin.email || "").trim().toLowerCase(),
          phone: String(formData.admin.phone || "").trim(),
          username: String(formData.admin.username || "").trim(),
          password: String(formData.admin.password || "").trim(),
        },
      };

      const organizationResponse = await createOrganizationByTenant(selectedTenantType, payload);

      if (!organizationResponse?.success) {
        setError(organizationResponse?.message || "Failed to create organization");
        return;
      }

      const message =
        organizationResponse?.message ||
        "Organization, main branch, and organization admin created successfully";

      setSuccessMessage(message);
      navigate("/company-super-admin/organization-admins", {
        state: {
          successMessage: message,
        },
      });
    } catch (submitError) {
      setError(submitError?.message || "Failed to save company and create admin");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-gray-600">{subtitle}</p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">{organizationSectionTitle}</h2>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
                  {organizationNameLabel}
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.organization.name}
                  onChange={handleOrganizationChange}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label htmlFor="shortName" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Short Name
                </label>
                <input
                  id="shortName"
                  name="shortName"
                  value={formData.organization.shortName}
                  onChange={handleOrganizationChange}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
                  placeholder="Enter short name"
                />
              </div>

              <div>
                <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Head Office Location
                </label>
                <input
                  id="location"
                  name="location"
                  value={formData.organization.location}
                  onChange={handleOrganizationChange}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
                  placeholder="Enter head office location"
                />
              </div>

              <div>
                <label htmlFor="contactNumber" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Contact Number
                </label>
                <input
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.organization.contactNumber}
                  onChange={handleOrganizationChange}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
                  placeholder="+94 71 234 5678"
                />
              </div>

              <div>
                <label htmlFor="organizationEmail" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="organizationEmail"
                  name="email"
                  type="email"
                  value={formData.organization.email}
                  onChange={handleOrganizationChange}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
                  placeholder="company@example.com"
                />
              </div>

              <div>
                <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.organization.status}
                  onChange={handleOrganizationChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Organization Admin Access</h2>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="adminName" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Admin Name
                </label>
                <input
                  id="adminName"
                  name="name"
                  value={formData.admin.name}
                  onChange={handleAdminChange}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
                  placeholder="Enter admin full name"
                />
              </div>

              <div>
                <label htmlFor="adminEmail" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Admin Email
                </label>
                <input
                  id="adminEmail"
                  name="email"
                  type="email"
                  value={formData.admin.email}
                  onChange={handleAdminChange}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label htmlFor="adminPhone" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Admin Phone
                </label>
                <input
                  id="adminPhone"
                  name="phone"
                  value={formData.admin.phone}
                  onChange={handleAdminChange}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
                  placeholder="+94 77 123 4567"
                />
              </div>

              <div>
                <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  value={formData.admin.username}
                  onChange={handleAdminChange}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
                  placeholder="Enter username"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Temporary Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.admin.password}
                  onChange={handleAdminChange}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
                  placeholder="Enter temporary password"
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/company-super-admin/organizations")}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              {submitting ? "Saving..." : "Save Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
