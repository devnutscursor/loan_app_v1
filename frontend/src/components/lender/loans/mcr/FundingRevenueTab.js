import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { loanCompensationService } from "../../../../services/mcr.service";
import {
  Lock,
  Unlock,
  DollarSign,
  TrendingUp,
  Briefcase,
  FileText,
} from "lucide-react";

const CHANNEL_BADGES = {
  Retail: { label: "RETAIL", cls: "bg-blue-600" },
  "Wholesale-Brokered": { label: "BROKERED", cls: "bg-emerald-600" },
  Correspondent: { label: "CORRESPONDENT", cls: "bg-violet-600" },
  "Table-Funded": { label: "TABLE FUNDED", cls: "bg-amber-600" },
  Other: { label: "OTHER", cls: "bg-gray-600" },
};

const COMP_PAID_OPTIONS = ["Borrower", "Lender", "Split", "N/A"];
const LIEN_OPTIONS = ["1st", "2nd", "Not Secured by Lien"];
const AMORT_OPTIONS = ["Fixed", "ARM", "Option ARM"];
const INVESTOR_OPTIONS = [
  "Fannie Mae", "Freddie Mac", "Ginnie Mae", "Private Investor",
  "FHLBank", "Life Insurance", "Commercial Bank", "Other", "Not Sold",
];
const SERVICING_OPTIONS = ["Released", "Retained", "N/A"];

const DATE_KEYS = ["rateLockDate", "rateLockExpiry", "fundedDate"];
const SELECT_KEYS = [
  "brokerCompPaidBy", "lienPosition", "amortizationType",
  "investorSoldTo", "servicingDisposition",
];
const ALL_FIELDS = [
  "brokerCompensation", "brokerCompPaidBy", "originationFee", "processingFee",
  "discountPoints", "srpAmount", "yspAmount", "passThruFees", "toleranceCure",
  "brokerFlatFees", "loanRevenue", "lenderFeesCollected", "rateLockPeriod",
  "rateLockDate", "rateLockExpiry", "lienPosition", "amortizationType",
  "cashOutAmount", "investorSoldTo", "warehousePeriodDays", "servicingDisposition",
  "fundedDate",
];

const INPUT_CLS = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition shadow-sm";

const isoDate = (v) => {
  if (!v) return "";
  try { return new Date(v).toISOString().split("T")[0]; } catch { return ""; }
};

const fc = (v) =>
  new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: 2,
  }).format(v || 0);

const num = (v) => (v === "" || v == null ? 0 : Number(v));

