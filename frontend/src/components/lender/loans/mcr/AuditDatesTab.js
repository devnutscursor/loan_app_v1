import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { loanCompensationService } from "../../../../services/mcr.service";
import {
  Lock,
  Pencil,
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  User,
  Clock,
  History,
  ShieldCheck,
  CalendarDays,
  KeyRound,
  Landmark,
} from "lucide-react";

const isoDate = (v) => {
  if (!v) return "";
  try { return new Date(v).toISOString().split("T")[0]; } catch { return ""; }
};

const fmtDate = (v) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return "—"; }
};

const fc = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v || 0);

const EDITABLE_KEYS = [
  "applicationDate", "approvalDate", "denialDate", "withdrawnDate",
  "closedIncompleteDate", "clearToCloseDate", "closingDate", "fundedDate",
  "disbursementDate", "firstPaymentDate", "noteDate", "recordingDate",
  "rateLockDate", "rateLockPeriod", "rateLockExpiry",
];

const AuditDatesTab = ({ loan, loanId, fetchLoanDetails }) => {
  const [compensation, setCompensation] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(null);
  const [editedDates, setEditedDates] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [excludeFromMCR, setExcludeFromMCR] = useState(loan?.excludeFromMCR || false);

  useEffect(() => { loadData(); }, [loanId]);
  useEffect(() => {
    setExcludeFromMCR(loan?.excludeFromMCR || false);
  }, [loan?.excludeFromMCR]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compRes, histRes] = await Promise.all([
        loanCompensationService.getCompensation(loanId),
        loanCompensationService.getStatusHistory(loanId),
      ]);
      setCompensation(compRes.data);
      setStatusHistory(histRes.data || []);
      initDates(compRes.data);
    } catch (err) {
      console.error("Error loading audit data:", err);
      toast.error("Failed to load audit data");
    } finally {
      setLoading(false);
    }
  };

  const initDates = (comp) => {
    if (!comp) return;
    const d = {};
    EDITABLE_KEYS.forEach((k) => {
      if (k === "rateLockPeriod") d[k] = comp[k] ?? "";
      else d[k] = isoDate(comp[k]);
    });
    setEditedDates(d);
    setHasChanges(false);
  };

  const set = (k, v) => {
    setEditedDates((p) => ({ ...p, [k]: v }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      EDITABLE_KEYS.forEach((k) => {
        const v = editedDates[k];
        if (k === "rateLockPeriod") payload[k] = v === "" ? null : Number(v);
        else payload[k] = v || null;
      });
      const res = await loanCompensationService.updateCompensation(loanId, payload);
      setCompensation(res.data);
      initDates(res.data);
      setEditMode(null);
      toast.success("Dates saved successfully");
    } catch (err) {
      console.error("Error saving dates:", err);
      toast.error("Failed to save dates");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    initDates(compensation);
    setEditMode(null);
    toast("Changes discarded", { icon: "↩️" });
  };

  const handleExcludeToggle = async () => {
    if (!loanId) return;
    setSaving(true);
    const newValue = !excludeFromMCR;
    try {
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

  const finalRate = compensation?.finalRate
    || loan?.loanDetails?.interestRate || loan?.loanParameters?.interestRate || null;
  const productLabel = loan?.loanParameters?.selectedProgramId?.programType || "Conventional";
  const productName = loan?.loanParameters?.selectedProgramId?.programName || "—";
  const loanAmount = loan?.loanDetails?.loanAmount || loan?.loanParameters?.loanAmount || 0;
  const loanPurpose = loan?.loanDetails?.loanType || "—";
  const occupancy = loan?.loanDetails?.occupancyType || loan?.property?.occupancyType || "—";
  const propertyType = loan?.property?.propertyType || "—";
  const lienPosition = compensation?.lienPosition || "1st";
  const isExpired = compensation?.rateLockExpiry && new Date(compensation.rateLockExpiry) < new Date();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-7 bg-gray-200 rounded-lg w-1/3" />
          <div className="grid grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-lg" />)}
          </div>
          <div className="h-64 bg-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ════════════════════ MCR DATA AUDIT ════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white">MCR Data Audit</h2>
          </div>
          <button
            type="button"
            onClick={handleExcludeToggle}
            disabled={saving}
            className="flex items-center gap-2.5 cursor-pointer select-none group disabled:opacity-60 disabled:cursor-not-allowed"
            aria-pressed={excludeFromMCR}
            aria-label="Exclude from MCR"
          >
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide group-hover:text-gray-300 transition">Exclude from MCR</span>
            <div className={`relative w-10 h-[22px] rounded-full transition-colors ${excludeFromMCR ? "bg-red-500" : "bg-gray-600"}`}>
              <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${excludeFromMCR ? "translate-x-[22px]" : "translate-x-[3px]"}`} />
            </div>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-0">
          {/* Revenue Info */}
          <AuditColumn title="Revenue Info" color="emerald" last={false}>
            <AuditLine label="Broker Compensation" value={fc(compensation?.brokerCompensation)} />
            <AuditLine label="Paid By" value={compensation?.brokerCompPaidBy || "—"} />
            <AuditLine label="Pass Through Fees" value={fc(compensation?.passThruFees)} />
            <AuditLine label="Tolerance Cure" value={fc(compensation?.toleranceCure)} />
            <AuditLine label="Broker Flat Fees" value={fc(compensation?.brokerFlatFees)} />
            <AuditLine label="Loan Revenue" value={fc(compensation?.loanRevenue)} highlight />
          </AuditColumn>

          {/* Product Info */}
          <AuditColumn title="Product Info" color="blue" last={false}>
            <AuditLine label="" value={`${productLabel} · ${productName}`} bold />
            <AuditLine label="Final Rate" value={finalRate ? `${finalRate}%` : "—"} highlight />
            <AuditLine label="Discount Points" value={compensation?.discountPoints ? fc(compensation.discountPoints) : "—"} />
            <AuditLine label="Rate Lock Period" value={compensation?.rateLockPeriod ? `${compensation.rateLockPeriod} days` : "—"} />
            <AuditLine label="Rate Expiry" value={fmtDate(compensation?.rateLockExpiry)} warn={isExpired} />
          </AuditColumn>

          {/* Loan Info */}
          <AuditColumn title="Loan Info" color="violet" last>
            <AuditLine label="Loan Amount" value={fc(loanAmount)} highlight />
            <AuditLine label="Loan Purpose" value={loanPurpose} />
            <AuditLine label="CashOut Amount" value={compensation?.cashOutAmount ? fc(compensation.cashOutAmount) : "—"} />
            <AuditLine label="Occupancy" value={occupancy} />
            <AuditLine label="Property Type" value={propertyType} />
            <AuditLine label="Lien Position" value={lienPosition === "1st" ? "First Lien" : lienPosition} />
          </AuditColumn>
        </div>
      </div>

      {/* ════════════════════ DATE TRACKING ════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Date Tracking</h2>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Loan Milestones ── */}
          <DateCard
            icon={Landmark} title="Loan Milestones" color="blue"
            editing={editMode === "milestones"}
            onEdit={() => setEditMode(editMode === "milestones" ? null : "milestones")}
          >
            <DateRow label="Application Date" value={editedDates.applicationDate} dateKey="applicationDate" editing={editMode === "milestones"} onChange={set} mcr />
            <DateRow label="Approval Date" value={editedDates.approvalDate} dateKey="approvalDate" editing={editMode === "milestones"} onChange={set} />
            <DateRow label="Clear To Close" value={editedDates.clearToCloseDate} dateKey="clearToCloseDate" editing={editMode === "milestones"} onChange={set} />
            <DateRow label="Closing Date" value={editedDates.closingDate} dateKey="closingDate" editing={editMode === "milestones"} onChange={set} mcr />
            <DateRow label="Loan Funded" value={editedDates.fundedDate} dateKey="fundedDate" editing={editMode === "milestones"} onChange={set} mcr />
            <DateRow label="Disbursement" value={editedDates.disbursementDate} dateKey="disbursementDate" editing={editMode === "milestones"} onChange={set} />
            <DateRow label="Denied" value={editedDates.denialDate} dateKey="denialDate" editing={editMode === "milestones"} onChange={set} warn />
            <DateRow label="Withdrawn" value={editedDates.withdrawnDate} dateKey="withdrawnDate" editing={editMode === "milestones"} onChange={set} warn />
            <DateRow label="Closed Incomplete" value={editedDates.closedIncompleteDate} dateKey="closedIncompleteDate" editing={editMode === "milestones"} onChange={set} warn />
          </DateCard>

          {/* ── Lock Dates ── */}
          <DateCard
            icon={KeyRound} title="Lock Dates" color="amber"
            editing={editMode === "lock"}
            onEdit={() => setEditMode(editMode === "lock" ? null : "lock")}
          >
            <DateRow label="Rate Lock" value={editedDates.rateLockDate} dateKey="rateLockDate" editing={editMode === "lock"} onChange={set} />
            <DateRow label="Rate Lock Expiry" value={editedDates.rateLockExpiry} dateKey="rateLockExpiry" editing={editMode === "lock"} onChange={set} warn={isExpired} />
            {editMode === "lock" ? (
              <div className="flex items-center justify-between py-2.5 px-1">
                <span className="text-sm text-gray-600 font-medium">Lock Period (days)</span>
                <input
                  type="number" value={editedDates.rateLockPeriod ?? ""} onChange={(e) => set("rateLockPeriod", e.target.value)}
                  className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right shadow-sm"
                />
              </div>
            ) : (
              <PlainRow label="Lock Period" value={compensation?.rateLockPeriod ? `${compensation.rateLockPeriod} days` : "—"} />
            )}
            <PlainRow label="Final Rate" value={finalRate ? `${finalRate}%` : "—"} />
          </DateCard>

          {/* ── Key Dates ── */}
          <DateCard
            icon={CalendarDays} title="Key Dates" color="violet"
            editing={editMode === "key"}
            onEdit={() => setEditMode(editMode === "key" ? null : "key")}
          >
            <DateRow label="First Payment Date" value={editedDates.firstPaymentDate} dateKey="firstPaymentDate" editing={editMode === "key"} onChange={set} />
            <DateRow label="Note Date" value={editedDates.noteDate} dateKey="noteDate" editing={editMode === "key"} onChange={set} />
            <DateRow label="Recording Date" value={editedDates.recordingDate} dateKey="recordingDate" editing={editMode === "key"} onChange={set} />
          </DateCard>

          {/* ── Status History ── */}
          <div className="bg-gray-50/60 rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-100/60 transition"
            >
              <div className="flex items-center gap-2.5">
                <History className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Status History</h3>
                <span className="ml-1 text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{statusHistory.length}</span>
              </div>
              {showHistory ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>

            {showHistory && (
              <div className="px-5 pb-4 border-t border-gray-200">
                {statusHistory.length > 0 ? (
                  <div className="relative mt-4">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-300 to-gray-200 rounded-full" />
                    <div className="space-y-3">
                      {statusHistory.map((entry, i) => (
                        <div key={i} className="relative flex items-start pl-8">
                          <div className={`absolute left-[5px] top-2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${i === 0 ? "bg-blue-500" : "bg-gray-300"}`} />
                          <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-medium">{entry.previousStatus || "New"}</span>
                              <ArrowRight className="h-3 w-3 text-gray-400" />
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-semibold">{entry.newStatus}</span>
                            </div>
                            <div className="flex items-center mt-2 text-[11px] text-gray-500 gap-3">
                              <span className="flex items-center gap-1"><User className="h-3 w-3" />{entry.changedBy?.firstName} {entry.changedBy?.lastName || "System"}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtDate(entry.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic mt-3">No status changes recorded</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ────── Sticky Save Bar ────── */}
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

const COLUMN_ACCENTS = {
  emerald: "border-emerald-400",
  blue: "border-blue-400",
  violet: "border-violet-400",
};

const AuditColumn = ({ title, color, last, children }) => (
  <div className={`py-4 px-5 ${!last ? "md:border-r md:border-gray-100" : ""}`}>
    <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${COLUMN_ACCENTS[color] || "border-gray-200"}`}>
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h4>
    </div>
    <div className="space-y-2.5">{children}</div>
  </div>
);

