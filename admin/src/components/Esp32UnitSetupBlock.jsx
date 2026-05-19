export default function Esp32UnitSetupBlock({ services = [], backendUrl = "" }) {
  const fallbackApiBase = `${String(backendUrl || "").replace(/\/$/, "")}/api`;

  if (!services.length) {
    return <p className="text-xs text-slate-500">No units configured for this branch.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-emerald-800 leading-relaxed">
        <strong>One link per unit</strong> — API base URL and Counter ID are both included. You do not need
        separate API and Counter links.
        <br />
        1. Power ESP32 → connect phone to <strong>QMS-Setup-XXXX</strong>
        <br />
        2. Open the unit setup link below (or <strong>http://192.168.4.1</strong>)
        <br />
        3. Enter branch WiFi SSID and password → Save
        <br />
        4. OLED shows <strong>how many in queue</strong>; hold button <strong>3 seconds</strong> to call next
      </p>
      {services.map((svc, sIdx) => {
        const counterId = svc.counterId || "unknown";
        const postUrl = `${fallbackApiBase}/tokens/iot/complete-and-next`;

        return (
          <div key={svc.id || sIdx} className="pl-4 py-3 border-l-4 border-emerald-500 bg-white rounded-lg shadow-sm space-y-3 mb-4">
            <div>
              <p className="text-sm font-black text-slate-800 uppercase tracking-wider">{svc.serviceName}</p>
              {svc.counterName && <p className="text-xs font-semibold text-emerald-600 mt-1">{svc.counterName}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Full API Link
                </p>
                <code className="block w-full bg-white border border-slate-200 p-2 rounded text-xs text-blue-700 break-all select-all font-mono">
                  {postUrl}
                </code>
              </div>
              
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Unit ID
                </p>
                <code className="block w-full bg-white border border-slate-200 p-2 rounded text-xs text-blue-700 break-all select-all font-mono font-bold">
                  {counterId}
                </code>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