const FundingRevenueTab = ({ loan, loanId }) => {
  const [compensation, setCompensation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => { loadCompensation(); }, [loanId]);

  const loadCompensation = async () => {
    setLoading(true);
    try {
      const res = await loanCompensationService.getCompensation(loanId);
      setCompensation(res.data);
      initFields(res.data);
    } catch (err) {
      console.error("Error loading compensation:", err);
      toast.error("Failed to load compensation data");
    } finally {
      setLoading(false);
    }
  };

  const initFields = (comp) => {
    if (!comp) return;
    const f = {};
    ALL_FIELDS.forEach((k) => {
      f[k] = DATE_KEYS.includes(k) ? isoDate(comp[k]) : (comp[k] ?? "");
    });
    setFields(f);
    setNotes(comp.compensationNotes || "");
    setHasChanges(false);
  };

  const set = (k, v) => {
    setFields((p) => ({ ...p, [k]: v }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      ALL_FIELDS.forEach((k) => {
        const v = fields[k];
        if (DATE_KEYS.includes(k)) payload[k] = v || null;
        else if (SELECT_KEYS.includes(k)) payload[k] = v || null;
        else payload[k] = v === "" || v == null ? null : Number(v);
      });
      const res = await loanCompensationService.updateCompensation(loanId, payload);
      setCompensation(res.data);
      initFields(res.data);
      toast.success("Revenue data saved successfully");
    } catch (err) {
      console.error("Error saving:", err);
      toast.error("Failed to save revenue data");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    initFields(compensation);
    toast("Changes discarded", { icon: "↩️" });
  };

  const loanAmount = loan?.loanDetails?.loanAmount || loan?.loanParameters?.loanAmount || 0;
  const brokerCompPct = loanAmount > 0
    ? ((num(fields.brokerCompensation) / loanAmount) * 100).toFixed(3) : "0.000";

  const grossRevenue =
    num(fields.brokerCompensation) + num(fields.brokerFlatFees) +
    num(fields.originationFee) + num(fields.processingFee) +
    num(fields.lenderFeesCollected) + num(fields.srpAmount) +
    num(fields.yspAmount) + num(fields.discountPoints) +
    num(fields.passThruFees) - num(fields.toleranceCure);

  const leadSource = loan?.leadSource || "Retail";
  const badge = CHANNEL_BADGES[leadSource] || CHANNEL_BADGES.Retail;

  const finalRate = compensation?.finalRate
    || loan?.loanDetails?.interestRate || loan?.loanParameters?.interestRate || null;

  const isLocked = !!compensation?.rateLockDate;

  const loName = loan?.assignedLoanOfficer
    ? `${loan.assignedLoanOfficer.firstName || ""} ${loan.assignedLoanOfficer.lastName || ""}`.trim() : "—";

  const mortgageType = loan?.loanParameters?.selectedProgramId?.programType
    || loan?.loanDetails?.loanType || "Conventional";

  const productName = loan?.loanParameters?.selectedProgramId?.programName
    || (loan?.loanParameters?.selectedProgramId?.programType
      ? `${loan.loanParameters.selectedProgramId.programType} ${loan?.loanParameters?.loanTerm || 30} Year ${compensation?.amortizationType || "Fixed"}`
      : "—");

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-7 bg-gray-200 rounded-lg w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg" />)}
          </div>
          <div className="h-64 bg-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ───── Header Card ───── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Funding / Revenue</h2>
            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider text-white ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            {isLocked ? <Lock className="h-3.5 w-3.5 text-emerald-400" /> : <Unlock className="h-3.5 w-3.5" />}
            <span className={isLocked ? "text-emerald-400 font-medium" : ""}>{isLocked ? "Rate Locked" : "Unlocked"}</span>
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          <SummaryCell label="Final Rate" value={finalRate ? `${finalRate}%` : "—"} accent="text-blue-700" />
          <SummaryCell label="Gross Revenue" value={fc(grossRevenue)} accent="text-emerald-700" />
          <SummaryCell label="Loan Amount" value={fc(loanAmount)} accent="text-gray-900" />
        </div>
      </div>

      {/* ───── Form Fields + Sidebar ───── */}
      <div className="flex gap-5">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <SectionHead icon={Briefcase} title="Loan & Rate Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-4">
            <Field label="Product">
              <ReadOnly value={productName} />
            </Field>
            <Field label="Final Rate">
              <ReadOnly value={finalRate ? `${finalRate}%` : "—"} highlight />
            </Field>
            <Field label="Loan Number">
              <ReadOnly value={loan?.loanNumber || "—"} />
            </Field>
            <Field label="Lock Period (days)">
              <input type="number" value={fields.rateLockPeriod ?? ""} onChange={(e) => set("rateLockPeriod", e.target.value)} placeholder="e.g. 30" className={INPUT_CLS} />
            </Field>
            <Field label="Lead Source">
              <ReadOnly value={leadSource} />
            </Field>
            <Field label="Rate Lock Date">
              <input type="date" value={fields.rateLockDate || ""} onChange={(e) => set("rateLockDate", e.target.value)} className={INPUT_CLS} />
            </Field>
            <Field label="Comp Paid Type">
              <select value={fields.brokerCompPaidBy || ""} onChange={(e) => set("brokerCompPaidBy", e.target.value)} className={INPUT_CLS}>
                <option value="">— Select —</option>
                {COMP_PAID_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Lock Expiry Date">
              <input type="date" value={fields.rateLockExpiry || ""} onChange={(e) => set("rateLockExpiry", e.target.value)} className={INPUT_CLS} />
            </Field>
            <Field label="Funded Date">
              <input type="date" value={fields.fundedDate || ""} onChange={(e) => set("fundedDate", e.target.value)} className={INPUT_CLS} />
            </Field>
            <Field label="Amortization Type">
              <select value={fields.amortizationType || ""} onChange={(e) => set("amortizationType", e.target.value)} className={INPUT_CLS}>
                <option value="">— Select —</option>
                {AMORT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Loan Info Sidebar */}
        <div className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Loan Info</h4>
          </div>
          <div className="px-5 py-4 space-y-4 flex-1">
            <SidebarRow icon="👤" label="Loan Officer" value={loName} />
            <SidebarRow icon="💰" label="Loan Amount" value={fc(loanAmount)} />
            <SidebarRow icon="🏦" label="Mortgage Type" value={mortgageType} />
            <div>
              <p className="text-[11px] text-gray-400 font-medium uppercase">Lien Position</p>
              <select
                value={fields.lienPosition || "1st"}
                onChange={(e) => set("lienPosition", e.target.value)}
                className="text-sm font-semibold text-gray-900 bg-transparent border-none p-0 -ml-0.5 focus:ring-0 cursor-pointer w-full"
              >
                {LIEN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-medium uppercase">Lock Status</p>
              <div className="flex items-center gap-1.5 mt-1">
                {isLocked
                  ? <Lock className="h-4 w-4 text-emerald-500" />
                  : <Unlock className="h-4 w-4 text-gray-400" />}
                <span className={`text-sm font-semibold ${isLocked ? "text-emerald-600" : "text-gray-500"}`}>
                  {isLocked ? "Locked" : "Unlocked"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───── Revenue Calculation ───── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <SectionHead icon={TrendingUp} title="Loan Revenue Calculation" />
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <FeeField label="Broker Compensation" value={fields.brokerCompensation} onChange={(v) => set("brokerCompensation", v)} hint={`= ${brokerCompPct}%`} />
            <FeeField label="Broker Fees" value={fields.brokerFlatFees} onChange={(v) => set("brokerFlatFees", v)} />
            <FeeField label="Origination Fee" value={fields.originationFee} onChange={(v) => set("originationFee", v)} />
            <FeeField label="Processing Fee" value={fields.processingFee} onChange={(v) => set("processingFee", v)} />
            <FeeField label="SRP Amount" value={fields.srpAmount} onChange={(v) => set("srpAmount", v)} />
            <FeeField label="YSP Amount" value={fields.yspAmount} onChange={(v) => set("yspAmount", v)} />
            <FeeField label="Discount Points" value={fields.discountPoints} onChange={(v) => set("discountPoints", v)} />
            <FeeField label="Pass-Through Fees" value={fields.passThruFees} onChange={(v) => set("passThruFees", v)} />
            <FeeField label="Lender Fees Collected" value={fields.lenderFeesCollected} onChange={(v) => set("lenderFeesCollected", v)} />
            <FeeField label="Tolerance Cure" value={fields.toleranceCure} onChange={(v) => set("toleranceCure", v)} minus />
          </div>
        </div>
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-t-2 border-emerald-200 px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-gray-900 text-base">Gross Revenue</span>
          <span className="font-bold text-emerald-700 tabular-nums text-lg tracking-tight">{fc(grossRevenue)}</span>
        </div>
      </div>

      {/* ───── Additional MCR Data ───── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <SectionHead icon={FileText} title="Additional MCR Data" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <Field label="Cash-Out Amount">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
              <input type="number" step="0.01" value={fields.cashOutAmount ?? ""} onChange={(e) => set("cashOutAmount", e.target.value)} className={`${INPUT_CLS} pl-7`} />
            </div>
          </Field>
          <Field label="Investor Sold To">
            <select value={fields.investorSoldTo || ""} onChange={(e) => set("investorSoldTo", e.target.value)} className={INPUT_CLS}>
              <option value="">— Select —</option>
              {INVESTOR_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Warehouse Period (days)">
            <input type="number" value={fields.warehousePeriodDays ?? ""} onChange={(e) => set("warehousePeriodDays", e.target.value)} className={INPUT_CLS} />
          </Field>
          <Field label="Servicing Disposition">
            <select value={fields.servicingDisposition || ""} onChange={(e) => set("servicingDisposition", e.target.value)} className={INPUT_CLS}>
              <option value="">— Select —</option>
              {SERVICING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* ───── Compensation Notes ───── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <SectionHead icon={FileText} title="Compensation Notes" />
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setHasChanges(true); }}
          rows={3}
          placeholder="Add notes about compensation, adjustments, or special considerations..."
          className="w-full mt-4 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none bg-gray-50/50 placeholder:text-gray-400"
        />
      </div>

      {/* ───── Sticky Save Bar ───── */}
      {hasChanges && (
        <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 px-6 py-3.5 flex items-center justify-between">
          <span className="text-sm text-gray-500 font-medium">Unsaved changes</span>
          <div className="flex items-center gap-3">
            <button onClick={handleDiscard} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition shadow-sm">
              Discard
            </button>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-sm">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════ Sub-components ═══════ */

const SectionHead = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2">
    <Icon className="h-4 w-4 text-gray-400" />
    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h3>
  </div>
);

const SummaryCell = ({ label, value, accent }) => (
  <div className="px-6 py-3 text-center">
    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
    <p className={`text-lg font-bold mt-0.5 tabular-nums ${accent}`}>{value}</p>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

const ReadOnly = ({ value, highlight }) => (
  <div className={`w-full px-3 py-2 rounded-lg text-sm cursor-default select-text border ${highlight ? "bg-blue-50/60 border-blue-100 text-blue-800 font-semibold" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
    {value || "—"}
  </div>
);

const SidebarRow = ({ icon, label, value }) => (
  <div>
    <p className="text-[11px] text-gray-400 font-medium uppercase">{label}</p>
    <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{icon && <span className="mr-1">{icon}</span>}{value || "—"}</p>
  </div>
);

const FeeField = ({ label, value, onChange, hint, minus }) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
      {label}
      {minus && <span className="ml-1 text-red-400 normal-case">(deducted)</span>}
    </label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">$</span>
      <input
        type="number"
        step="0.01"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition tabular-nums shadow-sm bg-white"
      />
    </div>
    {hint && <p className="mt-1 text-[11px] text-gray-400 font-medium">{hint}</p>}
  </div>
);

export default FundingRevenueTab;
