export default function ApprovedDivisionCard({ division, onDeactivate }) {
  return (
    <div className="px-4 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{division.divisionName}</h3>
          <p className="text-sm text-gray-600">District: {division.district}</p>
          <p className="text-sm text-gray-600">Category: {division.category}</p>
          <p className="text-sm text-gray-600">Branch Count: {division.branchCount}</p>
          <p className="text-sm text-gray-600">Admin: {division.adminName}</p>
          <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
            {division.status === "inactive" ? "Inactive" : "Approved"}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!division.branchAdminAccess}
            className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Open Admin Panel
          </button>
          <button
            type="button"
            onClick={() => onDeactivate(division.id)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Deactivate
          </button>
        </div>
      </div>
    </div>
  );
}
