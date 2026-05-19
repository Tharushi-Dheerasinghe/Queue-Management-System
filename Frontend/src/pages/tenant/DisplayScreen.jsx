import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import { createQueueSocket } from "../../utils/socketClient";

export default function DisplayScreen() {
  const { branchId } = useParams();
  const [data, setData] = useState(null);
  const [branding, setBranding] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchDisplayData = useCallback(async () => {
    try {
      const response = await api.get(`/branches/${branchId}/display`);
      setData(response.data.data);
      setBranding(response.data.data.branding || {});
    } catch (error) {
      console.error("Failed to fetch display data:", error);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchDisplayData();
  }, [fetchDisplayData]);

  useEffect(() => {
    if (!branchId) return;

    const socket = createQueueSocket();

    socket.on("connect", () => {
      socket.emit("joinBranch", branchId);
      fetchDisplayData();
    });

    socket.on("queueUpdated", (updateData) => {
      if (
        updateData.action === "callNextToken" ||
        updateData.action === "iotNextToken" ||
        updateData.action === "skipAndCallNextToken" ||
        updateData.action === "recallToken"
      ) {
        try {
          const audio = new Audio("/notification.mp3");
          audio.play().catch(() => {});
        } catch {
          // ignore audio errors
        }
      }
      fetchDisplayData();
    });

    return () => socket.disconnect();
  }, [branchId, fetchDisplayData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <h1 className="text-4xl font-bold">Loading Display...</h1>
      </div>
    );
  }

  if (!data || !data.branch) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-red-500">
        <h1 className="text-4xl font-bold">Branch Not Found or Error Loading</h1>
      </div>
    );
  }

  const { branch, called, waiting } = data;

  return (
    <div className="flex h-screen flex-col bg-slate-900 text-white overflow-hidden">
      <header
        className={`flex items-center justify-between px-8 py-6 shadow-md ${!branding?.primaryColor ? "bg-slate-800" : ""}`}
        style={branding?.primaryColor ? { backgroundColor: branding.primaryColor } : {}}
      >
        <div className="flex items-center gap-4">
          {branding?.logoUrl && (
            <img src={branding.logoUrl} alt="Logo" className="h-14 w-14 object-contain bg-white rounded-xl p-1 shadow-sm" />
          )}
          <div>
            <h1 className="text-5xl font-extrabold text-white">{branch.organizationName}</h1>
            <h2 className="text-2xl text-slate-100 mt-2 opacity-90">{branch.branchName} Branch</h2>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-blue-400">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="text-lg text-slate-400 mt-1">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>
      </header>

      <div className="flex flex-1 gap-8 p-8">
        <div className="flex-[2] flex flex-col rounded-3xl bg-slate-800 shadow-2xl overflow-hidden border border-slate-700">
          <div className="bg-blue-600 px-8 py-4">
            <h2 className="text-3xl font-bold text-white uppercase tracking-widest text-center">Currently Serving</h2>
          </div>
          <div className="flex-1 p-8 grid grid-cols-2 gap-8 auto-rows-max overflow-y-auto">
            {called.length === 0 ? (
              <div className="col-span-2 flex items-center justify-center h-full text-slate-500 text-3xl">
                No active tokens
              </div>
            ) : (
              called.map((token) => (
                <div
                  key={token._id}
                  className="flex flex-col items-center justify-center rounded-2xl bg-slate-700 p-8 shadow-inner border border-slate-600"
                >
                  <div className="text-2xl text-slate-400 font-semibold mb-2 uppercase tracking-wide">
                    {token.unitName || token.serviceName}
                  </div>
                  <div className="text-7xl font-black text-amber-400 tracking-tighter mb-4">{token.tokenNumber}</div>
                  <div className="text-2xl text-white font-medium bg-slate-900 px-6 py-2 rounded-full">
                    {token.counterName || "Counter"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col rounded-3xl bg-slate-800 shadow-2xl overflow-hidden border border-slate-700">
          <div className="bg-slate-700 px-8 py-4 border-b border-slate-600">
            <h2 className="text-2xl font-bold text-slate-300 uppercase tracking-widest text-center">Please Wait</h2>
          </div>
          <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
            {waiting.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-2xl">Queue is empty</div>
            ) : (
              waiting.map((token, index) => (
                <div
                  key={token._id}
                  className="flex items-center justify-between rounded-xl bg-slate-700 p-6 border-l-4 border-blue-500 shadow-sm"
                >
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-sm uppercase font-semibold">{token.serviceName}</span>
                    <span className="text-4xl font-bold text-white mt-1">{token.tokenNumber}</span>
                  </div>
                  <div className="text-blue-300 text-xl font-medium">Next {index + 1}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
