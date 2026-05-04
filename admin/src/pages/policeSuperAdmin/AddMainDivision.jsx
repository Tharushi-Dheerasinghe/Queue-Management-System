import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrganizationByTenant } from "../../services/tenantService";

const categoryOptions = [
  "Police Station",
  "Traffic Division",
  "CID",
  "Women & Children Bureau",
  "Tourist Police",
  "Community Police Unit",
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
  "Matara",
];

const servicesList = [
  "Complaint Entry",
  "Accident Report",
  "Traffic Fine Payment",
  "Lost Item Complaint",
  "Clearance Report",
  "General Inquiry",
];

const initialState = {
  tenantType: "police",
  organizationName: "",
  district: districts[0],
  isMain: true,
  branchName: "",
  shortName: "",
  stationCode: "",
  province: provinces[0],
  city: "",
  address: "",
  contactNumber: "",
  email: "",
  category: categoryOptions[0],
  services: [],
  admin: {
    name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    role: "organization_admin",
  },
  queueSettings: {
    bookingType: "token",
    tokenPrefix: "",
    maxDailyTokens: "",
    priorityEnabled: false,
  },
  status: "pending",
};

const sanitizeCodePart = (value = "") =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const takeFirstLetters = (value = "", max = 3) => {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "";

  if (words.length === 1) {
    return sanitizeCodePart(words[0]).slice(0, max);
  }

  return words
    .map((word) => sanitizeCodePart(word).charAt(0))
    .join("")
    .slice(0, max);
};

const generatePoliceCode = (district = "", branchName = "", shortName = "") => {
  const districtPart = sanitizeCodePart(district).slice(0, 3) || "POL";
  const namePart =
    sanitizeCodePart(shortName).slice(0, 3) ||
    takeFirstLetters(branchName, 3) ||
    "DIV";
  const randomPart = Math.floor(100 + Math.random() * 900);

  return `POL-${districtPart}-${namePart}-${randomPart}`;
};

const generateTokenPrefix = (shortName = "", branchName = "") => {
  return (
    sanitizeCodePart(shortName).slice(0, 4) ||
    takeFirstLetters(branchName, 4) ||
    "POL"
  );
};

