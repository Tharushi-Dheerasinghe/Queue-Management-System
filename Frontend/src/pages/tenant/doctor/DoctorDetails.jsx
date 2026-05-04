import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Stethoscope } from "lucide-react";
import { tenantConfig } from "../../../configs/tenantConfig";
import { saveDoctorSelection } from "../../../services/bookingService";

const sampleDates = [
  "Mon, Jan 20",
  "Tue, Jan 21",
  "Wed, Jan 22",
  "Thu, Jan 23",
  "Fri, Jan 24",
  "Sat, Jan 25",
  "Mon, Jan 27",
];

const sampleTimeSlots = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
];

export default function DoctorDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const hospital = tenantConfig.hospital;
  const theme = hospital.theme;

  const doctor = location.state?.doctor;
  const searchBranch = location.state?.searchBranch;

  if (!doctor) {
    return navigate("/hospital/find-doctor", { replace: true });
  }

  const availableBranches = hospital.branches || [];
  const [selectedBranch, setSelectedBranch] = useState(searchBranch || availableBranches[0] || "");
  const [selectedDate, setSelectedDate] = useState(sampleDates[0] || "");
  const [selectedTime, setSelectedTime] = useState(sampleTimeSlots[0] || "");

  const prioritizedBranches = useMemo(() => {
    if (!searchBranch) {
      return availableBranches;
    }

    const filtered = availableBranches.filter((b) => b !== searchBranch);
    return [searchBranch, ...filtered];
  }, [searchBranch, availableBranches]);

  const handleConfirmBooking = () => {
    saveDoctorSelection({
      doctor,
      selectedBranch,
      selectedDate,
      selectedTime,
    });
    navigate("/hospital/complete-booking", {
      state: {
        doctor,
        selectedBranch,
        selectedDate,
        selectedTime,
        searchBranch,
      },
    });
  };

  return (
    <div className="min-h-screen from-emerald-50 via-white to-slate-100 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-7xl">
        <div className={`rounded-3xl border ${theme.border} bg-white shadow-sm`}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 p-6 sm:p-8">
            <section className={`rounded-2xl border ${theme.border} ${theme.light} p-6 lg:col-span-4`}>
              <h2 className={`text-xs font-semibold uppercase tracking-[0.18em] ${theme.text}`}>
                Doctor Details
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Stethoscope className={`h-5 w-5 ${theme.text} flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Doctor Name</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{doctor.name}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Specialization</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{doctor.specialization}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Availability</p>
                  <p className="mt-1 text-sm text-slate-600">{doctor.availability}</p>
                </div>

                <div className={`rounded-xl border ${theme.border} bg-white p-3`}>
                  <p className="text-xs font-medium text-slate-600">
                    Once you confirm your preferred branch and time slot below, your appointment will
                    be booked with this specialist.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-6 lg:col-span-8">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Select Branch</h2>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {prioritizedBranches.map((branch) => {
                    const isPrioritized = branch === searchBranch;
                    return (
                      <button
                        key={branch}
                        type="button"
                        onClick={() => setSelectedBranch(branch)}
                        className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition ${
                          selectedBranch === branch
                            ? `border-current ${theme.primary} bg-white text-slate-900`
                            : `border-slate-200 bg-white text-slate-900 hover:border-slate-300`
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{branch}</span>
                        </div>
                        {isPrioritized && (
                          <span className={`mt-1 inline-block text-xs font-medium ${theme.text}`}>
                            Preferred
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">Select Date</h2>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {sampleDates.map((date) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={`rounded-xl border px-3 py-2 text-center text-xs font-medium transition ${
                        selectedDate === date
                          ? `border-current ${theme.primary} bg-white text-slate-900`
                          : `border-slate-200 bg-white text-slate-600 hover:border-slate-300`
                      }`}
                    >
                      <Calendar className="mx-auto h-4 w-4 mb-1" />
                      {date}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">Select Time Slot</h2>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {sampleTimeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`rounded-xl border px-3 py-2 text-center text-xs font-medium transition ${
                        selectedTime === time
                          ? `border-current ${theme.primary} bg-white text-slate-900`
                          : `border-slate-200 bg-white text-slate-600 hover:border-slate-300`
                      }`}
                    >
                      <Clock className="mx-auto h-4 w-4 mb-1" />
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl border ${theme.border} ${theme.light} p-4 sm:p-5`}>
                <h3 className="text-sm font-semibold text-slate-900">Booking Summary</h3>
                <div className="mt-3 space-y-1 text-sm">
                  <p>
                    <span className="font-medium text-slate-900">{doctor.name}</span>
                    <span className="text-slate-600"> ({doctor.specialization})</span>
                  </p>
                  <p className="text-slate-600">Branch: {selectedBranch}</p>
                  <p className="text-slate-600">
                    {selectedDate} at {selectedTime}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${theme.button}`}
                >
                  Confirm Booking
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/hospital/find-doctor")}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Back to Search
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
