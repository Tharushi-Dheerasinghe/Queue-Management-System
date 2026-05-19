import { useEffect, useMemo, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  callNextToken,
  getStaffBranchCounters,
  getStaffBranchServices,
  updateTokenStatus,
  createWalkInToken,
  getWaitingTokensList,
  recallTokenAPI,
  getWaitRejectedList,
  getActiveTokens
} from "../../services/staffService";
import { validateCustomerDetails } from "../../utils/customerValidation";

const formatElapsedTime = (startedAt, nowTimestamp) => {
  if (!startedAt) return "00:00:00";
  const started = new Date(startedAt).getTime();
  const diffSeconds = Math.max(0, Math.floor((nowTimestamp - started) / 1000));
  const hours = String(Math.floor(diffSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((diffSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(diffSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

// Icons
const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const UserPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default function StaffDashboard() {
  const { user, role, logout, branchId: authBranchId, tenantType: authTenantType, organizationId: authOrgId } = useAuth();
  const context = useOutletContext() || {};
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/staff-login"); 
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("staff_dashboard_theme");
    return saved ? saved === "dark" : true; 
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      localStorage.setItem("staff_dashboard_theme", newVal ? "dark" : "light");
      return newVal;
    });
  };

  // Branch data
  const [counters, setCounters] = useState([]);
  const [services, setServices] = useState([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [taskError, setTaskError] = useState(null);
  
  // Global Branch Data
  const [globalWaitingList, setGlobalWaitingList] = useState([]); // All waiting tokens
  const [globalWaitRejectedList, setGlobalWaitRejectedList] = useState([]); // All late/skipped tokens
  const [activeTokens, setActiveTokens] = useState([]); // All Currently 'Called' tokens

  // Active Control State
  const [activeUnitId, setActiveUnitId] = useState("");
  
  // Walk-in form state
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInMobile, setWalkInMobile] = useState("07");
  const [walkInService, setWalkInService] = useState("");
  const [walkInErrors, setWalkInErrors] = useState({});

  const [nowTimestamp, setNowTimestamp] = useState(Date.now());

  // Initialization
  useEffect(() => {
    Promise.all([getStaffBranchCounters(), getStaffBranchServices()]).then(([countersRes, servicesRes]) => {
      const s = servicesRes.services || [];
      setCounters(countersRes.counters || []);
      setServices(s);
      
      // Default to first service for both active control and walk-in form
      if (s.length > 0) {
        setActiveUnitId(s[0].id);
        setWalkInService(s[0].id);
      }
    }).catch(console.error);
  }, []);

  const fetchGlobalQueue = useCallback(async () => {
    const activeBranchId = authBranchId;
    if (!activeBranchId) return;

    try {
      const [waitingRes, waitRejectRes, activeRes] = await Promise.all([
        getWaitingTokensList(activeBranchId),
        getWaitRejectedList(activeBranchId),
        getActiveTokens(activeBranchId)
      ]);
      
      setGlobalWaitingList(waitingRes.tokens || []);
      setGlobalWaitRejectedList(waitRejectRes.tokens || []);
      setActiveTokens(activeRes.tokens || []);
      setTaskError(null);
    } catch (err) {
      console.error("Error fetching global queue:", err);
    } finally {
      setLoading(false);
    }
  }, [authBranchId]);

  useEffect(() => {
    if (authBranchId) {
      fetchGlobalQueue();
    }
  }, [fetchGlobalQueue, authBranchId]);

  // Live socket updates
  useEffect(() => {
    if (!authBranchId) return;

    const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    const socket = io(SOCKET_URL);

    socket.on("connect", () => {
      socket.emit("joinBranch", authBranchId);
    });

    socket.on("queueUpdated", () => {
      fetchGlobalQueue();
    });

    return () => socket.disconnect();
  }, [authBranchId, fetchGlobalQueue]);

  useEffect(() => {
    const timerId = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => clearInterval(timerId);
  }, []);

  // Derived state for the currently controlled unit
  const activeToken = activeTokens.find(t => t.serviceId === activeUnitId);
  const activeUnitWaitRejectList = globalWaitRejectedList.filter(t => t.serviceId === activeUnitId);
  
  // Find counter for active unit (assume first counter assigned to service)
  const getCounterForService = (serviceId) => {
    return counters.find(c => c.serviceId === serviceId)?.id;
  };

  const elapsedTime = useMemo(
    () => formatElapsedTime(activeToken?.startedAt, nowTimestamp),
    [activeToken?.startedAt, nowTimestamp]
  );

  const handleProcessToken = async () => {
    setActionLoading(true);
    setTaskError(null);
    try {
      const counterId = getCounterForService(activeUnitId);
      if (!counterId) throw new Error("No counter assigned to this unit.");

      const res = await callNextToken(counterId);
      if (!res.success || !res.token) {
        setTaskError(res.message || "No more customers in queue");
      }
      await fetchGlobalQueue();
    } catch (error) {
      setTaskError(error.message || "No more customers in queue.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWaitToken = async () => {
    if (!activeToken?._id) return;
    setActionLoading(true);
    try {
      await updateTokenStatus(activeToken._id, "Late"); 
      handleProcessToken(); 
    } catch (error) {
      setTaskError(error.message || "Failed to set token to wait");
      setActionLoading(false);
    }
  };

  const handleRejectToken = async () => {
    if (!activeToken?._id) return;
    setActionLoading(true);
    try {
      await updateTokenStatus(activeToken._id, "Skipped"); 
      handleProcessToken(); 
    } catch (error) {
      setTaskError(error.message || "Failed to reject token");
      setActionLoading(false);
    }
  };

  const handleRecallToken = async (tokenId) => {
    setActionLoading(true);
    setTaskError(null);
    try {
      const counterId = getCounterForService(activeUnitId);
      if (!counterId) throw new Error("No counter assigned to this unit.");

      await recallTokenAPI(tokenId, counterId);
      await fetchGlobalQueue();
    } catch (error) {
      setTaskError(error.message || "Failed to recall token.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWalkInMobileChange = (e) => {
    let v = String(e.target.value || "");
    if (!v.startsWith("07")) {
      const digits = v.replace(/\D/g, "");
      v = `07${digits}`;
    }
    const after = v.slice(2).replace(/\D/g, "").slice(0, 8);
    setWalkInMobile(`07${after}`.slice(0, 10));
  };

  const handleAddWalkIn = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setWalkInErrors({});
    try {
      if (!authBranchId || !walkInService) throw new Error("Branch or Service missing.");

      const validation = validateCustomerDetails({
        fullName: walkInName,
        mobile: walkInMobile,
        requireName: false,
      });

      if (!validation.isValid) {
        setWalkInErrors(validation.errors);
        throw new Error(Object.values(validation.errors)[0] || "Invalid customer details.");
      }

      await createWalkInToken({
        tenantType: context.tenantType || authTenantType,
        organizationId: authOrgId,
        branchId: authBranchId,
        serviceId: walkInService,
        fullName: validation.values.fullName,
        mobile: validation.values.mobile,
      });

      setWalkInName("");
      setWalkInMobile("07");
      setIsWalkInModalOpen(false);
      await fetchGlobalQueue();
      alert("Token generated successfully!");
    } catch (error) {
      alert(error.message || error?.errors?.mobile || "Failed to create token");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 text-white font-bold text-3xl">Loading Dashboard...</div>;
  }

  // Group waiting list by service for the global view at bottom
  const groupedWaitingLists = services.map(service => {
    return {
      service,
      tokens: globalWaitingList.filter(t => t.serviceId === service.id)
    };
  });

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col p-4 md:p-6 transition-colors duration-300 overflow-y-auto lg:overflow-hidden ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* Top Header */}
      <div className={`flex justify-between items-center mb-6 px-4 py-3 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest opacity-90">Staff Terminal</h1>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{user?.email} • {role}</p>
          </div>
          <div className="h-8 w-px bg-slate-500/30"></div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Active Unit:</span>
            <select 
              value={activeUnitId} 
              onChange={(e) => setActiveUnitId(e.target.value)} 
              className={`rounded-xl px-6 py-3 font-bold text-base md:text-lg outline-none cursor-pointer border transition min-w-fit ${isDarkMode ? 'bg-slate-900 border-blue-500 text-blue-300 focus:border-blue-400' : 'bg-slate-50 border-blue-400 text-blue-800 focus:border-blue-500'}`}
            >
              {services.map(s => <option key={s.id} value={s.id}>{s.serviceName}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsWalkInModalOpen(true)}
            className="flex items-center bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition active:scale-95 uppercase tracking-wide text-sm"
          >
            <UserPlusIcon />
            Get Token
          </button>
          <button 
            onClick={toggleTheme}
            className={`p-3 rounded-xl transition ${isDarkMode ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
            title="Toggle Theme"
          >
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </button>
          <button 
            onClick={handleLogout}
            className={`p-3 rounded-xl transition flex items-center justify-center ${isDarkMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'}`}
            title="Logout"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>

      {/* Main Control Panel (Only for activeUnitId) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 flex-none lg:flex-[2] min-h-0 mb-4 md:mb-6">
        
        {/* Left Sidebar: Wait & Rejected List for Active Unit */}
        <div className={`col-span-1 rounded-3xl border shadow-xl flex flex-col min-h-[300px] lg:min-h-0 overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`p-4 border-b font-bold tracking-wider uppercase text-center ${isDarkMode ? 'bg-slate-950/50 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
            Wait / Rejected ({services.find(s=>s.id===activeUnitId)?.serviceName || ""})
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {activeUnitWaitRejectList.length === 0 ? (
              <div className="flex items-center justify-center h-full opacity-50 text-sm font-medium">Empty List</div>
            ) : (
              activeUnitWaitRejectList.map((t, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-2xl shadow-sm border transition ${isDarkMode ? 'bg-slate-700 border-slate-600 hover:border-slate-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                  <div>
                    <p className={`font-black text-xl tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{t.tokenNumber}</p>
                    <p className={`text-[10px] mt-0.5 font-bold uppercase tracking-wider ${t.status === 'Late' ? 'text-amber-500' : 'text-red-500'}`}>
                      {t.status === 'Late' ? 'Wait List' : 'Rejected'}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleRecallToken(t._id)}
                    disabled={actionLoading}
                    className="font-black bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg hover:bg-emerald-500 transition active:scale-95 disabled:opacity-50 uppercase text-xs tracking-widest"
                  >
                    Get
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center: Main Display & Controls for Active Unit */}
        <div className={`col-span-1 lg:col-span-3 flex flex-col rounded-3xl shadow-2xl border overflow-y-auto min-h-[400px] lg:min-h-96 relative ${isDarkMode ? 'bg-slate-800 border-slate-700 shadow-black/30' : 'bg-white border-slate-200'}`}>
          <div className={`absolute top-0 left-0 w-full h-3 shrink-0 ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'}`}></div>
          
          <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6 text-center min-h-min">
            <h2 className={`text-xl font-black uppercase tracking-[0.3em] mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Serving Now: {services.find(s=>s.id===activeUnitId)?.serviceName || ""}</h2>
            
            <div className={`text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter my-2 lg:my-4 leading-none ${isDarkMode ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'text-blue-700'}`}>
              {activeToken?.tokenNumber || "--"}
            </div>
            
            <div className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {activeToken?.fullName || "No Customer Assigned"}
            </div>
            
            <div className={`text-lg font-mono font-bold px-5 py-1 rounded-full ${isDarkMode ? 'bg-black/40 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              Time: {elapsedTime}
            </div>

            {taskError && <p className="text-red-500 mt-2 font-bold text-sm">{taskError}</p>}
          </div>
          
          {/* Action Buttons */}
          <div className={`grid grid-cols-3 gap-3 lg:gap-4 p-4 lg:p-6 border-t shrink-0 ${isDarkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            {activeToken ? (
              <>
                <button onClick={handleWaitToken} disabled={actionLoading} className={`col-span-1 py-4 rounded-2xl font-black text-xl uppercase tracking-widest transition active:scale-95 shadow-xl border-2 ${isDarkMode ? 'bg-slate-800 border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-slate-900' : 'bg-white border-amber-400 text-amber-600 hover:bg-amber-50'}`}>
                  Wait
                </button>
                <button onClick={handleProcessToken} disabled={actionLoading} className="col-span-1 py-4 rounded-2xl font-black text-xl uppercase tracking-widest transition active:scale-95 shadow-xl bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-600 shadow-emerald-900/20">
                  Done
                </button>
                <button onClick={handleRejectToken} disabled={actionLoading} className={`col-span-1 py-4 rounded-2xl font-black text-xl uppercase tracking-widest transition active:scale-95 shadow-xl border-2 ${isDarkMode ? 'bg-slate-800 border-red-500 text-red-400 hover:bg-red-500 hover:text-slate-900' : 'bg-white border-red-500 text-red-600 hover:bg-red-50'}`}>
                  Reject
                </button>
              </>
            ) : (
              <button onClick={handleProcessToken} disabled={actionLoading} className="col-span-3 py-3 lg:py-4 rounded-2xl font-black text-xl lg:text-2xl uppercase tracking-widest transition active:scale-95 shadow-2xl bg-blue-600 hover:bg-blue-500 text-white border-2 border-blue-500 shadow-blue-900/30">
                Call Next Customer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Global View: All Units (Horizontal scrollable grid) */}
      <div className={`flex-1 rounded-3xl border shadow-xl flex flex-col overflow-hidden min-h-[200px] ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className={`p-4 border-b font-black tracking-widest uppercase flex items-center gap-3 ${isDarkMode ? 'bg-slate-950/50 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
          <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'}`}></div>
          Branch Global Queue View
        </div>
        
        <div className="flex-1 overflow-x-auto p-4 flex gap-4">
          {groupedWaitingLists.map(group => (
            <div key={group.service.id} className={`w-72 flex-shrink-0 flex flex-col rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`p-3 border-b text-center font-bold tracking-wider uppercase text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'} rounded-t-2xl`}>
                {group.service.serviceName}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-black ${isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>{group.tokens.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {group.tokens.length === 0 ? (
                  <div className="flex items-center justify-center h-full opacity-40 text-xs font-bold uppercase tracking-widest mt-10">Empty</div>
                ) : (
                  group.tokens.map((t, idx) => (
                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${isDarkMode ? 'bg-slate-700 text-blue-400 shadow-inner' : 'bg-slate-100 text-slate-600'}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className={`font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.tokenNumber}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Walk-in Modal */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className={`w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border-2 ${isDarkMode ? 'bg-slate-800 border-slate-700 shadow-black' : 'bg-white border-slate-200'}`}>
            <div className={`px-8 py-6 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
              <h2 className={`text-2xl font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Get Token</h2>
              <button onClick={() => setIsWalkInModalOpen(false)} className={`text-4xl font-bold opacity-50 hover:opacity-100 transition ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>&times;</button>
            </div>
            <form onSubmit={handleAddWalkIn} className="p-8 space-y-6">
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Unit</label>
                <select 
                  value={walkInService} 
                  onChange={(e) => setWalkInService(e.target.value)} 
                  className={`w-full rounded-2xl px-5 py-4 font-bold text-lg outline-none focus:ring-4 transition border-2 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:ring-blue-900 focus:border-blue-700' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-100 focus:border-blue-300'}`}
                >
                  {services.map(s => <option key={s.id} value={s.id}>{s.serviceName}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Customer Name (Optional)</label>
                <input 
                  type="text" 
                  value={walkInName} 
                  onChange={(e) => setWalkInName(e.target.value)} 
                  className={`w-full rounded-2xl px-5 py-4 font-bold text-lg outline-none focus:ring-4 transition border-2 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:ring-blue-900 focus:border-blue-700 placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-100 focus:border-blue-300 placeholder-slate-400'}`} 
                  placeholder="e.g. John Doe" 
                />
                {walkInErrors.fullName ? <p className="mt-2 text-xs text-red-500 font-semibold">{walkInErrors.fullName}</p> : null}
              </div>
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mobile Number *</label>
                <input 
                  type="text" 
                  value={walkInMobile} 
                  onChange={handleWalkInMobileChange} 
                  required 
                  className={`w-full rounded-2xl px-5 py-4 font-bold text-lg outline-none focus:ring-4 transition border-2 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:ring-blue-900 focus:border-blue-700 placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-100 focus:border-blue-300 placeholder-slate-400'}`} 
                  placeholder="0712345678" 
                />
                {walkInErrors.mobile ? <p className="mt-2 text-xs text-red-500 font-semibold">{walkInErrors.mobile}</p> : null}
              </div>
              <button 
                type="submit" 
                disabled={actionLoading} 
                className="w-full mt-6 bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-xl py-6 rounded-2xl shadow-xl hover:bg-blue-500 transition active:scale-95 disabled:opacity-50"
              >
                Generate Token
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
