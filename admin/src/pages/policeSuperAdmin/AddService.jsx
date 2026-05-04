import { useState } from "react";
import { useNavigate } from "react-router-dom";

const initialForm = {
  serviceName: "",
  category: "Public Service",
  description: "",
  status: "active",
};

export default function PoliceSuperAdminAddService() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (event) => {
    event.preventDefault();
    console.log("Police service draft:", form);
    navigate("/police-super-admin/services");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900">Add Service</h1>
        <p className="mt-2 text-gray-600">Create a new police service profile</p>

        <form onSubmit={handleSave} className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="serviceName" className="mb-1.5 block text-sm font-medium text-gray-700">
                Service Name
              </label>
              <input
                id="serviceName"
                name="serviceName"
                value={form.serviceName}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="Traffic Complaint Desk"
              />
            </div>

            <div>
              <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
              >
                <option>Public Service</option>
                <option>Investigation</option>
                <option>Traffic</option>
                <option>Community Safety</option>
                <option>Administration</option>
                <option>Emergency</option>
                <option>Other</option>
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

            <div className="md:col-span-2">
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
                placeholder="Briefly describe this service"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/police-super-admin/services")}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Save Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
