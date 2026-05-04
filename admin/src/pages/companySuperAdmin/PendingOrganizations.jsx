import { useState } from "react";

const initialPendingOrganizations = [
  { id: 1, name: "CityCare Hospital", type: "Hospital", requestedBy: "admin@citycare.com" },
  { id: 2, name: "Metro Bank", type: "Bank", requestedBy: "ops@metrobank.com" },
  { id: 3, name: "North Station Police", type: "Police", requestedBy: "chief@northpolice.com" },
];

export default function PendingOrganizations() {
  const [pendingOrganizations, setPendingOrganizations] = useState(initialPendingOrganizations);

  const handleDecision = (id) => {
    setPendingOrganizations((previous) => previous.filter((org) => org.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pending Organizations</h1>
        <p className="mt-2 text-sm text-slate-500">Approve or reject onboarding requests.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {pendingOrganizations.length === 0 ? (
          <p className="text-sm text-slate-500">No pending requests.</p>
        ) : (
          <div className="space-y-3">
            {pendingOrganizations.map((org) => (
              <article key={org.id} className="rounded-xl border border-slate-200 p-4">
                <h2 className="text-lg font-semibold text-slate-900">{org.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{org.type} • {org.requestedBy}</p>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecision(org.id)}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(org.id)}
                    className="rounded-lg border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
