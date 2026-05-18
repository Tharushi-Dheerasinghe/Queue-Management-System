import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Activity, ShieldCheck, Zap, HeartHandshake } from "lucide-react";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-16 bg-slate-900 border-t border-slate-800 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-50"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-sky-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Brand & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
                <Activity size={18} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-black text-white tracking-tight">QueueFlow</span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              {t("Revolutionizing the way organizations manage appointments and queues. Smart, seamless, and efficient.")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">{t("Platform")}</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/tenant-select" className="hover:text-sky-400 transition-colors">{t("Find Organizations")}</Link></li>
              <li><Link to="/about" className="hover:text-sky-400 transition-colors">{t("How it works")}</Link></li>
              <li><Link to="/contact" className="hover:text-sky-400 transition-colors">{t("Support")}</Link></li>
            </ul>
          </div>

          {/* Trust Badges */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">{t("Why choose us")}</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <ShieldCheck size={18} className="text-emerald-400" /> {t("Bank-level Security")}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Zap size={18} className="text-amber-400" /> {t("Real-time Updates")}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <HeartHandshake size={18} className="text-rose-400" /> {t("Reliable Service")}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} QueueFlow Platform. {t("All rights reserved.")}</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">{t("Privacy Policy")}</Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">{t("Terms of Service")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}