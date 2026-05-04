import { Outlet, useParams, Navigate, useLocation } from "react-router-dom";
import { tenantConfig } from "../configs/tenantConfig.js";
import Navbar from "../components/common/NavBar";
import Footer from "../components/common/Footer";
import EmergencyCallButton from "../components/common/EmergencyCallButton.jsx";
import { TenantProvider } from "../context/TenantContext";

export default function TenantLayout() {
  const { tenantType } = useParams();
  const tenant = tenantConfig[tenantType];
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar tenant={tenant} tenantType={tenantType} />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <TenantProvider tenantType={tenantType}>
          <Outlet context={{ tenantType, tenant }} />
        </TenantProvider>
      </main>
      {showEmergencyButton && tenantType === "hospital" && (
        <EmergencyCallButton name="Emergency Hotline" number="1990" />
      )}

      {showEmergencyButton && tenantType === "police" && (
        <EmergencyCallButton name="Police Emergency" number="119" />
      )}
      <Footer />
    </div>
  );
}