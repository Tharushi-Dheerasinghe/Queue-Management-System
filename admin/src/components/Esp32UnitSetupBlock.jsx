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
        const apiBase = svc.apiBase || fallbackApiBase;
        const setupUrl =
          svc.setupUrl ||
          `http://192.168.4.1/?counterId=${encodeURIComponent(counterId)}&api=${encodeURIComponent(apiBase)}&unit=${encodeURIComponent(svc.serviceName || "Unit")}`;

        return (
          <div key={svc.id || sIdx} className="pl-3 border-l-2 border-emerald-400 space-y-2 pb-3 border-b border-emerald-100 last:border-0">
            <p className="text-xs font-bold text-slate-800">{svc.serviceName}</p>
            {svc.counterName ? (
              <p className="text-[10px] text-slate-500">Counter: {svc.counterName}</p>
            ) : null}
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Unit setup link (phone on QMS-Setup WiFi)
            </p>
            <a
              href={setupUrl}
              className="block w-full bg-white border border-emerald-300 p-2 rounded text-xs text-blue-700 break-all underline"
            >
              {setupUrl}
            </a>
            <details className="text-[10px] text-slate-500">
              <summary className="cursor-pointer font-semibold text-slate-600">Technical details (optional)</summary>
              <p className="mt-1">API base: <span className="font-mono select-all">{apiBase}</span></p>
              <p>Counter ID: <span className="font-mono select-all">{counterId}</span></p>
              {svc.statusUrl ? (
                <p className="mt-1 break-all">Status: <span className="font-mono select-all">{svc.statusUrl}</span></p>
              ) : null}
            </details>
          </div>
        );
      })}
    </div>
  );
}
