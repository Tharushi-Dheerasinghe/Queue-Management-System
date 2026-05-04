import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import { getMyBookings } from "../../services/queueService";

export default function MyBooking() {
  const { tenantType, tenant } = useOutletContext();
  const navigate = useNavigate();
  const theme = tenant?.theme;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);
  const [showQr, setShowQr] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    getMyBookings()
      .then((data) => setBookings(data || []))
      .catch((err) => setError("Failed to load bookings."))
      .finally(() => setLoading(false));
  }, [tenantType]);

  const activeTokens = bookings.filter(
    (b) => (b.status === "Waiting" || b.status === "Called") && b.tenantType === tenantType
  );
  const historyTokens = bookings.filter(
    (b) => (b.status === "Completed" || b.status === "Cancelled" || b.status === "Skipped") && b.tenantType === tenantType
  );

  const statusBadge = (status) => {
    let color = "bg-blue-100 text-blue-700";
    if (status === "Waiting") color = "bg-amber-100 text-amber-700";
    if (status === "Called") color = "bg-emerald-100 text-emerald-700";
    if (status === "Completed") color = "bg-slate-200 text-slate-700";
    if (status === "Cancelled") color = "bg-red-100 text-red-700";
    if (status === "Skipped") color = "bg-orange-200 text-orange-700";
    return (
      <span className={`inline-flex w-24 items-center justify-center rounded px-2 py-1 text-xs font-semibold uppercase ${color}`}>
        {status}
      </span>
    );
  };

  const handleDownloadQr = (token) => {
    const tokenId = token._id || token.id;
    const canvas = document.getElementById(`booking-qr-canvas-${tokenId}`);
    if (!canvas) return;
    const imageData = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imageData;
    link.download = `booking-${token.tokenNumber}.png`;
    link.click();
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <span className="text-lg text-slate-500">Loading your bookings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl py-10 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button theme={theme} onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (activeTokens.length === 0 && historyTokens.length === 0) {
    let portalLabel = "this portal";
    if (tenantType === "bank") portalLabel = "your bank";
    else if (tenantType === "police") portalLabel = "your police station";
    else if (tenantType === "hospital") portalLabel = "your hospital";
    else if (tenantType === "supermarket") portalLabel = "your supermarket";
    return (
      <div className="mx-auto max-w-4xl flex flex-col items-center justify-center min-h-[60vh]">
        <EmptyState
          title={`No Bookings Found`}
          description={`You haven't made any bookings in ${portalLabel} yet.`}
          theme={theme}
          action={
            <Button theme={theme} onClick={() => navigate(`/${tenantType}`)}>
              Get a Token
            </Button>
          }
        />
      </div>
    );
  }

  let portalHeader = "My Bookings";
  let portalDesc = "Review your current tokens and booking history.";
  if (tenantType === "bank") {
    portalHeader = "My Bank Bookings";
    portalDesc = "View and manage your bank queue tokens.";
  } else if (tenantType === "police") {
    portalHeader = "My Police Bookings";
    portalDesc = "View and manage your police station queue tokens.";
  } else if (tenantType === "hospital") {
    portalHeader = "My Hospital Bookings";
    portalDesc = "View and manage your hospital queue tokens.";
  } else if (tenantType === "supermarket") {
    portalHeader = "My Supermarket Bookings";
    portalDesc = "View and manage your supermarket queue tokens.";
  }
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4">
      <PageHeader title={portalHeader} description={portalDesc} />

      {/* Active Tokens */}
      {activeTokens.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className={`text-lg font-semibold mb-4 ${theme?.text || "text-slate-800"}`}>Active Tokens</h2>
          <div className="grid gap-6">
            {activeTokens.map((token) => {
              const tokenId = token._id || token.id;
              const qrValue = JSON.stringify({
                tokenNumber: token.tokenNumber,
                branch: token.branchName,
                service: token.serviceName,
                fullName: token.fullName,
                mobile: token.mobile,
              });
              return (
                <div
                  key={tokenId}
                  className={`rounded-2xl border ${theme?.border || "border-slate-200"} bg-gradient-to-br from-white via-blue-50 to-white ${theme?.light} shadow-sm p-6`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex gap-3 items-center mb-2">
                        <span className={`inline-flex rounded-full px-3 py-1 text-lg font-bold tracking-wide ${theme?.light || "bg-blue-50"} ${theme?.darkText || "text-blue-900"}`}>{token.tokenNumber}</span>
                        <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide" style={{ background: theme?.light }}>{statusBadge(token.status)}</span>
                      </div>
                      <div className={`text-sm ${theme?.text || "text-slate-700"}`}>
                        <span className="font-medium">Branch:</span> {token.branchName} <span className="ml-2 font-medium">Service:</span> {token.serviceName}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[160px]">
                      <Button
                        theme={theme}
                        onClick={() => navigate(`/${tenantType}/queue-status/${token.tokenNumber}`)}
                        className="w-full"
                      >
                        View Queue Status
                      </Button>
                      <Button
                        theme={theme}
                        variant="secondary"
                        onClick={() => setShowQr(showQr === tokenId ? null : tokenId)}
                        className="w-full"
                      >
                        {showQr === tokenId ? "Hide QR" : "Get QR"}
                      </Button>
                    </div>
                  </div>

                  {showQr === tokenId && (
                    <div className="mt-6 pt-6 border-t border-dashed flex flex-col items-center gap-4">
                      <div className="p-4 bg-white border rounded-xl">
                        <QRCodeCanvas
                          id={`booking-qr-canvas-${tokenId}`}
                          value={qrValue}
                          size={160}
                          includeMargin
                        />
                      </div>
                      <Button
                        onClick={() => handleDownloadQr(token)}
                        variant="secondary"
                        theme={theme}
                        className="text-xs"
                      >
                        Download QR (PNG)
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* History Section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className={`text-lg font-semibold mb-4 ${theme?.text || "text-slate-800"}`}>Booking History</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {historyTokens.length === 0 ? (
            <p className="text-slate-400 text-sm py-4">No past bookings.</p>
          ) : (
            historyTokens.map((token) => (
              <div
                key={token._id || token.id}
                className="rounded-xl border bg-slate-50 p-4 border-slate-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`inline-flex rounded-full px-3 py-1 text-base font-bold tracking-wide ${theme?.light || "bg-blue-50"} ${theme?.darkText || "text-blue-900"}`}>{token.tokenNumber}</span>
                  <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide" style={{ background: theme?.light }}>{statusBadge(token.status)}</span>
                </div>
                <div className={`text-xs ${theme?.text || "text-slate-700"}`}>
                  <span className="font-medium">Branch:</span> {token.branchName}
                  <span className="ml-2 font-medium">Service:</span> {token.serviceName}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(token.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}