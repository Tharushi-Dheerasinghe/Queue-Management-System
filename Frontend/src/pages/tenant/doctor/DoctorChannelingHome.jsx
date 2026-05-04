import { useNavigate } from "react-router-dom";
import { Stethoscope, Hospital, ArrowRight } from "lucide-react";
import { tenantConfig } from "../../../configs/tenantConfig";
import { getDoctors } from "../../../services/doctorService";

const specializationList = [
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Gynecology & Obstetrics",
  "ENT",
  "Ophthalmology",
  "General Surgery",
  "Psychiatry",
];

export default function DoctorChannelingHome() {
  const navigate = useNavigate();
  const hospital = tenantConfig.hospital;
  const theme = hospital.theme;
  const doctors = getDoctors();

  return (
    <div className="min-h-screen from-emerald-50 via-white to-slate-100 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className={`rounded-3xl border ${theme.border} bg-white p-6 shadow-sm sm:p-8`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${theme.text}`}>
            Hospital Module
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Doctor Channeling
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            Explore available specialists, specializations, and branches before continuing to the
            doctor search and booking experience.
          </p>

          <button
            type="button"
            onClick={() => navigate("/hospital/find-doctor")}
            className={`mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${theme.button}`}
          >
            Find Doctor
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className={`rounded-3xl border ${theme.border} bg-white p-6 shadow-sm lg:col-span-7`}>
            <div className="flex items-center gap-2">
              <Stethoscope className={`h-5 w-5 ${theme.text}`} />
              <h2 className="text-lg font-semibold text-slate-900">Doctor Preview</h2>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {doctors.map((doctor) => (
                <article key={doctor.id} className={`rounded-2xl border ${theme.border} ${theme.light} p-4`}>
                  <p className="text-sm font-semibold text-slate-900">{doctor.name}</p>
                  <p className="mt-1 text-xs text-slate-600">{doctor.specialization}</p>
                  <p className="mt-1 text-xs text-slate-500">{doctor.branch}</p>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-6 lg:col-span-5">
            <section className={`rounded-3xl border ${theme.border} bg-white p-6 shadow-sm`}>
              <h3 className="text-base font-semibold text-slate-900">Specializations</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {specializationList.map((specialization) => (
                  <span
                    key={specialization}
                    className={`rounded-full border ${theme.border} ${theme.soft} px-3 py-1 text-xs font-medium ${theme.text}`}
                  >
                    {specialization}
                  </span>
                ))}
              </div>
            </section>

            <section className={`rounded-3xl border ${theme.border} bg-white p-6 shadow-sm`}>
              <div className="flex items-center gap-2">
                <Hospital className={`h-5 w-5 ${theme.text}`} />
                <h3 className="text-base font-semibold text-slate-900">Branches</h3>
              </div>
              <ul className="mt-4 space-y-2">
                {hospital.branches.map((branch) => (
                  <li
                    key={branch}
                    className={`rounded-xl border ${theme.border} px-3 py-2 text-sm font-medium text-slate-700`}
                  >
                    {branch}
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