export default function PoliceSuperAdminAddMainDivision() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const suggestedCode = useMemo(() => {
    return generatePoliceCode(
      formData.district,
      formData.branchName,
      formData.shortName
    );
  }, [formData.district, formData.branchName, formData.shortName]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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

  const handleQueueSettingsChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      queueSettings: {
        ...prev.queueSettings,
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  };

  const handleServiceToggle = (serviceName) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceName)
        ? prev.services.filter((service) => service !== serviceName)
        : [...prev.services, serviceName],
    }));
  };

  const validateForm = () => {
    if (!String(formData.branchName).trim()) {
      return "Branch / division name is required";
    }

    if (!String(formData.shortName).trim()) {
      return "Short name is required";
    }

    if (!String(formData.admin.name).trim()) {
      return "Admin name is required";
    }

    if (!String(formData.admin.email).trim()) {
      return "Admin email is required";
    }

    if (!String(formData.admin.username).trim()) {
      return "Admin username is required";
    }

    if (!String(formData.admin.password).trim()) {
      return "Admin password is required";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const validationMessage = validateForm();

      if (validationMessage) {
        setError(validationMessage);
        setSubmitting(false);
        return;
      }

      const finalStationCode =
        String(formData.stationCode || "").trim() || suggestedCode;

      const finalTokenPrefix =
        String(formData.queueSettings.tokenPrefix || "").trim() ||
        generateTokenPrefix(formData.shortName, formData.branchName);

      const payload = {
        tenantType: "police",
        organizationName: String(formData.branchName || "").trim(),
        divisionName: String(formData.branchName || "").trim(),
        shortName: String(formData.shortName || "").trim(),
        organizationCode: finalStationCode,
        stationCode: finalStationCode,
        district: String(formData.district || "").trim(),
        province: String(formData.province || "").trim(),
        city: String(formData.city || "").trim(),
        address: String(formData.address || "").trim(),
        contactNumber: String(formData.contactNumber || "").trim(),
        email: String(formData.email || "").trim().toLowerCase(),
        category: String(formData.category || "").trim(),
        branch: {
          branchName: `${String(formData.branchName || "").trim()} Main Branch`,
          branchCode: finalStationCode,
          shortName: String(formData.shortName || "").trim(),
          city: String(formData.city || "").trim(),
          address: String(formData.address || "").trim(),
          contactNumber: String(formData.contactNumber || "").trim(),
          email: String(formData.email || "").trim().toLowerCase(),
          status: "active",
        },
        services: formData.services,
        status: "pending",
        approvedAt: null,
        isMain: Boolean(formData.isMain),
        queueSettings: {
          bookingType: String(
            formData.queueSettings.bookingType || "token"
          ).toLowerCase(),
          tokenPrefix: finalTokenPrefix,
          maxDailyTokens: Number(formData.queueSettings.maxDailyTokens || 0),
          priorityEnabled: Boolean(formData.queueSettings.priorityEnabled),
        },
        admin: {
          name: String(formData.admin.name || "").trim(),
          email: String(formData.admin.email || "").trim().toLowerCase(),
          phone: String(formData.admin.phone || "").trim(),
          username: String(formData.admin.username || "").trim(),
          password: String(formData.admin.password || "").trim(),
        },
      };

      const response = await createOrganizationByTenant("police", payload);

      if (!response?.success) {
        setError(response?.message || "Failed to create police main division");
        return;
      }

      const message =
        response?.message ||
        "Main division, main branch, and division admin created successfully";

      setSuccessMessage(message);

      navigate("/police-super-admin/branches", {
        state: {
          successMessage: message,
        },
      });
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Failed to create police main division"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900">Add Main Division</h1>
        <p className="mt-2 text-gray-600">
          Create police organization record and division admin access
        </p>

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

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Section 1: Division Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              Division Information
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  District <span className="text-red-500">*</span>
                </label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                >
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 flex items-center">
                <input
                  type="checkbox"
                  id="isMain"
                  name="isMain"
                  checked={formData.isMain}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-2 focus:ring-sky-500"
                />
                <label
                  htmlFor="isMain"
                  className="ml-2 text-sm font-medium text-gray-700"
                >
                  This is a main division
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Station Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              Station / Division Information
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Division Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleChange}
                  placeholder="Enter division name"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Short Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="shortName"
                  value={formData.shortName}
                  onChange={handleChange}
                  placeholder="e.g. COL"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Police Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="stationCode"
                  value={formData.stationCode}
                  onChange={handleChange}
                  placeholder={suggestedCode}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 uppercase text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to auto generate: {suggestedCode}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Province
                </label>
                <select
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                >
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter station address"
                  rows="3"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="Enter contact number"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Services */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Services</h2>

            <div className="grid gap-3 md:grid-cols-2">
              {servicesList.map((service) => (
                <div key={service} className="flex items-center">
                  <input
                    type="checkbox"
                    id={service}
                    checked={formData.services.includes(service)}
                    onChange={() => handleServiceToggle(service)}
                    className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-2 focus:ring-sky-500"
                  />
                  <label htmlFor={service} className="ml-3 text-sm text-gray-700">
                    {service}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Admin Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              Division Admin Information
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Admin Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.admin.name}
                  onChange={handleAdminChange}
                  placeholder="Enter admin name"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Admin Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.admin.email}
                  onChange={handleAdminChange}
                  placeholder="Enter admin email"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Admin Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.admin.phone}
                  onChange={handleAdminChange}
                  placeholder="Enter phone number"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.admin.username}
                  onChange={handleAdminChange}
                  placeholder="Enter username"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.admin.password}
                  onChange={handleAdminChange}
                  placeholder="Enter password"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Queue Settings */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              Queue Settings
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Booking Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="bookingType"
                  value={formData.queueSettings.bookingType}
                  onChange={handleQueueSettingsChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                >
                  <option value="token">Token</option>
                  <option value="appointment">Appointment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Token Prefix
                </label>
                <input
                  type="text"
                  name="tokenPrefix"
                  value={formData.queueSettings.tokenPrefix}
                  onChange={handleQueueSettingsChange}
                  placeholder={generateTokenPrefix(
                    formData.shortName,
                    formData.branchName
                  )}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 uppercase text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to auto generate from short name
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Daily Tokens
                </label>
                <input
                  type="number"
                  min="0"
                  name="maxDailyTokens"
                  value={formData.queueSettings.maxDailyTokens}
                  onChange={handleQueueSettingsChange}
                  placeholder="Enter max tokens"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="priorityEnabled"
                  name="priorityEnabled"
                  checked={formData.queueSettings.priorityEnabled}
                  onChange={handleQueueSettingsChange}
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-2 focus:ring-sky-500"
                />
                <label
                  htmlFor="priorityEnabled"
                  className="ml-2 text-sm font-medium text-gray-700"
                >
                  Enable Priority Queue
                </label>
              </div>
            </div>
          </div>

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
              disabled={submitting}
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save Division & Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}