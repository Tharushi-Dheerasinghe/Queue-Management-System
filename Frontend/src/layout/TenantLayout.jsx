import { Outlet, useParams, Navigate, useLocation } from "react-router-dom";
import { tenantConfig, getTenantConfig } from "../configs/tenantConfig.js";
import Navbar from "../components/common/NavBar";
import Footer from "../components/common/Footer";
import EmergencyCallButton from "../components/common/EmergencyCallButton.jsx";
import Chatbot from "../components/common/Chatbot.jsx";
import { TenantProvider } from "../context/TenantContext";

export default function TenantLayout() {
  const { tenantType } = useParams();
  const tenant = getTenantConfig(tenantType);
  const location = useLocation();

  if (!tenant) {
    return <Navigate to="/" replace />;
  }

  // Show EmergencyCallButton only on TenantHome and MyBooking pages
  const showEmergencyButton = [
    `/${tenantType}`,
    `/${tenantType}/my-booking`,
  ].includes(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <TenantProvider tenantType={tenantType}>
        <Navbar tenant={tenant} tenantType={tenantType} />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Outlet context={{ tenantType, tenant }} />
        </main>
      </TenantProvider>
      {showEmergencyButton && tenantType === "hospital" && (
        <EmergencyCallButton name="Emergency Hotline" number="1990" />
      )}

      {showEmergencyButton && tenantType === "police" && (
        <EmergencyCallButton name="Police Emergency" number="119" />
      )}
      <Footer />
      <Chatbot />
    </div>
  );
}