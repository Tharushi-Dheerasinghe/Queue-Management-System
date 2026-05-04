export default function AdminInformationSection({ form, onChange, adminNamePlaceholder, adminEmailPlaceholder, usernamePlaceholder }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Admin Information</h2>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="adminName" className="mb-1.5 block text-sm font-medium text-gray-700">
            Admin Name
          </label>
          <input
            id="adminName"
            name="adminName"
            value={form.adminName}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
            placeholder={adminNamePlaceholder}
          />
        </div>

        <div>
          <label htmlFor="adminEmail" className="mb-1.5 block text-sm font-medium text-gray-700">
            Admin Email
          </label>
          <input
            id="adminEmail"
            name="adminEmail"
            type="email"
            value={form.adminEmail}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
            placeholder={adminEmailPlaceholder}
          />
        </div>

        <div>
          <label htmlFor="adminPhone" className="mb-1.5 block text-sm font-medium text-gray-700">
            Admin Phone
          </label>
          <input
            id="adminPhone"
            name="adminPhone"
            value={form.adminPhone}
            onChange={onChange}
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
            value={form.username}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
            placeholder={usernamePlaceholder}
          />
        </div>

        <div>
          <label htmlFor="temporaryPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
            Temporary Password
          </label>
          <input
            id="temporaryPassword"
            name="temporaryPassword"
            type="password"
            value={form.temporaryPassword}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
            placeholder="Enter temporary password"
          />
        </div>
      </div>
    </section>
  );
}
