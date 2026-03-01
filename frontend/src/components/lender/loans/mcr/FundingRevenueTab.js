import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { loanCompensationService } from "../../../../services/mcr.service";
import {
  DollarSign,
  Save,
  RefreshCw,
  TrendingUp,
  Landmark,
  FileBarChart,
  Percent,
  Building,
} from "lucide-react";

/**
 * Funding & Revenue Tab
 * 
 * Captures all financial/revenue data for a loan:
 * - Revenue/comp fields (broker comp, origination, processing, SRP, YSP, etc.)
 * - Product info (rate, lock period, lien position, amortization)
 * - Loan classification (MCR-specific fields)
 * - Additional MCR data (cash-out amount, investor, warehouse days, servicing)
 */
const FundingRevenueTab = ({ loan, loanId, fetchLoanDetails }) => {
  const [compensation, setCompensation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedFields, setEditedFields] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadCompensation();
  }, [loanId]);

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
    const fields = {};
    allFieldGroups.forEach((group) => {
      group.fields.forEach(({ key, type }) => {
        if (type === "select") {
          fields[key] = comp[key] || "";
        } else {
          fields[key] = comp[key] ?? "";
        }
      });
    });
    setEditedFields(fields);
    setHasChanges(false);
  };

  const handleFieldChange = (key, value) => {
    setEditedFields((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      allFieldGroups.forEach((group) => {
        group.fields.forEach(({ key, type }) => {
          const val = editedFields[key];
          if (type === "currency" || type === "number" || type === "percent") {
            payload[key] = val === "" || val === undefined ? null : Number(val);
          } else if (type === "select") {
            payload[key] = val || null;
          } else {
            payload[key] = val || null;
          }
        });
      });
      const res = await loanCompensationService.updateCompensation(loanId, payload);
      setCompensation(res.data);
      initFields(res.data);
      toast.success("Revenue data saved successfully");
    } catch (err) {
      console.error("Error saving compensation:", err);
      toast.error("Failed to save revenue data");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    initFields(compensation);
    toast("Changes reset", { icon: "↩️" });
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val || 0);

  // Field group definitions
  const revenueFields = {
    title: "Revenue & Compensation",
    icon: DollarSign,
    description: "All revenue components for MCR reporting",
    fields: [
      { key: "brokerCompensation", label: "Broker Compensation ($)", type: "currency" },
      { key: "brokerCompPaidBy", label: "Comp Paid By", type: "select", options: ["Borrower", "Lender", "Split", "N/A"] },
      { key: "originationFee", label: "Origination Fee ($)", type: "currency" },
      { key: "processingFee", label: "Processing Fee ($)", type: "currency" },
      { key: "discountPoints", label: "Discount Points ($)", type: "currency" },
      { key: "srpAmount", label: "SRP Amount ($)", type: "currency" },
      { key: "yspAmount", label: "YSP Amount ($)", type: "currency" },
      { key: "passThruFees", label: "Pass-thru Fees ($)", type: "currency" },
      { key: "toleranceCure", label: "Tolerance Cure ($)", type: "currency" },
      { key: "brokerFlatFees", label: "Broker Flat Fees ($)", type: "currency" },
      { key: "loanRevenue", label: "Loan Revenue ($)", type: "currency" },
      { key: "lenderFeesCollected", label: "Lender Fees Collected ($)", type: "currency" },
    ],
  };

  const productFields = {
    title: "Product Information",
    icon: TrendingUp,
    description: "Rate, lock, and product classification",
    fields: [
      { key: "finalRate", label: "Final Rate (%)", type: "percent" },
      { key: "rateLockPeriod", label: "Lock Period (days)", type: "number" },
      { key: "lienPosition", label: "Lien Position", type: "select", options: ["1st", "2nd", "Not Secured by Lien"] },
      { key: "amortizationType", label: "Amortization Type", type: "select", options: ["Fixed", "ARM", "Option ARM"] },
    ],
  };

  const additionalFields = {
    title: "Additional MCR Data",
    icon: FileBarChart,
    description: "Cash-out, investor, warehouse, and servicing data",
    fields: [
      { key: "cashOutAmount", label: "Cash-Out Amount ($)", type: "currency" },
      { key: "investorSoldTo", label: "Investor Sold To", type: "select", options: ["Fannie Mae", "Freddie Mac", "Ginnie Mae", "Private Investor", "FHLBank", "Life Insurance", "Commercial Bank", "Other", "Not Sold"] },
      { key: "warehousePeriodDays", label: "Warehouse Period (days)", type: "number" },
      { key: "servicingDisposition", label: "Servicing Disposition", type: "select", options: ["Released", "Retained", "N/A"] },
    ],
  };

  const allFieldGroups = [revenueFields, productFields, additionalFields];

  // Calculate totals
  const totalRevenue =
    (Number(editedFields.brokerCompensation) || 0) +
    (Number(editedFields.originationFee) || 0) +
    (Number(editedFields.processingFee) || 0) +
    (Number(editedFields.srpAmount) || 0) +
    (Number(editedFields.yspAmount) || 0) +
    (Number(editedFields.brokerFlatFees) || 0);

  const totalFees =
    (Number(editedFields.originationFee) || 0) +
    (Number(editedFields.processingFee) || 0) +
    (Number(editedFields.brokerFlatFees) || 0) +
    (Number(editedFields.passThruFees) || 0);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
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
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Funding & Revenue</h2>
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
                  ? "bg-green-600 text-white hover:bg-green-700"
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

      {/* Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600 font-semibold uppercase">Total Revenue</p>
          <p className="text-2xl font-bold text-green-800">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-semibold uppercase">Total Fees</p>
          <p className="text-2xl font-bold text-blue-800">{formatCurrency(totalFees)}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4">
          <p className="text-xs text-purple-600 font-semibold uppercase">Final Rate</p>
          <p className="text-2xl font-bold text-purple-800">
            {editedFields.finalRate ? `${editedFields.finalRate}%` : "—"}
          </p>
        </div>
      </div>

      {/* Field Groups */}
      {allFieldGroups.map((group) => {
        const Icon = group.icon;
        return (
          <div key={group.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-1">
              <Icon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {group.title}
              </h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">{group.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.fields.map(({ key, label, type, options }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  {type === "select" ? (
                    <select
                      value={editedFields[key] || ""}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                    >
                      <option value="">— Select —</option>
                      {options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : type === "text" ? (
                    <input
                      type="text"
                      value={editedFields[key] || ""}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                  ) : (
                    <div className="relative">
                      {type === "currency" && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      )}
                      {type === "percent" && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                      )}
                      <input
                        type="number"
                        step={type === "percent" ? "0.001" : type === "currency" ? "0.01" : "1"}
                        value={editedFields[key] ?? ""}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition ${
                          type === "currency" ? "pl-7" : ""
                        } ${type === "percent" ? "pr-7" : ""}`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FundingRevenueTab;
