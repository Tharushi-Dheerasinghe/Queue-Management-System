import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useTenant } from "../../../context/TenantContext";
import { getPharmacyBooking } from "../../../services/pharmacyService";

export default function PharmacyBookingSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantType, theme } = useTenant();

  const booking =
    location.state?.pharmacyBooking ||
    getPharmacyBooking(tenantType);

  return (
    <div className="space-y-6">
      <section className={`rounded-3xl border ${theme.border} bg-white p-6 shadow-sm sm:p-8`}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-7 w-7 text-emerald-700" />
        </div>
        <p className={`mt-4 text-center text-xs font-semibold uppercase tracking-[0.18em] ${theme.text}`}>
          Pharmacy Queue
        </p>
        <h1 className="mt-2 text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Booking Successful
        </h1>

        <div className={`mx-auto mt-6 max-w-2xl rounded-2xl border ${theme.border} ${theme.light} p-5`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Token Number:</span> {booking?.tokenNumber || "N/A"}
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Patient Name:</span> {booking?.patient?.fullName || "N/A"}
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Queue Type:</span> {booking?.queueType || "Pharmacy Queue"}
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Status:</span> {booking?.status || "Waiting"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => navigate("/hospital/my-booking")}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${theme.button}`}
          >
            View My Booking
          </button>
        </div>
      </section>
    </div>
  );
}
