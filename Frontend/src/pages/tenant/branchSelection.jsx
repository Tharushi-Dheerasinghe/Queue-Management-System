import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import BranchCard from "../../components/tenant/BranchCard";
import { useTenant } from "../../context/TenantContext";
import { legacyStorageKeys, readValue, storageKeys } from "../../utils/storage";
import { getBranchesForTenantSelection } from "../../services/tenantSelectionService";
import { isNestedTenant } from "../../utils/tenantHelpers";
import { useTranslation } from "react-i18next";
import { parseWorkingDayToIndex } from "../../utils/workingDayUtils";

export default function BranchSelection() {
  const {
    tenantType,
    tenant,
    theme,
    selectedOrganization,
    selectedOrganizationId,
    setSelectedBranch,
    setSelectedService,
    setSelectedDate,
  } = useTenant();
  
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedServiceToBook, setSelectedServiceToBook] = useState(null);
  const [selectedBranchToBook, setSelectedBranchToBook] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const navigate = useNavigate();
  const queueFlowStarted =
    readValue(sessionStorage, storageKeys.queueFlowStarted(tenantType), [legacyStorageKeys.queueFlowStarted]) ===
    "true";
  const [searchTerm, setSearchTerm] = useState("");
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const nestedTenant = isNestedTenant(tenant);
  const fallbackSelectedOrganizationId = localStorage.getItem(
    `queueflow_${tenantType}_selectedOrganization_id`
  ) || "";
  const effectiveSelectedOrganizationId = String(
    selectedOrganizationId || fallbackSelectedOrganizationId || ""
  ).trim();

  useEffect(() => {
    let isMounted = true;

    const loadBranches = async () => {
      console.log("Checking Org ID:", effectiveSelectedOrganizationId);
      console.log("Fetching branches for ID:", selectedOrganizationId);

      if (nestedTenant && !effectiveSelectedOrganizationId) {
        setBranches([]);
        setLoadingBranches(false);
        setFetchError("");
        return;
      }

      try {
        setLoadingBranches(true);
        setFetchError("");

        const response = await getBranchesForTenantSelection({
          tenantType,
          organizationId: effectiveSelectedOrganizationId,
        });

        if (!isMounted) {
          return;
        }

        const fetchedBranches = Array.isArray(response) ? response : [];
        setBranches(fetchedBranches);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setFetchError(error?.response?.data?.message || error?.message || "Failed to load branches");
        setBranches([]);
      } finally {
        if (isMounted) {
          setLoadingBranches(false);
        }
      }
    };

    loadBranches();

    return () => {
      isMounted = false;
    };
  }, [tenantType, selectedOrganizationId, effectiveSelectedOrganizationId, nestedTenant]);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredBranches = branches
    .filter((branch) => {
      if (!normalizedSearchTerm) {
        return true;
      }

      return String(branch.branchName || "").toLowerCase().includes(normalizedSearchTerm);
    })
    .sort((a, b) => {
      if (!normalizedSearchTerm) {
        return String(a.branchName || "").localeCompare(String(b.branchName || ""));
      }

      const aValue = String(a.branchName || "").toLowerCase();
      const bValue = String(b.branchName || "").toLowerCase();

      const getScore = (value) => {
        if (value === normalizedSearchTerm) {
          return 0;
        }

        if (value.startsWith(normalizedSearchTerm)) {
          return 1;
        }

        return 2;
      };

      return getScore(aValue) - getScore(bValue);
    });

  const handleServiceSelect = (branch, service) => {
    if (!queueFlowStarted || service.isClosed) return;

    setSelectedBranchToBook(branch);
    setSelectedServiceToBook(service);

    // Calculate next 14 available dates based on workingDays
    const dates = [];
    let currentDate = new Date();
    const validDays = (service.workingDays && service.workingDays.length > 0)
      ? service.workingDays
          .map((day) => parseWorkingDayToIndex(day))
          .filter((day) => day !== null)
      : [0, 1, 2, 3, 4, 5, 6];

    for (let i = 0; i < 30 && dates.length < 14; i++) {
      if (validDays.includes(currentDate.getDay())) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setAvailableDates(dates);
    setShowDatePicker(true);
  };

  const handleDateConfirm = (date) => {
    setSelectedBranch(selectedBranchToBook);
    setSelectedService(selectedServiceToBook);
    setSelectedDate(date.toISOString().split("T")[0]);
    navigate(`/${tenantType}/book-token`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <PageHeader
            title="Select a Branch"
            description="Choose the branch you want to continue with."
          />

          <div className="w-full lg:w-72">
            <label
              htmlFor="branch-search"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
            >
              {t("Search Branch")}
            </label>
            <input
              id="branch-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("Type branch name...")}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-4 ${
                theme?.border || "border-blue-200"
              } ${theme?.ring || "focus:ring-blue-100"}`}
            />
          </div>
        </div>
        <div
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            theme?.light || "bg-blue-50"
          } ${theme?.text || "text-blue-700"}`}
        >
          {t("Step 1 of 4")}
        </div>

        {nestedTenant && !effectiveSelectedOrganizationId && (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {t("No organization selected yet. Please choose an organization first.")}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredBranches.map((branch) => (
          <BranchCard
            key={branch.id}
            branch={branch}
            branchName={branch.branchName}
            services={branch.services}
            selectedServiceId={selectedServiceToBook?.id}
            onSelectService={handleServiceSelect}
            theme={theme}
            disabled={!queueFlowStarted}
          />
        ))}
      </div>

      {loadingBranches && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          {t("Loading branches and units...")}
        </div>
      )}

      {!loadingBranches && fetchError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {!loadingBranches && !fetchError && filteredBranches.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          {nestedTenant && effectiveSelectedOrganizationId
            ? t("No branches available for the selected organization.")
            : t("No branches match your search.")}
        </div>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && selectedServiceToBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{t("Select Date", "Select Date")}</h3>
                <p className="text-sm text-slate-500">{selectedServiceToBook.serviceName} at {selectedBranchToBook.branchName}</p>
              </div>
              <button 
                onClick={() => setShowDatePicker(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-2 mb-6">
              {availableDates.map((date, idx) => {
                const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <button
                    key={idx}
                    onClick={() => handleDateConfirm(date)}
                    className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50`}
                  >
                    <span className="font-medium">{dateStr}</span>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-md">Available</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {!queueFlowStarted && (
        <button
          type="button"
          onClick={() => navigate(`/${tenantType}`)}
          className={`fixed bottom-5 right-5 z-40 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl md:bottom-6 md:right-6 ${
            theme?.button || "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Get Token
        </button>
      )}
    </div>
  );
}