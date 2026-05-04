import { useState } from "react";

export default function CheckIn() {
  const [bookingNumber, setBookingNumber] = useState("");
  const [checkedIn, setCheckedIn] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bookingNumber.trim()) return;
    setCheckedIn(true);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Check In
        </h1>
        <p className="mt-2 text-slate-500">
          Enter your booking or token number to confirm your arrival.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Booking / Token Number
            </label>
            <input
              type="text"
              value={bookingNumber}
              onChange={(e) => setBookingNumber(e.target.value)}
              placeholder="Enter your booking number"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Confirm Check In
          </button>
        </form>
      </div>

      {checkedIn && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-emerald-700">
            Check-in Successful
          </h3>
          <p className="mt-2 text-sm text-emerald-600">
            Your arrival has been confirmed successfully.
          </p>
        </div>
      )}
    </div>
  );
}