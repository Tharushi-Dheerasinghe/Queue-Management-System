import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBranches } from "../../services/branchService";
import { createOrganizationService } from "../../services/organizationAdminService";

export default function AddService() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // 1. branchId වෙනුවට branchIds array එකක් ලෙස state එක හැදුවා
  const [formData, setFormData] = useState({
    branchIds: [], 
    serviceName: "",
    description: "",
    status: "active",
  });

  useEffect(() => {
    let isMounted = true;
    const loadBranches = async () => {
      try {
        setBranchesLoading(true);
        const response = await getBranches();
        if (!isMounted) return;

        const fetchedBranches = response?.success && Array.isArray(response.branches)
          ? response.branches
          : [];

        setBranches(fetchedBranches);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Failed to load branches");
      } finally {
        if (isMounted) setBranchesLoading(false);
      }
    };
    loadBranches();
    return () => { isMounted = false; };
  }, []);

  // 2. Multi-select handle කරන function එක
  const handleBranchChange = (event) => {
    const options = event.target.options;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setFormData(prev => ({ ...prev, branchIds: selectedValues }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formData.branchIds.length === 0) {
      setError("Please select at least one branch.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      // 3. හැම branch එකකටම අදාළව service එක create කරන්න loop එකක් භාවිතා කරනවා
      const promises = formData.branchIds.map(id => 
        createOrganizationService({
          branchId: id,
          serviceName: formData.serviceName,
          description: formData.description,
          status: formData.status
        })
      );

      const results = await Promise.all(promises);
      
      const allSuccessful = results.every(res => res.success);

      if (allSuccessful) {
        navigate("/organization-admin/services");
      } else {
        setError("Some services failed to create. Please check the services list.");
      }
    } catch (err) {
      setError(err?.message || "Error creating services");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Add Service (Bulk)</h1>
        <p className="mt-2 text-sm text-slate-500">Create a service for multiple branches at once</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Select Branches (Hold Ctrl/Cmd to select multiple) <span className="text-red-600">*</span>
            </label>
            <select
              multiple // 4. Multiple attribute එක එකතු කළා
              value={formData.branchIds}
              onChange={handleBranchChange}
              required
              disabled={branchesLoading || branches.length === 0}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100 min-h-[120px]"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id} className="p-2 border-b border-slate-50 last:border-0">
                  {branch.branchName}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-400 font-normal">Selected: {formData.branchIds.length} branches</p>
          </div>

          <div>
            <label htmlFor="serviceName" className="mb-1.5 block text-sm font-medium text-slate-700">
              Service Name <span className="text-red-600">*</span>
            </label>
            <input
              id="serviceName"
              name="serviceName"
              type="text"
              value={formData.serviceName}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
              placeholder="e.g., General Inquiry"
            />
          </div>

          {/* Description and Status options rest unchanged... */}
          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div>
            <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex gap-3 border-t border-slate-200 pt-6">
          <button type="button" onClick={() => navigate("/organization-admin/services")} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || branchesLoading || formData.branchIds.length === 0}
            className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {submitting ? "Creating Services..." : `Create for ${formData.branchIds.length} Branches`}
          </button>
        </div>
      </form>
    </div>
  );
}