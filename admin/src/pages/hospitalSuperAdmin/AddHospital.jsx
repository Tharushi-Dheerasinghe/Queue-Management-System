import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminInformationSection from "../../components/forms/sections/AdminInformationSection";
import BranchInformationSection from "../../components/forms/sections/BranchInformationSection";
import OrganizationInformationSection from "../../components/forms/sections/OrganizationInformationSection";
import QueueSettingsSection from "../../components/forms/sections/QueueSettingsSection";
import ServicesSelectionSection from "../../components/forms/sections/ServicesSelectionSection";
import { createOrganizationByTenant } from "../../services/tenantService";

const hospitalCategories = [
  "Teaching Hospital",
  "National Hospital",
  "Provincial General Hospital",
  "District General Hospital",
  "Base Hospital",
  "Divisional Hospital",
  "Specialized Hospital",
];

const provinces = [
  "Western",
  "Central",
  "Southern",
  "Northern",
  "Eastern",
  "North Western",
  "North Central",
  "Uva",
  "Sabaragamuwa",
];

const districts = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Galle",
  "Jaffna",
  "Batticaloa",
  "Kurunegala",
  "Anuradhapura",
  "Badulla",
  "Ratnapura",
];

const servicesList = [
  "OPD Consultation",
  "Radiology / Scans",
  "Laboratory Tests",
  "Dental Clinic",
  "Eye Clinic",
  "ENT Clinic",
  "Maternity Clinic",
  "Pediatric Clinic",
  "Cardiology Clinic",
];

const initialState = {
  hospitalName: "",
  shortName: "",
  hospitalCategory: hospitalCategories[0],
  province: provinces[0],
  district: districts[0],
  city: "",
  address: "",
  contactNumber: "",
  email: "",
  branchName: "",
  branchCode: "",
  openingTime: "",
  closingTime: "",
  services: [],
  adminName: "",
  adminEmail: "",
  adminPhone: "",
  username: "",
  temporaryPassword: "",
  bookingType: "Token",
  tokenPrefix: "",
  maxDailyTokens: "",
  priorityQueueEnabled: false,
};

export default function HospitalSuperAdminAddHospital() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleServiceToggle = (serviceName) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(serviceName)
        ? prev.services.filter((service) => service !== serviceName)
        : [...prev.services, serviceName],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = {
        tenantType: "hospital",
        organizationName: form.hospitalName,
        shortName: form.shortName,
        category: form.hospitalCategory,
        province: form.province,
        district: form.district,
        city: form.city,
        address: form.address,
        contactNumber: form.contactNumber,
        email: form.email,
        queueSettings: {
          bookingType: String(form.bookingType || "Token").toLowerCase(),
          tokenPrefix: form.tokenPrefix,
          maxDailyTokens: Number(form.maxDailyTokens || 0),
          priorityEnabled: Boolean(form.priorityQueueEnabled),
        },
        status: "active",
        branch: {
          branchName: String(form.branchName || "").trim(),
          branchCode: String(form.branchCode || "").trim(),
          city: String(form.city || "").trim(),
          address: String(form.address || "").trim(),
          contactNumber: String(form.contactNumber || "").trim(),
          email: String(form.email || "").trim().toLowerCase(),
          status: "active",
        },
        services: form.services,
        admin: {
          name: String(form.adminName || "").trim(),
          email: String(form.adminEmail || "").trim().toLowerCase(),
          phone: String(form.adminPhone || "").trim(),
          username: String(form.username || "").trim(),
          password: String(form.temporaryPassword || "").trim(),
        },
      };

      const organizationResponse = await createOrganizationByTenant("hospital", payload);

      if (!organizationResponse?.success) {
        setError(organizationResponse?.message || "Failed to create hospital organization payload");
        return;
      }

      const message =
        organizationResponse?.message ||
        "Hospital, main branch, services, and organization admin created successfully";

      setSuccessMessage(message);

      navigate("/hospital-super-admin/hospital-admins", {
        state: { successMessage: message },
      });
    } catch (submitError) {
      setError(submitError?.message || "Failed to create hospital organization and admin");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900">Hospital Registration</h1>
        <p className="mt-2 text-gray-600">Register hospital and branch admin access</p>

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
          <OrganizationInformationSection
            sectionTitle="Hospital Information"
            form={form}
            onChange={handleChange}
            nameField="hospitalName"
            nameLabel="Hospital Name"
            namePlaceholder="National Hospital Colombo"
            categoryField="hospitalCategory"
            categoryLabel="Hospital Category"
            categoryOptions={hospitalCategories}
            shortNamePlaceholder="NHC"
            cityPlaceholder="Colombo"
            addressPlaceholder="No. 24, Main Road, Colombo"
            contactPlaceholder="+94 71 234 5678"
            emailPlaceholder="hospital@example.com"
            provinces={provinces}
            districts={districts}
          />

          <BranchInformationSection
            form={form}
            onChange={handleChange}
            branchNamePlaceholder="NHC West Wing"
            branchCodePlaceholder="NHC-W01"
          />

          <ServicesSelectionSection
            servicesList={servicesList}
            selectedServices={form.services}
            onToggle={handleServiceToggle}
          />

          <AdminInformationSection
            form={form}
            onChange={handleChange}
            adminNamePlaceholder="Nimal Perera"
            adminEmailPlaceholder="admin.branch@example.com"
            usernamePlaceholder="hospitalbranchadmin"
          />

          <QueueSettingsSection
            form={form}
            onChange={handleChange}
            tokenPrefixPlaceholder="NHC"
            maxDailyTokensPlaceholder="500"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/hospital-super-admin/branches")}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              {submitting ? "Saving..." : "Save Hospital"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
