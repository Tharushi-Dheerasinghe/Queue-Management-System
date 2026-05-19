import { useEffect, useState, useCallback } from "react";
import { createQueueSocket } from "../../utils/socketClient";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Button from "../../components/common/Button";
import { statusConfig } from "../../data/dummyData";
import {
  clearQueueToken,
  trackQueueTokenByNumber,
  cancelQueueToken,
} from "../../services/queueService";
import { useTranslation } from "react-i18next";

const STATUS_TEXT = {
  Waiting: "Your token is in the waiting queue. Please stay alert for your turn.",
  Called: "Your token is being served now. Please proceed to the service counter.",
  Completed: "This token has been completed. You may book another token if needed.",
};

const statusColorClasses = {
  amber: "border-amber-200 bg-amber-100 text-amber-700",
  blue: "border-blue-200 bg-blue-100 text-blue-700",
  green: "border-emerald-200 bg-emerald-100 text-emerald-700",
  red: "border-red-200 bg-red-100 text-red-700",
};

export default function QueueStatus() {
  const { t } = useTranslation();
  const { tenantType, tenant } = useOutletContext();
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const theme = tenant?.theme;
  const [isCancelling, setIsCancelling] = useState(false);

  const loadTrackedTokenCallback = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const urlTokenNumber = tokenId ? String(tokenId) : null;
      let tokenNumberToFetch = urlTokenNumber;

      if (!tokenNumberToFetch) {
        tokenNumberToFetch = getStoredTokenNumber(tenantType);
      }

      if (!tokenNumberToFetch) {
        setTokenData(null);
        setLoading(false);
        return;
      }

      const trackedToken = await trackQueueTokenByNumber(tokenNumberToFetch);
      setTokenData(trackedToken || null);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load queue status");
      setTokenData(null);
    } finally {
      setLoading(false);
    }
  }, [tokenId, tenantType]);

  useEffect(() => {
    loadTrackedTokenCallback();

    // Request notification permission
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, [loadTrackedTokenCallback]);

  // Setup Socket.io connection
  useEffect(() => {
    if (!tokenData?.branchId) return;

    const socket = createQueueSocket();

    socket.on("connect", () => {
      socket.emit("joinBranch", tokenData.branchId);
    });

    socket.on("queueUpdated", (data) => {
      const called = data?.calledToken || data?.token;
      const calledId = String(called?.id || called?._id || "");
      const myId = String(tokenData?.id || tokenData?._id || "");

      if (calledId && calledId === myId && called?.status === "Called") {
        if ("Notification" in window && Notification.permission === "granted") {
          const counterLabel = data?.counter?.counterName || called.counterName || "counter";
          new Notification("It's Your Turn!", {
            body: `Token ${called.tokenNumber} — go to ${counterLabel}`,
            icon: "/favicon.ico",
          });
        }
      }

      loadTrackedTokenCallback();
    });

    return () => {
      socket.disconnect();
    };
  }, [tokenData?.branchId, loadTrackedTokenCallback]);

  const status = tokenData?.status || "Waiting";
  const statusMeta = statusConfig[status] || statusConfig.Waiting;
  const statusAccentClasses = statusColorClasses[statusMeta.color] || statusColorClasses.blue;
  const [statusBorderClass, statusBgClass, statusTextClass] = statusAccentClasses.split(" ");

  const handleBookAnotherToken = () => {
    clearQueueToken(tenantType);
    navigate(`/${tenantType}/branches`);
  };

  const handleCancelToken = async () => {
    if (!tokenData?.id || isCancelling) return;
    setIsCancelling(true);
    setError("");
    try {
      await cancelQueueToken(tokenData.id);
      clearQueueToken(tenantType);
      setTokenData(null);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to cancel token. Please try again."
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <h2 className="text-2xl font-bold text-slate-900">Loading Queue Status</h2>
        <p className="mt-3 text-slate-500">Please wait while we fetch your live token details.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-red-50 p-8 text-center shadow-sm sm:p-10">
        <h2 className="text-2xl font-bold text-red-700">Unable to Load Queue</h2>
        <p className="mt-3 text-red-600">{error}</p>
        <Button onClick={() => navigate(`/${tenantType}`)} theme={theme} className="mt-6">
          Get Token
        </Button>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
            theme?.light || "bg-blue-50"
          } ${theme?.text || "text-blue-700"}`}
        >
          🎫
        </div>
        <h2 className="text-2xl font-bold text-slate-900">No Active Token</h2>
        <p className="mt-3 text-slate-500">
          You do not have an active booking right now. Start a new token booking to view live queue status.
        </p>
        <Button
          onClick={() => navigate(`/${tenantType}`)}
          theme={theme}
          className="mt-6"
        >
          Get Token
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className={`rounded-3xl bg-gradient-to-r p-6 text-white shadow-md sm:p-8 ${theme?.gradient || "from-blue-700 to-sky-500"}`}>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Queue Status
          {t("Queue Status")}
        </h1>
        <p className="mt-2 text-sm text-white/90 sm:text-base">
          {t("View your current token and live queue information.")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">{t("Step 4 of 4")}</span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">{t("Status")}: {t(status)}</span>
        </div>
      </div>

      <div className={`rounded-3xl bg-gradient-to-r p-8 text-white shadow-lg ${theme?.gradient || "from-blue-700 to-sky-500"}`}>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/90">
          {t("Live Queue")}
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-sm text-white/90">{t("Your Token")}</p>
            <h2 className="mt-2 text-2xl font-bold">{tokenData.tokenNumber}</h2>
          </div>

          <div>
            <p className="text-sm text-white/90">{t("Current Token")}</p>
            <h2 className="mt-2 text-2xl font-bold">{tokenData.currentToken}</h2>
          </div>

          <div>
            <p className="text-sm text-white/90">{t("People Ahead")}</p>
            <h2 className="mt-2 text-2xl font-bold">{tokenData.peopleAhead}</h2>
          </div>

          <div>
            <p className="text-sm text-white/90">{t("Estimated Wait")}</p>
            <h2 className="mt-2 text-2xl font-bold">{tokenData.estimatedWait}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={`rounded-3xl border bg-white p-6 shadow-sm ${theme?.border || "border-slate-200"}`}>
          <h3 className="text-lg font-semibold text-slate-900">{t("Booking Details")}</h3>
          <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${theme?.light || "bg-blue-50"} ${theme?.text || "text-blue-700"}`}>
            {t("Tenant Booking")}
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p><span className="font-medium text-slate-900">{t("Name")}:</span> {tokenData.fullName}</p>
            <p><span className="font-medium text-slate-900">{t("Mobile")}:</span> {tokenData.mobile}</p>
            <p><span className="font-medium text-slate-900">{t("Branch")}:</span> {tokenData.branch}</p>
            <p><span className="font-medium text-slate-900">{t("Service")}:</span> {tokenData.service}</p>
            {tokenData.note ? (
              <p><span className="font-medium text-slate-900">{t("Note")}:</span> {tokenData.note}</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">{t("Current Status")}</h3>
          <p
            className={`mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${
              theme?.border || statusBorderClass
            } ${theme?.soft || statusBgClass} ${theme?.text || statusTextClass}`}
          >
            {t(statusMeta.label)}
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            {t(STATUS_TEXT[status] || STATUS_TEXT.Waiting)}
          </p>

          <Button
            onClick={handleBookAnotherToken}
            theme={theme}
            className="mt-6 w-full"
          >
            {t("Book Another Token")}
          </Button>

          <Button
            onClick={handleCancelToken}
            variant="danger"
            className="mt-3 w-full"
            disabled={isCancelling}
          >
            {isCancelling ? t("Cancelling...") : t("Cancel Token")}
          </Button>
        </div>
      </div>
    </div>
  );
}