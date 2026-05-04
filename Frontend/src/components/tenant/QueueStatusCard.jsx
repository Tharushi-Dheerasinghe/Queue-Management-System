import { useNavigate, useOutletContext } from "react-router-dom";
import QueueStatusCard from "../components/QueueStatusCard";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import { legacyStorageKeys, readJSON, removeItem, storageKeys } from "../../utils/storage";

export default function QueueStatus() {
  const { tenantType } = useOutletContext();
  const navigate = useNavigate();

  const tokenData = readJSON(localStorage, storageKeys.tokenData(tenantType), [legacyStorageKeys.tokenData]);

  const handleBookAnother = () => {
    removeItem(localStorage, storageKeys.tokenData(tenantType));
    removeItem(localStorage, storageKeys.selectedBranch(tenantType));
    removeItem(localStorage, storageKeys.selectedService(tenantType));
    navigate(`/${tenantType}/branches`);
  };

  if (!tokenData) {
    return (
      <EmptyState
        title="No Token Found"
        description="Please book a token first to view your queue status."
        buttonText="Book a Token"
        buttonLink={`/${tenantType}/branches`}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Queue Status"
        description="View your current token and live queue information."
      />

      <QueueStatusCard
        tokenNumber={tokenData.tokenNumber}
        currentToken={tokenData.currentToken}
        peopleAhead={tokenData.peopleAhead}
        estimatedWait={tokenData.estimatedWait}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Booking Details</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p><span className="font-medium text-slate-900">Name:</span> {tokenData.fullName}</p>
            <p><span className="font-medium text-slate-900">Mobile:</span> {tokenData.mobile}</p>
            <p><span className="font-medium text-slate-900">Branch:</span> {tokenData.branch}</p>
            <p><span className="font-medium text-slate-900">Service:</span> {tokenData.service}</p>
            {tokenData.note && (
              <p><span className="font-medium text-slate-900">Note:</span> {tokenData.note}</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Current Status</h3>
          <p className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
            {tokenData.status}
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Your token is currently in the waiting queue. Please stay alert for the next update.
          </p>

          <Button
            onClick={handleBookAnother}
            className="mt-6 w-full sm:w-auto"
          >
            Book Another Token
          </Button>
        </div>
      </div>
    </div>
  );
}