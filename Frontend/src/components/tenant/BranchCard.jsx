export default function BranchCard({ branch, branchName, services = [], selectedServiceId, onSelectService, theme, disabled = false }) {
  return (
    <div
      className={`w-full rounded-2xl border p-6 text-left shadow-sm bg-white ${
        theme?.border || "border-slate-200"
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${
            theme?.light || "bg-blue-50"
          } ${theme?.text || "text-blue-700"}`}
        >
          𖠿
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{branchName}</h3>
          <p className="text-xs text-slate-500">
            {services.length} available {services.length === 1 ? 'unit' : 'units'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        {services.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No units available</p>
        ) : (
          services.map(service => {
            const isSelected = selectedServiceId === service.id;
            return (
              <button
                key={service.id}
                type="button"
                disabled={disabled || service.isClosed}
                onClick={() => onSelectService(branch, service)}
                className={`w-full flex justify-between items-center px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  isSelected 
                    ? `${theme?.light || "bg-blue-50"} ${theme?.border || "border-blue-300"} ${theme?.text || "text-blue-700"} ring-2 ${theme?.ring || "ring-blue-100"}`
                    : service.isClosed
                      ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span>{service.serviceName}</span>
                {service.isClosed ? (
                  <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">Closed</span>
                ) : (
                  <span className="text-xs opacity-60">Select →</span>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  );
}