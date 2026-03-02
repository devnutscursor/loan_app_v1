import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { loanCompensationService } from "../../../../services/mcr.service";
import {
  CalendarDays,
  Save,
  RefreshCw,
  Clock,
  History,
  ChevronDown,
  ChevronUp,
  User,
  ArrowRight,
} from "lucide-react";

/**
 * Audit & Dates Tab
 * 
 * Manages all MCR-critical dates for a loan:
 * - 13 audit date fields (editable date pickers)
 * - Rate lock information (date, period, expiry)
 * - Status change history timeline
 */
const AuditDatesTab = ({ loan, loanId, fetchLoanDetails }) => {
  const [compensation, setCompensation] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editedDates, setEditedDates] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadData();
  }, [loanId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compRes, histRes] = await Promise.all([
        loanCompensationService.getCompensation(loanId),
        loanCompensationService.getStatusHistory(loanId),
      ]);
      setCompensation(compRes.data);
      setStatusHistory(histRes.data || []);
      initEditedDates(compRes.data);
    } catch (err) {
      console.error("Error loading audit data:", err);
      toast.error("Failed to load audit data");
    } finally {
      setLoading(false);
    }
  };

  const initEditedDates = (comp) => {
    if (!comp) return;
    const dates = {};
    dateFields.forEach(({ key }) => {
      dates[key] = comp[key] ? toInputDate(comp[key]) : "";
    });
    rateFields.forEach(({ key, type }) => {
      if (type === "date") {
        dates[key] = comp[key] ? toInputDate(comp[key]) : "";
      } else {
        dates[key] = comp[key] ?? "";
      }
    });
    setEditedDates(dates);
    setHasChanges(false);
  };

  const toInputDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().split("T")[0];
  };

  const handleDateChange = (key, value) => {
    setEditedDates((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      Object.entries(editedDates).forEach(([key, value]) => {
        if (dateFields.some((f) => f.key === key) || rateFields.some((f) => f.key === key && f.type === "date")) {
          payload[key] = value || null;
        } else {
          payload[key] = value === "" ? null : Number(value) || value || null;
        }
      });
      const res = await loanCompensationService.updateCompensation(loanId, payload);
      setCompensation(res.data);
      initEditedDates(res.data);
      toast.success("Audit dates saved successfully");
    } catch (err) {
      console.error("Error saving dates:", err);
      toast.error("Failed to save audit dates");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    initEditedDates(compensation);
    toast("Changes reset", { icon: "↩️" });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  // Date field definitions
  const dateFields = [
    { key: "applicationDate", label: "Application Date", description: "Date application was received/submitted" },
    { key: "approvalDate", label: "Approval Date", description: "Date of unconditional approval" },
    { key: "denialDate", label: "Denial Date", description: "Date application was denied" },
    { key: "withdrawnDate", label: "Withdrawn Date", description: "Date borrower withdrew application" },
    { key: "closedIncompleteDate", label: "Closed Incomplete Date", description: "Date file was closed incomplete" },
    { key: "clearToCloseDate", label: "Clear to Close Date", description: "Date loan was cleared to close" },
    { key: "closingDate", label: "Closing Date", description: "Date of loan closing/settlement" },
    { key: "fundedDate", label: "Funded Date", description: "Date funds were disbursed" },
    { key: "disbursementDate", label: "Disbursement Date", description: "Date of final disbursement" },
    { key: "firstPaymentDate", label: "First Payment Date", description: "Date of first mortgage payment" },
    { key: "noteDate", label: "Note Date", description: "Date on the promissory note" },
    { key: "recordingDate", label: "Recording Date", description: "Date deed/mortgage was recorded" },
  ];

  const rateFields = [
    { key: "rateLockDate", label: "Rate Lock Date", type: "date", description: "Date rate was locked" },
    { key: "rateLockPeriod", label: "Lock Period (days)", type: "number", description: "Number of days rate is locked" },
    { key: "rateLockExpiry", label: "Rate Lock Expiry", type: "date", description: "Date rate lock expires" },
    { key: "finalRate", label: "Final Rate (%)", type: "number", description: "Final locked interest rate" },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save/Reset */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CalendarDays className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Audit & Dates</h2>
          </div>
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <button
                onClick={handleReset}
                className="flex items-center px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition ${
                hasChanges
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Audit Dates Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Loan Audit Dates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dateFields.map(({ key, label, description }) => (
            <div key={key} className="group">
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="date"
                value={editedDates[key] || ""}
                onChange={(e) => handleDateChange(key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <p className="text-xs text-gray-400 mt-1">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rate Lock Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Rate Lock Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rateFields.map(({ key, label, type, description }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type === "date" ? "date" : "number"}
                step={key === "finalRate" ? "0.001" : "1"}
                value={editedDates[key] ?? ""}
                onChange={(e) => handleDateChange(key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <p className="text-xs text-gray-400 mt-1">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status Change History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
        >
          <div className="flex items-center">
            <History className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Status Change History ({statusHistory.length})
            </h3>
          </div>
          {showHistory ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {showHistory && (
          <div className="px-6 pb-6 border-t border-gray-100">
            {statusHistory.length > 0 ? (
              <div className="relative mt-4">
                {/* Timeline line */}
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />

                <div className="space-y-4">
                  {statusHistory.map((entry, i) => (
                    <div key={i} className="relative flex items-start pl-10">
                      {/* Timeline dot */}
                      <div className="absolute left-2.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow" />

                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center text-sm">
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                            {entry.previousStatus || "New"}
                          </span>
                          <ArrowRight className="h-3 w-3 mx-2 text-gray-400" />
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {entry.newStatus}
                          </span>
                        </div>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <User className="h-3 w-3 mr-1" />
                          <span>{entry.changedBy?.firstName} {entry.changedBy?.lastName || "System"}</span>
                          <span className="mx-2">·</span>
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatDateTime(entry.createdAt)}</span>
                        </div>
                        {entry.changeReason && (
                          <p className="mt-1 text-xs text-gray-600 italic">"{entry.changeReason}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic mt-4">No status changes recorded yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditDatesTab;
