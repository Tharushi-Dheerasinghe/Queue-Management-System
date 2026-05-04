import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">404 Error</p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900">Page Not Found</h1>
        <p className="mt-3 text-sm text-slate-500">The page you are looking for does not exist in this admin panel.</p>
        <Link
          to="/login"
          className="mt-6 inline-block rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
