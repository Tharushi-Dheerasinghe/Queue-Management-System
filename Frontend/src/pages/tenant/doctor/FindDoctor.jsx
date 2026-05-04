import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Stethoscope } from "lucide-react";
import { tenantConfig } from "../../../configs/tenantConfig";
import { searchDoctors } from "../../../services/doctorService";

export default function FindDoctor() {
  const navigate = useNavigate();
  const hospital = tenantConfig.hospital;
  const theme = hospital.theme;

  const [doctorSearch, setDoctorSearch] = useState("");
  const [specializationSearch, setSpecializationSearch] = useState("");
  const [branchSearch, setBranchSearch] = useState("");

  const filteredDoctors = useMemo(() => {
    return searchDoctors({
      name: doctorSearch,
      specialization: specializationSearch,
      branch: branchSearch,
    });
  }, [doctorSearch, specializationSearch, branchSearch]);

  const handleChannelNow = (doctor) => {
    navigate("/hospital/doctor-details", {
      state: {
        doctor,
        searchBranch: branchSearch.trim() ? branchSearch.trim() : null,
      },
    });
  };

  return (
    <div className="min-h-screen from-emerald-50 via-white to-slate-100 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-7xl">
        <div className={`rounded-3xl border ${theme.border} bg-white p-6 shadow-sm sm:p-8`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${theme.text}`}>
            Doctor Channeling
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Channel a Doctor
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            Search by doctor name, specialization, or branch
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <aside className={`rounded-2xl border ${theme.border} ${theme.light} p-5 lg:col-span-4`}>
              <div className="mb-4 flex items-center gap-2">
                <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${theme.soft} ${theme.text}`}>
                  <Search className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Search Filters</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="doctor-search" className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                    Doctor Name
                  </label>
                  <input
                    id="doctor-search"
                    type="text"
                    value={doctorSearch}
                    onChange={(event) => setDoctorSearch(event.target.value)}
                    placeholder="e.g. Dr. Nimal"
                    className={`w-full rounded-xl border ${theme.border} bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme.ring}`}
                  />
                </div>

                <div>
                  <label htmlFor="specialization-search" className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                    Specialization
                  </label>
                  <input
                    id="specialization-search"
                    type="text"
                    value={specializationSearch}
                    onChange={(event) => setSpecializationSearch(event.target.value)}
                    placeholder="e.g. Cardiology"
                    className={`w-full rounded-xl border ${theme.border} bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme.ring}`}
                  />
                </div>

                <div>
                  <label htmlFor="branch-search" className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                    Branch
                  </label>
                  <input
                    id="branch-search"
                    type="text"
                    value={branchSearch}
                    onChange={(event) => setBranchSearch(event.target.value)}
                    placeholder="e.g. Main Hospital"
                    className={`w-full rounded-xl border ${theme.border} bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme.ring}`}
                  />
                </div>
              </div>
            </aside>

            <section className="space-y-3 lg:col-span-8">
              {filteredDoctors.length === 0 ? (
                <div className={`rounded-2xl border border-dashed ${theme.border} ${theme.light} px-6 py-10 text-center`}>
                  <p className="text-base font-semibold text-slate-900">No doctors found</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Try adjusting your search terms for doctor, specialization, or branch.
                  </p>
                </div>
              ) : (
                filteredDoctors.map((doctor) => (
                  <article
                    key={doctor.id}
                    className={`rounded-2xl border ${theme.border} bg-white p-4 shadow-sm sm:p-5`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Stethoscope className={`h-4 w-4 ${theme.text}`} />
                          <h3 className="text-lg font-semibold text-slate-900">{doctor.name}</h3>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{doctor.specialization}</p>
                        <p className="mt-1 text-sm text-slate-500">Branch: {doctor.branch}</p>
                        <p className="mt-1 text-sm text-slate-500">Availability: {doctor.availability}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleChannelNow(doctor)}
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${theme.button}`}
                      >
                        Channel Now
                      </button>
                    </div>
                  </article>
                ))
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
