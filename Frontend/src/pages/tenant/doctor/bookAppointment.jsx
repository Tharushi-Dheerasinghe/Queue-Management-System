import { useNavigate } from "react-router-dom";
import { CalendarCheck, Clock3, Stethoscope } from "lucide-react";
import { useTenant } from "../../../context/TenantContext";

export default function BookAppointment() {
	const navigate = useNavigate();
	const { tenantType, tenant, theme } = useTenant();

	return (
		<div className="space-y-6">
			<section className={`rounded-3xl border ${theme.border} bg-white p-6 shadow-sm sm:p-8`}>
				<p className={`text-xs font-semibold uppercase tracking-[0.18em] ${theme.text}`}>
					Doctor Channeling
				</p>
				<h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
					Book Appointment
				</h1>
				<p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
					Continue through the standard queue flow to select branch and doctor channeling
					service before confirming your appointment.
				</p>
			</section>

			<section className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div className={`rounded-2xl border ${theme.border} ${theme.light} p-5`}>
					<div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${theme.soft} ${theme.text}`}>
						<Stethoscope className="h-5 w-5" />
					</div>
					<h2 className="mt-3 text-lg font-semibold text-slate-900">Specialist Selection</h2>
					<p className="mt-1 text-sm text-slate-600">Find the right consultant quickly.</p>
				</div>
				<div className={`rounded-2xl border ${theme.border} ${theme.light} p-5`}>
					<div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${theme.soft} ${theme.text}`}>
						<Clock3 className="h-5 w-5" />
					</div>
					<h2 className="mt-3 text-lg font-semibold text-slate-900">Time Slot Booking</h2>
					<p className="mt-1 text-sm text-slate-600">Choose available channeling windows.</p>
				</div>
				<div className={`rounded-2xl border ${theme.border} ${theme.light} p-5`}>
					<div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${theme.soft} ${theme.text}`}>
						<CalendarCheck className="h-5 w-5" />
					</div>
					<h2 className="mt-3 text-lg font-semibold text-slate-900">Confirmation</h2>
					<p className="mt-1 text-sm text-slate-600">Review and finalize the booking details.</p>
				</div>
			</section>

			<div className="flex flex-wrap gap-3">
				<button
					type="button"
					onClick={() => navigate(`/${tenantType}/branches`)}
					className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${theme.button}`}
				>
					Start Channeling Flow
				</button>
				<button
					type="button"
					onClick={() => navigate(`/${tenantType}`)}
					className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
				>
					Back to Home
				</button>
			</div>
		</div>
	);
}
