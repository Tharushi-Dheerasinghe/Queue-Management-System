import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "../../../context/TenantContext";
import { createPharmacyBooking } from "../../../services/pharmacyService";

export default function PharmacyDetails() {
  const navigate = useNavigate();
  const { tenantType, theme } = useTenant();

  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    nic: "",
    prescriptionClinicNumber: "",
    serviceSource: "",
    priorityType: "",
    age: "",
    note: "",
  });
  const [prescriptionFileName, setPrescriptionFileName] = useState("");
  const [prescriptionPreview, setPrescriptionPreview] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handlePrescriptionUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPrescriptionFileName("");
      setPrescriptionPreview("");
      return;
    }

    setPrescriptionFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setPrescriptionPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmDetails = () => {
    const pharmacyBooking = createPharmacyBooking({
      ...formData,
      prescriptionFileName,
      prescriptionPreview,
    }, tenantType);

    navigate("/hospital/pharmacy/success", {
      state: { pharmacyBooking },
    });
  };

  const canSubmit =
    formData.fullName.trim() &&
    formData.mobileNumber.trim() &&
    formData.nic.trim() &&
    formData.prescriptionClinicNumber.trim() &&
    formData.serviceSource.trim() &&
    formData.priorityType.trim() &&
    formData.age.trim();

  return (
    <div className="space-y-6">
      <section className={`rounded-3xl border ${theme.border} bg-white p-6 shadow-sm sm:p-8`}>
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${theme.text}`}>
          Pharmacy Queue
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Pharmacy Details
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          Enter your details and upload a prescription image to generate a pharmacy token.
        </p>
      </section>

      <section className={`rounded-3xl border ${theme.border} bg-white p-6 shadow-sm sm:p-8`}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="fullName">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`w-full rounded-xl border ${theme.border} px-4 py-2.5 text-sm text-slate-900 outline-none`}
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="mobileNumber">
              Mobile Number
            </label>
            <input
              id="mobileNumber"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              className={`w-full rounded-xl border ${theme.border} px-4 py-2.5 text-sm text-slate-900 outline-none`}
              placeholder="07X XXX XXXX"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="nic">
              NIC / ID
            </label>
            <input
              id="nic"
              name="nic"
              value={formData.nic}
              onChange={handleChange}
              className={`w-full rounded-xl border ${theme.border} px-4 py-2.5 text-sm text-slate-900 outline-none`}
              placeholder="Enter NIC or ID"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="prescriptionClinicNumber">
              Prescription / Clinic Number
            </label>
            <input
              id="prescriptionClinicNumber"
              name="prescriptionClinicNumber"
              value={formData.prescriptionClinicNumber}
              onChange={handleChange}
              className={`w-full rounded-xl border ${theme.border} px-4 py-2.5 text-sm text-slate-900 outline-none`}
              placeholder="Enter prescription or clinic number"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="serviceSource">
              Service Source
            </label>
            <select
              id="serviceSource"
              name="serviceSource"
              value={formData.serviceSource}
              onChange={handleChange}
              className={`w-full rounded-xl border ${theme.border} px-4 py-2.5 text-sm text-slate-900 outline-none`}
            >
              <option value="">Select service source</option>
              <option value="Clinic">Clinic</option>
              <option value="OPD">OPD</option>
              <option value="Ward">Ward</option>
              <option value="External Prescription">External Prescription</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="priorityType">
              Priority Type
            </label>
            <select
              id="priorityType"
              name="priorityType"
              value={formData.priorityType}
              onChange={handleChange}
              className={`w-full rounded-xl border ${theme.border} px-4 py-2.5 text-sm text-slate-900 outline-none`}
            >
              <option value="">Select priority type</option>
              <option value="Normal">Normal</option>
              <option value="Senior Citizen">Senior Citizen</option>
              <option value="Disabled">Disabled</option>
              <option value="Pregnant">Pregnant</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="age">
              Age
            </label>
            <input
              id="age"
              name="age"
              type="number"
              min="0"
              value={formData.age}
              onChange={handleChange}
              className={`w-full rounded-xl border ${theme.border} px-4 py-2.5 text-sm text-slate-900 outline-none`}
              placeholder="Enter age"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="note">
              Optional Note
            </label>
            <textarea
              id="note"
              name="note"
              rows="3"
              value={formData.note}
              onChange={handleChange}
              className={`w-full rounded-xl border ${theme.border} px-4 py-2.5 text-sm text-slate-900 outline-none`}
              placeholder="Add any pharmacy-related note"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="prescriptionImage">
              Prescription Image
            </label>
            <input
              id="prescriptionImage"
              type="file"
              accept="image/*"
              onChange={handlePrescriptionUpload}
              className={`w-full rounded-xl border ${theme.border} bg-white px-4 py-2.5 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-800`}
            />
            {prescriptionFileName && (
              <p className="mt-2 text-sm text-slate-600">Selected file: {prescriptionFileName}</p>
            )}
            {prescriptionPreview && (
              <img
                src={prescriptionPreview}
                alt="Prescription preview"
                className={`mt-3 h-40 w-full rounded-xl border ${theme.border} object-cover sm:h-48`}
              />
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate("/hospital/pharmacy")}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Back
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleConfirmDetails}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${theme.button} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            Generate Token
          </button>
        </div>
      </section>
    </div>
  );
}
