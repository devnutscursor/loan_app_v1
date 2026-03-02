/**
 * Company Financial Condition Page
 *
 * Re-exports the same Financial Condition form using CompanyLayout
 * at /company/mcr-reports/financial-condition
 */
import React, { useState, useEffect } from "react";
import Head from "next/head";
import { toast } from "react-hot-toast";
import CompanyLayout from "../../../components/layout/CompanyLayout";
import { mcrService as MCRService } from "../../../services/mcr.service";
import {
  Calculator,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

/**
 * This page mirrors the lender FC page but wrapped in CompanyLayout.
 * For full schedule forms, see:
 *   frontend/src/pages/lender/mcr-reports/financial-condition.js
 */
const CompanyFinancialCondition = () => {
  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(QUARTERS[Math.floor(new Date().getMonth() / 3)]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ scheduleA: true, scheduleB: false, scheduleC: false, scheduleCF: false, scheduleD: false, scheduleO: false });
  const [explanatoryNotes, setExplanatoryNotes] = useState("");

  useEffect(() => { loadData(); }, [year, quarter]);

  const getEmptyData = () => ({ scheduleA: {}, scheduleB: {}, equityRollforward: {}, scheduleC: {}, scheduleCF: {}, scheduleD: {}, scheduleO: {} });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await MCRService.getFinancialCondition(year, quarter);
      const fc = res.data || getEmptyData();
      setData(fc);
      setExplanatoryNotes(fc.explanatoryNotes || "");
    } catch {
      setData(getEmptyData());
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (schedule, field, value) => {
    const numVal = value === "" ? 0 : parseFloat(value) || 0;
    setData(prev => ({ ...prev, [schedule]: { ...(prev[schedule] || {}), [field]: numVal } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await MCRService.saveFinancialCondition(year, quarter, { ...data, explanatoryNotes });
      toast.success("Financial Condition data saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const formatCurrency = (val) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val || 0);

  if (loading) {
    return (
      <CompanyLayout>
        <Head><title>Financial Condition | Company</title></Head>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <Head><title>Financial Condition | Company</title></Head>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center">
              <Calculator className="h-7 w-7 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Financial Condition</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">Schedules A–O (Company-Level, Quarterly)</p>
          </div>
          <div className="flex items-center space-x-3">
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={quarter} onChange={(e) => setQuarter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
            <button onClick={handleSave} disabled={saving} className="flex items-center px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
              {saving ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-4">
            This is the company-level Financial Condition entry form. For the full data entry experience with all schedules, calculated fields, and validation, use the Lender MCR Reports → Financial Condition page.
          </p>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <SummaryCard label="Total Assets (A290)" value={formatCurrency(data?.scheduleA?.totalAssets)} />
            <SummaryCard label="Total L&E (B360)" value={formatCurrency(data?.scheduleB?.totalLiabilitiesAndEquity)} />
            <SummaryCard label="Gross Income (C800)" value={formatCurrency(data?.scheduleC?.totalGrossIncome)} />
            <SummaryCard label="Net Income (D600)" value={formatCurrency(data?.scheduleD?.netIncome)} />
          </div>

          {/* Key fields in each schedule */}
          {Object.entries({
            scheduleA: { label: "Schedule A — Assets", fields: ["cashAndEquivalents", "otherAssets", "totalAssets"] },
            scheduleB: { label: "Schedule B — Liabilities & Equity", fields: ["warehouseLines", "totalLiabilities", "totalEquity", "totalLiabilitiesAndEquity"] },
            scheduleC: { label: "Schedule C — Income", fields: ["totalInterestIncome", "totalOriginationIncome", "totalGrossIncome"] },
            scheduleD: { label: "Schedule D — Expenses", fields: ["totalGrossExpenses", "incomeTaxes", "netIncome"] },
            scheduleO: { label: "Schedule O — Reserves", fields: ["creditLossEnding", "reoEnding", "repurchaseEnding"] },
          }).map(([key, { label, fields }]) => (
            <div key={key} className="mb-4">
              <button onClick={() => toggleSection(key)} className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                {expandedSections[key] ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                {label}
              </button>
              {expandedSections[key] && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-5">
                  {fields.map(field => (
                    <div key={field}>
                      <label className="block text-xs text-gray-500 mb-1">{field}</label>
                      <input
                        type="number"
                        value={data?.[key]?.[field] || ""}
                        onChange={(e) => handleFieldChange(key, field, e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Explanatory Notes</label>
            <textarea
              value={explanatoryNotes}
              onChange={(e) => setExplanatoryNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Notes..."
            />
          </div>
        </div>
      </div>
    </CompanyLayout>
  );
};

const SummaryCard = ({ label, value }) => (
  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

export default CompanyFinancialCondition;
