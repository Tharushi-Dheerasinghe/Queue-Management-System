import { useState } from "react";
import { useNavigate } from "react-router-dom";

const initialForm = {
  organizationName: "",
  email: "",
  phoneNumber: "",
  address: "",
  organizationType: "Government",
  status: "active",
};

export default function HospitalSuperAdminAddMainCategory() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (event) => {
    event.preventDefault();
    // Local-only placeholder until backend integration.
    console.log("Organization draft:", form);
    navigate("/hospital-super-admin/organizations");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900">Add Organization</h1>
        <p className="mt-2 text-gray-600">Create a new hospital organization profile</p>

        <form onSubmit={handleSave} className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="organizationName" className="mb-1.5 block text-sm font-medium text-gray-700">
                Organization Name
              </label>
              <input
                id="organizationName"
                name="organizationName"
                value={form.organizationName}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="City General Hospital"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="organization@example.com"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="mb-1.5 block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="+94 71 234 5678"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="No. 25, Main Street, Colombo"
              />
            </div>

            <div>
              <label htmlFor="organizationType" className="mb-1.5 block text-sm font-medium text-gray-700">
                Organization Type
              </label>
              <select
                id="organizationType"
                name="organizationType"
                value={form.organizationType}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
              >
                <option>Government</option>
                <option>Private</option>
                <option>Semi-Government</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/hospital-super-admin/organizations")}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Save Organization
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
