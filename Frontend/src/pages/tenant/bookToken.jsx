import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Button from "../../components/common/Button";
import PageHeader from "../../components/common/PageHeader";
import { useTenant } from "../../context/TenantContext";
import { clearQueueToken, createQueueToken } from "../../services/queueService";
import { legacyStorageKeys, readValue, storageKeys } from "../../utils/storage";

export default function BookToken() { // <-- මෙතනින් function එක පටන් ගන්න
  const { tenantType, theme, selectedBranch, selectedService, selectedDate } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const canGenerateToken = Boolean(selectedBranch?.id && selectedService?.id);

  // Auth check removed - Guest flow allowed

  const scopedOrganization = readValue(
    localStorage,
    storageKeys.selectedOrganization(tenantType),
    [legacyStorageKeys.selectedOrganization]
  );
  const legacyOrganization = localStorage.getItem("selectedOrganization") || "";
  const legacyOrganizationTenant = localStorage.getItem("selectedOrganizationTenant") || "";
  const selectedOrganization =
    scopedOrganization ||
    (legacyOrganizationTenant === tenantType ? legacyOrganization : "");

  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "07",
    nic: "",
    age: "",
    note: "",
    bookingDate: selectedDate || new Date().toISOString().split("T")[0],
  });
  const [generatedTokenData, setGeneratedTokenData] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const topRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "mobile") {
      // Ensure prefix '07' is preserved
      let v = String(value || "");

      // If user removed prefix, restore it preserving digits
      if (!v.startsWith("07")) {
        const digits = v.replace(/\D/g, "");
        v = `07${digits}`;
      }

      // Keep only digits after prefix and limit to 8 digits
      const after = v.slice(2).replace(/\D/g, "").slice(0, 8);
      const next = `07${after}`;

      // Enforce maximum total length of 10 (07 + 8 digits)
      setFormData((prev) => ({ ...prev, mobile: next.slice(0, 10) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!canGenerateToken) {
      navigate(`/${tenantType}`);
      return;
    }

    // Validate mobile: must start with '07' and be exactly 10 chars (07 + 8 digits)
    if (!formData.mobile || !String(formData.mobile).startsWith("07") || String(formData.mobile).length !== 10) {
      setError("Please enter a valid phone number (e.g., 071 234 5678)");
      return;
    }

    if (!formData.nic || !formData.age) {
      setError("Please provide your NIC and Age.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const tokenData = await createQueueToken({
        tenantType,
        organization: selectedOrganization,
        branchId: selectedBranch.id,
        serviceId: selectedService.id,
        fullName: formData.fullName,
        mobile: formData.mobile,
        nic: formData.nic,
        age: Number(formData.age),
        note: formData.note,
        bookingDate: formData.bookingDate,
        // Optional userId for guests
        userId: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user"))?.id : null,
      });
      setGeneratedTokenData(tokenData);
      setShowQr(false);
      
      setTimeout(() => {
        if (topRef.current) {
          topRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } catch (error) {
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to book token. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetTokenRedirect = () => {
    navigate(`/${tenantType}`);
  };

  const handleBookAnother = () => {
    setFormData({
      fullName: "",
      mobile: "07",
      nic: "",
      age: "",
      note: "",
      bookingDate: selectedDate || new Date().toISOString().split("T")[0],
    });
    setGeneratedTokenData(null);
    setShowQr(false);
    clearQueueToken(tenantType);
  };

  const qrValue = generatedTokenData
    ? JSON.stringify(
        {
          tokenNumber: generatedTokenData.tokenNumber,
          branch: generatedTokenData.branch,
          service: generatedTokenData.service,
          fullName: generatedTokenData.fullName,
          mobile: generatedTokenData.mobile,
        },
        null,
        2
      )
    : "";

  const handleDownloadQr = () => {
    const canvas = document.getElementById("token-qr-canvas");
    if (!canvas || !generatedTokenData) return;

    const imageData = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imageData;
    link.download = `token-${generatedTokenData.tokenNumber}.png`;
    link.click();
  };

  const handleDownloadPdf = async () => {
    const receiptElement = document.getElementById("token-receipt");
    if (!receiptElement || !generatedTokenData) return;

    try {
      const canvas = await html2canvas(receiptElement, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Token-${generatedTokenData.tokenNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  return (
    <div ref={topRef} className="mx-auto max-w-4xl space-y-6">
      {/* ඔයාගේ ඉතිරි UI එක මෙතන තියෙනවා */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <PageHeader
          title="Book a Token"
          description="Fill in the details below to generate your token."
        />
        <div
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            theme?.light || "bg-blue-50"
          } ${theme?.text || "text-blue-700"}`}
        >
          Step 3 of 4
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${
            theme?.border || "border-blue-200"
          } ${theme?.light || "from-blue-50"} to-white`}
        >
          <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${theme?.text || "text-blue-700"}`}>
            Selected Branch
          </p>
          <h3 className="mt-1 font-semibold text-slate-900">{selectedBranch?.branchName || "Not selected"}</h3>
        </div>

        <div
          className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${
            theme?.border || "border-blue-200"
          } ${theme?.light || "from-blue-50"} to-white`}
        >
          <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${theme?.text || "text-blue-700"}`}>
            Selected Service
          </p>
          <h3 className="mt-1 font-semibold text-slate-900">{selectedService?.serviceName || "Not selected"}</h3>
        </div>

        <div
          className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${
            theme?.border || "border-blue-200"
          } ${theme?.light || "from-blue-50"} to-white`}
        >
          <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${theme?.text || "text-blue-700"}`}>
            Booking Date
          </p>
          <h3 className="mt-1 font-semibold text-slate-900">{formData.bookingDate || "Today"}</h3>
        </div>
      </div>

      {!generatedTokenData ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Customer Information</h2>
            <p className="mt-1 text-sm text-slate-500">Provide your details to generate a queue token.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="mb-2 text-sm text-red-600 font-semibold">{error}</div>}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 ${theme?.ring || "focus:ring-blue-100"}`}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Mobile Number</label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="X XXX XXXX"
                className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 ${theme?.ring || "focus:ring-blue-100"}`}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">NIC</label>
                <input
                  type="text"
                  name="nic"
                  value={formData.nic}
                  onChange={handleChange}
                  placeholder="ID Number"
                  className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 ${theme?.ring || "focus:ring-blue-100"}`}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Age</label>
                <input
                  type="number"
                  name="age"
                  min="0"
                  max="120"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Age"
                  className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 ${theme?.ring || "focus:ring-blue-100"}`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Note</label>
              <textarea
                rows="4"
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="Optional note"
                className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 ${theme?.ring || "focus:ring-blue-100"}`}
              />
            </div>

            <Button
              type={canGenerateToken ? "submit" : "button"}
              onClick={!canGenerateToken ? handleGetTokenRedirect : undefined}
              theme={theme}
              className="w-full"
              disabled={canGenerateToken ? isSubmitting : false}
            >
              {canGenerateToken ? (isSubmitting ? "Generating..." : "Generate Token") : "Get Token"}
            </Button>
          </form>
        </div>
      ) : (
        <div
          id="token-receipt"
          className={`rounded-3xl border bg-gradient-to-br p-6 shadow-md sm:p-8 ${
            theme?.border || "border-blue-200"
          } from-white ${theme?.light || "via-blue-50"} to-white`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${theme?.soft || "bg-blue-100"} ${theme?.text || "text-blue-700"}`}>
                Token Generated
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">Booking Confirmed</h2>
              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <p><strong>Name:</strong> {generatedTokenData.fullName}</p>
                <p><strong>NIC:</strong> {generatedTokenData.nic}</p>
              </div>
            </div>
            <div className={`rounded-2xl border bg-white px-6 py-4 text-center shadow-sm ${theme?.border || "border-blue-200"}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${theme?.text || "text-blue-700"}`}>Token Number</p>
              <p className={`mt-1 text-3xl font-bold ${theme?.darkText || "text-blue-900"}`}>{generatedTokenData.tokenNumber}</p>
              <Button onClick={() => setShowQr((prev) => !prev)} theme={theme} className="mt-3 w-full px-3 py-2 text-xs" data-html2canvas-ignore>
                {showQr ? "Hide QR" : "Get QR"}
              </Button>
            </div>
          </div>

          {showQr && (
            <div className={`mt-6 rounded-2xl border bg-white p-5 shadow-sm ${theme?.border || "border-blue-200"}`}>
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <QRCodeCanvas id="token-qr-canvas" value={qrValue} size={180} includeMargin />
                </div>
                <Button onClick={handleDownloadQr} variant="secondary" theme={theme}>
                  Download QR (PNG)
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3" data-html2canvas-ignore>
            <Button onClick={() => navigate(`/${tenantType}/queue-status`)} theme={theme} className="w-full">
              View Queue
            </Button>
            <Button onClick={handleBookAnother} variant="secondary" theme={theme} className="w-full">
              Book Another
            </Button>
            <Button onClick={handleDownloadPdf} variant="secondary" theme={theme} className="w-full border-blue-500 text-blue-700">
              Download PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}