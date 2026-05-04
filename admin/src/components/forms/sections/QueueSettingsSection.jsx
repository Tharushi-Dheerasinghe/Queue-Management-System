export default function QueueSettingsSection({ form, onChange, tokenPrefixPlaceholder, maxDailyTokensPlaceholder }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Queue Settings</h2>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="bookingType" className="mb-1.5 block text-sm font-medium text-gray-700">
            Booking Type
          </label>
          <select
            id="bookingType"
            name="bookingType"
            value={form.bookingType}
            onChange={onChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
          >
            <option value="Token">Token</option>
            <option value="Appointment">Appointment</option>
          </select>
        </div>

        <div>
          <label htmlFor="tokenPrefix" className="mb-1.5 block text-sm font-medium text-gray-700">
            Token Prefix
          </label>
          <input
            id="tokenPrefix"
            name="tokenPrefix"
            value={form.tokenPrefix}
            onChange={onChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
            placeholder={tokenPrefixPlaceholder}
          />
        </div>

        <div>
          <label htmlFor="maxDailyTokens" className="mb-1.5 block text-sm font-medium text-gray-700">
            Max Daily Tokens
          </label>
          <input
            id="maxDailyTokens"
            name="maxDailyTokens"
            type="number"
            min="0"
            value={form.maxDailyTokens}
            onChange={onChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
            placeholder={maxDailyTokensPlaceholder}
          />
        </div>

        <div className="flex items-center">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
            <input
              type="checkbox"
              name="priorityQueueEnabled"
              checked={form.priorityQueueEnabled}
              onChange={onChange}
              className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-200"
            />
            <span className="text-sm font-medium text-gray-700">Priority Queue Enabled</span>
          </label>
        </div>
      </div>
    </section>
  );
}
