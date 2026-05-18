import React from "react";
import Navbar from "../components/common/NavBar";
import { useTranslation } from "react-i18next";
import { Info, CheckCircle2, Shield, Zap } from "lucide-react";

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t("About")} <span className="text-sky-500">QueueFlow</span>
          </h1>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            {t("Revolutionizing customer wait times through intelligent queue management systems designed for modern businesses.")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
              {t("Our Mission")}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-6">
              {t("At QueueFlow, our mission is to eliminate the frustration of waiting in line. We provide a seamless, digital queuing experience that empowers both customers and service providers. Whether you are at a hospital, bank, police station, or supermarket, our platform ensures a smooth, organized, and stress-free process.")}
            </p>
            <ul className="space-y-4">
              {[
                t("Real-time queue tracking and notifications"),
                t("Multi-tenant architecture for enterprise scale"),
                t("Detailed analytics and staff performance metrics")
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-sky-500/10 blur-3xl rounded-full"></div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl relative z-10">
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80" 
                alt="Team working" 
                className="rounded-2xl w-full object-cover h-64 shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Zap size={32} />, title: t("Lightning Fast"), desc: t("Optimized infrastructure to ensure zero latency during high-traffic queue registrations.") },
            { icon: <Shield size={32} />, title: t("Secure & Private"), desc: t("Enterprise-grade security protecting customer data and organizational metrics.") },
            { icon: <Info size={32} />, title: t("Data Driven"), desc: t("Advanced analytics to help administrators make informed staffing decisions.") },
          ].map((feature, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-2xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
