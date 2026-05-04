import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useOutletContext } from "react-router-dom";
import {
  getCurrentStaffTask,
  callNextToken,
  skipAndCallNextToken,
  endStaffTask,
  getNextWaitingToken,
  getStaffBranchCounters,
  getStaffBranchServices,
  getWaitingTokenCount,
  getProcessedTokens,
} from "../../services/staffService";

const formatElapsedTime = (startedAt, nowTimestamp) => {
  if (!startedAt) return "00:00:00";
  const started = new Date(startedAt).getTime();
  const diffSeconds = Math.max(0, Math.floor((nowTimestamp - started) / 1000));
  const hours = String(Math.floor(diffSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((diffSeconds % 3600) / 60)).padStart(
    2,
    "0",
  );
  const seconds = String(diffSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

// localStorage utilities for persisting currentTask across page refreshes
const CURRENT_TASK_STORAGE_KEY = "staff_dashboard_current_task";

const saveCurrentTaskToStorage = (task) => {
  try {
    if (task) {
      localStorage.setItem(CURRENT_TASK_STORAGE_KEY, JSON.stringify(task));
    } else {
      localStorage.removeItem(CURRENT_TASK_STORAGE_KEY);
    }
  } catch (error) {
    console.warn("Failed to save currentTask to localStorage:", error);
  }
};

const loadCurrentTaskFromStorage = () => {
  try {
    const stored = localStorage.getItem(CURRENT_TASK_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn("Failed to load currentTask from localStorage:", error);
    return null;
  }
};

const clearCurrentTaskFromStorage = () => {
  try {
    localStorage.removeItem(CURRENT_TASK_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear currentTask from localStorage:", error);
  }
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const context = useOutletContext() || {};
  const theme = context.tenant?.theme;

  // State for branch overview
  const [counters, setCounters] = useState([]);
  const [services, setServices] = useState([]);
  const [countersLoading, setCountersLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [countersError, setCountersError] = useState(null);
  const [servicesError, setServicesError] = useState(null);

  // State for active task/queue
  const [currentTask, setCurrentTask] = useState(null);
  const [nextWaitingToken, setNextWaitingToken] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const [actionLoading, setActionLoading] = useState(false);
  const [taskError, setTaskError] = useState(null);
  const [waitingTokens, setWaitingTokens] = useState([]);
  const [workSession, setWorkSession] = useState(null);
  const [workSessionStartedAt, setWorkSessionStartedAt] = useState(null);

  // State for processed tokens history
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Work session
  const [endingSession, setEndingSession] = useState(false);

  // Restore currentTask from localStorage on mount
  useEffect(() => {
    const savedTask = loadCurrentTaskFromStorage();
    if (savedTask) {
      console.log("Restored currentTask from localStorage:", savedTask);
      setCurrentTask(savedTask);
    }
  }, []);

  // Fetch counters
  useEffect(() => {
    setCountersLoading(true);
    getStaffBranchCounters()
      .then((res) => setCounters(res.counters || []))
      .catch((err) =>
        setCountersError(err.message || "Failed to load counters"),
      )
      .finally(() => setCountersLoading(false));
  }, []);

  // Fetch services
  useEffect(() => {
    setServicesLoading(true);
    getStaffBranchServices()
      .then((res) => setServices(res.services || []))
      .catch((err) =>
        setServicesError(err.message || "Failed to load services"),
      )
      .finally(() => setServicesLoading(false));
  }, []);

  // Fetch current task and next in queue
  const fetchTaskAndQueue = async () => {
    setLoading(true);
    setTaskError(null);
    console.log("fetchTaskAndQueue started...");
    try {
      const res = await getCurrentStaffTask();
      const task = res?.currentTask || null;

      setWorkSession(task);
      // NOTE: Do NOT clear currentTask here — it's managed by callNextToken and localStorage.
      // currentTask represents the token being served, workSession represents the staff session.
      // Set work session start time from backend, or use current time if not available
      if (task && !workSessionStartedAt) {
        setWorkSessionStartedAt(task.startedAt || new Date().toISOString());
      }
      console.log("Current Task Response:", res);

      // වැදගත්: user.branchId වෙනුවට task.branchId භාවිතා කරන්න
      if (task?.serviceId && task?.branchId) { // user.branchId වෙනුවට task.branchId භාවිතා කරන්න
      const [nextRes, statsRes] = await Promise.all([
        getNextWaitingToken(task.serviceId, task.branchId),
        getWaitingTokenCount({ serviceId: task.serviceId, branchId: task.branchId })
      ]);
        
        setNextWaitingToken(nextRes.nextToken || null);
        setQueueStats(statsRes.count );
      } else {
        setNextWaitingToken(null);
        setQueueStats(0);
      }
    } catch (err) {
      console.error("Error in fetchTaskAndQueue:", err);
      setTaskError(err.message || "Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskAndQueue();
  }, []);

  // Fetch processed tokens history for current counter
  const fetchHistory = async (counterId) => {
    if (!counterId) return;
    
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await getProcessedTokens(counterId, 10);
      setHistory(res.tokens || []);
    } catch (err) {
      console.error("Error fetching history:", err);
      setHistoryError(err.message || "Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (workSession?.counterId) {
      fetchHistory(workSession.counterId);
    }
  }, [workSession?.counterId]);

  // Timer runs for the full active work session, even when currentTask becomes null.
  useEffect(() => {
    if (!workSessionStartedAt) return undefined;

    const timerId = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => clearInterval(timerId);
  }, [workSessionStartedAt]);

  // Memoized filtered counters/services (if needed for future filtering)
  const activeCounters = useMemo(
    () => counters.filter((c) => c.status === "active"),
    [counters],
  );
  const inactiveCounters = useMemo(
    () => counters.filter((c) => c.status !== "active"),
    [counters],
  );

  // Elapsed time for current customer (Serving Now)
  const elapsedTime = useMemo(
    () => formatElapsedTime(currentTask?.startedAt, nowTimestamp),
    [currentTask?.startedAt, nowTimestamp],
  );

  // Session duration (Work Session total time)
  const sessionDuration = useMemo(
    () => formatElapsedTime(workSessionStartedAt, nowTimestamp),
    [workSessionStartedAt, nowTimestamp],
  );

// Handle Complete & Call Next
const handleProcessToken = async () => {
  setActionLoading(true);
  setTaskError(null);

  try {
    const activeCounterId = workSession?.counterId || user?.counterId;

    if (!activeCounterId) {
      throw new Error("Counter ID එක හඳුනා ගැනීමට නොහැකි විය. කරුණාකර පිටුව Refresh කරන්න.");
    }

    const res = await callNextToken(activeCounterId); 

    // සාර්ථකව නව ටෝකනයක් ලැබුණහොත්
    if (res.success && res.token) {
      const newTask = {
        ...res.token,
        startedAt: res.token?.startedAt || new Date().toISOString(),
        counterId: activeCounterId 
      };
      setCurrentTask(newTask);
      saveCurrentTaskToStorage(newTask); 
      setNowTimestamp(Date.now());

      if (res.token?.serviceId && res.token?.branchId) {
        const [nextRes, statsRes] = await Promise.all([
          getNextWaitingToken(res.token.serviceId, res.token.branchId),
          getWaitingTokenCount({ serviceId: res.token.serviceId, branchId: res.token.branchId }),
        ]);
        setNextWaitingToken(nextRes.nextToken || null);
        setQueueStats(statsRes.count || 0);
      }
      
      // Refresh history after processing token
      await fetchHistory(activeCounterId);
    } else {
      // පෝලිම හිස් නම් (res.token === null)
      setCurrentTask(null);
      clearCurrentTaskFromStorage(); // localStorage ඉවත් කිරීම
      setNextWaitingToken(null);
      setQueueStats(0);
      setTaskError(res.message || "No more customers in queue");
    }
  } catch (error) {
    // Error එකක් ආ විට (උදා: 404 response එකකදී)
    setCurrentTask(null);
    clearCurrentTaskFromStorage();
    setNextWaitingToken(null);
    setQueueStats(0);
    setTaskError(error.message || "No more customers in queue.");
  } finally {
    setActionLoading(false);
  }
};

// Handle Skip Token (මෙයත් ඉහත ආකාරයටම සකස් කරන්න)
const handleSkipToken = async () => {
  setActionLoading(true);
  setTaskError(null);

  try {
    const activeCounterId = workSession?.counterId || user?.counterId;
    if (!activeCounterId) {
      throw new Error("Counter ID එක හඳුනා ගැනීමට නොහැකි විය.");
    }

    const res = await skipAndCallNextToken(activeCounterId);

    if (res.success && res.token) {
      const newTask = {
        ...res.token,
        startedAt: res.token?.startedAt || new Date().toISOString(),
        counterId: activeCounterId,
      };
      setCurrentTask(newTask);
      saveCurrentTaskToStorage(newTask);
      setNowTimestamp(Date.now());

      const [nextRes, statsRes] = await Promise.all([
        getNextWaitingToken(res.token.serviceId, res.token.branchId),
        getWaitingTokenCount({ serviceId: res.token.serviceId, branchId: res.token.branchId }),
      ]);
      setNextWaitingToken(nextRes.nextToken || null);
      setQueueStats(statsRes.count || 0);
      
      // Refresh history after processing token
      await fetchHistory(activeCounterId);
    } else {
      // Skip කළ පසු පෝලිම හිස් නම්
      setCurrentTask(null);
      clearCurrentTaskFromStorage();
      setNextWaitingToken(null);
      setQueueStats(0);
      setTaskError(res.message || "No more customers in queue");
    }
  } catch (error) {
    setCurrentTask(null);
    clearCurrentTaskFromStorage();
    setNextWaitingToken(null);
    setQueueStats(0);
    setTaskError(error.message || "No more customers in queue.");
  } finally {
    setActionLoading(false);
  }
};
  // End work session
  const handleEndSession = async () => {
    setEndingSession(true);
    setTaskError(null);
    setWorkSession(null);
    try {
      await endStaffTask();
      setCurrentTask(null);
      clearCurrentTaskFromStorage(); // Clear from localStorage when session ends
      setNextWaitingToken(null);
      setQueueStats(null);
      setWorkSessionStartedAt(null);
    } catch (err) {
      setTaskError(err.message || "Failed to end session");
    } finally {
      setEndingSession(false);
    }
  };

  // UI
  if (loading || countersLoading || servicesLoading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-2 py-8 md:px-6 md:py-10">
      {/* Active Queue Management Section */}
      {workSession && (
        <section className="grid md:grid-cols-3 gap-6">
          {/* Main Card */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 md:p-10 shadow-xl flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-dashed pb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                  Serving Now
                </span>
                <h2
                  className={`text-6xl md:text-8xl font-black tracking-tighter ${theme?.text || "text-blue-600"}`}
                >
                  {currentTask?.tokenNumber || "--"}
                </h2>
              </div>
              {currentTask?.startedAt ? (
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-500">Customer Serving Time</span>
                  <span className="font-mono text-2xl font-bold text-slate-700 bg-slate-100 px-4 py-1 rounded-lg">
                    {elapsedTime}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-500">No Customer</span>
                  <span className="font-mono text-2xl font-bold text-slate-400 px-4 py-1">
                    --:--:--
                  </span>
                </div>
              )}
            </div>
            {/* Token Details */}
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Service
                </p>
                <p className="text-lg font-bold text-slate-900">
                  {currentTask?.serviceName || "-"}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Customer
                </p>
                <p className="text-lg font-bold text-slate-900">
                  {currentTask?.fullName || "N/A"}
                </p>
              </div>
            </div>
            {/* Next in Queue & Stats */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest">
                  Next Up in Queue
                </span>
                <p className="text-lg font-bold text-sky-900">
                  {nextWaitingToken
                    ? `Token: ${nextWaitingToken.tokenNumber}`
                    : "Queue is Empty"}
                </p>
                {nextWaitingToken && (
                  <div className="text-xs text-sky-600 font-medium">
                    {nextWaitingToken.fullName}
                  </div>
                )}
              </div>
              <div className="flex-1 text-right">
                <span className="text-xs text-slate-500">Waiting in Queue</span>
                <div className="text-2xl font-bold text-slate-900">
                  {queueStats ?? "-"}
                </div>
              </div>
            </div>
            {/* Action Button */}
            <div className="pt-2">
              {currentTask ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    onClick={handleProcessToken}
                    disabled={actionLoading}
                    className={`w-full ${theme?.primary || "bg-blue-600"} text-white py-6 rounded-2xl text-2xl font-bold shadow-xl active:scale-95 transition-all hover:brightness-110 disabled:opacity-50`}
                  >
                    {actionLoading ? "Processing..." : "Complete & Call Next"}
                  </button>
                  <button
                    onClick={handleSkipToken}
                    disabled={actionLoading}
                    className="w-full rounded-2xl border border-amber-200 bg-amber-50 py-6 text-2xl font-bold text-amber-700 shadow-sm transition-all hover:bg-amber-100 active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading ? "Processing..." : "Skip & Call Next"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleProcessToken}
                  disabled={actionLoading}
                  className={`${theme?.primary || "bg-blue-600"} text-white w-full py-6 rounded-2xl text-2xl font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50`}
                >
                  {actionLoading ? "Processing..." : "Call First Customer"}
                </button>
              )}
              <p className="mt-4 text-sm text-slate-400 font-medium">
                Clicking this will finish current task and fetch the next token
                instantly.
              </p>
              {taskError && (
                <div className="text-red-500 text-sm mt-2">{taskError}</div>
              )}
            </div>
          </div>
          {/* Work Session Details */}
          <aside className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 justify-between min-h-[260px]">
            <div>
              {workSession && (
                <div className="flex justify">
                  <div
                    className={`px-4 py-2 rounded-xl font-bold border shadow-sm ${theme?.soft || "bg-slate-100"} ${theme?.border || "border-slate-200"} ${theme?.text || "text-slate-900"}`}
                  >
                    <span className="text-xs uppercase tracking-widest opacity-60 mr-2">
                      Counter:
                    </span>
                    {workSession.counterName ||
                      workSession.counterNumber ||
                      "N/A"}
                  </div>
                </div>
              )}
              <h4 className="text-slate-900 font-bold mt-10 text-lg mb-2">
                Work Session
              </h4>
              <div className="text-slate-500 text-sm mb-3">
                <span className="text-xs uppercase tracking-widest font-bold text-slate-400">Session Duration</span>
                <p className="font-mono text-lg font-bold text-slate-700 bg-white px-3 py-2 rounded-lg mt-1 border border-slate-200">
                  {sessionDuration}
                </p>
              </div>
              <div className="text-slate-500 text-sm mb-1">
                Service:{" "}
                <span className="font-bold text-slate-900">
                  {workSession.serviceName}
                </span>
              </div>
              <div className="text-slate-500 text-sm mb-1">
                Started:{" "}
                <span className="font-bold text-slate-900">
                  {workSessionStartedAt
                    ? new Date(workSessionStartedAt).toLocaleTimeString()
                    : "-"}
                </span>
              </div>
            </div>
            <button
              onClick={handleEndSession}
              disabled={endingSession}
              className={`w-full ${theme?.danger || "bg-red-600"} text-white py-3 rounded-xl text-lg font-bold shadow active:scale-95 transition-all hover:brightness-110 disabled:opacity-50`}
            >
              {endingSession ? "Ending..." : "End Work Session"}
            </button>
            {taskError && (
              <div className="text-red-500 text-sm mt-2">{taskError}</div>
            )}
          </aside>
        </section>
      )}

      {/* If no active work session, show call first customer */}
      {!workSession && (
        <section className="bg-white rounded-3xl border border-slate-200 p-10 shadow-xl text-center">
          <div className="space-y-6">
            <div className="text-5xl">😴</div>
            <h2 className="text-2xl font-bold text-slate-900">
              No Active Task
            </h2>
            <p className="text-slate-500">
              Click below to call the first customer in the queue.
            </p>
            <button
              onClick={handleProcessToken}
              disabled={actionLoading}
              className={`${theme?.primary || "bg-blue-600"} text-white px-12 py-5 rounded-2xl text-xl font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50`}
            >
              {actionLoading ? "Processing..." : "Call First Customer"}
            </button>
            {taskError && (
              <div className="text-red-500 text-sm mt-2">{taskError}</div>
            )}
          </div>
        </section>
      )}

      {/* Recently Processed History Section */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-10 shadow-xl">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Recently Processed</h3>
          <p className="text-sm text-slate-500">Tokens completed or skipped by you</p>
        </div>

        {historyLoading ? (
          <div className="p-8 text-center text-slate-500">
            Loading history...
          </div>
        ) : historyError ? (
          <div className="p-8 text-center text-red-500">
            {historyError}
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No processed tokens yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Token #</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Service</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((token, index) => {
                  const statusColor = token.status === "Completed" 
                    ? "bg-emerald-100 text-emerald-700" 
                    : "bg-amber-100 text-amber-700";
                  
                  const processedTime = token.completedAt || token.skippedAt || token.createdAt;
                  const timeDisplay = processedTime 
                    ? new Date(processedTime).toLocaleTimeString()
                    : "-";

                  return (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">
                        {token.tokenNumber}
                      </td>
                      <td className="py-4 px-4 text-slate-700">
                        {token.serviceName || "-"}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold w-24 ${statusColor}`}>
                          {token.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {timeDisplay}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
