import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getBranchesForTenantSelection } from "../../services/tenantSelectionService";
import { useTenant } from "../../context/TenantContext";
import { Calendar, Clock, MapPin, Activity, CheckCircle2, XCircle, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import api from "../../services/api";
import { validateCustomerDetails } from "../../utils/customerValidation";
import { formatMobileInput, mobileInputProps } from "../../utils/phoneInput";
import {
  formatLocalDateStr,
  isWorkingDay,
  parseLocalDateStr,
} from "../../utils/workingDayUtils";

export default function OrganizationDetails() {
  const { tenantType, organizationId } = useParams();
  const { tenant, orgBranding, selectedOrganization } = useTenant();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking Modal State
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", mobile: "07", nic: "", age: "" });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [selectedDates, setSelectedDates] = useState({});
  const [dateStripStarts, setDateStripStarts] = useState({});

  const getSelectedDate = (branchId) => {
    if (selectedDates[branchId]) return selectedDates[branchId];
    return formatLocalDateStr(new Date());
  };

  const getDateStripStart = (branchId) => {
    if (dateStripStarts[branchId]) return dateStripStarts[branchId];
    return new Date();
  };

  const shiftDateStrip = (branchId, days) => {
    setDateStripStarts(prev => {
      const currentStart = prev[branchId] || new Date();
      const next = new Date(currentStart);
      next.setDate(next.getDate() + days);
      return { ...prev, [branchId]: next };
    });
  };

  const jumpToDate = (branchId, e) => {
    if(e.target.value) {
      const d = new Date(e.target.value);
      setDateStripStarts(prev => ({ ...prev, [branchId]: d }));
      setSelectedDates(prev => ({ ...prev, [branchId]: e.target.value }));
    }
  };

  const generateDateStrip = (branchId) => {
    const dates = [];
    const start = getDateStripStart(branchId);
    for(let i=0; i<7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getBranchesForTenantSelection({ tenantType, organizationId });
        setBranches(data);
      } catch (err) {
        setError(err.message || "Failed to load details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenantType, organizationId]);

  const handleBookClick = (branch, service, isAvailable) => {
    if (!isAvailable) return;
    setSelectedBranch(branch);
    setSelectedService(service);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "mobile") {
      setFormData((prev) => ({ ...prev, mobile: formatMobileInput(value) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    const validation = validateCustomerDetails(formData);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setBookingError(Object.values(validation.errors)[0] || "Please fix the highlighted fields.");
      return;
    }

    setBookingLoading(true);
    setBookingError("");
    setFieldErrors({});
    try {
      const payload = {
        tenantType,
        organizationId,
        branchId: selectedBranch.id,
        serviceId: selectedService.id,
        bookingDate: getSelectedDate(selectedBranch.id),
        fullName: validation.values.fullName,
        mobile: validation.values.mobile,
        nic: validation.values.nic,
        age: validation.values.age || undefined,
      };
      
      const response = await api.post("/tokens", payload);
      
      if (response.data.success) {
        // Save to local storage for tracking
        const savedTokens = JSON.parse(localStorage.getItem(`queueflow_${tenantType}_my_tokens`) || "[]");
        const tokenData = response.data.token || response.data.data;
        if(tokenData) {
          savedTokens.push(tokenData);
          localStorage.setItem(`queueflow_${tenantType}_my_tokens`, JSON.stringify(savedTokens));
        }
        
        setShowModal(false);
        // Navigate to track with token ID or show success here (we will implement TrackQueue next)
        navigate(`/${tenantType}/track?new=${tokenData?.id || tokenData?._id}`);
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.errors
        ? Object.values(err.response.data.errors)[0]
        : "Failed to book token";
      setBookingError(message);
    } finally {
      setBookingLoading(false);
    }
  };

  const primaryColor = orgBranding?.primaryColor || tenant?.theme?.primaryHex || "#0ea5e9";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryColor }}></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-10">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Organization Header */}
      <div 
        className="rounded-3xl p-8 mb-10 shadow-xl text-white relative overflow-hidden"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center gap-6">
          {orgBranding?.logoUrl ? (
            <img src={orgBranding.logoUrl} alt="Logo" className="w-24 h-24 rounded-2xl bg-white p-2 shadow-lg object-contain" />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
              <Activity size={40} className="text-white" />
            </div>
          )}
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">{selectedOrganization || t("Organization Details")}</h1>
            <p className="text-lg opacity-90 mt-2">{orgBranding?.welcomeText || t("Welcome to our services")}</p>
          </div>
        </div>
      </div>

      {/* Branches List */}
      <div className="space-y-12">
        {branches.length === 0 ? (
          <div className="text-center text-slate-500 py-10">{t("No branches available.")}</div>
        ) : (
          branches.map((branch) => (
            <div key={branch.id} className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 dark:border-slate-800 pb-6 mb-8 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{branch.branchName}</h2>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      {t("Branch")} • 
                      <span className="font-medium text-slate-600 dark:text-slate-400">
                        {branch.openingTime || "08:00"} - {branch.closingTime || "17:00"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Horizontal Date Strip View */}
                <div className="flex flex-col gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <CalendarDays size={18} />
                      {t("Select Appointment Date")}
                    </h3>
                    <div className="flex items-center gap-2">
                      <input 
                        type="date"
                        value={getSelectedDate(branch.id)}
                        min={formatLocalDateStr(new Date())}
                        onChange={(e) => jumpToDate(branch.id, e)}
                        className="text-xs px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-sky-500"
                        title="Jump to specific date"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => shiftDateStrip(branch.id, -7)}
                      className="p-2 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    
                    <div className="flex-1 flex gap-2 overflow-hidden justify-between">
                      {generateDateStrip(branch.id).map((dateObj, idx) => {
                        const dateStr = formatLocalDateStr(dateObj);
                        const isSelected = getSelectedDate(branch.id) === dateStr;
                        const shortDay = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                        const dayNum = dateObj.getDate();
                        const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' });
                        const dayOfWeek = dateObj.getDay();

                        // check if branch has any available services on this date
                        const isBranchAvailable = branch.services?.some(s => {
                          if (s.isClosed) return false;
                          const onWorkingDay = isWorkingDay(s.workingDays, dayOfWeek);
                          const isSpecificDate = s.availableDates && s.availableDates.includes(dateStr);
                          return onWorkingDay || isSpecificDate;
                        });

                        return (
                          <button
                            key={dateStr}
                            onClick={() => setSelectedDates(prev => ({ ...prev, [branch.id]: dateStr }))}
                            className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-xl border transition-all ${
                              isSelected 
                                ? "bg-sky-500 border-sky-600 text-white shadow-md transform scale-105" 
                                : isBranchAvailable
                                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
                                  : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-100 opacity-80"
                            }`}
                          >
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-sky-100' : ''}`}>{shortDay}</span>
                            <span className="text-lg font-black leading-none my-1">{dayNum}</span>
                            <span className={`text-[10px] font-semibold ${isSelected ? 'text-sky-100' : ''}`}>{monthStr}</span>
                          </button>
                        );
                      })}
                    </div>

                    <button 
                      onClick={() => shiftDateStrip(branch.id, 7)}
                      className="p-2 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branch.services && branch.services.length > 0 ? (
                  branch.services.map((service) => {
                    // Check availability based on selected date
                    const currentSelectedDateStr = getSelectedDate(branch.id);
                    const dayOfWeek = parseLocalDateStr(currentSelectedDateStr).getDay();

                    let isAvailable = false;
                    if (!service.isClosed) {
                      const onWorkingDay = isWorkingDay(service.workingDays, dayOfWeek);
                      const isSpecificDate = service.availableDates && service.availableDates.includes(currentSelectedDateStr);
                      isAvailable = onWorkingDay || isSpecificDate;
                    }

                    return (
                      <div 
                        key={service.id} 
                        onClick={() => handleBookClick(branch, service, isAvailable)}
                        className={`relative group rounded-2xl p-6 border-2 transition-all cursor-pointer ${
                          !isAvailable 
                            ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-70 cursor-not-allowed' 
                            : 'border-transparent bg-white dark:bg-slate-800 shadow-md hover:shadow-xl hover:-translate-y-1'
                        }`}
                        style={isAvailable ? { borderColor: `${primaryColor}20` } : {}}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700" style={isAvailable ? { color: primaryColor } : {}}>
                            <Clock size={24} />
                          </div>
                          <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${!isAvailable ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                            {!isAvailable ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                            {!isAvailable ? t("Closed") : t("Available")}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">{service.serviceName}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{isAvailable ? t("Click to book token") : t("Not available on selected date")}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-slate-500 py-4">{t("No services configured.")}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-white" style={{ backgroundColor: primaryColor }}>
              <h3 className="text-2xl font-bold">{t("Book Token")}</h3>
              <p className="text-white/80 text-sm mt-1">{selectedBranch?.branchName} • {selectedService?.serviceName}</p>
            </div>
            
            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
              {bookingError ? <p className="text-sm font-semibold text-red-600">{bookingError}</p> : null}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("Full Name")} *</label>
                <input required name="fullName" value={formData.fullName} onChange={handleInputChange} className={`w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 outline-none transition ${fieldErrors.fullName ? "border-red-400" : "border-slate-200 dark:border-slate-700"}`} style={{ '--tw-ring-color': primaryColor }} placeholder={t("Enter your name")} />
                {fieldErrors.fullName ? <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p> : null}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("Mobile Number")} *</label>
                <input required {...mobileInputProps} name="mobile" value={formData.mobile} onChange={handleInputChange} className={`w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 outline-none transition ${fieldErrors.mobile ? "border-red-400" : "border-slate-200 dark:border-slate-700"}`} style={{ '--tw-ring-color': primaryColor }} placeholder="0770181369" />
                {fieldErrors.mobile ? <p className="mt-1 text-xs text-red-600">{fieldErrors.mobile}</p> : null}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("NIC Number")}</label>
                  <input name="nic" value={formData.nic} onChange={handleInputChange} className={`w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 outline-none transition ${fieldErrors.nic ? "border-red-400" : "border-slate-200 dark:border-slate-700"}`} style={{ '--tw-ring-color': primaryColor }} placeholder="NIC (Optional)" />
                  {fieldErrors.nic ? <p className="mt-1 text-xs text-red-600">{fieldErrors.nic}</p> : null}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("Age")}</label>
                  <input type="number" min="1" max="120" name="age" value={formData.age} onChange={handleInputChange} className={`w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 outline-none transition ${fieldErrors.age ? "border-red-400" : "border-slate-200 dark:border-slate-700"}`} style={{ '--tw-ring-color': primaryColor }} placeholder={t("Optional")} />
                  {fieldErrors.age ? <p className="mt-1 text-xs text-red-600">{fieldErrors.age}</p> : null}
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition">
                  {t("Cancel")}
                </button>
                <button type="submit" disabled={bookingLoading} className="flex-1 px-4 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition flex justify-center items-center disabled:opacity-70" style={{ backgroundColor: primaryColor }}>
                  {bookingLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : t("Confirm Booking")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
