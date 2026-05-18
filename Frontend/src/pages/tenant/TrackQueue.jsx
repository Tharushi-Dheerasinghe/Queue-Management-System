import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTenant } from "../../context/TenantContext";
import { io } from "socket.io-client";
import { Download, Search, RefreshCw, Bell, User as UserIcon } from "lucide-react";
import api from "../../services/api";

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

export default function TrackQueue() {
  const { tenantType } = useParams();
  const { tenant, orgBranding } = useTenant();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const newlyBookedId = searchParams.get("new");

  const [myTokens, setMyTokens] = useState([]);
  const [searchTokenNum, setSearchTokenNum] = useState("");
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  const primaryColor = orgBranding?.primaryColor || tenant?.theme?.primaryHex || "#0ea5e9";
  const notificationPermission = useRef(Notification.permission);

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(permission => {
        notificationPermission.current = permission;
      });
    }

    // Load saved tokens
    loadSavedTokens();

    // Socket Connection
    const newSocket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to tracking socket");
    });

    newSocket.on("queueUpdated", (updateData) => {
      // Whenever queue updates, refresh our tokens to get latest 'peopleAhead' and 'status'
      refreshAllTokens();
      
      // Check if any of our tokens were called
      const savedTokens = JSON.parse(localStorage.getItem(`queueflow_${tenantType}_my_tokens`) || "[]");
      savedTokens.forEach(token => {
        if (updateData.branchId === token.branchId && updateData.serviceId === token.serviceId) {
          if (updateData.calledToken && updateData.calledToken._id === token.id) {
            triggerNotification(
              t("It's your turn!"),
              `${t("Your token")} ${token.tokenNumber} ${t("has been called to Counter")} ${updateData.calledToken.counterNumber || ''}`
            );
          } else if (token.status === "Waiting") {
            // Check if they are next
            api.get(`/tokens/${token.id}`).then(res => {
              if (res.data.success && res.data.data.peopleAhead === 1) {
                triggerNotification(
                  t("Get Ready!"),
                  `${t("Only 1 person ahead of you for")} ${token.serviceName}.`
                );
              }
            }).catch(() => {});
          }
        }
      });
    });

    return () => newSocket.disconnect();
  }, [tenantType]);

  const triggerNotification = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: orgBranding?.logoUrl || '/favicon.ico' });
    }
  };

  const loadSavedTokens = () => {
    let saved = JSON.parse(localStorage.getItem(`queueflow_${tenantType}_my_tokens`) || "[]");
    saved = saved.filter(t => t && (t.id || t._id));
    setMyTokens(saved);
  };

  const refreshAllTokens = async () => {
    const saved = JSON.parse(localStorage.getItem(`queueflow_${tenantType}_my_tokens`) || "[]");
    if (saved.length === 0) return;

    try {
      const updatedTokens = await Promise.all(saved.map(async (t) => {
        try {
          const res = await api.get(`/tokens/${t.id || t._id}`);
          if (res.data.success) {
            return { ...t, ...res.data.data, id: res.data.data._id || res.data.data.id };
          }
        } catch (e) { }
        return t;
      }));
      localStorage.setItem(`queueflow_${tenantType}_my_tokens`, JSON.stringify(updatedTokens));
      setMyTokens(updatedTokens);
    } catch (e) {
      console.error("Failed to refresh tokens", e);
    }
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!searchTokenNum.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/tokens/track/${searchTokenNum.trim()}`);
      if (res.data.success) {
        const tokenData = res.data.data;
        const exists = myTokens.some(t => t.tokenNumber === tokenData.tokenNumber);
        if (!exists) {
          const newTokens = [...myTokens, { ...tokenData, id: tokenData._id }];
          localStorage.setItem(`queueflow_${tenantType}_my_tokens`, JSON.stringify(newTokens));
          setMyTokens(newTokens);
        }
        setSearchTokenNum("");
      }
    } catch (err) {
      alert(err.response?.data?.message || t("Token not found"));
    } finally {
      setLoading(false);
    }
  };

  const printToken = (token) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Token ${token.tokenNumber}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; text-align: center; }
            .card { border: 2px dashed #ccc; padding: 30px; border-radius: 16px; max-width: 400px; margin: auto; }
            h1 { font-size: 48px; margin: 10px 0; color: ${primaryColor}; }
            p { font-size: 18px; color: #555; margin: 5px 0; }
            .org { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; }
            .date { font-size: 14px; color: #888; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="org">${token.organizationName}</div>
            <p>${token.branchName} • ${token.serviceName}</p>
            <h1>${token.tokenNumber}</h1>
            <p><strong>Name:</strong> ${token.fullName}</p>
            ${token.estimatedWait ? `<p><strong>Est. Wait:</strong> ${token.estimatedWait}</p>` : ''}
            <div class="date">${new Date(token.createdAt || Date.now()).toLocaleString()}</div>
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const removeToken = (tokenId) => {
    const filtered = myTokens.filter(t => (t.id || t._id) !== tokenId);
    localStorage.setItem(`queueflow_${tenantType}_my_tokens`, JSON.stringify(filtered));
    setMyTokens(filtered);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 pt-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="text-slate-500" />
            {t("Track Queue")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t("Watch your live queue status here.")}</p>
        </div>
        
        <form onSubmit={handleManualSearch} className="flex w-full md:w-auto relative">
          <input 
            type="text" 
            placeholder={t("Enter Token Number...")}
            value={searchTokenNum}
            onChange={(e) => setSearchTokenNum(e.target.value)}
            className="pl-4 pr-12 py-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full md:w-72 focus:outline-none focus:ring-2 shadow-sm"
            style={{ '--tw-ring-color': primaryColor }}
          />
          <button type="submit" disabled={loading} className="absolute right-1 top-1 p-2 rounded-full text-white transition disabled:opacity-50" style={{ backgroundColor: primaryColor }}>
            <Search size={20} />
          </button>
        </form>
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={refreshAllTokens} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">
          <RefreshCw size={16} /> {t("Refresh Status")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {myTokens.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t("No saved tokens")}</h2>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">{t("Book a token or enter your token number above to start tracking your queue status.")}</p>
          </div>
        ) : (
          myTokens.map(token => {
            const isNew = token.id === newlyBookedId || token._id === newlyBookedId;
            const isWaiting = token.status === "Waiting";
            const isCalled = token.status === "Called";
            const isCompleted = token.status === "Completed";
            
            return (
              <div 
                key={token.id || token._id} 
                className={`relative bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border-2 overflow-hidden transition-all ${isNew ? 'animate-in zoom-in duration-500' : ''}`}
                style={{ borderColor: isCalled ? primaryColor : (isWaiting ? 'transparent' : '#cbd5e1') }}
              >
                {isNew && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                    {t("Newly Booked")}
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row gap-6 md:items-center">
                  {/* Token Big Number */}
                  <div className="flex flex-col items-center justify-center min-w-[140px] p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <span className="text-sm font-bold text-slate-400">{t("TOKEN NO")}</span>
                    <span className="text-5xl font-black mt-1" style={{ color: primaryColor }}>{token.tokenNumber}</span>
                  </div>

                  {/* Token Details */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{token.organizationName}</h3>
                      <p className="text-sm text-slate-500 font-medium">{token.branchName} • {token.serviceName}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <UserIcon size={16} />
                      <span className="font-semibold">{token.fullName}</span>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-center md:items-end justify-between min-h-[100px] border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                    {isWaiting ? (
                      <div className="text-center md:text-right w-full">
                        <div className="text-sm font-semibold text-slate-500">{t("People Ahead")}</div>
                        <div className="text-4xl font-extrabold text-slate-900 dark:text-white">{token.peopleAhead || 0}</div>
                        {token.estimatedWait && <div className="text-xs text-orange-500 font-bold mt-1">{t("Wait:")} ~{token.estimatedWait}</div>}
                      </div>
                    ) : (
                      <div className="text-center md:text-right w-full">
                        <div className="text-sm font-semibold text-slate-500">{t("Status")}</div>
                        <div className={`text-2xl font-black ${isCalled ? 'animate-pulse' : ''}`} style={isCalled ? { color: primaryColor } : { color: '#64748b' }}>
                          {t(token.status)}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 w-full mt-4">
                      <button 
                        onClick={() => printToken(token)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        <Download size={16} /> {t("PDF")}
                      </button>
                      <button 
                        onClick={() => removeToken(token.id || token._id)}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      >
                        {t("Remove")}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
