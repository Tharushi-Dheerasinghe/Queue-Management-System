export default function ServicesSelectionSection({ servicesList, selectedServices, onToggle }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Services</h2>

      <div className="mt-5">
        <p className="mb-2 text-sm font-medium text-gray-700">Services</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {servicesList.map((service) => (
            <label
              key={service}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
            >
              <input
                type="checkbox"
                checked={selectedServices.includes(service)}
                onChange={() => onToggle(service)}
                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-200"
              />
              <span className="text-sm text-gray-700">{service}</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
