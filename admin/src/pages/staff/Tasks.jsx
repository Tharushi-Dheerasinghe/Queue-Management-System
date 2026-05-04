import { useEffect, useMemo, useState } from "react";
import {
  endStaffTask,
  getCurrentStaffTask,
  getStaffBranchCounters,
  getStaffBranchServices,
  startStaffTask,
} from "../../services/staffService";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

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

export default function StaffTasks() {
  const [currentTask, setCurrentTask] = useState(null);
  const [services, setServices] = useState([]);
  const [counters, setCounters] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [counterId, setCounterId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState("");
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());

  const loadTaskData = async () => {
    const [taskResponse, servicesResponse, countersResponse] =
      await Promise.all([
        getCurrentStaffTask(),
        getStaffBranchServices(),
        getStaffBranchCounters(),
      ]);

    setCurrentTask(taskResponse?.currentTask || null);
    setServices(
      Array.isArray(servicesResponse?.services)
        ? servicesResponse.services
        : [],
    );
    setCounters(
      Array.isArray(countersResponse?.counters)
        ? countersResponse.counters
        : [],
    );
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        setLoading(true);
        setError("");
        await loadTaskData();
        if (!isMounted) return;
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Failed to load tasks page data");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentTask) return undefined;
    setNowTimestamp(Date.now());
    const intervalId = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [currentTask]);

  const elapsedTime = useMemo(
    () => formatElapsedTime(currentTask?.startedAt, nowTimestamp),
    [currentTask?.startedAt, nowTimestamp],
  );

  const formDisabled = Boolean(currentTask) || loading || submitting || ending;

  // තෝරාගත් Service එකට අදාළ Counters පමණක් පෙරීම
  const filteredCounters = useMemo(() => {
    if (!serviceId) return [];
    return counters.filter(
      (counter) =>
        String(counter.serviceId) === String(serviceId) &&
        counter.status === "inactive",
    );
  }, [counters, serviceId]);

  const handleServiceChange = (event) => {
    const selectedServiceId = event.target.value;
    setServiceId(selectedServiceId);
    setCounterId(""); // Service එක වෙනස් කළ විට Counter එක Reset කරයි
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!serviceId || !counterId) {
      setError("Please select both service and counter before starting work");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await startStaffTask({ serviceId, counterId });
      const taskResponse = await getCurrentStaffTask();
      setCurrentTask(taskResponse?.currentTask || null);
    } catch (err) {
      setError(err?.message || "Failed to start work");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndWork = async () => {
    try {
      setEnding(true);
      setError("");
      await endStaffTask();
      setCurrentTask(null);
      setServiceId("");
      setCounterId("");
    } catch (err) {
      setError(err?.message || "Failed to end work");
    } finally {
      setEnding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          My Tasks
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Select a service and counter to start your work session
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-500">Loading task details...</p>
        </section>
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Current Active Task
            </h2>
            {currentTask ? (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Service
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {currentTask.serviceName || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Counter
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {currentTask.counterName || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Started At
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatDateTime(currentTask.startedAt)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Shift Time: {elapsedTime}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Status
                  </p>
                  <p className="mt-1 text-sm font-semibold text-emerald-700">
                    {currentTask.status || "active"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No active task found. Start work from the form below.
              </p>
            )}
          </section>

          {currentTask && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">
                You already have an active task. You cannot start another task
                until this one is completed.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleEndWork}
                  disabled={ending}
                  className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
                >
                  {ending ? "Ending..." : "End Work"}
                </button>
              </div>
            </section>
          )}

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-slate-900">Start Work</h2>
            <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="serviceId"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Service <span className="text-red-600">*</span>
                </label>
                <select
                  id="serviceId"
                  value={serviceId}
                  onChange={handleServiceChange}
                  disabled={formDisabled}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100 disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.serviceName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="counterId"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Counter <span className="text-red-600">*</span>
                </label>
                <select
                  id="counterId"
                  value={counterId}
                  onChange={(e) => setCounterId(e.target.value)}
                  disabled={formDisabled || !serviceId}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100 disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {!serviceId ? (
                    <option value="">First select a service</option>
                  ) : (
                    <>
                      <option value="">Select a counter</option>
                      {filteredCounters.map((counter) => (
                        <option key={counter.id} value={counter.id}>
                          {counter.counterName}
                        </option>
                      ))}
                    </>
                  )}
                </select>

                {serviceId && (
                  <>
                    {/* තෝරාගත් සේවාවට අදාළ කවුන්ටර කිසිවක් නැතිනම් */}
                    {counters.filter(
                      (c) => String(c.serviceId) === String(serviceId),
                    ).length === 0 ? (
                      <p className="mt-1 text-xs text-red-500">
                        No counters assigned to this service.
                      </p>
                    ) : (
                      filteredCounters.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600 font-medium">
                          All counters for this service are currently occupied.
                        </p>
                      )
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <button
                type="submit"
                disabled={formDisabled || !serviceId || !counterId}
                className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
              >
                {submitting ? "Starting..." : "Start Work"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
