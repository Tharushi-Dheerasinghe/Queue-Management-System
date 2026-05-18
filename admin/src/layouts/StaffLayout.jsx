import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function StaffLayout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/staff-login"); // Redirect explicitly to the staff login page
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Minimal Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-4 max-w-[1600px] mx-auto w-full">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Staff Terminal</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{user?.email || "Unknown Staff"}</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 uppercase tracking-widest">
              {role || "Staff"}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-slate-900 text-white px-5 py-2 text-sm font-bold transition hover:bg-slate-800 active:scale-95"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Full-width Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
