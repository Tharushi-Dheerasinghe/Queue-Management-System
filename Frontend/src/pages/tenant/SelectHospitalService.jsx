import { useNavigate } from "react-router-dom";
import { tenantConfig } from "../../configs/tenantConfig";
import { hospitalModules } from "../../data/dummyData";
import { storageKeys, writeValue } from "../../utils/storage";

export default function SelectHospitalService() {
  const navigate = useNavigate();
  const hospital = tenantConfig.hospital;
  const theme = hospital.theme;

  const handleSelectModule = (moduleKey, route) => {
    writeValue(sessionStorage, storageKeys.hospitalModule("hospital"), moduleKey);

    if (moduleKey === "token-management") {
      navigate("/hospital/select-organization");
      return;
    }

    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-100 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <div className={`rounded-3xl border ${theme.border} bg-white p-6 shadow-sm sm:p-8`}>
          <div className="flex items-start gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${theme.border} ${theme.light}`}>
              <img src={hospital.icon} alt={hospital.name} className="h-8 w-8 object-contain" />
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${theme.text}`}>
                Hospital Entry
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Select Hospital Service
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                Choose the service module to continue. Each module is optimized for a different
                hospital workflow.
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {hospitalModules.map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.title}
                  type="button"
                  onClick={() => handleSelectModule(module.moduleKey, module.route)}
                  className={`group rounded-2xl border ${theme.border} p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme.ring}`}
                >
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${theme.soft} ${theme.text}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-slate-900">{module.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
                  <p className={`mt-4 text-xs font-semibold uppercase tracking-[0.12em] ${theme.text}`}>
                    Enter Module
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
