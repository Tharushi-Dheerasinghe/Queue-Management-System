import TenantCard from "../components/home/TenantCard";

const tenantList = [
  {
    title: "Bank Queue System",
    description: "Manage customer services such as deposits, withdrawals, and account inquiries.",
    routeKey: "bank",
    entryPath: "/bank/select-organization",
  },
  {
    title: "Hospital Queue System",
    description: "Handle patient flow, doctor channeling, lab services, and clinic-based queues.",
    routeKey: "hospital",
    entryPath: "/hospital/select-service",
  },
  {
    title: "Police Queue System",
    description: "Support complaint registration, public inquiries, and document verification services.",
    routeKey: "police",
    entryPath: "/police/select-organization",
  },
  {
    title: "Supermarket Queue System",
    description: "Control billing counters, express checkout, and customer support queues.",
    routeKey: "supermarket",
    entryPath: "/supermarket/select-organization",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-5xl rounded-[32px] bg-gradient-to-r from-blue-100 via-green-100 via-indigo-100 to-orange-100 p-[2px] shadow-sm">
          <div className="rounded-[30px] bg-white p-7 text-center sm:p-10">
            <div className="inline-flex rounded-full bg-gradient-to-r from-blue-100 via-green-100 via-indigo-100 to-orange-100 p-[1px] shadow-sm">
              <div className="rounded-full border border-white/70 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-800">
                Multi-Tenant Queue Platform
              </div>
            </div>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Select a Service Domain
            </h1>

            <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Choose a domain to explore the shared queue management frontend built for banks,
              hospitals, police stations, and supermarkets.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">4 Tenant Types</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">Responsive UI</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">Local Queue Tracking</span>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-6xl grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {tenantList.map((tenant) => (
            <TenantCard
              key={tenant.routeKey}
              title={tenant.title}
              description={tenant.description}
              routeKey={tenant.routeKey}
              entryPath={tenant.entryPath}
            />
          ))}
        </div>
      </section>
    </div>
  );
}