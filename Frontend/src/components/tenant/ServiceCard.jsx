export default function ServiceCard({ service, selected, onSelect, theme, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(service)}
      className={`w-full rounded-2xl border p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
        selected
          ? `${theme?.border || "border-blue-200"} ${theme?.light || "bg-blue-50"} ring-4 ${theme?.ring || "ring-blue-100"}`
          : "border-slate-200 bg-white"
      } ${disabled ? " hover:translate-y-0 hover:shadow-sm" : "cursor-pointer"}`}
    >
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-xl ${
          theme?.light || "bg-blue-50"
        } ${theme?.text || "text-blue-700"}`}
      >
        🛎️
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{service}</h3>
          <p className="mt-2 text-sm text-slate-500">
            Continue with this service to proceed with token booking.
          </p>
        </div>

        {selected && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${
              theme?.primary || "bg-blue-600"
            }`}
          >
            Selected
          </span>
        )}
      </div>
    </button>
  );
}