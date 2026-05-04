export default function PendingDivisionCard({ division, onReject, onAccept }) {
  return (
    <div className="px-4 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{division.divisionName}</h3>
          <p className="text-sm text-gray-600">District: {division.district}</p>
          <p className="text-sm text-gray-600">Category: {division.category}</p>
          <p className="text-sm text-gray-600">Admin: {division.adminName}</p>
          <p className="text-sm text-gray-600">Admin Email: {division.adminEmail}</p>
          <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
            Pending
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onReject(division.id)}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => onAccept(division.id)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
