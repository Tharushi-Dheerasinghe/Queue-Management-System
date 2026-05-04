import { useNavigate } from "react-router-dom";
import { Pill } from "lucide-react";
import { useTenant } from "../../../context/TenantContext";

export default function PharmacyQueueHome() {
  const navigate = useNavigate();
  const { theme } = useTenant();

  return (
    <div className="space-y-6">
      <section className={`rounded-3xl border ${theme.border} bg-white p-6 shadow-sm sm:p-8`}>
        <div className="flex items-start gap-4">
          <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${theme.soft} ${theme.text}`}>
            <Pill className="h-6 w-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${theme.text}`}>
              Hospital Module
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Pharmacy Queue
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Join the pharmacy queue for prescription verification and medicine collection with a
              dedicated hospital flow.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/hospital/pharmacy/details")}
          className={`mt-6 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${theme.button}`}
        >
          Get Pharmacy Token
        </button>
      </section>
    </div>
  );
}
