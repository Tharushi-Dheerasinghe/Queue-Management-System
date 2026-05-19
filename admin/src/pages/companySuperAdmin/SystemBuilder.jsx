import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { bulkCreateSystem } from "../../services/tenantService";

export default function SystemBuilder() {
  const navigate = useNavigate();
  const { tenantType } = useAuth(); // "bank", "supermarket", etc.
  
  // Helper to get item from local storage safely
  const getSaved = (key, defaultVal) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const [step, setStep] = useState(() => getSaved("systemBuilder_step", 1));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Payload State
  const [customTenantType, setCustomTenantType] = useState(() => getSaved("systemBuilder_tenant", ""));
  const [isOtherCategory, setIsOtherCategory] = useState(() => getSaved("systemBuilder_isOtherCat", false));
  const [orgName, setOrgName] = useState(() => getSaved("systemBuilder_org", ""));
  const [branding, setBranding] = useState(() => getSaved("systemBuilder_branding", {
    logoUrl: "",
    primaryColor: "#0284c7", // default sky-600
    welcomeText: "Welcome to our Queue System",
  }));
  
  // Branches with nested Units
  // Initial state: 1 branch with 1 unit
  const [branches, setBranches] = useState(() => getSaved("systemBuilder_branches", [
    { id: 1, branchName: "", city: "", units: [{ id: 1, serviceName: "" }] }
  ]));

  const [exportData, setExportData] = useState(null);

  // Persist state to local storage on changes
  useEffect(() => {
    if (step === 4) return; // Don't persist success step to avoid locking user there
    localStorage.setItem("systemBuilder_step", JSON.stringify(step));
    localStorage.setItem("systemBuilder_tenant", JSON.stringify(customTenantType));
    localStorage.setItem("systemBuilder_isOtherCat", JSON.stringify(isOtherCategory));
    localStorage.setItem("systemBuilder_org", JSON.stringify(orgName));
    localStorage.setItem("systemBuilder_branding", JSON.stringify(branding));
    localStorage.setItem("systemBuilder_branches", JSON.stringify(branches));
  }, [step, customTenantType, isOtherCategory, orgName, branding, branches]);

  const addBranch = () => {
    setBranches([
      ...branches, 
      { id: Date.now(), branchName: "", city: "", units: [{ id: Date.now(), serviceName: "" }] }
    ]);
  };

  const removeBranch = (branchId) => {
    setBranches(branches.filter(b => b.id !== branchId));
  };

  const updateBranch = (id, field, value) => {
    setBranches(branches.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const addUnit = (branchId) => {
    setBranches(branches.map(b => {
      if (b.id === branchId) {
        return { ...b, units: [...b.units, { id: Date.now(), serviceName: "" }] };
      }
      return b;
    }));
  };

  const removeUnit = (branchId, unitId) => {
    setBranches(branches.map(b => {
      if (b.id === branchId) {
        return { ...b, units: b.units.filter(u => u.id !== unitId) };
      }
      return b;
    }));
  };

  const updateUnit = (branchId, unitId, value) => {
    setBranches(branches.map(b => {
      if (b.id === branchId) {
        return {
          ...b,
          units: b.units.map(u => u.id === unitId ? { ...u, serviceName: value } : u)
        };
      }
      return b;
    }));
  };

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        tenantType: (tenantType && tenantType !== "company" ? tenantType : customTenantType.toLowerCase().trim()),
        organizationName: orgName,
        branding,
        branches: branches.map(b => ({
          branchName: b.branchName,
          city: b.city,
          units: b.units.map(u => ({ serviceName: u.serviceName }))
        }))
      };

      const res = await bulkCreateSystem(payload);
      if (res.success) {
        setExportData(res);
        setStep(4); // Success / Export Step
        
        // Clear saved state so next time it's fresh
        localStorage.removeItem("systemBuilder_step");
        localStorage.removeItem("systemBuilder_tenant");
        localStorage.removeItem("systemBuilder_isOtherCat");
        localStorage.removeItem("systemBuilder_org");
        localStorage.removeItem("systemBuilder_branding");
        localStorage.removeItem("systemBuilder_branches");
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to generate system");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">System Builder</h1>
        <p className="text-slate-500 mt-2">Generate a complete organization, branches, and units in one go.</p>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-2 flex-1 rounded-full ${step >= i ? 'bg-sky-500' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* STEP 1: Organization & Branding */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-2">1. Organization Details</h2>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Industry Category (Type) *</label>
              <select 
                value={isOtherCategory ? "Other" : customTenantType}
                onChange={e => {
                  if (e.target.value === "Other") {
                    setIsOtherCategory(true);
                    setCustomTenantType("");
                  } else {
                    setIsOtherCategory(false);
                    setCustomTenantType(e.target.value);
                  }
                }}
                className={`w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-sky-500 outline-none ${isOtherCategory ? 'mb-2' : ''}`}
              >
                <option value="" disabled>-- Select Industry Category --</option>
                <option value="bank">Bank</option>
                <option value="hospital">Hospital</option>
                <option value="police">Police</option>
                <option value="supermarket">Supermarket</option>
                <option value="salon">Salon</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="Other">Other (Type manually)</option>
              </select>

              {isOtherCategory && (
                <input 
                  type="text" 
                  value={customTenantType}
                  onChange={e => setCustomTenantType(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="Type your custom category (e.g. Cinema)"
                />
              )}
              <p className="text-xs text-slate-500 mt-1">Select an existing category or type a completely new one.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Organization Name (Optional)</label>
              <input 
                type="text" 
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-sky-500 outline-none"
                placeholder="e.g. HealthFirst Hospital"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Logo (Optional)</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2 hover:bg-slate-100 transition">
                      <span className="text-sm text-slate-500">
                        {branding.logoUrl && branding.logoUrl.startsWith("data:image") ? "Image Selected" : "Upload PNG/JPG (Max 500KB)"}
                      </span>
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          if (file.size > 500 * 1024) {
                            alert("File is too large. Please select an image under 500KB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setBranding({...branding, logoUrl: reader.result});
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>
                  {branding.logoUrl && (
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border bg-white shadow-sm">
                      <img src={branding.logoUrl} alt="Logo preview" className="h-full w-full object-contain" />
                      <button 
                        onClick={() => setBranding({...branding, logoUrl: ""})}
                        className="absolute -right-1 -top-1 rounded-full bg-red-500 text-white w-4 h-4 flex items-center justify-center text-[10px] shadow-sm hover:bg-red-600"
                        title="Remove logo"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Brand Color</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    value={branding.primaryColor}
                    onChange={e => setBranding({...branding, primaryColor: e.target.value})}
                    className="h-10 w-10 border-0 rounded cursor-pointer"
                  />
                  <span className="text-sm font-mono text-slate-500">{branding.primaryColor}</span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Welcome Text</label>
              <input 
                type="text" 
                value={branding.welcomeText}
                onChange={e => setBranding({...branding, welcomeText: e.target.value})}
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-sky-500 outline-none"
                placeholder="Welcome to our Queue System"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={() => {
                  if (!customTenantType || !customTenantType.trim()) {
                    setError("Please select or enter an Industry Category.");
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                className="bg-sky-600 text-white px-6 py-2.5 rounded-xl hover:bg-sky-700 transition"
              >
                Next Step →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 & 3 Combined: Branches & Units */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-2">2. Branches & Units</h2>
            
            <div className="space-y-6">
              {branches.map((branch, index) => (
                <div key={branch.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800">Branch {index + 1}</h3>
                    {branches.length > 1 && (
                      <button onClick={() => removeBranch(branch.id)} className="text-red-500 text-sm font-semibold hover:underline">
                        Remove Branch
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Branch Name *</label>
                      <input 
                        type="text" 
                        value={branch.branchName}
                        onChange={e => updateBranch(branch.id, 'branchName', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                        placeholder="e.g. Colombo Main"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">City</label>
                      <input 
                        type="text" 
                        value={branch.city}
                        onChange={e => updateBranch(branch.id, 'city', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                        placeholder="e.g. Colombo"
                      />
                    </div>
                  </div>

                  {/* Units for this Branch */}
                  <div className="pl-4 border-l-2 border-slate-200 space-y-3">
                    <h4 className="text-sm font-bold text-slate-700">Units / Services</h4>
                    {branch.units.map((unit, uIdx) => (
                      <div key={unit.id} className="flex gap-2 items-center">
                        <span className="text-xs text-slate-400 w-4">{uIdx + 1}.</span>
                        <input 
                          type="text" 
                          value={unit.serviceName}
                          onChange={e => updateUnit(branch.id, unit.id, e.target.value)}
                          className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-sky-500"
                          placeholder="e.g. OPD or Pharmacy"
                        />
                        {branch.units.length > 1 && (
                          <button onClick={() => removeUnit(branch.id, unit.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addUnit(branch.id)} className="text-sky-600 text-sm font-semibold hover:underline mt-2 inline-block">
                      + Add another Unit
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addBranch} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-400 transition">
              + Add Another Branch
            </button>

            <div className="flex justify-between pt-6 border-t mt-6">
              <button onClick={() => setStep(1)} className="text-slate-500 font-semibold px-4">← Back</button>
              <button 
                onClick={() => setStep(3)}
                className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold"
              >
                Next: Review & Build →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-2">3. Review & Build</h2>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{orgName}</h3>
              <p className="text-sm text-slate-500 mb-4">You are about to create this organization with {branches.length} branches.</p>
              
              <ul className="space-y-3">
                {branches.map(b => (
                  <li key={b.id} className="text-sm">
                    <strong>{b.branchName || "Unnamed Branch"}</strong> ({b.city})
                    <div className="text-slate-500 ml-4 mt-1">
                      ↳ {b.units.length} Units: {b.units.map(u => u.serviceName).join(", ")}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between pt-6">
              <button onClick={() => setStep(2)} className="text-slate-500 font-semibold px-4">← Edit Branches</button>
              <button 
                onClick={handleExport}
                disabled={loading}
                className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-emerald-700 shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? "Building System..." : "🚀 Export & Generate"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Export Links */}
        {step === 4 && exportData && (
          <div className="space-y-6 animate-in fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
              <h2 className="text-2xl font-bold text-slate-800">System Generated!</h2>
              <p className="text-slate-500">Your system has been built successfully. Hand over these links and credentials to the respective branches.</p>
            </div>
            
            {exportData.adminCredentials && (
              <div className="p-6 border border-blue-200 bg-blue-50 rounded-2xl relative overflow-hidden mb-6">
                 <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                 <h3 className="font-bold text-blue-900 text-lg mb-2">Organization Admin Credentials</h3>
                 <p className="text-sm text-blue-700 mb-4">Use these to log into the main admin portal to manage all branches.</p>
                 <div className="mb-4">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">🔗 Admin Portal URL</p>
                    <code className="block w-full bg-white border border-blue-200 p-2 rounded text-xs text-slate-800 break-all select-all">
                      {window.location.origin}/admin-login
                    </code>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Email</p>
                      <code className="block w-full bg-white border border-blue-200 p-2 rounded text-sm text-slate-800 select-all">{exportData.adminCredentials.email}</code>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Password</p>
                      <code className="block w-full bg-white border border-blue-200 p-2 rounded text-sm text-slate-800 select-all">{exportData.adminCredentials.password}</code>
                    </div>
                 </div>
              </div>
            )}
            
            <div className="space-y-6">
              {exportData.results.map((res, i) => {
                const actualTenantType = tenantType !== "company" ? tenantType : customTenantType.toLowerCase().trim();
                const customerAppUrl = import.meta.env.VITE_CUSTOMER_URL || "https://queue-management-system-teal.vercel.app";
                const backendUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
                
                const tvLink = `${customerAppUrl}/${actualTenantType}/display/${res.branch.id}`;
                const kioskLink = `${window.location.origin}/staff-login`; // Staff login needed
                const iotWebhook = `${backendUrl}/api/tokens/iot/complete-and-next`;
                
                return (
                  <div key={i} className="p-6 border border-emerald-200 bg-emerald-50 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                    <h3 className="font-bold text-emerald-900 text-lg mb-4">{res.branch.branchName}</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">📺 TV Monitor URL</p>
                        <code className="block w-full bg-white border border-emerald-200 p-2 rounded text-xs text-slate-800 break-all select-all">
                          {tvLink}
                        </code>
                      </div>
                      
                      <div>
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">🖥️ Kiosk / Staff Dashboard</p>
                        <code className="block w-full bg-white border border-emerald-200 p-2 rounded text-xs text-slate-800 break-all select-all">
                          {kioskLink}
                        </code>
                        <p className="text-[10px] text-emerald-600 mt-1">Note: Staff must log in to the admin portal.</p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">🔌 ESP32 Button Webhooks (Per Unit)</p>
                        {res.services && res.services.map((svc, sIdx) => (
                          <div key={svc.id || sIdx} className="mb-3 pl-3 border-l-2 border-emerald-300">
                            <p className="text-xs font-bold text-slate-700">{svc.serviceName} Unit</p>
                            <code className="block w-full bg-white border border-emerald-200 p-2 mt-1 rounded text-xs text-slate-800 break-all select-all">
                              POST {iotWebhook}
                            </code>
                            <p className="text-[10px] text-emerald-600 mt-1">Payload: {`{"counterId": "${svc.counterId || 'unknown'}"}`}</p>
                          </div>
                        ))}
                      </div>

                      {res.staffCredentials && (
                        <div className="mt-4 pt-4 border-t border-emerald-200 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Staff Email</p>
                            <code className="block w-full bg-white border border-emerald-200 p-2 rounded text-sm text-slate-800 select-all">{res.staffCredentials.email}</code>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Staff Password</p>
                            <code className="block w-full bg-white border border-emerald-200 p-2 rounded text-sm text-slate-800 select-all">{res.staffCredentials.password}</code>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="pt-6 text-center">
              <button 
                onClick={() => navigate('/company-super-admin/organizations')}
                className="text-sky-600 font-bold hover:underline"
              >
                Go to Organizations List
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
