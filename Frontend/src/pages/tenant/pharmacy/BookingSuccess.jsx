import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Printer, Ticket } from "lucide-react";
import { tenantConfig } from "../../../configs/tenantConfig";
import { getAppointment } from "../../../services/bookingService";

export default function BookingSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const hospital = tenantConfig.hospital;
  const theme = hospital.theme;
  const booking = location.state?.booking || getAppointment();

  return (
    <div className="min-h-screen from-emerald-50 via-white to-slate-100 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-3xl">
        <div className={`rounded-3xl border ${theme.border} bg-white p-8 text-center shadow-sm`}>
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${theme.light}`}>
            <CheckCircle2 className={`h-8 w-8 ${theme.text}`} />
          </div>
          <p className={`mt-4 text-xs font-semibold uppercase tracking-[0.18em] ${theme.text}`}>
            Booking Confirmed
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Your appointment has been saved
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            The appointment booking is complete. You can now review the booking summary below.
          </p>

          {booking && (
            <div className={`mt-8 rounded-2xl border ${theme.border} ${theme.light} p-5 text-left`}>
              <div className="flex items-center gap-2">
                <Ticket className={`h-4 w-4 ${theme.text}`} />
                <h2 className="text-sm font-semibold text-slate-900">Booking Summary</h2>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p><span className="font-semibold text-slate-900">Doctor:</span> {booking.doctorName}</p>
                <p><span className="font-semibold text-slate-900">Specialization:</span> {booking.specialization}</p>
                <p><span className="font-semibold text-slate-900">Branch:</span> {booking.branch}</p>
                <p><span className="font-semibold text-slate-900">Date:</span> {booking.date}</p>
                <p><span className="font-semibold text-slate-900">Time:</span> {booking.time || "N/A"}</p>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/hospital/my-appointment")}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${theme.button}`}
            >
              View Booking
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
