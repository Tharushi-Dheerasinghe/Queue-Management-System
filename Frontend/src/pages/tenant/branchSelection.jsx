import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import BranchCard from "../../components/tenant/BranchCard";
import { useTenant } from "../../context/TenantContext";
import { legacyStorageKeys, readValue, storageKeys } from "../../utils/storage";
import { getBranchesForTenantSelection } from "../../services/tenantSelectionService";
import { isNestedTenant } from "../../utils/tenantHelpers";

export default function BranchSelection() {
  const {
    tenantType,
    tenant,
    theme,
    selectedOrganization,
    selectedOrganizationId,
    selectedBranch,
    setSelectedBranch,
  } = useTenant();
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

  const activeSelectedBranch = useMemo(() => {
    if (!selectedBranch?.id) {
      return null;
    }

    return branches.find((branch) => String(branch.id) === String(selectedBranch.id)) || null;
  }, [branches, selectedBranch]);

  const handleBranchSelect = (branch) => {
    if (!queueFlowStarted) {
      return;
    }

    setSelectedBranch(branch);
  };

  const handleContinue = () => {
    if (!activeSelectedBranch?.id) {
      return;
    }

    navigate(`/${tenantType}/services`);
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
              Search Branch
            </label>
            <input
              id="branch-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type branch name..."
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
          Step 1 of 4
        </div>

        {nestedTenant && !effectiveSelectedOrganizationId && (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            No organization selected yet. Please choose an organization first.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredBranches.map((branch) => (
          <BranchCard
            key={branch.id}
            branch={branch.branchName}
            selected={activeSelectedBranch?.id === branch.id}
            onSelect={() => handleBranchSelect(branch)}
            theme={theme}
            disabled={!queueFlowStarted}
          />
        ))}
      </div>

      {loadingBranches && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          Loading branches...
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
            ? "No branches available for the selected organization."
            : "No branches match your search."}
        </div>
      )}

      {queueFlowStarted && activeSelectedBranch && (
        <div
          className={`rounded-3xl border p-5 shadow-sm sm:flex sm:items-center sm:justify-between ${
            theme?.border || "border-blue-200"
          } ${theme?.light || "bg-blue-50"}`}
        >
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-[0.14em] ${
                theme?.text || "text-blue-700"
              }`}
            >
              Selected Branch
            </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{activeSelectedBranch.branchName}</p>
          </div>

          <button
            onClick={handleContinue}
            className={`mt-4 w-full rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition sm:mt-0 sm:w-auto ${
              theme?.button || "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Continue
          </button>
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