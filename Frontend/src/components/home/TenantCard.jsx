import { useNavigate } from "react-router-dom";
import { tenantConfig } from "../../configs/tenantConfig";

export default function TenantCard({ title, description, routeKey, entryPath }) {
  const navigate = useNavigate();
  const tenant = tenantConfig[routeKey];
  const theme = tenant?.theme;
  const targetPath = entryPath || `/${routeKey}/select-organization`;

  return (
    <div onClick={() => navigate(targetPath)} className="group flex h-full cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex-1">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
              theme?.light || "bg-blue-50"
            } ${theme?.text || "text-blue-700"}`}
          >
            <img src={tenant?.icon} alt={tenant?.name} />
          </div>

          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              theme?.soft || "bg-blue-100"
            } ${theme?.text || "text-blue-700"}`}
          >
            {tenant?.shortName || "Tenant"}
          </span>
        </div>

        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <div className="mt-auto pt-6">
        <button
          className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${
            theme?.button || "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Enter
        </button>
      </div>
    </div>
  );
}