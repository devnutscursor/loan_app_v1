import React, { useState, useEffect, useCallback, useMemo } from "react";
import Head from "next/head";
import { toast } from "react-hot-toast";
import LenderLayout from "../../../components/layout/LenderLayout";
import { useAuth } from "../../../contexts/AuthContext";
import { mcrService as MCRService } from "../../../services/mcr.service";
import {
  DollarSign,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  FileBarChart,
  ChevronLeft,
} from "lucide-react";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

/**
 * Financial Condition Data Entry Page
 *
 * Company-level quarterly financial data entry for Schedules A–O.
 * Calculated fields auto-compute on input change.
 */
const FinancialCondition = () => {
  const { user } = useAuth();
  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(QUARTERS[Math.floor(new Date().getMonth() / 3)]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    scheduleA: true,
    scheduleB: false,
    equityRollforward: false,
    scheduleC: false,
    scheduleCF: false,
    scheduleD: false,
    scheduleO: false,
  });
  const [explanatoryNotes, setExplanatoryNotes] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    loadData();
  }, [year, quarter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await MCRService.getFinancialCondition(year, quarter);
      const fc = res.data || getEmptyData();
      setData(fc);
      setExplanatoryNotes(fc.explanatoryNotes || "");
    } catch (err) {
      console.error("Error loading FC data:", err);
      setData(getEmptyData());
    } finally {
      setLoading(false);
    }
  };

  const getEmptyData = () => ({
    scheduleA: {},
    scheduleB: {},
    equityRollforward: {},
    scheduleC: {},
    scheduleCF: {},
    scheduleD: {},
    scheduleO: {},
    explanatoryNotes: "",
  });

  const handleFieldChange = (schedule, field, value) => {
    const numVal = value === "" ? 0 : parseFloat(value) || 0;
    setData((prev) => {
      const updated = {
        ...prev,
        [schedule]: {
          ...(prev[schedule] || {}),
          [field]: numVal,
        },
      };
      return recalculate(updated);
    });
  };

  const handleNestedFieldChange = (schedule, parent, field, value) => {
    const numVal = value === "" ? 0 : parseFloat(value) || 0;
    setData((prev) => {
      const updated = {
        ...prev,
        [schedule]: {
          ...(prev[schedule] || {}),
          [parent]: {
            ...((prev[schedule] || {})[parent] || {}),
            [field]: numVal,
          },
        },
      };
      return recalculate(updated);
    });
  };

  /** Recalculate all calculated fields */
  const recalculate = (d) => {
    const a = d.scheduleA || {};
    const b = d.scheduleB || {};
    const er = d.equityRollforward || {};
    const c = d.scheduleC || {};
    const cf = d.scheduleCF || {};
    const dd = d.scheduleD || {};
    const o = d.scheduleO || {};

    // Schedule A calculations
    const mortSecTotal = (a.mortgageSecurities?.heldToMaturity || 0) + (a.mortgageSecurities?.availableForSale || 0) + (a.mortgageSecurities?.tradingSecurities || 0);
    const mortLoanTotal = (a.mortgageLoans?.hfsAtCost || 0) + (a.mortgageLoans?.hfsAtFairValue || 0) + (a.mortgageLoans?.hfiAtCost || 0) + (a.mortgageLoans?.hfiAtFairValue || 0) - (a.mortgageLoans?.allowanceForLoanLoss || 0);
    const totalMSR = (a.msrAmortized || 0) + (a.msrFairValue || 0);
    const totalAssets = (a.cashAndEquivalents || 0) + (a.accountsReceivable || 0) + mortSecTotal + mortLoanTotal + (a.otherRealEstateOwned || 0) + totalMSR + (a.derivativeAssets || 0) + (a.otherAssets || 0) + (a.investmentsInSubs || 0);

    // Schedule B calculations
    const totalShortTerm = (b.warehouseLines || 0) + (b.otherShortTermDebt || 0) + (b.accountsPayable || 0);
    const totalLongTerm = (b.notesPayable || 0) + (b.capitalLeases || 0) + (b.deferredRevenue || 0) + (b.guarantyLiabilities || 0) + (b.derivativeLiabilities || 0) + (b.taxesPayable || 0) + (b.deferredTaxLiability || 0) + (b.repurchaseReserves || 0);
    const totalLiabilities = totalShortTerm + totalLongTerm;
    const totalEquity = (b.preferredStock || 0) + (b.commonStock || 0) + (b.additionalPaidInCapital || 0) + (b.retainedEarnings || 0) - (b.treasuryStock || 0) + (b.otherComprehensiveIncome || 0) + (b.noncontrollingInterest || 0) + (b.subordinatedDebt || 0);
    const totalLE = totalLiabilities + totalEquity;

    // Equity Rollforward
    const endingEquity = (er.beginningBalance || 0) + (er.netIncome || 0) + (er.newStockIssuance || 0) - (er.stockRepurchases || 0) + (er.otherCapitalContributions || 0) + (er.ociUnrealizedGainsAFS || 0) + (er.ociUnrealizedGainsDerivatives || 0) + (er.ociOther || 0) - (er.dividendsDistributions || 0) + (er.equityAdjustments || 0);

    // Schedule C calculations
    const totalInterestIncome = (c.interestOnLoansHFS || 0) + (c.interestOnLoansHFI || 0) + (c.interestOnSecuritiesHTM || 0) + (c.interestOnSecuritiesAFS || 0) + (c.interestOnTradingSecurities || 0) + (c.otherInterestIncome || 0) + (c.yieldAdjustment || 0) + (c.servicingRelatedInterest || 0);
    const totalOriginationIncome = (c.discountsOnFVofLHS || 0) + (c.originationFees || 0) + (c.feesFromCorrespondents || 0) + (c.brokerFeesBrokeredOut || 0) + (c.otherOriginationIncome || 0) + (c.amountsReclassified || 0);
    const netSecondary = (c.gainOnLoansSoldServicingRetained || 0) + (c.capitalizedServicing || 0) + (c.gainOnLoansSoldServicingReleased || 0) + (c.servicingReleasedPremiums || 0) - (c.feesPaidToBrokers || 0) - (c.directFeesReclassified || 0) - (c.directExpensesReclassified || 0) + (c.recognitionOfRetainedInterests || 0) - (c.pairOffExpenses || 0) - (c.provisionForRepurchaseReserve || 0) + (c.locomAdjustments || 0) + (c.irlcIncome || 0) + (c.gainsOnDerivativesHedging || 0) + (c.gainOnFVChangesLHS || 0) + (c.otherSecondaryMarketGains || 0);
    const totalServicing = (c.servicingFeesFirstMortgages || 0) + (c.servicingFeesOtherMortgages || 0) + (c.subservicingFees || 0) + (c.lateFees || 0) + (c.amortizationOfMSRs || 0) + (c.changesMSRValuationAllowance || 0);
    const totalOtherNonInt = (c.gainFromSaleOfSecurities || 0) + (c.otherNonInterestIncome || 0);
    const totalGrossIncome = totalInterestIncome + totalOriginationIncome + netSecondary + totalServicing + totalOtherNonInt;
    const totalInterestExpense = (c.warehousingInterestExpense || 0) + (c.otherInterestExpense || 0);

    // Schedule CF
    const totalCashChange = (cf.netCashFromOperating || 0) + (cf.cashFromInvesting || 0) + (cf.cashFromFinancing || 0);

    // Schedule D calculations
    const totalOrigComp = (dd.loanProductionOfficers || 0) + (dd.loanOrigination || 0) + (dd.warehousingSecondaryMktg || 0) + (dd.postCloseSupport || 0) + (dd.originationManagement || 0);
    const totalServComp = (dd.servicingManagement || 0) + (dd.otherServicingPersonnel || 0);
    const totalOtherExp = (dd.occupancyAndEquipment || 0) + (dd.technologyExpenses || 0) + (dd.outsourcingFees || 0) + (dd.professionalFees || 0) + (dd.allOtherExpenses || 0);
    const totalCorpAdmin = (dd.corporateManagement || 0) + (dd.corporateTech || 0) + (dd.otherCorporateExpenses || 0);
    const totalPersonnel = totalOrigComp + totalServComp;
    const totalGrossExpenses = totalInterestExpense + totalPersonnel + totalOtherExp + totalCorpAdmin;
    const preTaxNOI = totalGrossIncome - totalGrossExpenses;
    const netIncome = preTaxNOI - (dd.incomeTaxes || 0);

    // Schedule O
    const creditLossEnding = (o.creditLossBeginning || 0) + (o.provisionForCreditLosses || 0) - (o.chargeOffsNet || 0);
    const reoEnding = (o.reoBeginning || 0) + (o.reoChanges || 0);
    const repurchaseEnding = (o.repurchaseBeginning || 0) + (o.provisionForRepurchases || 0) - (o.repurchaseChargeOffs || 0);

    return {
      ...d,
      scheduleA: {
        ...a,
        mortgageSecurities: { ...(a.mortgageSecurities || {}), total: mortSecTotal },
        mortgageLoans: { ...(a.mortgageLoans || {}), total: mortLoanTotal },
        totalMSR: totalMSR,
        totalAssets: totalAssets,
      },
      scheduleB: {
        ...b,
        totalShortTermLiabilities: totalShortTerm,
        totalLongTermLiabilities: totalLongTerm,
        totalLiabilities: totalLiabilities,
        totalEquity: totalEquity,
        totalLiabilitiesAndEquity: totalLE,
      },
      equityRollforward: { ...er, endingBalance: endingEquity },
      scheduleC: {
        ...c,
        totalInterestIncome: totalInterestIncome,
        totalOriginationIncome: totalOriginationIncome,
        netSecondaryMarketingIncome: netSecondary,
        totalServicingIncome: totalServicing,
        totalOtherNonInterestIncome: totalOtherNonInt,
        totalGrossIncome: totalGrossIncome,
        totalInterestExpense: totalInterestExpense,
      },
      scheduleCF: { ...cf, totalCashChange: totalCashChange },
      scheduleD: {
        ...dd,
        totalOriginationComp: totalOrigComp,
        totalServicingComp: totalServComp,
        totalCorporateAdmin: totalCorpAdmin,
        totalGrossExpenses: totalGrossExpenses,
        preTaxNetOperatingIncome: preTaxNOI,
        netIncome: netIncome,
      },
      scheduleO: {
        ...o,
        creditLossEnding: creditLossEnding,
        reoEnding: reoEnding,
        repurchaseEnding: repurchaseEnding,
      },
    };
  };

  const runValidation = () => {
    if (!data) return;
    const errors = [];
    const a = data.scheduleA || {};
    const b = data.scheduleB || {};
    const er = data.equityRollforward || {};
    const dd = data.scheduleD || {};

    // Balance sheet must balance: Total L&E = Total Assets
    if (Math.abs((b.totalLiabilitiesAndEquity || 0) - (a.totalAssets || 0)) > 0.01) {
      errors.push("Balance sheet does not balance: Total L&E ≠ Total Assets");
    }
    // Net income must match
    if (Math.abs((er.netIncome || 0) - (dd.netIncome || 0)) > 0.01) {
      errors.push("Equity Rollforward Net Income ≠ Schedule D Net Income");
    }
    // Ending equity must match
    if (Math.abs((er.endingBalance || 0) - (b.totalEquity || 0)) > 0.01) {
      errors.push("Equity Rollforward Ending Balance ≠ Schedule B Total Equity");
    }
    // Repurchase reserves cross-check
    const o = data.scheduleO || {};
    if (Math.abs((b.repurchaseReserves || 0) - (o.repurchaseEnding || 0)) > 0.01) {
      errors.push("Schedule B Repurchase Reserves ≠ Schedule O Ending Repurchase Reserve");
    }
    setValidationErrors(errors);
    return errors;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const errors = runValidation();
      const payload = { ...data, explanatoryNotes };
      await MCRService.saveFinancialCondition(year, quarter, payload);
      toast.success("Financial Condition data saved");
      if (errors && errors.length > 0) {
        toast("Validation warnings detected — review before finalizing", { icon: "⚠️" });
      }
    } catch (err) {
      console.error("Error saving FC:", err);
      toast.error("Failed to save data");
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val || 0);

  if (loading) {
    return (
      <LenderLayout>
        <Head><title>Financial Condition | LoanApp360</title></Head>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </LenderLayout>
    );
  }

  return (
    <LenderLayout>
      <Head><title>Financial Condition | LoanApp360</title></Head>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center">
              <Calculator className="h-7 w-7 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Financial Condition</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">Schedules A – O (Company-Level, Quarterly)</p>
          </div>
          <div className="flex items-center space-x-3">
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={quarter} onChange={(e) => setQuarter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {QUARTERS.map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-amber-800 flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 mr-2" />Validation Warnings
            </h3>
            <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
              {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {/* Schedule Sections */}
        <div className="space-y-4">
          {/* Schedule A: Assets */}
          <AccordionSection
            title="Schedule A — Assets"
            code="A"
            expanded={expandedSections.scheduleA}
            onToggle={() => toggleSection("scheduleA")}
            summary={formatCurrency(data?.scheduleA?.totalAssets)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CurrencyField label="A010 — Cash & Cash Equivalents" value={data?.scheduleA?.cashAndEquivalents} onChange={(v) => handleFieldChange("scheduleA", "cashAndEquivalents", v)} />
              <CurrencyField label="A020 — Accounts Receivable" value={data?.scheduleA?.accountsReceivable} onChange={(v) => handleFieldChange("scheduleA", "accountsReceivable", v)} />
            </div>
            <SubSection title="A030 — Mortgage-Backed Securities">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CurrencyField label="Held to Maturity" value={data?.scheduleA?.mortgageSecurities?.heldToMaturity} onChange={(v) => handleNestedFieldChange("scheduleA", "mortgageSecurities", "heldToMaturity", v)} />
                <CurrencyField label="Available for Sale" value={data?.scheduleA?.mortgageSecurities?.availableForSale} onChange={(v) => handleNestedFieldChange("scheduleA", "mortgageSecurities", "availableForSale", v)} />
                <CurrencyField label="Trading Securities" value={data?.scheduleA?.mortgageSecurities?.tradingSecurities} onChange={(v) => handleNestedFieldChange("scheduleA", "mortgageSecurities", "tradingSecurities", v)} />
              </div>
              <CalcField label="Total MBS" value={data?.scheduleA?.mortgageSecurities?.total} />
            </SubSection>
            <SubSection title="A060 — Mortgage Loans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField label="HFS at Cost" value={data?.scheduleA?.mortgageLoans?.hfsAtCost} onChange={(v) => handleNestedFieldChange("scheduleA", "mortgageLoans", "hfsAtCost", v)} />
                <CurrencyField label="HFS at Fair Value" value={data?.scheduleA?.mortgageLoans?.hfsAtFairValue} onChange={(v) => handleNestedFieldChange("scheduleA", "mortgageLoans", "hfsAtFairValue", v)} />
                <CurrencyField label="HFI at Cost" value={data?.scheduleA?.mortgageLoans?.hfiAtCost} onChange={(v) => handleNestedFieldChange("scheduleA", "mortgageLoans", "hfiAtCost", v)} />
                <CurrencyField label="HFI at Fair Value" value={data?.scheduleA?.mortgageLoans?.hfiAtFairValue} onChange={(v) => handleNestedFieldChange("scheduleA", "mortgageLoans", "hfiAtFairValue", v)} />
                <CurrencyField label="Allowance for Loan Loss (−)" value={data?.scheduleA?.mortgageLoans?.allowanceForLoanLoss} onChange={(v) => handleNestedFieldChange("scheduleA", "mortgageLoans", "allowanceForLoanLoss", v)} />
              </div>
              <CalcField label="Total Mortgage Loans" value={data?.scheduleA?.mortgageLoans?.total} />
            </SubSection>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <CurrencyField label="A090 — Other Real Estate Owned" value={data?.scheduleA?.otherRealEstateOwned} onChange={(v) => handleFieldChange("scheduleA", "otherRealEstateOwned", v)} />
              <CurrencyField label="A120 — MSR Amortized" value={data?.scheduleA?.msrAmortized} onChange={(v) => handleFieldChange("scheduleA", "msrAmortized", v)} />
              <CurrencyField label="A130 — MSR Fair Value" value={data?.scheduleA?.msrFairValue} onChange={(v) => handleFieldChange("scheduleA", "msrFairValue", v)} />
              <CalcField label="A160 — Total MSR" value={data?.scheduleA?.totalMSR} />
              <CurrencyField label="A220 — Derivative Assets" value={data?.scheduleA?.derivativeAssets} onChange={(v) => handleFieldChange("scheduleA", "derivativeAssets", v)} />
              <CurrencyField label="A230 — Other Assets" value={data?.scheduleA?.otherAssets} onChange={(v) => handleFieldChange("scheduleA", "otherAssets", v)} />
              <CurrencyField label="A280 — Investments in Subsidiaries" value={data?.scheduleA?.investmentsInSubs} onChange={(v) => handleFieldChange("scheduleA", "investmentsInSubs", v)} />
            </div>
            <CalcField label="A290 — Total Assets" value={data?.scheduleA?.totalAssets} highlight />
          </AccordionSection>

          {/* Schedule B: Liabilities & Equity */}
          <AccordionSection title="Schedule B — Liabilities & Equity" code="B" expanded={expandedSections.scheduleB} onToggle={() => toggleSection("scheduleB")} summary={formatCurrency(data?.scheduleB?.totalLiabilitiesAndEquity)}>
            <SubSection title="Short-Term Liabilities">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CurrencyField label="B010 — Warehouse Lines" value={data?.scheduleB?.warehouseLines} onChange={(v) => handleFieldChange("scheduleB", "warehouseLines", v)} />
                <CurrencyField label="B015 — Other Short-Term Debt" value={data?.scheduleB?.otherShortTermDebt} onChange={(v) => handleFieldChange("scheduleB", "otherShortTermDebt", v)} />
                <CurrencyField label="B016 — Accounts Payable" value={data?.scheduleB?.accountsPayable} onChange={(v) => handleFieldChange("scheduleB", "accountsPayable", v)} />
              </div>
              <CalcField label="B217 — Total Short-Term" value={data?.scheduleB?.totalShortTermLiabilities} />
            </SubSection>
            <SubSection title="Long-Term Liabilities">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField label="B020 — Notes Payable" value={data?.scheduleB?.notesPayable} onChange={(v) => handleFieldChange("scheduleB", "notesPayable", v)} />
                <CurrencyField label="B030 — Capital Leases" value={data?.scheduleB?.capitalLeases} onChange={(v) => handleFieldChange("scheduleB", "capitalLeases", v)} />
                <CurrencyField label="B050 — Deferred Revenue" value={data?.scheduleB?.deferredRevenue} onChange={(v) => handleFieldChange("scheduleB", "deferredRevenue", v)} />
                <CurrencyField label="B160 — Guaranty Liabilities" value={data?.scheduleB?.guarantyLiabilities} onChange={(v) => handleFieldChange("scheduleB", "guarantyLiabilities", v)} />
                <CurrencyField label="B180 — Derivative Liabilities" value={data?.scheduleB?.derivativeLiabilities} onChange={(v) => handleFieldChange("scheduleB", "derivativeLiabilities", v)} />
                <CurrencyField label="B190 — Taxes Payable" value={data?.scheduleB?.taxesPayable} onChange={(v) => handleFieldChange("scheduleB", "taxesPayable", v)} />
                <CurrencyField label="B200 — Deferred Tax Liability" value={data?.scheduleB?.deferredTaxLiability} onChange={(v) => handleFieldChange("scheduleB", "deferredTaxLiability", v)} />
                <CurrencyField label="B210 — Repurchase Reserves" value={data?.scheduleB?.repurchaseReserves} onChange={(v) => handleFieldChange("scheduleB", "repurchaseReserves", v)} />
              </div>
              <CalcField label="B219 — Total Long-Term" value={data?.scheduleB?.totalLongTermLiabilities} />
            </SubSection>
            <CalcField label="B220 — Total Liabilities" value={data?.scheduleB?.totalLiabilities} />
            <SubSection title="Equity">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField label="B240 — Subordinated Debt" value={data?.scheduleB?.subordinatedDebt} onChange={(v) => handleFieldChange("scheduleB", "subordinatedDebt", v)} />
                <CurrencyField label="B250 — Preferred Stock" value={data?.scheduleB?.preferredStock} onChange={(v) => handleFieldChange("scheduleB", "preferredStock", v)} />
                <CurrencyField label="B260 — Common Stock" value={data?.scheduleB?.commonStock} onChange={(v) => handleFieldChange("scheduleB", "commonStock", v)} />
                <CurrencyField label="B270 — Additional Paid-in Capital" value={data?.scheduleB?.additionalPaidInCapital} onChange={(v) => handleFieldChange("scheduleB", "additionalPaidInCapital", v)} />
                <CurrencyField label="B280 — Retained Earnings" value={data?.scheduleB?.retainedEarnings} onChange={(v) => handleFieldChange("scheduleB", "retainedEarnings", v)} />
                <CurrencyField label="B290 — Treasury Stock (−)" value={data?.scheduleB?.treasuryStock} onChange={(v) => handleFieldChange("scheduleB", "treasuryStock", v)} />
                <CurrencyField label="B300 — Other Comprehensive Income" value={data?.scheduleB?.otherComprehensiveIncome} onChange={(v) => handleFieldChange("scheduleB", "otherComprehensiveIncome", v)} />
                <CurrencyField label="B310 — Noncontrolling Interest" value={data?.scheduleB?.noncontrollingInterest} onChange={(v) => handleFieldChange("scheduleB", "noncontrollingInterest", v)} />
              </div>
            </SubSection>
            <CalcField label="B350 — Total Equity" value={data?.scheduleB?.totalEquity} />
            <CalcField label="B360 — Total Liabilities & Equity" value={data?.scheduleB?.totalLiabilitiesAndEquity} highlight />
          </AccordionSection>

          {/* Schedule B-350R: Equity Rollforward */}
          <AccordionSection title="Schedule B-350R — Equity Rollforward" code="B-350R" expanded={expandedSections.equityRollforward} onToggle={() => toggleSection("equityRollforward")} summary={formatCurrency(data?.equityRollforward?.endingBalance)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CurrencyField label="B350A — Beginning Balance" value={data?.equityRollforward?.beginningBalance} onChange={(v) => handleFieldChange("equityRollforward", "beginningBalance", v)} />
              <CurrencyField label="B350B — Net Income" value={data?.equityRollforward?.netIncome} onChange={(v) => handleFieldChange("equityRollforward", "netIncome", v)} />
              <CurrencyField label="B350C — New Stock Issuance" value={data?.equityRollforward?.newStockIssuance} onChange={(v) => handleFieldChange("equityRollforward", "newStockIssuance", v)} />
              <CurrencyField label="B350D — Stock Repurchases (−)" value={data?.equityRollforward?.stockRepurchases} onChange={(v) => handleFieldChange("equityRollforward", "stockRepurchases", v)} />
              <CurrencyField label="B350E — Other Capital Contributions" value={data?.equityRollforward?.otherCapitalContributions} onChange={(v) => handleFieldChange("equityRollforward", "otherCapitalContributions", v)} />
              <CurrencyField label="B350F — OCI: Unrealized Gains AFS" value={data?.equityRollforward?.ociUnrealizedGainsAFS} onChange={(v) => handleFieldChange("equityRollforward", "ociUnrealizedGainsAFS", v)} />
              <CurrencyField label="B350G — OCI: Unrealized Derivatives" value={data?.equityRollforward?.ociUnrealizedGainsDerivatives} onChange={(v) => handleFieldChange("equityRollforward", "ociUnrealizedGainsDerivatives", v)} />
              <CurrencyField label="B350H — OCI: Other" value={data?.equityRollforward?.ociOther} onChange={(v) => handleFieldChange("equityRollforward", "ociOther", v)} />
              <CurrencyField label="B350L — Dividends/Distributions (−)" value={data?.equityRollforward?.dividendsDistributions} onChange={(v) => handleFieldChange("equityRollforward", "dividendsDistributions", v)} />
              <CurrencyField label="B350N — Equity Adjustments" value={data?.equityRollforward?.equityAdjustments} onChange={(v) => handleFieldChange("equityRollforward", "equityAdjustments", v)} />
            </div>
            <CalcField label="B350T — Ending Balance" value={data?.equityRollforward?.endingBalance} highlight />
          </AccordionSection>

          {/* Schedule C: Income */}
          <AccordionSection title="Schedule C — Income" code="C" expanded={expandedSections.scheduleC} onToggle={() => toggleSection("scheduleC")} summary={formatCurrency(data?.scheduleC?.totalGrossIncome)}>
            <SubSection title="Interest Income">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField label="C010 — Interest on Loans HFS" value={data?.scheduleC?.interestOnLoansHFS} onChange={(v) => handleFieldChange("scheduleC", "interestOnLoansHFS", v)} />
                <CurrencyField label="C020 — Interest on Loans HFI" value={data?.scheduleC?.interestOnLoansHFI} onChange={(v) => handleFieldChange("scheduleC", "interestOnLoansHFI", v)} />
                <CurrencyField label="C030 — Securities HTM" value={data?.scheduleC?.interestOnSecuritiesHTM} onChange={(v) => handleFieldChange("scheduleC", "interestOnSecuritiesHTM", v)} />
                <CurrencyField label="C040 — Securities AFS" value={data?.scheduleC?.interestOnSecuritiesAFS} onChange={(v) => handleFieldChange("scheduleC", "interestOnSecuritiesAFS", v)} />
                <CurrencyField label="C050 — Trading Securities" value={data?.scheduleC?.interestOnTradingSecurities} onChange={(v) => handleFieldChange("scheduleC", "interestOnTradingSecurities", v)} />
                <CurrencyField label="C060 — Other Interest Income" value={data?.scheduleC?.otherInterestIncome} onChange={(v) => handleFieldChange("scheduleC", "otherInterestIncome", v)} />
                <CurrencyField label="C070 — Yield Adjustment" value={data?.scheduleC?.yieldAdjustment} onChange={(v) => handleFieldChange("scheduleC", "yieldAdjustment", v)} />
                <CurrencyField label="C080 — Servicing Related Interest" value={data?.scheduleC?.servicingRelatedInterest} onChange={(v) => handleFieldChange("scheduleC", "servicingRelatedInterest", v)} />
              </div>
              <CalcField label="C090 — Total Interest Income" value={data?.scheduleC?.totalInterestIncome} />
            </SubSection>
            <SubSection title="Origination-Related Income">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField label="C200 — Discounts/FV of LHS" value={data?.scheduleC?.discountsOnFVofLHS} onChange={(v) => handleFieldChange("scheduleC", "discountsOnFVofLHS", v)} />
                <CurrencyField label="C210 — Origination Fees" value={data?.scheduleC?.originationFees} onChange={(v) => handleFieldChange("scheduleC", "originationFees", v)} />
                <CurrencyField label="C220 — Fees from Correspondents" value={data?.scheduleC?.feesFromCorrespondents} onChange={(v) => handleFieldChange("scheduleC", "feesFromCorrespondents", v)} />
                <CurrencyField label="C230 — Broker Fees (Brokered Out)" value={data?.scheduleC?.brokerFeesBrokeredOut} onChange={(v) => handleFieldChange("scheduleC", "brokerFeesBrokeredOut", v)} />
                <CurrencyField label="C240 — Other Origination Income" value={data?.scheduleC?.otherOriginationIncome} onChange={(v) => handleFieldChange("scheduleC", "otherOriginationIncome", v)} />
                <CurrencyField label="C250 — Amounts Reclassified" value={data?.scheduleC?.amountsReclassified} onChange={(v) => handleFieldChange("scheduleC", "amountsReclassified", v)} />
              </div>
              <CalcField label="C260 — Total Origination Income" value={data?.scheduleC?.totalOriginationIncome} />
            </SubSection>
            <SubSection title="Secondary Marketing Gains / Losses">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField label="C300 — Gain Sold (Servicing Retained)" value={data?.scheduleC?.gainOnLoansSoldServicingRetained} onChange={(v) => handleFieldChange("scheduleC", "gainOnLoansSoldServicingRetained", v)} />
                <CurrencyField label="C310 — Capitalized Servicing" value={data?.scheduleC?.capitalizedServicing} onChange={(v) => handleFieldChange("scheduleC", "capitalizedServicing", v)} />
                <CurrencyField label="C320 — Gain Sold (Servicing Released)" value={data?.scheduleC?.gainOnLoansSoldServicingReleased} onChange={(v) => handleFieldChange("scheduleC", "gainOnLoansSoldServicingReleased", v)} />
                <CurrencyField label="C330 — Servicing Released Premiums" value={data?.scheduleC?.servicingReleasedPremiums} onChange={(v) => handleFieldChange("scheduleC", "servicingReleasedPremiums", v)} />
                <CurrencyField label="C340 — Fees Paid to Brokers (−)" value={data?.scheduleC?.feesPaidToBrokers} onChange={(v) => handleFieldChange("scheduleC", "feesPaidToBrokers", v)} />
                <CurrencyField label="C350 — Direct Fees Reclassified (−)" value={data?.scheduleC?.directFeesReclassified} onChange={(v) => handleFieldChange("scheduleC", "directFeesReclassified", v)} />
                <CurrencyField label="C360 — Direct Expenses Reclassified (−)" value={data?.scheduleC?.directExpensesReclassified} onChange={(v) => handleFieldChange("scheduleC", "directExpensesReclassified", v)} />
                <CurrencyField label="C370 — Retained Interest Recognition" value={data?.scheduleC?.recognitionOfRetainedInterests} onChange={(v) => handleFieldChange("scheduleC", "recognitionOfRetainedInterests", v)} />
                <CurrencyField label="C380 — Pair-off Expenses (−)" value={data?.scheduleC?.pairOffExpenses} onChange={(v) => handleFieldChange("scheduleC", "pairOffExpenses", v)} />
                <CurrencyField label="C390 — Provision for Repurchase Reserve (−)" value={data?.scheduleC?.provisionForRepurchaseReserve} onChange={(v) => handleFieldChange("scheduleC", "provisionForRepurchaseReserve", v)} />
                <CurrencyField label="C400 — LOCOM Adjustments" value={data?.scheduleC?.locomAdjustments} onChange={(v) => handleFieldChange("scheduleC", "locomAdjustments", v)} />
                <CurrencyField label="C410 — IRLC Income" value={data?.scheduleC?.irlcIncome} onChange={(v) => handleFieldChange("scheduleC", "irlcIncome", v)} />
                <CurrencyField label="C420 — Derivatives/Hedging Gains" value={data?.scheduleC?.gainsOnDerivativesHedging} onChange={(v) => handleFieldChange("scheduleC", "gainsOnDerivativesHedging", v)} />
                <CurrencyField label="C430 — FV Changes on LHS" value={data?.scheduleC?.gainOnFVChangesLHS} onChange={(v) => handleFieldChange("scheduleC", "gainOnFVChangesLHS", v)} />
                <CurrencyField label="C440 — Other Secondary Gains" value={data?.scheduleC?.otherSecondaryMarketGains} onChange={(v) => handleFieldChange("scheduleC", "otherSecondaryMarketGains", v)} />
              </div>
              <CalcField label="C450 — Net Secondary Marketing Income" value={data?.scheduleC?.netSecondaryMarketingIncome} />
            </SubSection>
            <SubSection title="Servicing-Related Income">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField label="C500 — Servicing Fees (1st Mortgages)" value={data?.scheduleC?.servicingFeesFirstMortgages} onChange={(v) => handleFieldChange("scheduleC", "servicingFeesFirstMortgages", v)} />
                <CurrencyField label="C510 — Servicing Fees (Other)" value={data?.scheduleC?.servicingFeesOtherMortgages} onChange={(v) => handleFieldChange("scheduleC", "servicingFeesOtherMortgages", v)} />
                <CurrencyField label="C520 — Sub-servicing Fees" value={data?.scheduleC?.subservicingFees} onChange={(v) => handleFieldChange("scheduleC", "subservicingFees", v)} />
                <CurrencyField label="C540 — Late Fees" value={data?.scheduleC?.lateFees} onChange={(v) => handleFieldChange("scheduleC", "lateFees", v)} />
                <CurrencyField label="C550 — Amortization of MSRs" value={data?.scheduleC?.amortizationOfMSRs} onChange={(v) => handleFieldChange("scheduleC", "amortizationOfMSRs", v)} />
                <CurrencyField label="C570 — MSR Valuation Changes" value={data?.scheduleC?.changesMSRValuationAllowance} onChange={(v) => handleFieldChange("scheduleC", "changesMSRValuationAllowance", v)} />
              </div>
              <CalcField label="C650 — Total Servicing Income" value={data?.scheduleC?.totalServicingIncome} />
            </SubSection>
            <SubSection title="Other Non-Interest Income">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField label="C720 — Gain from Sale of Securities" value={data?.scheduleC?.gainFromSaleOfSecurities} onChange={(v) => handleFieldChange("scheduleC", "gainFromSaleOfSecurities", v)} />
                <CurrencyField label="C770 — Other Non-Interest Income" value={data?.scheduleC?.otherNonInterestIncome} onChange={(v) => handleFieldChange("scheduleC", "otherNonInterestIncome", v)} />
              </div>
              <CalcField label="C780 — Total Other Non-Interest" value={data?.scheduleC?.totalOtherNonInterestIncome} />
            </SubSection>
            <CalcField label="C800 — Total Gross Income" value={data?.scheduleC?.totalGrossIncome} highlight />
            <SubSection title="Interest Expense">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField label="C100 — Warehousing Interest Expense" value={data?.scheduleC?.warehousingInterestExpense} onChange={(v) => handleFieldChange("scheduleC", "warehousingInterestExpense", v)} />
                <CurrencyField label="C150 — Other Interest Expense" value={data?.scheduleC?.otherInterestExpense} onChange={(v) => handleFieldChange("scheduleC", "otherInterestExpense", v)} />
              </div>
              <CalcField label="C160 — Total Interest Expense" value={data?.scheduleC?.totalInterestExpense} />
            </SubSection>
          </AccordionSection>

          {/* Schedule CF: Cash Flow */}
          <AccordionSection title="Schedule CF — Cash Flow" code="CF" expanded={expandedSections.scheduleCF} onToggle={() => toggleSection("scheduleCF")} summary={formatCurrency(data?.scheduleCF?.totalCashChange)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CurrencyField label="CF010 — Net Cash from Operating" value={data?.scheduleCF?.netCashFromOperating} onChange={(v) => handleFieldChange("scheduleCF", "netCashFromOperating", v)} />
              <CurrencyField label="CF020 — Cash from Investing" value={data?.scheduleCF?.cashFromInvesting} onChange={(v) => handleFieldChange("scheduleCF", "cashFromInvesting", v)} />
              <CurrencyField label="CF030 — Cash from Financing" value={data?.scheduleCF?.cashFromFinancing} onChange={(v) => handleFieldChange("scheduleCF", "cashFromFinancing", v)} />
            </div>
            <CalcField label="CF040 — Total Cash Change" value={data?.scheduleCF?.totalCashChange} highlight />
          </AccordionSection>

          {/* Schedule D: Non-Interest Expense */}
          <AccordionSection title="Schedule D — Non-Interest Expense" code="D" expanded={expandedSections.scheduleD} onToggle={() => toggleSection("scheduleD")} summary={formatCurrency(data?.scheduleD?.netIncome)}>
            <SubSection title="Origination Compensation">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField label="D010 — Loan Production Officers" value={data?.scheduleD?.loanProductionOfficers} onChange={(v) => handleFieldChange("scheduleD", "loanProductionOfficers", v)} />
                <CurrencyField label="D020 — Loan Origination" value={data?.scheduleD?.loanOrigination} onChange={(v) => handleFieldChange("scheduleD", "loanOrigination", v)} />
                <CurrencyField label="D030 — Warehousing/Secondary Mktg" value={data?.scheduleD?.warehousingSecondaryMktg} onChange={(v) => handleFieldChange("scheduleD", "warehousingSecondaryMktg", v)} />
                <CurrencyField label="D040 — Post-Close Support" value={data?.scheduleD?.postCloseSupport} onChange={(v) => handleFieldChange("scheduleD", "postCloseSupport", v)} />
                <CurrencyField label="D050 — Origination Management" value={data?.scheduleD?.originationManagement} onChange={(v) => handleFieldChange("scheduleD", "originationManagement", v)} />
              </div>
              <CalcField label="D070 — Total Origination Comp" value={data?.scheduleD?.totalOriginationComp} />
            </SubSection>
            <SubSection title="Servicing Compensation">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField label="D080 — Servicing Management" value={data?.scheduleD?.servicingManagement} onChange={(v) => handleFieldChange("scheduleD", "servicingManagement", v)} />
                <CurrencyField label="D090 — Other Servicing Personnel" value={data?.scheduleD?.otherServicingPersonnel} onChange={(v) => handleFieldChange("scheduleD", "otherServicingPersonnel", v)} />
              </div>
              <CalcField label="D100 — Total Servicing Comp" value={data?.scheduleD?.totalServicingComp} />
            </SubSection>
            <SubSection title="Other Expenses">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField label="D200 — Occupancy & Equipment" value={data?.scheduleD?.occupancyAndEquipment} onChange={(v) => handleFieldChange("scheduleD", "occupancyAndEquipment", v)} />
                <CurrencyField label="D210 — Technology Expenses" value={data?.scheduleD?.technologyExpenses} onChange={(v) => handleFieldChange("scheduleD", "technologyExpenses", v)} />
                <CurrencyField label="D220 — Outsourcing Fees" value={data?.scheduleD?.outsourcingFees} onChange={(v) => handleFieldChange("scheduleD", "outsourcingFees", v)} />
                <CurrencyField label="D230 — Professional Fees" value={data?.scheduleD?.professionalFees} onChange={(v) => handleFieldChange("scheduleD", "professionalFees", v)} />
                <CurrencyField label="D280 — All Other Expenses" value={data?.scheduleD?.allOtherExpenses} onChange={(v) => handleFieldChange("scheduleD", "allOtherExpenses", v)} />
              </div>
            </SubSection>
            <SubSection title="Corporate Administration">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField label="D400 — Corporate Management" value={data?.scheduleD?.corporateManagement} onChange={(v) => handleFieldChange("scheduleD", "corporateManagement", v)} />
                <CurrencyField label="D410 — Corporate Tech" value={data?.scheduleD?.corporateTech} onChange={(v) => handleFieldChange("scheduleD", "corporateTech", v)} />
                <CurrencyField label="D430 — Other Corporate Expenses" value={data?.scheduleD?.otherCorporateExpenses} onChange={(v) => handleFieldChange("scheduleD", "otherCorporateExpenses", v)} />
              </div>
              <CalcField label="D440 — Total Corporate Admin" value={data?.scheduleD?.totalCorporateAdmin} />
            </SubSection>
            <CalcField label="D310 — Total Gross Expenses" value={data?.scheduleD?.totalGrossExpenses} />
            <CalcField label="D510 — Pre-Tax Net Operating Income" value={data?.scheduleD?.preTaxNetOperatingIncome} />
            <CurrencyField label="D520 — Income Taxes" value={data?.scheduleD?.incomeTaxes} onChange={(v) => handleFieldChange("scheduleD", "incomeTaxes", v)} />
            <CalcField label="D600 — Net Income" value={data?.scheduleD?.netIncome} highlight />
          </AccordionSection>

          {/* Schedule O: Reserves */}
          <AccordionSection title="Schedule O — Reserves" code="O" expanded={expandedSections.scheduleO} onToggle={() => toggleSection("scheduleO")} summary="">
            <SubSection title="Credit Loss Reserves">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CurrencyField label="O010 — Beginning Balance" value={data?.scheduleO?.creditLossBeginning} onChange={(v) => handleFieldChange("scheduleO", "creditLossBeginning", v)} />
                <CurrencyField label="O020 — Provision for Credit Losses" value={data?.scheduleO?.provisionForCreditLosses} onChange={(v) => handleFieldChange("scheduleO", "provisionForCreditLosses", v)} />
                <CurrencyField label="O030 — Charge-offs (Net)" value={data?.scheduleO?.chargeOffsNet} onChange={(v) => handleFieldChange("scheduleO", "chargeOffsNet", v)} />
              </div>
              <CalcField label="O060 — Credit Loss Ending" value={data?.scheduleO?.creditLossEnding} />
            </SubSection>
            <SubSection title="REO Valuation">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField label="O110 — REO Beginning" value={data?.scheduleO?.reoBeginning} onChange={(v) => handleFieldChange("scheduleO", "reoBeginning", v)} />
                <CurrencyField label="O120 — REO Changes" value={data?.scheduleO?.reoChanges} onChange={(v) => handleFieldChange("scheduleO", "reoChanges", v)} />
              </div>
              <CalcField label="O130 — REO Ending" value={data?.scheduleO?.reoEnding} />
            </SubSection>
            <SubSection title="Repurchase Reserves">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CurrencyField label="O310 — Beginning Balance" value={data?.scheduleO?.repurchaseBeginning} onChange={(v) => handleFieldChange("scheduleO", "repurchaseBeginning", v)} />
                <CurrencyField label="O320 — Provision for Repurchases" value={data?.scheduleO?.provisionForRepurchases} onChange={(v) => handleFieldChange("scheduleO", "provisionForRepurchases", v)} />
                <CurrencyField label="O330 — Charge-offs" value={data?.scheduleO?.repurchaseChargeOffs} onChange={(v) => handleFieldChange("scheduleO", "repurchaseChargeOffs", v)} />
              </div>
              <CalcField label="O350 — Repurchase Ending" value={data?.scheduleO?.repurchaseEnding} />
            </SubSection>
            <SubSection title="Memo Items">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyField label="O360 — UPB Repurchased" value={data?.scheduleO?.upbRepurchased} onChange={(v) => handleFieldChange("scheduleO", "upbRepurchased", v)} />
                <CurrencyField label="O370 — Loans Repurchased (#)" value={data?.scheduleO?.loansRepurchased} onChange={(v) => handleFieldChange("scheduleO", "loansRepurchased", v)} />
              </div>
            </SubSection>
          </AccordionSection>

          {/* Explanatory Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Explanatory Notes</h3>
            <textarea
              value={explanatoryNotes}
              onChange={(e) => setExplanatoryNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any explanatory notes for this quarter's filing..."
            />
          </div>
        </div>
      </div>
    </LenderLayout>
  );
};

/* ──────────────────────────────────────────────────
 * Reusable Sub-Components
 * ────────────────────────────────────────────────── */

const AccordionSection = ({ title, code, expanded, onToggle, summary, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <button onClick={onToggle} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
      <div className="flex items-center">
        {expanded ? <ChevronDown className="h-5 w-5 text-gray-400 mr-2" /> : <ChevronRight className="h-5 w-5 text-gray-400 mr-2" />}
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded font-mono">{code}</span>
      </div>
      {summary && <span className="text-sm font-medium text-gray-700">{summary}</span>}
    </button>
    {expanded && <div className="px-6 pb-6 border-t border-gray-100 pt-4">{children}</div>}
  </div>
);

const SubSection = ({ title, children }) => (
  <div className="mt-4 mb-2">
    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-1">{title}</h4>
    {children}
  </div>
);

const CurrencyField = ({ label, value, onChange }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
      <input
        type="number"
        step="0.01"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        placeholder="0.00"
      />
    </div>
  </div>
);

const CalcField = ({ label, value, highlight }) => {
  const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
  return (
    <div className={`flex justify-between items-center mt-3 px-3 py-2 rounded-lg ${highlight ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border border-gray-200"}`}>
      <span className={`text-sm font-medium ${highlight ? "text-blue-800" : "text-gray-700"}`}>{label}</span>
      <span className={`text-sm font-bold ${highlight ? "text-blue-900" : "text-gray-900"}`}>{formatted}</span>
    </div>
  );
};

export default FinancialCondition;
