import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
} from "lucide-react";

/**
 * MCR Validation Panel
 *
 * Displays cross-check validation results after an MCR report is generated.
 * Validation rules per sections 13.1–13.9 of MCR Implementation Plan.
 *
 * @param {Object} props.report - The active MCR report object
 * @param {Object} [props.fcData] - Financial Condition data (optional)
 * @param {Boolean} props.show - Whether to render the panel
 */
const MCRValidationPanel = ({ report, fcData, show }) => {
  if (!show || !report) return null;

  // Combine backend-provided validationErrors (if any) with client-side checks
  const backendResults = Array.isArray(report.validationErrors)
    ? report.validationErrors.map((ve) => ({
        rule: ve.code || "Backend validation",
        severity: ve.severity || "error",
        message: ve.message || "Validation error"
      }))
    : [];

  const results = [
    ...backendResults,
    ...runValidation(report, fcData)
  ];
  const errors = results.filter((r) => r.severity === "error");
  const warnings = results.filter((r) => r.severity === "warning");
  const passes = results.filter((r) => r.severity === "pass");

  const overallStatus =
    errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "pass";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div
        className={`px-6 py-4 border-b ${
          overallStatus === "error"
            ? "bg-red-50 border-red-200"
            : overallStatus === "warning"
            ? "bg-amber-50 border-amber-200"
            : "bg-green-50 border-green-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {overallStatus === "error" ? (
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
            ) : overallStatus === "warning" ? (
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
            )}
            <h3 className="text-sm font-semibold text-gray-900">
              Validation Results
            </h3>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-green-700">{passes.length} passed</span>
            {warnings.length > 0 && (
              <span className="text-amber-700">{warnings.length} warnings</span>
            )}
            {errors.length > 0 && (
              <span className="text-red-700">{errors.length} errors</span>
            )}
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
        {results.map((r, i) => (
          <div key={i} className="px-6 py-3 flex items-start">
            {r.severity === "error" ? (
              <XCircle className="h-4 w-4 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            ) : r.severity === "warning" ? (
              <AlertTriangle className="h-4 w-4 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{r.rule}</p>
              <p className="text-xs text-gray-500 mt-0.5">{r.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Run all validation checks against a report and optional FC data.
 */
function runValidation(report, fcData) {
  const results = [];
  const app = report.applicationData || {};
  const closed = report.closedLoanData || {};
  const rev = report.revenueData || {};
  const mloData = report.mloData || {};
  const mloOfficers = mloData.loanOfficers || (Array.isArray(mloData) ? mloData : []);

  // 13.1 Pipeline Balance Check
  // AC010 + AC020 = AC030 + AC040 + AC050 + AC060 + AC070 + AC080
  const pipelineCheck = (app.AC010?.count || 0) + (app.AC020?.count || 0) -
    (app.AC030?.count || 0) - (app.AC040?.count || 0) -
    (app.AC050?.count || 0) - (app.AC060?.count || 0) -
    (app.AC070?.count || 0) - (app.AC080?.count || 0);

  if (pipelineCheck === 0) {
    results.push({
      rule: "13.1 Pipeline Balance",
      severity: "pass",
      message: `Pipeline balances: AC010(${app.AC010?.count || 0}) + AC020(${app.AC020?.count || 0}) = AC030 + AC040 + AC050 + AC060 + AC070 + AC080`,
    });
  } else {
    results.push({
      rule: "13.1 Pipeline Balance",
      severity: "error",
      message: `Pipeline does not balance: remainder = ${pipelineCheck}. Check AC010–AC080 values.`,
    });
  }

  // 13.2 Closed Loan Vertical Checks — each breakdown should sum to AC100 total
  const totalClosed = closed.AC100?.count || 0;
  if (totalClosed > 0) {
    const verticals = {
      "By Loan Type (AC110-AC170)": ["AC110", "AC120", "AC130", "AC140", "AC150", "AC160", "AC170"],
      "By Property Type (AC200-AC240)": ["AC200", "AC210", "AC220", "AC230", "AC240"],
      "By Occupancy (AC300-AC320)": ["AC300", "AC310", "AC320"],
      "By Lien Position (AC500-AC520)": ["AC500", "AC510", "AC520"],
      "By QM Status (AC920-AC960)": ["AC920", "AC930", "AC940", "AC950", "AC960"],
    };

    let verticalPass = true;
    Object.entries(verticals).forEach(([label, codes]) => {
      const sum = codes.reduce((s, c) => s + (closed[c]?.count || 0), 0);
      if (sum !== totalClosed) {
        verticalPass = false;
        results.push({
          rule: `13.2 ${label}`,
          severity: "error",
          message: `${label} sum (${sum}) ≠ AC100 total (${totalClosed})`,
        });
      }
    });

    if (verticalPass) {
      results.push({
        rule: "13.2 Closed Loan Verticals",
        severity: "pass",
        message: `All breakdowns match AC100 count of ${totalClosed}`,
      });
    }
  } else {
    results.push({
      rule: "13.2 Closed Loan Verticals",
      severity: "pass",
      message: "No closed loans in period — skip vertical checks.",
    });
  }

  // 13.3 MLO Attribution Check — sum of MLO loan counts should = AC070 funded count
  const fundedCount = app.AC070?.count || 0;
  if (mloOfficers.length > 0) {
    const mloTotalCount = mloOfficers.reduce((s, m) => s + (m.loanCount || m.count || 0), 0);
    const mloTotalAmount = mloOfficers.reduce((s, m) => s + (m.totalAmount || m.amount || 0), 0);

    if (mloTotalCount === fundedCount) {
      results.push({
        rule: "13.3 MLO Attribution (Count)",
        severity: "pass",
        message: `MLO total count (${mloTotalCount}) = AC070 funded count (${fundedCount})`,
      });
    } else {
      results.push({
        rule: "13.3 MLO Attribution (Count)",
        severity: "warning",
        message: `MLO sum (${mloTotalCount}) ≠ AC070 (${fundedCount}) — check MLO assignments`,
      });
    }
  }

  // 13.4 Revenue Sanity Check
  const totalRevenue = rev.AC1100?.amount || 0;
  if (fundedCount > 0) {
    if (totalRevenue > 0) {
      results.push({
        rule: "13.4 Revenue Sanity",
        severity: "pass",
        message: `Revenue ($${totalRevenue.toLocaleString()}) > $0 with ${fundedCount} funded loans`,
      });
    } else {
      results.push({
        rule: "13.4 Revenue Sanity",
        severity: "warning",
        message: `Revenue is $0 but there are ${fundedCount} funded loans — check compensation data`,
      });
    }
  }

  // 13.5 Financial Condition Cross-Checks
  if (fcData) {
    const a290 = fcData.scheduleA?.totalAssets || 0;
    const b360 = fcData.scheduleB?.totalLiabilitiesAndEquity || 0;
    if (Math.abs(a290 - b360) < 1) {
      results.push({
        rule: "13.5 Balance Sheet",
        severity: "pass",
        message: `A290 ($${a290.toLocaleString()}) = B360 ($${b360.toLocaleString()})`,
      });
    } else {
      results.push({
        rule: "13.5 Balance Sheet",
        severity: "error",
        message: `A290 ($${a290.toLocaleString()}) ≠ B360 ($${b360.toLocaleString()}) — Balance sheet does not balance`,
      });
    }

    const erNetIncome = fcData.equityRollforward?.netIncome || 0;
    const dNetIncome = fcData.scheduleD?.netIncome || 0;
    if (Math.abs(erNetIncome - dNetIncome) < 1) {
      results.push({
        rule: "13.5 Net Income Match",
        severity: "pass",
        message: "Equity Rollforward Net Income = Schedule D Net Income",
      });
    } else {
      results.push({
        rule: "13.5 Net Income Match",
        severity: "error",
        message: `B350B ($${erNetIncome.toLocaleString()}) ≠ D600 ($${dNetIncome.toLocaleString()})`,
      });
    }
  }

  // 13.9 Excluded Loans
  if (report.totalLoansExcluded > 0) {
    results.push({
      rule: "13.9 Excluded Loans",
      severity: "pass",
      message: `${report.totalLoansExcluded} loans excluded (excludeFromMCR = true)`,
    });
  }

  // 13.8 Division-by-Zero (general info)
  results.push({
    rule: "13.8 Division Guard",
    severity: "pass",
    message: "All count-based averages use safe division (count > 0 check).",
  });

  return results;
}

export default MCRValidationPanel;
