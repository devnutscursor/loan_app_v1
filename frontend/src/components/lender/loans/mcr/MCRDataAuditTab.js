import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { loanCompensationService } from "../../../../services/mcr.service";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit3,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Save,
  Info,
} from "lucide-react";

/**
 * MCR Data Audit Tab
 * 
 * Read-only validation view showing MCR-critical data quality:
 * - Revenue card (summary of broker comp, fees, SRP/YSP, revenue)
 * - Product card (rate, lock, lien position, amortization)
 * - Loan info card (purpose, property, occupancy, LTV/DTI)
 * - MCR Classification card (HOEPA, QM, lead source, doc type, etc.)
 * - Validation warnings for incomplete fields
 * - "Exclude from MCR" toggle
 */
const MCRDataAuditTab = ({ loan, setLoan, loanId, activeMainTab, setActiveMainTab, fetchLoanDetails }) => {
  const [compensation, setCompensation] = useState(null);
  const [syncedLoan, setSyncedLoan] = useState(loan);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [excludeFromMCR, setExcludeFromMCR] = useState(loan?.excludeFromMCR || false);
  const [validationWarnings, setValidationWarnings] = useState([]);

  useEffect(() => {
    loadAndSync();
  }, [loanId]);

  useEffect(() => {
    if (compensation || syncedLoan) {
      runValidation();
    }
  }, [compensation, syncedLoan]);

  const loadAndSync = async () => {
    setLoading(true);
    try {
      // Call syncMCRDefaults — this backfills classification defaults, audit dates,
      // and triggers auto-fill hooks so compensation has derived fields
      const syncRes = await loanCompensationService.syncMCRDefaults(loanId);
      if (syncRes?.data) {
        setCompensation(syncRes.data.compensation);
        setSyncedLoan(syncRes.data.loan);
        // Update parent loan state so other tabs see the synced data
        if (setLoan && syncRes.data.loan) {
          setLoan(prev => ({ ...prev, ...syncRes.data.loan }));
        }
      }
    } catch (err) {
      console.error("Error syncing MCR defaults:", err);
      // Fallback to just loading compensation
      try {
        const res = await loanCompensationService.getCompensation(loanId);
        setCompensation(res.data);
      } catch (err2) {
        console.error("Error loading compensation:", err2);
        toast.error("Failed to load MCR compensation data");
      }
    } finally {
      setLoading(false);
    }
  };

  const runValidation = () => {
    const warnings = [];
    const l = syncedLoan || loan; // prefer synced data

    // Pre-closing statuses where revenue/fee fields aren't expected yet
    const preClosingStatuses = ['New', 'Application Submitted', 'Processing', 'Underwriting', 'Conditional Approval', 'Clear to Close'];
    const isPreClosing = preClosingStatuses.includes(l?.status);

    // Revenue validation — only flag as error for funded/closed loans
    if ((compensation?.brokerCompensation ?? 0) === 0 && (compensation?.originationFee ?? 0) === 0) {
      if (!isPreClosing) {
        warnings.push({ field: "Revenue", message: "No broker compensation or origination fee recorded", severity: "error" });
      } else {
        warnings.push({ field: "Revenue", message: "No fees recorded yet (expected before closing)", severity: "info" });
      }
    }
    if (compensation?.loanRevenue == null || compensation?.loanRevenue === 0) {
      if (!isPreClosing) {
        warnings.push({ field: "Revenue", message: "Loan revenue is not set", severity: "warning" });
      }
    }

    // Product validation
    if (compensation?.finalRate == null) {
      warnings.push({ field: "Product", message: "Final rate is not set", severity: "warning" });
    }

    // Date validation: closing date expected once the loan is closed or funded.
    // Funded date is required only when status is Funded — "Closed" without a separate
    // funded milestone should not block on funded date.
    if (["Funded", "Closed"].includes(l?.status)) {
      if (!compensation?.closingDate) {
        warnings.push({ field: "Dates", message: "Closing date is missing for a closed/funded loan", severity: "error" });
      }
    }
    if (l?.status === "Funded" && !compensation?.fundedDate) {
      warnings.push({ field: "Dates", message: "Funded date is missing for a funded loan", severity: "error" });
    }

    // Application date — after sync this should be backfilled
    if (!compensation?.applicationDate) {
      warnings.push({ field: "Dates", message: "Application date is not set", severity: "warning" });
    }

    // MCR classification — after sync these will have defaults, so only warn if still missing
    if (!l?.fundingMethod) {
      warnings.push({ field: "Classification", message: "Funding method is not specified", severity: "warning" });
    }
    if (!l?.docType) {
      warnings.push({ field: "Classification", message: "Documentation type is not specified", severity: "warning" });
    }
    if (l?.qmStatus === undefined || l?.qmStatus === null || l?.qmStatus === "") {
      warnings.push({ field: "Classification", message: "QM status is not specified", severity: "warning" });
    }

    // Property validation
    if (!l?.property?.state) {
      warnings.push({ field: "Loan Info", message: "Property state is missing (required for per-state MCR)", severity: "error" });
    }
    if (!l?.property?.propertyType) {
      warnings.push({ field: "Loan Info", message: "Property type is missing", severity: "warning" });
    }

    // HELOC-specific validation: If lienPosition is 2nd and secondLienType is HELOC, creditLineAmount is required
    if ((compensation?.lienPosition === '2nd' || compensation?.lienPosition === 'Subordinate Lien') && compensation?.secondLienType === 'HELOC') {
      if (!compensation?.creditLineAmount || compensation.creditLineAmount <= 0) {
        warnings.push({ field: "Product", message: "HELOC Credit Line Amount is required for 2nd-lien HELOCs (RMLA I120)", severity: "error" });
      }
    }

    setValidationWarnings(warnings);
  };

  const handleExcludeToggle = async () => {
    setSaving(true);
    try {
      const newValue = !excludeFromMCR;
      // Update via loan endpoint (this is a Loan model field)
      const customAxios = (await import("../../../../utils/axios")).default;
      await customAxios.put(`/api/v1/loans/${loanId}`, { excludeFromMCR: newValue });
      setExcludeFromMCR(newValue);
      toast.success(newValue ? "Loan excluded from MCR" : "Loan included in MCR");
      if (fetchLoanDetails) fetchLoanDetails();
    } catch (err) {
      console.error("Error toggling MCR exclusion:", err);
      toast.error("Failed to update MCR exclusion");
    } finally {
      setSaving(false);
    }
  };

  const navigateToFundingTab = () => {
    if (setActiveMainTab) setActiveMainTab("funding-revenue");
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val || 0);

  const errorCount = validationWarnings.filter((w) => w.severity === "error").length;
  const warningCount = validationWarnings.filter((w) => w.severity === "warning").length;
  const infoCount = validationWarnings.filter((w) => w.severity === "info").length;

  // Summary data for cards — use synced loan data
  const l = syncedLoan || loan;
  const summaryData = {
    revenue: [
      { label: "Broker Compensation", value: formatCurrency(compensation?.brokerCompensation) },
      { label: "Comp Paid By", value: compensation?.brokerCompPaidBy || "—" },
      { label: "Origination Fee", value: formatCurrency(compensation?.originationFee) },
      { label: "Processing Fee", value: formatCurrency(compensation?.processingFee) },
      { label: "Discount Points", value: formatCurrency(compensation?.discountPoints) },
      { label: "SRP Amount", value: formatCurrency(compensation?.srpAmount) },
      { label: "YSP Amount", value: formatCurrency(compensation?.yspAmount) },
      { label: "Broker Flat Fees", value: formatCurrency(compensation?.brokerFlatFees) },
      { label: "Lender Fees", value: formatCurrency(compensation?.lenderFeesCollected) },
      { label: "Loan Revenue", value: formatCurrency(compensation?.loanRevenue), highlight: true },
    ],
    product: [
      { label: "Final Rate", value: compensation?.finalRate ? `${compensation.finalRate}%` : "—" },
      { label: "Rate Lock Period", value: compensation?.rateLockPeriod ? `${compensation.rateLockPeriod} days` : "—" },
      { label: "Lien Position", value: compensation?.lienPosition || "—" },
      { label: "Second Lien Type", value: compensation?.secondLienType === "ClosedEndSecond" ? "Closed-End Second" : compensation?.secondLienType || "—" },
      { label: "HELOC Credit Line", value: compensation?.creditLineAmount > 0 ? formatCurrency(compensation.creditLineAmount) : "—" },
      { label: "Amortization", value: compensation?.amortizationType || "—" },
      { label: "Servicing", value: compensation?.servicingDisposition || "—" },
      { label: "Investor", value: compensation?.investorSoldTo || "—" },
    ],
    loanInfo: [
      { label: "Loan Purpose", value: l?.loanDetails?.loanType || "—" },
      { label: "Property Type", value: l?.property?.propertyType || "—" },
      { label: "Property State", value: l?.property?.state || "—" },
      { label: "Occupancy", value: l?.property?.occupancyType || "—" },
      { label: "Units", value: l?.property?.units || "1" },
      { label: "LTV", value: l?.financialCalculations?.ltv ? `${l.financialCalculations.ltv}%` : "—" },
      { label: "DTI", value: l?.financialCalculations?.dti ? `${l.financialCalculations.dti}%` : "—" },
      { label: "Loan Amount", value: formatCurrency(l?.loanDetails?.loanAmount || l?.loanDetails?.requestedLoanAmount) },
    ],
    classification: [
      { label: "Funding Method", value: l?.fundingMethod || "—" },
      { label: "Source of Business", value: l?.leadSource || "—" },
      { label: "Doc Type", value: l?.docType || "—" },
      { label: "Interest Only", value: l?.interestOnlyFlag ? "Yes" : "No" },
      { label: "HOEPA Flag", value: l?.hoeparFlag ? "Yes" : "No" },
      { label: "QM Status", value: l?.qmStatus || "—" },
      { label: "Is Reverse Mortgage", value: l?.isReverseMortgage ? "Yes" : "No" },
      { label: "Prepayment Penalty", value: l?.hasPrepaymentPenalty ? "Yes" : "No" },
      { label: "Piggyback Second", value: l?.isPiggybackSecond ? "Yes" : "No" },
      { label: "Has MI", value: l?.hasMortgageInsurance ? "Yes" : "No" },
    ],
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ShieldCheck className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">MCR Data Audit</h2>
          </div>
          <div className="flex items-center space-x-4">
            {/* Validation badge */}
            <div className="flex items-center space-x-2">
              {errorCount > 0 && (
                <span className="flex items-center px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  <XCircle className="h-3 w-3 mr-1" />
                  {errorCount} Error{errorCount > 1 ? "s" : ""}
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {warningCount} Warning{warningCount > 1 ? "s" : ""}
                </span>
              )}
              {errorCount === 0 && warningCount === 0 && (
                <span className="flex items-center px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {infoCount > 0 ? `${infoCount} Info` : "All Clear"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Exclude from MCR Toggle */}
      <div className={`rounded-xl border p-4 flex items-center justify-between ${
        excludeFromMCR ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
      }`}>
        <div className="flex items-center">
          <Info className="h-5 w-5 mr-3 text-gray-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {excludeFromMCR ? "This loan is EXCLUDED from MCR reports" : "This loan is INCLUDED in MCR reports"}
            </p>
            <p className="text-xs text-gray-500">Toggle to change MCR inclusion</p>
          </div>
        </div>
        <button
          onClick={handleExcludeToggle}
          disabled={saving}
          className="flex items-center space-x-2"
        >
          {saving ? (
            <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
          ) : excludeFromMCR ? (
            <ToggleLeft className="h-8 w-8 text-red-500 cursor-pointer" />
          ) : (
            <ToggleRight className="h-8 w-8 text-green-500 cursor-pointer" />
          )}
        </button>
      </div>

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Validation Issues
          </h3>
          <div className="space-y-2">
            {validationWarnings.map((w, i) => (
              <div
                key={i}
                className={`flex items-start p-3 rounded-lg text-sm ${
                  w.severity === "error" ? "bg-red-50 text-red-700" :
                  w.severity === "warning" ? "bg-amber-50 text-amber-700" :
                  "bg-blue-50 text-blue-700"
                }`}
              >
                {w.severity === "error" ? (
                  <XCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                ) : w.severity === "warning" ? (
                  <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                ) : (
                  <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <span className="font-medium">{w.field}:</span> {w.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Card */}
        <DataCard
          title="Revenue Summary"
          items={summaryData.revenue}
          onEdit={navigateToFundingTab}
          editLabel="Edit in Funding Tab"
        />

        {/* Product Card */}
        <DataCard
          title="Product Information"
          items={summaryData.product}
          onEdit={navigateToFundingTab}
          editLabel="Edit in Funding Tab"
        />

        {/* Loan Info Card */}
        <DataCard
          title="Loan Information"
          items={summaryData.loanInfo}
        />

        {/* MCR Classification Card */}
        <DataCard
          title="MCR Classification"
          items={summaryData.classification}
        />
      </div>
    </div>
  );
};

/**
 * Reusable read-only data card
 */
const DataCard = ({ title, items, onEdit, editLabel }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
      {onEdit && (
        <button
          onClick={onEdit}
          className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition"
        >
          <Edit3 className="h-3 w-3 mr-1" />
          {editLabel || "Edit"}
        </button>
      )}
    </div>
    <div className="space-y-2.5">
      {items.map(({ label, value, highlight }, i) => (
        <div
          key={i}
          className={`flex justify-between items-center ${
            highlight ? "bg-blue-50 -mx-2 px-2 py-1 rounded" : ""
          }`}
        >
          <span className="text-sm text-gray-600">{label}</span>
          <span className={`text-sm font-medium ${
            value === "—" ? "text-gray-300" : highlight ? "text-blue-700 font-bold" : "text-gray-900"
          }`}>
            {value}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default MCRDataAuditTab;
