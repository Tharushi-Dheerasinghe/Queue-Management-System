import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Clock3, FileText, MapPin, Phone, User } from "lucide-react";
import { tenantConfig } from "../../../configs/tenantConfig";
import { createAppointment, getDoctorSelection } from "../../../services/bookingService";

export default function CompleteBooking() {
  const location = useLocation();
  const navigate = useNavigate();
  const hospital = tenantConfig.hospital;
  const theme = hospital.theme;

  const doctorSelection = getDoctorSelection();

  const appointment = location.state || {
    doctor: {
      name: doctorSelection.doctorName,
      specialization: doctorSelection.specialization,
    },
    selectedBranch: doctorSelection.selectedBranch,
    selectedDate: doctorSelection.selectedDate,
    selectedTime: doctorSelection.selectedTime,
  };

  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    nic: "",
    age: "",
    gender: "",
    note: "",
  });

  const summaryTime =
    appointment.selectedTime ||
    doctorSelection.selectedTime ||
    "";
  const summaryDate =
    appointment.selectedDate ||
    doctorSelection.selectedDate ||
    "";
  const summaryBranch =
    appointment.selectedBranch ||
    doctorSelection.selectedBranch ||
    "";
  const summaryDoctorName =
    appointment.doctor?.name ||
    doctorSelection.doctorName ||
    "";
  const summarySpecialization =
    appointment.doctor?.specialization ||
    doctorSelection.specialization ||
    "";

  const bookingSummary = useMemo(
    () => ({
      doctorName: summaryDoctorName,
      specialization: summarySpecialization,
      branch: summaryBranch,
      date: summaryDate,
      time: summaryTime,
    }),
    [summaryBranch, summaryDate, summaryDoctorName, summarySpecialization, summaryTime]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleCompleteBooking = (event) => {
    event.preventDefault();

    const savedBooking = createAppointment({
      doctorName: bookingSummary.doctorName,
      specialization: bookingSummary.specialization,
      branch: bookingSummary.branch,
      date: bookingSummary.date,
      time: bookingSummary.time,
      patient: formData,
    });
    navigate("/hospital/booking-success", { state: { booking: savedBooking } });
  };

  const canSubmit =
    formData.fullName.trim() &&
    formData.mobileNumber.trim() &&
    formData.nic.trim() &&
    formData.age.trim() &&
    formData.gender.trim();

  return (
    <div className="min-h-screen from-emerald-50 via-white to-slate-100 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${theme.text}`}>
            Booking Completion
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Complete Booking
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            Review the appointment summary and enter patient details to finalize the booking.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className={`rounded-3xl border ${theme.border} bg-white p-6 shadow-sm lg:col-span-4`}>
            <h2 className="text-lg font-semibold text-slate-900">Booking Summary</h2>

            <div className={`mt-5 rounded-2xl border ${theme.border} ${theme.light} p-5`}>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Doctor</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{bookingSummary.doctorName || "N/A"}</p>
              <p className="mt-1 text-sm text-slate-600">{bookingSummary.specialization || "Specialization not set"}</p>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                <MapPin className={`mt-0.5 h-4 w-4 flex-shrink-0 ${theme.text}`} />
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Branch</p>
                  <p className="mt-1 font-medium text-slate-900">{bookingSummary.branch || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                <Calendar className={`mt-0.5 h-4 w-4 flex-shrink-0 ${theme.text}`} />
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Date</p>
                  <p className="mt-1 font-medium text-slate-900">{bookingSummary.date || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                <Clock3 className={`mt-0.5 h-4 w-4 flex-shrink-0 ${theme.text}`} />
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Time</p>
                  <p className="mt-1 font-medium text-slate-900">{bookingSummary.time || "Not selected"}</p>
                </div>
              </div>
            </div>
          </aside>

          <section className={`rounded-3xl border ${theme.border} bg-white p-6 shadow-sm lg:col-span-8`}>
            <h2 className="text-lg font-semibold text-slate-900">Patient Details</h2>
            <p className="mt-2 text-sm text-slate-600">
              Please fill in the patient information to complete the booking.
            </p>

            <form className="mt-6 space-y-5" onSubmit={handleCompleteBooking}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="fullName">
                    Full Name
                  </label>
                  <div className={`flex items-center gap-3 rounded-2xl border ${theme.border} bg-white px-4 py-3`}>
                    <User className={`h-4 w-4 ${theme.text}`} />
                    <input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      placeholder="Enter full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="mobileNumber">
                    Mobile Number
                  </label>
                  <div className={`flex items-center gap-3 rounded-2xl border ${theme.border} bg-white px-4 py-3`}>
                    <Phone className={`h-4 w-4 ${theme.text}`} />
                    <input
                      id="mobileNumber"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      placeholder="07X XXX XXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="nic">
                    NIC / ID Number
                  </label>
                  <div className={`flex items-center gap-3 rounded-2xl border ${theme.border} bg-white px-4 py-3`}>
                    <FileText className={`h-4 w-4 ${theme.text}`} />
                    <input
                      id="nic"
                      name="nic"
                      value={formData.nic}
                      onChange={handleChange}
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      placeholder="Enter NIC or ID"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="age">
                    Age
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="0"
                    value={formData.age}
                    onChange={handleChange}
                    className={`w-full rounded-2xl border ${theme.border} bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400`}
                    placeholder="Enter age"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="gender">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full rounded-2xl border ${theme.border} bg-white px-4 py-3 text-sm text-slate-900 outline-none`}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="note">
                  Symptoms / Note
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows="4"
                  value={formData.note}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border ${theme.border} bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400`}
                  placeholder="Describe symptoms or add any note"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/hospital/doctor-details", { state: location.state })}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${theme.button} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  Complete Booking
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