const AuditLine = ({ label, value, bold, warn, highlight }) => (
  <div className="flex items-baseline justify-between gap-3">
    {label && <span className="text-xs text-gray-400 whitespace-nowrap">{label}</span>}
    <span className={`text-sm text-right truncate tabular-nums ${bold ? "font-bold text-gray-900" : warn ? "font-semibold text-red-600" : highlight ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
      {value}
    </span>
  </div>
);

const CARD_ACCENTS = {
  blue: "border-t-blue-500",
  amber: "border-t-amber-500",
  violet: "border-t-violet-500",
};

const DateCard = ({ icon: Icon, title, color, editing, onEdit, children }) => (
  <div className={`bg-white rounded-xl border border-gray-200 border-t-[3px] ${CARD_ACCENTS[color] || "border-t-gray-300"} overflow-hidden`}>
    <div className="flex items-center justify-between px-5 py-3 bg-gray-50/60 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h3>
      </div>
      <button onClick={onEdit} className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition ${editing ? "bg-blue-100 text-blue-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
        <Pencil className="h-3 w-3" />
        {editing ? "Done" : "Edit"}
      </button>
    </div>
    <div className="px-5 py-2 divide-y divide-gray-50">{children}</div>
  </div>
);

const PlainRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2.5 px-1">
    <span className="text-sm text-gray-600 font-medium">{label}</span>
    <span className="text-sm font-semibold text-gray-900 tabular-nums">{value}</span>
  </div>
);

const DateRow = ({ label, value, dateKey, editing, onChange, mcr, warn }) => {
  const hasValue = !!value;
  const displayVal = hasValue ? fmtDate(value) : "—";
  const isWarning = warn && hasValue;

  return (
    <div className="flex items-center justify-between py-2.5 px-1 group">
      <div className="flex items-center gap-2.5">
        {hasValue
          ? isWarning
            ? <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            : <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          : <Circle className="h-4 w-4 text-gray-200 flex-shrink-0" />}
        <span className="text-sm text-gray-700 font-medium">{label}</span>
        {mcr && (
          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-blue-100 text-blue-600 rounded-md tracking-wide">MCR</span>
        )}
      </div>
      {editing ? (
        <input
          type="date" value={value || ""} onChange={(e) => onChange(dateKey, e.target.value)}
          className="w-40 px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
        />
      ) : (
        <span className={`text-sm tabular-nums ${isWarning ? "text-red-600 font-semibold" : hasValue ? "text-gray-900 font-semibold" : "text-gray-300"}`}>
          {displayVal}
        </span>
      )}
    </div>
  );
};

export default AuditDatesTab;
