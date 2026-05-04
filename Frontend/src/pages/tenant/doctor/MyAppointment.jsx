import { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Calendar, Phone, Stethoscope, User } from "lucide-react";
import { tenantConfig } from "../../../configs/tenantConfig";
import { getAppointment } from "../../../services/bookingService";

export default function MyAppointment() {
  const navigate = useNavigate();
  const appointmentCardRef = useRef(null);
  const hospital = tenantConfig.hospital;
  const theme = hospital.theme;

  const appointment = useMemo(() => {
    return getAppointment();
  }, []);

  const handleDownloadPdf = async () => {
    if (!appointmentCardRef.current) {
      return;
    }

    const canvas = await html2canvas(appointmentCardRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imageData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const imageWidth = pageWidth - 20;
    const imageHeight = (canvas.height * imageWidth) / canvas.width;

    pdf.addImage(imageData, "PNG", 10, 10, imageWidth, imageHeight);
    pdf.save("hospital-appointment.pdf");
  };

  if (!appointment) {
    return (
      <div className="min-h-screen from-emerald-50 via-white to-slate-100 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">No Appointment Found</h1>
          <p className="mt-3 text-sm text-slate-600">
            No appointment data is available. Complete a doctor channeling booking first.
          </p>
          <button
            type="button"
            onClick={() => navigate("/hospital/doctor-channeling")}
            className={`mt-6 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${theme.button}`}
          >
            Go to Doctor Channeling
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen from-emerald-50 via-white to-slate-100 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <div className={`rounded-3xl border ${theme.border} bg-white p-6 shadow-sm sm:p-8`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${theme.text}`}>
            Doctor Channeling
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            My Appointment
          </h1>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section ref={appointmentCardRef} className={`rounded-2xl border ${theme.border} ${theme.light} p-5`}>
              <h2 className="text-lg font-semibold text-slate-900">Appointment Details</h2>

              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Doctor:</span> {appointment.doctorName}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Specialization:</span> {appointment.specialization}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Branch:</span> {appointment.branch}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Date:</span> {appointment.date}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Booking Status:</span> {appointment.status || "Confirmed"}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-900">Patient Information</h2>

              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <User className={`h-4 w-4 ${theme.text}`} />
                  <p>
                    <span className="font-semibold text-slate-900">Name:</span> {appointment.patient?.fullName || "N/A"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className={`h-4 w-4 ${theme.text}`} />
                  <p>
                    <span className="font-semibold text-slate-900">Mobile:</span> {appointment.patient?.mobileNumber || "N/A"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Stethoscope className={`h-4 w-4 ${theme.text}`} />
                  <p>
                    <span className="font-semibold text-slate-900">Patient ID:</span> {appointment.patient?.nic || "N/A"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className={`h-4 w-4 ${theme.text}`} />
                  <p>
                    <span className="font-semibold text-slate-900">Time:</span> {appointment.time || "N/A"}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/hospital")}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${theme.button}`}
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
