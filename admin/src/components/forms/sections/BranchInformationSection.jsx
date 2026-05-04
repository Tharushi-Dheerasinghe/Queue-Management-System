export default function BranchInformationSection({ form, onChange, branchNamePlaceholder, branchCodePlaceholder }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Branch Information</h2>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="branchName" className="mb-1.5 block text-sm font-medium text-gray-700">
            Branch Name
          </label>
          <input
            id="branchName"
            name="branchName"
            value={form.branchName}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
            placeholder={branchNamePlaceholder}
          />
        </div>

        <div>
          <label htmlFor="branchCode" className="mb-1.5 block text-sm font-medium text-gray-700">
            Branch Code
          </label>
          <input
            id="branchCode"
            name="branchCode"
            value={form.branchCode}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
            placeholder={branchCodePlaceholder}
          />
        </div>

        <div>
          <label htmlFor="openingTime" className="mb-1.5 block text-sm font-medium text-gray-700">
            Opening Time
          </label>
          <input
            id="openingTime"
            name="openingTime"
            type="time"
            value={form.openingTime}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
          />
        </div>

        <div>
          <label htmlFor="closingTime" className="mb-1.5 block text-sm font-medium text-gray-700">
            Closing Time
          </label>
          <input
            id="closingTime"
            name="closingTime"
            type="time"
            value={form.closingTime}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
          />
        </div>
      </div>
    </section>
  );
}
