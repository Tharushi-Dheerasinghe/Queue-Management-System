import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminInformationSection from "../../components/forms/sections/AdminInformationSection";
import BranchInformationSection from "../../components/forms/sections/BranchInformationSection";
import OrganizationInformationSection from "../../components/forms/sections/OrganizationInformationSection";
import QueueSettingsSection from "../../components/forms/sections/QueueSettingsSection";
import ServicesSelectionSection from "../../components/forms/sections/ServicesSelectionSection";

const organizationCategories = [
  "Police Division",
  "Police Range",
  "Special Unit",
  "Traffic Unit",
  "Community Unit",
  "Women and Child Bureau",
  "Investigation Unit",
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
  "Public Complaint Desk",
  "Traffic Violation Handling",
  "Crime Reporting",
  "CID Referral",
  "Women and Child Help Desk",
  "Community Mediation",
  "Character Certificate Processing",
  "Emergency Response Dispatch",
  "Lost and Found Support",
];

const initialState = {
  organizationName: "",
  shortName: "",
  organizationCategory: organizationCategories[0],
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

export default function PoliceSuperAdminAddBranch() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);

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

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("Police Add Branch Form Data:", form);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900">Add Branch</h1>
        <p className="mt-2 text-gray-600">Create a police branch and branch admin access</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <OrganizationInformationSection
            sectionTitle="Organization Information"
            form={form}
            onChange={handleChange}
            nameField="organizationName"
            nameLabel="Organization Name"
            namePlaceholder="Colombo Police Division"
            categoryField="organizationCategory"
            categoryLabel="Organization Category"
            categoryOptions={organizationCategories}
            shortNamePlaceholder="CPD"
            cityPlaceholder="Colombo"
            addressPlaceholder="No. 10, Main Street, Colombo"
            contactPlaceholder="+94 11 234 5678"
            emailPlaceholder="division@police.gov.lk"
            provinces={provinces}
            districts={districts}
          />

          <BranchInformationSection
            form={form}
            onChange={handleChange}
            branchNamePlaceholder="Colombo Fort Police Station"
            branchCodePlaceholder="CPD-FORT-01"
          />

          <ServicesSelectionSection
            servicesList={servicesList}
            selectedServices={form.services}
            onToggle={handleServiceToggle}
          />

          <AdminInformationSection
            form={form}
            onChange={handleChange}
            adminNamePlaceholder="Saman Perera"
            adminEmailPlaceholder="branchadmin@police.gov.lk"
            usernamePlaceholder="policebranchadmin"
          />

          <QueueSettingsSection
            form={form}
            onChange={handleChange}
            tokenPrefixPlaceholder="CPD"
            maxDailyTokensPlaceholder="250"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/police-super-admin/branches")}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Save Branch & Create Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
