import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { ChevronUp, ChevronDown, Search, RefreshCw, Loader2, Info } from "lucide-react";
import customAxios from "../../../utils/axios";
import {
  filterCatalogProductsByBankruptcy,
  filterRatesByBankruptcy,
  BANKRUPTCY_CHAPTER_OPTIONS,
  BANKRUPTCY_STATUS_OPTIONS,
  bankruptcyDischargeSeasoningYears,
  isBankruptcyHardStopStatus,
  isBucketEligibleForBankruptcy,
  mortgagePayloadViolatesBankruptcyHardStop,
  parseBankruptcyCount,
} from "../../../utils/bankruptcySeasoning";
import {
  classifyMortgageProductText,
  filterCatalogProductsByHousingSeasoning,
  filterRatesByHousingEvent,
  housingSeasoningYears,
  isBucketEligibleForHousingSeasoning,
  HOUSING_EVENT_TYPE_OPTIONS,
} from "../../../utils/housingEventSeasoning";
import { getTotalIncome, getTotalDebts } from "./utils/LoanCalculationUtils";
import {
  buildBorrowersForNonOccupantValidation,
  NON_OCCUPANT_FNMA_HELP_TEXT,
  validateNonOccupantForPricing,
} from "../../../utils/nonOccupantCoBorrower";
import {
  applyEscrowWaiverFilter,
  ESCROW_WAIVER_HELP_TEXT,
  mapMortgageTypeToEscrowLoanType,
} from "../../../utils/escrowWaiver";
import {
  computeIsSelfEmployed,
  filterCatalogSelfEmployedNonQmPivot,
  shouldPivotToNonQmDocs,
  validateSelfEmployedNonQmBankStatementLtv,
} from "../../../utils/selfEmployedProductRouting";
import { mergeFthbEnhancedProgramsIntoCatalog } from "../../../utils/firstTimeHomebuyerProductRouting";
import {
  computeUsdaEligibility,
  filterCatalogRuralUsdaOnly,
} from "../../../utils/ruralUsdaRouting";
import {
  SOLAR_INITIAL,
  applySolarLtvAdjustment,
  evaluateSolarRules,
  filterCatalogForSolar,
  hydrateSolarFromLoan,
  solarMortechOverrides,
  validateSolarDetails,
} from "../../../utils/solarRouting";
import {
  MI_COMPANY_OPTIONS,
  MI_COVERAGE_OPTIONS,
  MI_INITIAL,
  MI_NO_MI_MODE_OPTIONS,
  estimateBpmiMonthly,
  hydrateMiFromLoan,
  miMortechOverrides,
  shouldShowMiFields,
  validateMiDetails,
} from "../../../utils/miRouting";
import SolarDetailsModal from "./SolarDetailsModal";
import BrokerCompensationModal from "./BrokerCompensationModal";
import {
  COMP_INITIAL,
  FIXED_BORROWER_SECTION_A_FEE_PCT,
  applyCompensationToRate,
  buildPricingSelectionCompensation,
  hydrateCompensationFromLoan,
  quoteDetailPointsCostAndPct,
} from "../../../utils/compensationRouting";

const LOAN_TERM_OPTIONS = ["30", "25", "20", "15", "10"];

const NON_QM_MORTGAGE_TYPE = "Non-QM (Non-Conforming)";

const MORTGAGE_TYPE_OPTIONS = [
  "Conforming",
  "FHA",
  "VA",
  "JUMBO",
  NON_QM_MORTGAGE_TYPE,
  "Second Home",
  "Home Ready Program",
  "Home Possible Program",
];

const MORTGAGE_TYPE_KEYWORDS = {
  Conforming: { include: ["conf"], exclude: ["home ready", "home poss"] },
  FHA: { include: ["fha"] },
  VA: { include: ["va"] },
  USDA: { include: ["usda", "rural", "fmha", "govt rd"] },
  JUMBO: { include: ["jumbo"] },
  "Second Home": { include: ["conf"], exclude: ["home ready", "home poss"] },
  "Home Ready Program": { include: ["home ready"] },
  "Home Possible Program": { include: ["home poss"] },
};
const AFFORDABLE_PRODUCT_KEYWORDS = ["home ready", "homeready", "home possible", "home poss", "homepossible"];

const filterCatalogProducts = (products, mortgageType, rateType, loanTerm) => {
  if (!products || products.length === 0) return [];
  if (String(mortgageType || "").includes(" / ")) {
    const termYr = parseInt(String(loanTerm || "").trim(), 10);
    const rateKey = String(rateType || "").toLowerCase();
    const selectedTypes = String(mortgageType)
      .split(" / ")
      .map((s) => s.trim())
      .filter(Boolean);
    const allowedBuckets = new Set(
      selectedTypes.flatMap((label) => MORTGAGE_LABEL_TO_BUCKETS[label] || [])
    );
    return products.filter((p) => {
      const bucket = classifyMortgageProductText(p?.name || "");
      if (!allowedBuckets.has(bucket)) return false;
      const name = String(p?.name || "").toLowerCase();
      if (rateKey && !name.includes(rateKey)) return false;
      if (Number.isFinite(termYr) && termYr > 0) {
        const termOk =
          name.includes(`${termYr} yr`) ||
          name.includes(`${termYr} year`) ||
          name.includes(`${termYr}yr`) ||
          name.includes(`${termYr}year`);
        if (!termOk) return false;
      }
      return true;
    });
  }
  if (mortgageType === NON_QM_MORTGAGE_TYPE) {
    const termYr = parseInt(String(loanTerm || "").trim(), 10);
    const rateKey = String(rateType || "").toLowerCase();
    const nonQmOnly = products.filter((p) => classifyMortgageProductText(p?.name || "") === "nonQm");
    const narrowed = nonQmOnly.filter((p) => {
      if (classifyMortgageProductText(p?.name || "") !== "nonQm") return false;
      const name = (p.name || "").toLowerCase();
      if (rateKey && !name.includes(rateKey)) return false;
      if (Number.isFinite(termYr) && termYr > 0) {
        const termOk =
          name.includes(`${termYr} yr`) ||
          name.includes(`${termYr} year`) ||
          name.includes(`${termYr}yr`) ||
          name.includes(`${termYr}year`);
        if (!termOk) return false;
      }
      return true;
    });
    // Non-QM naming in vendor catalog is inconsistent; if strict term/rate filter yields none,
    // still show all Non-QM options so user can proceed with placeholder flow.
    return narrowed.length > 0 ? narrowed : nonQmOnly;
  }
  const mtConfig = MORTGAGE_TYPE_KEYWORDS[mortgageType];
  if (!mtConfig) return products;

  const termStr = `${loanTerm} yr`;

  return products.filter((p) => {
    // Guardrail: never include Non-QM bucket products in keyword-based conforming/gov filters.
    // Non-QM should only appear when explicitly selected or when allowNonQm alternatives are merged in.
    if (classifyMortgageProductText(p?.name || "") === "nonQm") return false;

    const name = (p.name || "").toLowerCase();

    const matchesMortgage = mtConfig.include.some((kw) => name.includes(kw));
    if (!matchesMortgage) return false;

    if (mtConfig.exclude) {
      const excluded = mtConfig.exclude.some((kw) => name.includes(kw));
      if (excluded) return false;
    }

    const matchesRate = name.includes(rateType.toLowerCase());
    if (!matchesRate) return false;

    const matchesTerm = name.includes(termStr);
    if (!matchesTerm) return false;

    return true;
  });
};

/**
 * Catalog product filter that can optionally include Non-QM products as selectable alternatives
 * even when the chosen mortgageType keyword filter would normally exclude them.
 *
 * This supports workflows like housing-event / derogatory filters where conventional/gov may be
 * ineligible, but Non-QM remains eligible and should remain selectable.
 */
const filterCatalogProductsAllowNonQm = (products, mortgageType, rateType, loanTerm, allowNonQm = false) => {
  const base = filterCatalogProducts(products, mortgageType, rateType, loanTerm);
  if (!allowNonQm) return base;
  if (!products || products.length === 0) return base;

  const termYr = parseInt(String(loanTerm || "").trim(), 10);
  const rateKey = String(rateType || "").toLowerCase();
  const nonQmOnly = products.filter((p) => classifyMortgageProductText(p?.name || "") === "nonQm");

  const nonQmExtrasNarrow = nonQmOnly.filter((p) => {
    if (classifyMortgageProductText(p?.name || "") !== "nonQm") return false;
    const name = (p.name || "").toLowerCase();
    // Keep non-qm list aligned with the user's term/rate selection for usability.
    if (rateKey && !name.includes(rateKey)) return false;
    if (Number.isFinite(termYr) && termYr > 0) {
      const termOk =
        name.includes(`${termYr} yr`) ||
        name.includes(`${termYr} year`) ||
        name.includes(`${termYr}yr`) ||
        name.includes(`${termYr}year`);
      if (!termOk) return false;
    }
    return true;
  });
  const nonQmExtras = nonQmExtrasNarrow.length > 0 ? nonQmExtrasNarrow : nonQmOnly;

  if (nonQmExtras.length === 0) return base;

  const seen = new Set(base.map((p) => String(p.productId)));
  const merged = base.slice();
  for (const p of nonQmExtras) {
    const id = String(p.productId);
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(p);
    }
  }
  return merged;
};

const filterByAffordableEligibility = (items, affordableEligibility) => {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (!affordableEligibility) return items;
  const eligibleFlag = affordableEligibility.affordableEligible;
  // Unknown / missing inputs: do not filter, just show warning in UI.
  if (eligibleFlag == null) return items;

  // Mode 1 (Strict): Affordable checked switches product category.
  if (eligibleFlag === true) {
    return items.filter((item) => {
      const text = String(item?.name || item?.productName || item?.vendorProductName || "").toLowerCase();
      return AFFORDABLE_PRODUCT_KEYWORDS.some((kw) => text.includes(kw));
    });
  }

  // Not eligible: hide affordable programs, keep everything else visible.
  return items.filter((item) => {
    const text = String(item?.name || item?.productName || item?.vendorProductName || "").toLowerCase();
    return !AFFORDABLE_PRODUCT_KEYWORDS.some((kw) => text.includes(kw));
  });
};

/** HomeReady/HomePossible only, with same rate/term narrowing as main catalog filter. */
const filterCatalogToAffordableProgramsOnly = (products, rateType, loanTerm) => {
  if (!products || products.length === 0) return [];
  const termYr = parseInt(String(loanTerm || "").trim(), 10);
  const rateKey = String(rateType || "").toLowerCase();
  return products.filter((p) => {
    const name = String(p?.name || "").toLowerCase();
    if (!AFFORDABLE_PRODUCT_KEYWORDS.some((kw) => name.includes(kw))) return false;
    if (rateKey && !name.includes(rateKey)) return false;
    if (Number.isFinite(termYr) && termYr > 0) {
      const termOk =
        name.includes(`${termYr} yr`) ||
        name.includes(`${termYr} year`) ||
        name.includes(`${termYr}yr`) ||
        name.includes(`${termYr}year`);
      if (!termOk) return false;
    }
    return true;
  });
};

const inferAffordableMortgageTypeFromProductName = (name = "") => {
  const n = String(name || "").toLowerCase();
  if (n.includes("home poss") || n.includes("homepossible")) return "Home Possible Program";
  return "Home Ready Program";
};

const inferRateTypeAndTermFromProductName = (name = "") => {
  const n = String(name || "").toLowerCase();
  const rateType = n.includes("arm") ? "ARM" : "Fixed";
  const termMatch = n.match(/\b(10|15|20|25|30)\s*(yr|year)?\b/);
  const loanTerm = termMatch ? termMatch[1] : "30";
  return { rateType, loanTerm };
};

const parseNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Collateral value for LTV/CLTV display and rules (aligns with Mortech payload `appraisedvalue` = min for purchase).
 * Purchase: lesser of purchase price and appraised value when both exist.
 * Refinance: appraised value when present (else purchase as fallback).
 */
const ltvDenominatorValue = (form) => {
  const pp = parseNum(form?.purchasePrice);
  const av = parseNum(form?.appraisedValue);
  const purpose = String(form?.loanPurpose || "").toLowerCase();
  const isPurchase = purpose.includes("purchase");
  if (isPurchase) {
    if (pp > 0 && av > 0) return Math.min(pp, av);
    if (pp > 0) return pp;
    if (av > 0) return av;
    return 0;
  }
  if (av > 0) return av;
  if (pp > 0) return pp;
  return 0;
};

const cleanProductLabel = (name = "") =>
  String(name).replace(/\s*\(ID:\s*[^)]+\)\s*$/i, "").trim();

/** P&I on principal (loan amount), same idea as qualification card. */
const monthlyPrincipalAndInterest = (principal, annualRatePct, termYears) => {
  const p = parseNum(principal);
  const rate = parseNum(annualRatePct);
  const years = parseNum(termYears) || 30;
  if (p <= 0) return 0;
  const n = years * 12;
  const r = rate / 100 / 12;
  if (r <= 0) return p / n;
  return (p * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
};

const hasLoanIncomeObject = (income) =>
  income &&
  typeof income === "object" &&
  (parseNum(income.baseIncome) > 0 ||
    parseNum(income.overtime) > 0 ||
    parseNum(income.commissions) > 0 ||
    parseNum(income.bonuses) > 0 ||
    parseNum(income.militaryEntitlements) > 0 ||
    (Array.isArray(income.otherIncome) &&
      income.otherIncome.some((x) => parseNum(x?.amount) > 0)));

const fmtCurrency = (v) => {
  const n = parseNum(v);
  return n ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "";
};

const fmtPct = (v, digits = 3) => {
  const n = parseNum(v);
  return n ? `${n.toFixed(digits)}%` : "";
};

const filterRatesByDesiredRate = (rates, desiredRatePct, { windowPct = 0.25 } = {}) => {
  const desired = Number(desiredRatePct);
  if (!Number.isFinite(desired) || desired <= 0) return rates;
  if (!Array.isArray(rates) || rates.length === 0) return rates;

  const scored = rates
    .map((r) => {
      const rate = Number(r?.interestRate);
      const diff = Number.isFinite(rate) ? Math.abs(rate - desired) : Infinity;
      return { r, diff };
    })
    .filter((x) => x.diff !== Infinity);

  if (scored.length === 0) return rates;

  const withinWindow = scored.filter((x) => x.diff <= windowPct).map((x) => x.r);
  if (withinWindow.length > 0) return withinWindow;

  // Fallback: keep the closest quote per lender so the UI still shows something.
  const bestByLender = new Map();
  for (const { r, diff } of scored) {
    const lender = String(r?.lenderName || "Unknown Lender");
    const prev = bestByLender.get(lender);
    if (!prev || diff < prev.diff) bestByLender.set(lender, { r, diff });
  }
  return Array.from(bestByLender.values()).map((x) => x.r);
};

const cls = (...args) => args.filter(Boolean).join(" ");

const inputCls = "w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none";
const readOnlyCls = `${inputCls} bg-gray-50 text-gray-800 cursor-default`;
const selectCls = `${inputCls} appearance-none bg-white`;

const DollarNumberInput = ({ value, onChange, className, placeholder, ...props }) => (
  <div className="relative">
    <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-gray-500">$</span>
    <input
      {...props}
      type="number"
      value={value}
      onChange={onChange}
      className={`${className || ""} pl-6`}
      placeholder={placeholder ?? "0"}
    />
  </div>
);
const labelCls = "block text-[10px] uppercase font-semibold text-gray-500 mb-1 tracking-wide";
const checkboxLabelCls = "flex items-center gap-2 py-1 cursor-pointer";
const checkboxCls = "h-3.5 w-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer";

const NON_QM_DISCLAIMER =
  "Non-QM pricing is not available in the system. Please contact the investor directly for accurate pricing.";
const RULE_DRIVEN_FIELDS = new Set([
  "mortgageLates",
  "mortgageLate30Count",
  "mortgageLate60Count",
  "mortgageLate90Count",
  "housingEvent",
  "housingEventType",
  "housingEventDate",
  "bankruptcy",
  "bankruptcyChapter",
  "bankruptcyStatus",
  "bankruptcyDischargeDate",
  "bankruptcyCount",
  "rural",
]);
const MORTGAGE_LABEL_TO_BUCKETS = {
  Conforming: ["conventional"],
  FHA: ["government"],
  VA: ["government"],
  USDA: ["government"],
  JUMBO: ["conventional"],
  "Second Home": ["conventional"],
  "Home Ready Program": ["conventional"],
  "Home Possible Program": ["conventional"],
  [NON_QM_MORTGAGE_TYPE]: ["nonQm"],
};

const deriveAllowedMortgageTypesFromCreditEvents = (form) => {
  let convAllowed = true;
  let govAllowed = true;
  let nonQmAllowed = true;

  if (form.mortgageLates) {
    const late30 = parseNum(form.mortgageLate30Count);
    const late60 = parseNum(form.mortgageLate60Count);
    const late90 = parseNum(form.mortgageLate90Count);
    // Client-confirmed: treat 30/60/90 late-count tags as source of truth; omit 120+.
    // Rule matrix:
    //   Any mortgage late (30/60/90 > 0)  -> hide Conventional, show Non-QM
    //   More than one 30-day late, OR any 60/90 -> hide Government (FHA/VA)
    const anyLate = late30 > 0 || late60 > 0 || late90 > 0;
    const severeForGov = late30 > 1 || late60 > 0 || late90 > 0;

    if (anyLate) {
      convAllowed = false;
      nonQmAllowed = true;
    }
    if (severeForGov) {
      govAllowed = false;
    }
  }

  if (form.housingEvent && form.housingEventType && form.housingEventDate) {
    const years = housingSeasoningYears(form.housingEventDate);
    if (years !== null) {
      convAllowed = convAllowed && isBucketEligibleForHousingSeasoning(years, form.housingEventType, "conventional");
      govAllowed = govAllowed && isBucketEligibleForHousingSeasoning(years, form.housingEventType, "government");
      nonQmAllowed = nonQmAllowed && isBucketEligibleForHousingSeasoning(years, form.housingEventType, "nonQm");
    }
  }

  if (form.bankruptcy) {
    const seasoningYears = bankruptcyDischargeSeasoningYears(form.bankruptcyDischargeDate);
    const bkCtx = {
      bankruptcyStatus: form.bankruptcyStatus,
      bankruptcyChapter: form.bankruptcyChapter,
      bankruptcyCount: parseBankruptcyCount(form.bankruptcyCount),
    };
    convAllowed = convAllowed && isBucketEligibleForBankruptcy("conventional", seasoningYears, bkCtx);
    govAllowed = govAllowed && isBucketEligibleForBankruptcy("government", seasoningYears, bkCtx);
    nonQmAllowed = nonQmAllowed && isBucketEligibleForBankruptcy("nonQm", seasoningYears, bkCtx);
  }

  const allowed = [];
  if (convAllowed) allowed.push("Conforming");
  if (govAllowed) allowed.push("FHA", "VA");
  if (nonQmAllowed) allowed.push(NON_QM_MORTGAGE_TYPE);
  return allowed;
};

const mapPropertyType = (pt) => {
  const v = String(pt || "").toLowerCase();
  if (v.includes("condo")) return "Condo";
  if (v.includes("town")) return "Townhouse";
  if (v.includes("multi") || v.includes("duplex")) return "Multi-Family";
  if (v.includes("manufactured") || v.includes("mobile")) return "Manufactured";
  if (v.includes("cooperative")) return "Cooperative";
  if (v.includes("pud")) return "PUD";
  return "Single Family (1-4 Units)";
};

const mapOccupancy = (ot) => {
  const v = String(ot || "").toLowerCase();
  if (v.includes("vacation") || v.includes("second")) return "Second Home";
  if (v.includes("investment")) return "Investment";
  return "Primary Residence";
};

const mapAttachment = (pt) => {
  const v = String(pt || "").toLowerCase();
  if (v.includes("condo") || v.includes("town") || v.includes("cooperative")) return "Attached";
  return "Detached";
};

const deriveLoanPurpose = (lt) => {
  const v = String(lt || "").toLowerCase();
  if (v.includes("purchase")) return "Purchase";
  return "Refinance";
};

const deriveMortgageType = (lt) => {
  const v = String(lt || "").toLowerCase();
  if (v.includes("fha")) return "FHA";
  if (v.includes("va")) return "VA";
  if (v.includes("jumbo")) return "JUMBO";
  return "Conforming";
};

const deriveProductCategory = (mortgageType) => {
  const key = (mortgageType || "").toLowerCase();
  if (key === "fha") return "fha_30yr";
  if (key === "va") return "va_30yr";
  if (key === "usda") return "usda_30yr";
  if (key === "jumbo") return "jumbo_30yr";
  if (key.includes("non-qm") || key.includes("non conform")) return "non_qm_30yr";
  return "conv_30yr";
};

const INITIAL = {
  loanPurpose: "Purchase",
  refinanceType: "Rate & Term",
  debtsToBePaidOff: "",
  debtsToBePaidOffMonthly: "",
  mortgageType: "Conforming",
  lienPosition: "First",
  purchasePrice: "",
  appraisedValue: "",
  baseLoanAmount: "",
  ltv: "",
  subordinateLiens: false,
  secondMortgageAmount: "",
  docType: "Full Doc",

  propertyZip: "",
  county: "",
  propertyState: "",
  fico: "",
  dti: "",
  annualIncome: "",
  occupancy: "Primary Residence",
  propertyType: "Single Family (1-4 Units)",
  attachmentType: "Detached",
  numberOfUnits: "1",
  numberOfBorrowers: "1",
  reserves: "0",
  firstTimeHomebuyer: false,
  affordable: false,
  nonOccupantCoBorrower: false,
  selfEmployed: false,
  ownershipPercentage: "",
  canProvideTaxReturns: "",

  lender: "",
  estClosingDate: "",
  compPayer: "Borrower Paid",
  compPercent: "",
  // Broker Compensation (BPC / LPC) — per Compensation Type SOP. The LO can
  // edit via the Broker Compensation modal; defaults come from COMP_INITIAL.
  // Do NOT merge this with `compPercent` — that field is an interest-rate
  // fallback used by pricingMetrics. See utils/compensationRouting.js.
  compensation: { ...COMP_INITIAL },
  rateType: "Fixed",
  lockDays: "30",
  loanTerm: "30",
  vaType: "0",
  vaFirstTimeUse: true,
  desiredRate: "",
  estimateMI: false,
  miDetails: { ...MI_INITIAL },

  productCategory: "conv_30yr",
  selectedProductId: "",

  escrow: "None",
  hazardInsurance: "",
  hazardInsurancePct: "",
  propertyTaxes: "",
  propertyTaxesPct: "",
  hoaMonthly: "",
  suppPropertyInsurance: "0",
  propertiesFinanced: "",
  titleSeasoning: "",
  acres: "",
  improvementsAmount: "",
  residencyStatus: "US Citizen",
  aus: "All",
  mi: "BPMI",
  interestOnly: false,
  principalAndInterest: true,
  mortgageLates: false,
  mortgageLate30Count: "",
  mortgageLate60Count: "",
  mortgageLate90Count: "",
  housingEvent: false,
  housingEventType: "",
  housingEventDate: "",
  bankruptcy: false,
  bankruptcyChapter: "",
  bankruptcyStatus: "",
  bankruptcyDischargeDate: "",
  bankruptcyCount: "1",
  rural: false,
  solar: false,
  solarDetails: { ...SOLAR_INITIAL },
};

const fmtMoney = (v, decimals = 0) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

const calcPI = (principal, annualRatePct, termYears) => {
  const p = Number(principal);
  const r = Number(annualRatePct) / 100 / 12;
  const n = Number(termYears) * 12;
  if (!p || !n) return 0;
  if (!r) return p / n;
  return (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
};

const buildRateGroups = (rates, loanAmount, termYears, compOptions = {}) => {
  const { compPayer, compensation } = compOptions;
  const grouped = rates.reduce((acc, r) => {
    const name = r.lenderName || "Unknown Lender";
    (acc[name] = acc[name] || []).push(r);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([lenderName, lenderRates]) => {
      const stack = lenderRates
        .map((r) => {
          const rate = Number(r.interestRate);
          const mortechApr = Number(r.apr);
          if (!Number.isFinite(rate)) return null;

          // Compensation math: LPC = passthrough, BPC = thinned price + Section A PFC.
          // See utils/compensationRouting.js for the formulas.
          const enriched = applyCompensationToRate({
            rate: r,
            loanAmount,
            compPayer,
            compensation,
            termYears,
          });
          const quotePts = quoteDetailPointsCostAndPct(Number(r.points), loanAmount);

          // The displayed APR depends on comp type: BPC shows the UI-side
          // APR that includes the Section A PFC; LPC shows the raw Mortech APR.
          const apr = enriched.isBpc && Number.isFinite(Number(enriched.bpcApr))
            ? Number(enriched.bpcApr)
            : Number.isFinite(mortechApr)
              ? mortechApr
              : rate;

          // Rebuild the per-row fees shown on the card. Start from Mortech's
          // fees[] (already normalized to { description, amount, section,
          // paymentType, prepaid }) and append the Section A BPC fee when BPC.
          const mortechFees = Array.isArray(r.fees) ? r.fees : [];
          const bpcFee = enriched.sectionAFee
            ? {
                description: enriched.sectionAFee.name,
                amount: enriched.sectionAFee.amount,
                section: enriched.sectionAFee.section,
                paymentType: enriched.sectionAFee.paymentType,
                prepaid: enriched.sectionAFee.prepaid,
                isPFC: !!enriched.sectionAFee.isPFC,
                isComp: true,
              }
            : null;
          const displayFees = bpcFee ? [bpcFee, ...mortechFees] : mortechFees;

          return {
            source: r,
            rate,
            apr,
            mortechApr: Number.isFinite(mortechApr) ? mortechApr : null,
            bpcApr: enriched.bpcApr,
            pi: calcPI(loanAmount, rate, termYears),
            cost: enriched.finalCost,
            basePrice: enriched.finalPrice,
            rawBasePrice: enriched.rawBasePrice,
            rawCost: enriched.rawCost,
            sectionAFee: enriched.sectionAFee,
            compType: enriched.compType,
            thinPctApplied: enriched.thinPctApplied,
            feePctApplied: enriched.feePctApplied,
            isBpc: enriched.isBpc,
            fees: displayFees,
            borrowerRebate:
              typeof r.borrowerRebate === 'number' ? r.borrowerRebate : null,
            loanAmount,
            quotePointsPct: quotePts.pct,
            quotePointsCost: quotePts.dollars,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.rate - b.rate);

      return { lenderName, hero: stack[0] || null, stack };
    })
    .filter((g) => g.hero)
    .sort((a, b) => a.hero.rate - b.hero.rate);
};

/**
 * FeesBreakdown — Closing Fee Detail table (mirrors Mortech's XML grid).
 *
 * Columns: Description / Amount / Percentage (of loan amount) / Section / Prepaid.
 * The Points row uses `quote_detail@price` (via `quoteDetailPointsCostAndPct`).
 * The rate card **Price** is `100 − quote_detail@price` (then BPC thin if applicable).
 * Grouped into three buckets:
 *   1. CLOSING COSTS - GENERALLY  (non-prepaid closing-cost fees)
 *   2. PRE-PAID ITEMS             (fees flagged prepaid OR in the Prepaids section)
 *   3. OVER PAR BORROWER REBATE   (synthetic row derived from Mortech's borrowerRebate)
 *
 * The synthesized Borrower-Paid Comp PFC (Origination Charges section, isPFC)
 * shows up inline with other Origination fees and is tagged "(BPC)" in amber
 * so the LO can see the Section A charge at a glance.
 */
const FeesBreakdown = ({ item }) => {
  const fees = Array.isArray(item?.fees) ? item.fees : [];
  const loanAmount = Number(item?.loanAmount) || 0;
  const pointsAmount = Number(item?.quotePointsCost) || 0;
  const pointsPct =
    item?.quotePointsPct != null && Number.isFinite(Number(item.quotePointsPct))
      ? Number(Number(item.quotePointsPct).toFixed(3))
      : null;
  const rebateRaw = Number(item?.borrowerRebate);
  const hasRebate = Number.isFinite(rebateRaw) && rebateRaw !== 0;

  if (fees.length === 0 && !hasRebate && Math.abs(pointsAmount) < 0.005) {
    return (
      <div className="text-[11px] text-gray-500 italic">
        No fee details returned for this rate.
      </div>
    );
  }

  const pctOf = (amt) => {
    if (!loanAmount || !Number.isFinite(loanAmount)) return "";
    return `${((Number(amt) || 0) / loanAmount * 100).toFixed(3)}`;
  };

  // Section drives the group; the `prepaid` flag per row drives the Prepaid column.
  const closingCosts = fees.filter((f) => f?.section !== "Prepaids");
  const prepaidItems = fees.filter((f) => f?.section === "Prepaids");

  const sumAmount = (arr) => arr.reduce((s, f) => s + (Number(f?.amount) || 0), 0);
  const sumPrepaidCol = (arr) =>
    arr.reduce((s, f) => {
      if (!f) return s;
      const usePrepaid = f.prepaid || f.section === "Prepaids";
      return s + (usePrepaid ? Number(f.amount) || 0 : 0);
    }, 0);

  const totalAmount =
    pointsAmount + sumAmount(fees) + (hasRebate ? rebateRaw : 0);
  const totalPrepaid =
    pointsAmount + sumPrepaidCol(fees) + (hasRebate ? rebateRaw : 0);

  const renderRow = (f, key) => {
    const bpc =
      f?.isComp ||
      (f?.isPFC === true &&
        (f?.name || "").toLowerCase().includes("borrower paid"));
    const amt = Number(f?.amount) || 0;
    const showPrepaid = f?.prepaid || f?.section === "Prepaids";
    const prepaidAmt = showPrepaid ? amt : 0;
    return (
      <tr
        key={key}
        className={`border-b border-gray-100 ${bpc ? "bg-amber-50" : ""}`}
      >
        <td className="pl-6 pr-3 py-1 text-gray-800 font-medium">
          {f?.description || f?.name || "—"}
          {bpc && (
            <span className="ml-1 text-[10px] font-semibold text-amber-700">
              (BPC)
            </span>
          )}
        </td>
        <td className="px-3 py-1 text-right text-gray-900 tabular-nums">
          {fmtMoney(amt, 2)}
        </td>
        <td className="px-3 py-1 text-right text-gray-600 tabular-nums">
          {pctOf(amt)}
        </td>
        <td className="px-3 py-1 text-gray-600">{f?.section || "—"}</td>
        <td className="px-3 py-1 text-right text-gray-900 tabular-nums">
          {fmtMoney(prepaidAmt, 2)}
        </td>
      </tr>
    );
  };

  const groupHeader = (label) => (
    <tr className="bg-gray-50">
      <td
        colSpan={5}
        className="px-3 py-1 text-[10px] font-bold uppercase text-gray-700 tracking-wide"
      >
        {label}
      </td>
    </tr>
  );

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
      <div className="px-3 py-1.5 bg-gray-100 border-b border-gray-200">
        <div className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
          Closing Fee Detail
        </div>
      </div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-[10px] uppercase text-gray-500 border-b border-gray-200 bg-white">
            <th className="text-left pl-3 pr-3 py-1 font-semibold w-[38%]">&nbsp;</th>
            <th className="text-right px-3 py-1 font-semibold">Amount</th>
            <th className="text-right px-3 py-1 font-semibold">Percentage</th>
            <th className="text-left px-3 py-1 font-semibold">Section</th>
            <th className="text-right px-3 py-1 font-semibold">Prepaid</th>
          </tr>
        </thead>
        <tbody>
          {Math.abs(pointsAmount) >= 0.005 && (
            <tr className="border-b border-gray-100 bg-white">
              <td className="pl-6 pr-3 py-1 text-gray-800 font-medium">Points:</td>
              <td className="px-3 py-1 text-right text-gray-900 tabular-nums">
                {fmtMoney(pointsAmount, 2)}
              </td>
              <td className="px-3 py-1 text-right text-gray-600 tabular-nums">
                {pointsPct != null ? pointsPct.toFixed(3) : pctOf(pointsAmount)}
              </td>
              <td className="px-3 py-1 text-gray-600"></td>
              <td className="px-3 py-1 text-right text-gray-900 tabular-nums">
                {fmtMoney(pointsAmount, 2)}
              </td>
            </tr>
          )}
          {closingCosts.length > 0 && (
            <>
              {groupHeader("Closing Costs - Generally")}
              {closingCosts.map((f, i) => renderRow(f, `cc-${i}`))}
            </>
          )}
          {prepaidItems.length > 0 && (
            <>
              {groupHeader("Pre-paid Items")}
              {prepaidItems.map((f, i) => renderRow(f, `pp-${i}`))}
            </>
          )}
          {hasRebate && (
            <>
              {groupHeader("Over Par Borrower Rebate")}
              <tr className="border-b border-gray-100">
                <td className="pl-6 pr-3 py-1 text-gray-800 font-medium">
                  Borrower Rebate
                </td>
                <td className="px-3 py-1 text-right text-red-600 tabular-nums">
                  {fmtMoney(rebateRaw, 2)}
                </td>
                <td className="px-3 py-1 text-right text-red-600 tabular-nums">
                  {pctOf(rebateRaw)}
                </td>
                <td className="px-3 py-1 text-gray-600">Prepaids</td>
                <td className="px-3 py-1 text-right text-red-600 tabular-nums">
                  {fmtMoney(rebateRaw, 2)}
                </td>
              </tr>
            </>
          )}
          <tr className="bg-gray-100 border-t border-gray-300">
            <td className="px-3 py-1.5 font-bold text-gray-900">Total Fees:</td>
            <td className="px-3 py-1.5 text-right font-bold text-gray-900 tabular-nums">
              {fmtMoney(totalAmount, 2)}
            </td>
            <td></td>
            <td></td>
            <td className="px-3 py-1.5 text-right font-bold text-gray-900 tabular-nums">
              {fmtMoney(totalPrepaid, 2)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const ProductsPricingTab = ({ loan }) => {
  const initializedLoanIdRef = useRef(null);
  const [form, setForm] = useState(INITIAL);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pricingResult, setPricingResult] = useState(null);
  const [pricingError, setPricingError] = useState("");
  const [rateGroups, setRateGroups] = useState([]);
  const [expandedCards, setExpandedCards] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedRate, setSelectedRate] = useState(null);
  const [applying, setApplying] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSyncing, setCatalogSyncing] = useState(false);
  const [creditRuleDrivenMode, setCreditRuleDrivenMode] = useState(false);
  const [mortgageTypeManualOverride, setMortgageTypeManualOverride] = useState(false);
  const [stateOptions, setStateOptions] = useState([]);
  const [stateLoading, setStateLoading] = useState(false);
  const [countyOptions, setCountyOptions] = useState([]);
  const [countyLoading, setCountyLoading] = useState(false);
  const [affordableEligibility, setAffordableEligibility] = useState(null);
  const [usdaEligibility, setUsdaEligibility] = useState(null);
  const [usdaLoading, setUsdaLoading] = useState(false);
  const [solarModalOpen, setSolarModalOpen] = useState(false);
  const [compModalOpen, setCompModalOpen] = useState(false);
  const [expandedFees, setExpandedFees] = useState({});

  useEffect(() => {
    let cancelled = false;
    const fetchStates = async () => {
      setStateLoading(true);
      try {
        const resp = await customAxios.get("/api/v1/affordable/states");
        if (!cancelled) setStateOptions(resp.data?.data?.states || []);
      } catch (_) {
        if (!cancelled) setStateOptions([]);
      } finally {
        if (!cancelled) setStateLoading(false);
      }
    };
    fetchStates();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!form.propertyState) {
      setCountyOptions([]);
      setCountyLoading(false);
      return undefined;
    }
    const fetchCounties = async () => {
      setCountyLoading(true);
      try {
        const resp = await customAxios.get("/api/v1/affordable/counties", {
          params: { state: form.propertyState },
        });
        if (!cancelled) setCountyOptions(resp.data?.data?.counties || []);
      } catch (_) {
        if (!cancelled) setCountyOptions([]);
      } finally {
        if (!cancelled) setCountyLoading(false);
      }
    };
    fetchCounties();
    return () => {
      cancelled = true;
    };
  }, [form.propertyState]);

  useEffect(() => {
    if (!form.county) return;
    const exists = countyOptions.some((x) => x.countyName === form.county);
    if (!exists) {
      setForm((prev) => ({ ...prev, county: "", propertyZip: "" }));
    }
  }, [countyOptions, form.county]);

  useEffect(() => {
    let cancelled = false;
    if (!form.affordable) {
      setAffordableEligibility(null);
      return undefined;
    }
    if (!form.propertyState || !form.county || !parseNum(form.annualIncome)) {
      setAffordableEligibility({
        affordableEligible: null,
        reason: "Select state/county and enter annual income for AMI check",
      });
      return undefined;
    }
    const fetchEligibility = async () => {
      try {
        const resp = await customAxios.get("/api/v1/affordable/eligibility", {
          params: {
            state: form.propertyState,
            county: form.county,
            annualIncome: form.annualIncome,
            zip: form.propertyZip,
          },
        });
        if (!cancelled) setAffordableEligibility(resp.data?.data || null);
      } catch (e) {
        if (!cancelled) {
          setAffordableEligibility({
            affordableEligible: false,
            reason: e?.response?.data?.message || "Unable to evaluate AMI eligibility",
          });
        }
      }
    };
    fetchEligibility();
    return () => {
      cancelled = true;
    };
  }, [form.affordable, form.propertyState, form.county, form.annualIncome, form.propertyZip]);

  useEffect(() => {
    let cancelled = false;
    if (!form.rural) {
      setUsdaEligibility(null);
      setUsdaLoading(false);
      return undefined;
    }
    if (!form.propertyState || !form.county || !parseNum(form.annualIncome)) {
      setUsdaEligibility({
        eligible: false,
        missingInputs: [
          !form.propertyState ? "propertyState" : null,
          !form.county ? "county" : null,
          !parseNum(form.annualIncome) ? "annualIncome" : null,
        ].filter(Boolean),
        reasons: [],
        countyLimit: null,
        cap: null,
        borrowerIncome: parseNum(form.annualIncome) || null,
        occupancyOk: String(form.occupancy || "").toLowerCase().includes("primary"),
        incomeOk: null,
      });
      return undefined;
    }
    const fetchUsda = async () => {
      setUsdaLoading(true);
      try {
        const resp = await customAxios.get("/api/v1/affordable/usda-eligibility", {
          params: {
            state: form.propertyState,
            county: form.county,
            annualIncome: form.annualIncome,
            zip: form.propertyZip,
            occupancy: form.occupancy,
          },
        });
        if (!cancelled) setUsdaEligibility(resp.data?.data || null);
      } catch (e) {
        if (!cancelled) {
          setUsdaEligibility({
            eligible: false,
            reasons: [e?.response?.data?.message || "Unable to evaluate USDA eligibility"],
            countyLimit: null,
            cap: null,
            borrowerIncome: parseNum(form.annualIncome) || null,
            occupancyOk: String(form.occupancy || "").toLowerCase().includes("primary"),
            incomeOk: null,
            missingInputs: [],
          });
        }
      } finally {
        if (!cancelled) setUsdaLoading(false);
      }
    };
    fetchUsda();
    return () => {
      cancelled = true;
    };
  }, [
    form.rural,
    form.propertyState,
    form.county,
    form.annualIncome,
    form.propertyZip,
    form.occupancy,
  ]);

  useEffect(() => {
    const v = form.escrow;
    if (v === "None Waived") {
      setForm((prev) => (prev.escrow === "None" ? prev : { ...prev, escrow: "None" }));
      return;
    }
    if (v === "Taxes Waived" || v === "Insurance Waived" || v === "All Waived") {
      setForm((prev) => (prev.escrow === "Waived" ? prev : { ...prev, escrow: "Waived" }));
    }
  }, [form.escrow]);

  useEffect(() => {
    let cancelled = false;
    const fetchCatalog = async () => {
      setCatalogLoading(true);
      try {
        const resp = await customAxios.get("/api/v1/mortech/catalog/products");
        if (!cancelled) setCatalogProducts(resp.data?.products || []);
      } catch (_) {
        if (!cancelled) setCatalogProducts([]);
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    };
    fetchCatalog();
    return () => { cancelled = true; };
  }, []);

  const handleSyncCatalog = async () => {
    setCatalogSyncing(true);
    try {
      await customAxios.post("/api/v1/mortech/catalog/sync");
      const resp = await customAxios.get("/api/v1/mortech/catalog/products");
      setCatalogProducts(resp.data?.products || []);
    } catch (_) { /* noop */ }
    finally { setCatalogSyncing(false); }
  };

  const allowNonQmAlternatives = useMemo(() => {
    if (form.housingEvent) return true;
    const s = String(form.bankruptcyStatus || "").toLowerCase();
    if (form.bankruptcy && (s === "open" || s === "pending")) return true;
    return false;
  }, [form.housingEvent, form.bankruptcy, form.bankruptcyStatus]);

  const selfEmployedNoDocsPivot = useMemo(
    () =>
      shouldPivotToNonQmDocs(
        form.selfEmployed,
        form.ownershipPercentage,
        form.canProvideTaxReturns
      ),
    [form.selfEmployed, form.ownershipPercentage, form.canProvideTaxReturns]
  );

  const pricingLtvPct = useMemo(() => {
    const base = parseNum(form.baseLoanAmount);
    const val = ltvDenominatorValue(form);
    if (!val) return 0;
    return (base / val) * 100;
  }, [form.baseLoanAmount, form.appraisedValue, form.purchasePrice, form.loanPurpose]);

  const selfEmployedNonQmLtvValidation = useMemo(
    () => validateSelfEmployedNonQmBankStatementLtv(pricingLtvPct, selfEmployedNoDocsPivot),
    [pricingLtvPct, selfEmployedNoDocsPivot]
  );

  /**
   * Local (synchronous) USDA eligibility for UI gating. Backend re-validates
   * authoritatively before Mortech is called. `usdaEligibility` (async from
   * server) takes precedence when available; otherwise we fall back to local
   * compute so the banner updates instantly.
   */
  const usdaEligibilityLocal = useMemo(
    () =>
      computeUsdaEligibility({
        rural: form.rural,
        occupancy: form.occupancy,
        annualIncome: form.annualIncome,
        countyLimit: usdaEligibility?.countyLimit,
      }),
    [form.rural, form.occupancy, form.annualIncome, usdaEligibility?.countyLimit]
  );

  const usdaEligibilityView = usdaEligibility || usdaEligibilityLocal;

  /**
   * Rural USDA pivot is active when:
   *   - Rural is checked
   *   - Server (or local fallback) reports eligible
   *   - Self-Employed no-docs Non-QM pivot is NOT active (it wins per spec)
   */
  const ruralUsdaPivot = useMemo(() => {
    if (!form.rural) return false;
    if (selfEmployedNoDocsPivot) return false;
    return usdaEligibilityView?.eligible === true;
  }, [form.rural, selfEmployedNoDocsPivot, usdaEligibilityView]);

  /**
   * Solar (PACE + Solar Lease) routing evaluation.
   * Always computed — it is never "ignored" like Rural; S1 composes with SE.
   */
  const solarEval = useMemo(() => {
    if (!form.solar) {
      return {
        blocksAgency: false,
        financedPaceAmount: 0,
        dtiAddBack: 0,
        banners: [],
        processorTasks: [],
      };
    }
    return evaluateSolarRules(form.solarDetails || {});
  }, [form.solar, form.solarDetails]);

  const solarValidation = useMemo(
    () => (form.solar ? validateSolarDetails(form.solarDetails || {}) : { ok: true, errors: {} }),
    [form.solar, form.solarDetails]
  );

  /**
   * Effective LTV once a financed PACE payoff is rolled in (RULE S2).
   * Original `ltv` remains the base-loan-amount LTV for UI reference.
   */
  const solarLtvAdjustment = useMemo(
    () =>
      applySolarLtvAdjustment({
        baseLoanAmount: form.baseLoanAmount,
        purchasePrice: ltvDenominatorValue(form),
        solar: form.solarDetails || {},
      }),
    [form.baseLoanAmount, form.purchasePrice, form.appraisedValue, form.loanPurpose, form.solarDetails]
  );

  const mortgageFilteredCatalog = useMemo(() => {
    if (selfEmployedNoDocsPivot) {
      if (!selfEmployedNonQmLtvValidation.eligible) {
        return [];
      }
      return filterCatalogSelfEmployedNonQmPivot(
        catalogProducts,
        form.rateType,
        form.loanTerm
      );
    }
    // Rural + USDA-eligible → USDA-only catalog (supersedes FTHB / Affordable).
    if (ruralUsdaPivot) {
      if (solarEval.blocksAgency) {
        // Rural + PACE-remain → Agency/Gov blocked; USDA (gov) also excluded → Non-QM only.
        return filterCatalogForSolar(
          catalogProducts,
          form.solarDetails,
          form.rateType,
          form.loanTerm
        );
      }
      return filterCatalogRuralUsdaOnly(catalogProducts, form.rateType, form.loanTerm);
    }
    // RULE S1 — PACE lien that will remain blocks Agency/Government; keep Non-QM only.
    if (solarEval.blocksAgency) {
      return filterCatalogForSolar(
        catalogProducts,
        form.solarDetails,
        form.rateType,
        form.loanTerm
      );
    }
    // Self-employed + no tax docs → Non-QM pivot takes priority over Affordable (Case 6).
    const affordableEligibleStrict =
      form.affordable && affordableEligibility?.affordableEligible === true;
    if (affordableEligibleStrict) {
      return filterCatalogToAffordableProgramsOnly(
        catalogProducts,
        form.rateType,
        form.loanTerm
      );
    }
    let catalog = filterCatalogProductsAllowNonQm(
      catalogProducts,
      form.mortgageType,
      form.rateType,
      form.loanTerm,
      // Only include Non-QM products alongside other lanes when the Mortgage Type selection
      // explicitly includes Non-QM (e.g. "Conforming / FHA / Non-QM ...").
      allowNonQmAlternatives && String(form.mortgageType || "").includes(NON_QM_MORTGAGE_TYPE)
    );
    const fthbEnhanceCatalog =
      form.firstTimeHomebuyer &&
      !selfEmployedNoDocsPivot &&
      form.mortgageType !== NON_QM_MORTGAGE_TYPE;
    if (fthbEnhanceCatalog) {
      catalog = mergeFthbEnhancedProgramsIntoCatalog(
        catalog,
        catalogProducts,
        form.rateType,
        form.loanTerm
      );
    }
    return catalog;
  }, [
    catalogProducts,
    form.mortgageType,
    form.rateType,
    form.loanTerm,
    allowNonQmAlternatives,
    form.affordable,
    form.firstTimeHomebuyer,
    affordableEligibility,
    selfEmployedNoDocsPivot,
    selfEmployedNonQmLtvValidation,
    ruralUsdaPivot,
    solarEval.blocksAgency,
    form.solarDetails,
  ]);

  const selectedCatalogProduct = useMemo(() => {
    if (!form.selectedProductId) return null;
    return (catalogProducts || []).find((p) => String(p.productId) === String(form.selectedProductId)) || null;
  }, [catalogProducts, form.selectedProductId]);

  const selectedCatalogBucket = useMemo(() => {
    return classifyMortgageProductText(selectedCatalogProduct?.name || "");
  }, [selectedCatalogProduct]);

  const isNonQmCatalogSelected = selectedCatalogBucket === "nonQm";
  const isNonQmMortgageTypeSelected = form.mortgageType === NON_QM_MORTGAGE_TYPE;
  const isNonQmFallbackSelected =
    !form.selectedProductId && String(form.productCategory || "").toLowerCase() === "non_qm_30yr";
  const isNonQmFlow = isNonQmMortgageTypeSelected || isNonQmCatalogSelected || isNonQmFallbackSelected;

  const housingFilteredCatalog = useMemo(() => {
    if (!form.housingEvent) return mortgageFilteredCatalog;
    return filterCatalogProductsByHousingSeasoning(mortgageFilteredCatalog, {
      eventType: form.housingEventType,
      eventDate: form.housingEventDate,
    });
  }, [mortgageFilteredCatalog, form.housingEvent, form.housingEventType, form.housingEventDate]);

  const bankruptcyCatalogCtx = useMemo(() => {
    if (!form.bankruptcy) return null;
    return {
      bankruptcy: true,
      bankruptcyStatus: form.bankruptcyStatus,
      bankruptcyChapter: form.bankruptcyChapter,
      bankruptcyDischargeDate: form.bankruptcyDischargeDate,
      bankruptcyCount: parseBankruptcyCount(form.bankruptcyCount),
    };
  }, [
    form.bankruptcy,
    form.bankruptcyStatus,
    form.bankruptcyChapter,
    form.bankruptcyDischargeDate,
    form.bankruptcyCount,
  ]);

  const pricingBorrowersForNonOccupant = useMemo(
    () => buildBorrowersForNonOccupantValidation(form, loan),
    [form.nonOccupantCoBorrower, loan]
  );

  const nonOccupantValidation = useMemo(
    () =>
      validateNonOccupantForPricing(
        pricingLtvPct,
        parseNum(form.numberOfUnits) || 1,
        pricingBorrowersForNonOccupant,
        form.mortgageType
      ),
    [pricingLtvPct, form.numberOfUnits, pricingBorrowersForNonOccupant, form.mortgageType]
  );

  const escrowWaiverValidation = useMemo(() => {
    const escrowWaived = form.escrow === "Waived";
    const lt = mapMortgageTypeToEscrowLoanType(form.mortgageType);
    return applyEscrowWaiverFilter(lt, pricingLtvPct, escrowWaived);
  }, [form.escrow, form.mortgageType, pricingLtvPct]);

  const filteredProducts = useMemo(() => {
    if (!nonOccupantValidation.eligible) {
      return [];
    }
    if (!escrowWaiverValidation.eligible) {
      return [];
    }
    const bankruptcyFiltered = !bankruptcyCatalogCtx
      ? housingFilteredCatalog
      : filterCatalogProductsByBankruptcy(housingFilteredCatalog, bankruptcyCatalogCtx);
    if (form.affordable && !selfEmployedNoDocsPivot && !ruralUsdaPivot) {
      return filterByAffordableEligibility(bankruptcyFiltered, affordableEligibility);
    }
    return bankruptcyFiltered;
  }, [
    housingFilteredCatalog,
    bankruptcyCatalogCtx,
    form.affordable,
    affordableEligibility,
    nonOccupantValidation,
    escrowWaiverValidation,
    selfEmployedNoDocsPivot,
    ruralUsdaPivot,
  ]);

  const bankruptcyEligibility = useMemo(() => {
    if (!form.bankruptcy) return null;
    const seasoningYears = bankruptcyDischargeSeasoningYears(form.bankruptcyDischargeDate);
    const ctx = {
      bankruptcyStatus: form.bankruptcyStatus,
      bankruptcyChapter: form.bankruptcyChapter,
      bankruptcyCount: parseBankruptcyCount(form.bankruptcyCount),
    };
    return {
      conventional: isBucketEligibleForBankruptcy("conventional", seasoningYears, ctx),
      government: isBucketEligibleForBankruptcy("government", seasoningYears, ctx),
      nonQm: isBucketEligibleForBankruptcy("nonQm", seasoningYears, ctx),
      hardStop: isBankruptcyHardStopStatus(form.bankruptcyStatus),
    };
  }, [
    form.bankruptcy,
    form.bankruptcyStatus,
    form.bankruptcyChapter,
    form.bankruptcyDischargeDate,
    form.bankruptcyCount,
  ]);

  const isOnlyNonQmByBankruptcy = !!(
    bankruptcyEligibility &&
    !bankruptcyEligibility.conventional &&
    !bankruptcyEligibility.government &&
    bankruptcyEligibility.nonQm
  );

  const creditRuleMortgageTypeValue = useMemo(() => {
    if (ruralUsdaPivot && !solarEval.blocksAgency) return "USDA";
    if (solarEval.blocksAgency) return NON_QM_MORTGAGE_TYPE;
    if (!creditRuleDrivenMode) return "";
    const allowed = deriveAllowedMortgageTypesFromCreditEvents(form);
    if (allowed.length === 0) return "";
    return allowed.join(" / ");
  }, [ruralUsdaPivot, creditRuleDrivenMode, form, solarEval.blocksAgency]);

  // Products that match ONLY the currently selected mortgage type path (without Non-QM augmentation).
  // Used to decide when to auto-shift mortgageType to Non-QM for housing-event scenarios.
  const strictSelectedFlowProducts = useMemo(() => {
    const strictMortgageOnly = filterCatalogProducts(
      catalogProducts,
      form.mortgageType,
      form.rateType,
      form.loanTerm
    );
    const strictHousing = form.housingEvent
      ? filterCatalogProductsByHousingSeasoning(strictMortgageOnly, {
          eventType: form.housingEventType,
          eventDate: form.housingEventDate,
        })
      : strictMortgageOnly;
    if (!bankruptcyCatalogCtx) return strictHousing;
    return filterCatalogProductsByBankruptcy(strictHousing, bankruptcyCatalogCtx);
  }, [
    catalogProducts,
    form.mortgageType,
    form.rateType,
    form.loanTerm,
    form.housingEvent,
    form.housingEventType,
    form.housingEventDate,
    bankruptcyCatalogCtx,
  ]);

  const anyNonQmCatalogProducts = useMemo(
    () => (catalogProducts || []).filter((p) => classifyMortgageProductText(p?.name || "") === "nonQm"),
    [catalogProducts]
  );

  useEffect(() => {
    if (filteredProducts.length > 0) {
      const currentStillValid = filteredProducts.some((p) => p.productId === form.selectedProductId);
      if (!currentStillValid) {
        setForm((prev) => ({ ...prev, selectedProductId: filteredProducts[0].productId }));
      }
    } else {
      setForm((prev) => ({ ...prev, selectedProductId: "" }));
    }
  }, [filteredProducts, form.selectedProductId]);

  // When Affordable + AMI eligible, auto-align mortgage type with HomeReady/HomePossible catalog
  // (user is often still on "Conforming", which would otherwise hide these products upstream).
  useEffect(() => {
    if (!form.affordable || affordableEligibility?.affordableEligible !== true) return;
    if (mortgageTypeManualOverride) return;
    if (filteredProducts.length === 0) return;
    const affordableMt = new Set(["Home Ready Program", "Home Possible Program"]);
    if (affordableMt.has(form.mortgageType)) return;
    const firstName = filteredProducts[0]?.name || "";
    const nextMt = inferAffordableMortgageTypeFromProductName(firstName);
    setForm((prev) => ({
      ...prev,
      mortgageType: nextMt,
      productCategory: deriveProductCategory(nextMt),
    }));
  }, [
    form.affordable,
    form.mortgageType,
    affordableEligibility,
    filteredProducts,
    mortgageTypeManualOverride,
  ]);

  // Self-employed + no tax returns → Non-QM catalog only; align mortgage type so the dropdown matches routing.
  useEffect(() => {
    if (!selfEmployedNoDocsPivot) return;
    if (!selfEmployedNonQmLtvValidation.eligible) return;
    if (mortgageTypeManualOverride) return;
    if (form.mortgageType === NON_QM_MORTGAGE_TYPE) return;
    if (filteredProducts.length === 0) return;
    setForm((prev) => ({
      ...prev,
      mortgageType: NON_QM_MORTGAGE_TYPE,
      productCategory: deriveProductCategory(NON_QM_MORTGAGE_TYPE),
    }));
  }, [
    selfEmployedNoDocsPivot,
    selfEmployedNonQmLtvValidation.eligible,
    form.mortgageType,
    filteredProducts.length,
    mortgageTypeManualOverride,
  ]);

  // Documentation Type (Alt-Doc) → force Non-QM lane.
  // Bank Statement / Alt Doc / DSCR / Stated Income should be priced as Non-QM.
  const docTypeForcedNonQmRef = useRef(false);
  const docTypePrevSelectionRef = useRef({ mortgageType: null, productCategory: null });
  useEffect(() => {
    const isAltDoc = String(form.docType || "") !== "Full Doc";

    if (!isAltDoc) {
      // Restore prior lane only if we were the ones who forced Non-QM.
      if (
        docTypeForcedNonQmRef.current &&
        !mortgageTypeManualOverride &&
        form.mortgageType === NON_QM_MORTGAGE_TYPE &&
        !solarEval.blocksAgency &&
        !selfEmployedNoDocsPivot &&
        !isOnlyNonQmByBankruptcy
      ) {
        const prev = docTypePrevSelectionRef.current || {};
        const fallbackMt = prev.mortgageType || "Conforming";
        setForm((p) => ({
          ...p,
          mortgageType: fallbackMt,
          productCategory: prev.productCategory || deriveProductCategory(fallbackMt),
        }));
      }
      docTypeForcedNonQmRef.current = false;
      return;
    }

    if (mortgageTypeManualOverride) return;
    if (form.mortgageType === NON_QM_MORTGAGE_TYPE) {
      docTypeForcedNonQmRef.current = true;
      return;
    }

    docTypePrevSelectionRef.current = {
      mortgageType: form.mortgageType,
      productCategory: form.productCategory,
    };
    docTypeForcedNonQmRef.current = true;
    setForm((p) => ({
      ...p,
      mortgageType: NON_QM_MORTGAGE_TYPE,
      productCategory: deriveProductCategory(NON_QM_MORTGAGE_TYPE),
    }));
  }, [
    form.docType,
    form.mortgageType,
    form.productCategory,
    mortgageTypeManualOverride,
    solarEval.blocksAgency,
    selfEmployedNoDocsPivot,
    isOnlyNonQmByBankruptcy,
  ]);

  // Rural + USDA-eligible → force USDA mortgageType / productCategory.
  useEffect(() => {
    if (!ruralUsdaPivot) return;
    if (solarEval.blocksAgency) return; // Solar S1 wins → Non-QM below.
    if (mortgageTypeManualOverride) return;
    if (form.mortgageType === "USDA") return;
    setForm((prev) => ({
      ...prev,
      mortgageType: "USDA",
      productCategory: deriveProductCategory("USDA"),
    }));
  }, [ruralUsdaPivot, form.mortgageType, mortgageTypeManualOverride, solarEval.blocksAgency]);

  // Solar PACE-remain (RULE S1) → force Non-QM mortgageType / productCategory.
  useEffect(() => {
    if (!solarEval.blocksAgency) return;
    if (mortgageTypeManualOverride) return;
    if (form.mortgageType === NON_QM_MORTGAGE_TYPE) return;
    setForm((prev) => ({
      ...prev,
      mortgageType: NON_QM_MORTGAGE_TYPE,
      productCategory: deriveProductCategory(NON_QM_MORTGAGE_TYPE),
    }));
  }, [solarEval.blocksAgency, form.mortgageType, mortgageTypeManualOverride]);

  // When Rural is unchecked (or becomes ineligible) and we're still parked on USDA,
  // revert to a sensible default so the main product catalog comes back.
  useEffect(() => {
    if (ruralUsdaPivot) return;
    if (mortgageTypeManualOverride) return;
    if (form.mortgageType !== "USDA") return;
    const fallback = deriveMortgageType(loan?.loanDetails?.loanType) || "Conforming";
    setForm((prev) => ({
      ...prev,
      mortgageType: fallback,
      productCategory: deriveProductCategory(fallback),
    }));
  }, [ruralUsdaPivot, form.mortgageType, mortgageTypeManualOverride, loan]);

  // Credit-rule-driven mortgage type (Mortgage Lates / Housing Event) can produce a combined
  // "A / B / C" option. Avoid UI flicker by only applying it when the rule-driven mode is
  // first enabled (or when the allowed set changes AND we are still on the previously applied
  // rule-driven value). Never override higher-priority forced lanes (DocType Non-QM, Solar S1,
  // Self-employed pivot, USDA pivot, Bankruptcy-only Non-QM).
  const prevCreditRuleDrivenModeRef = useRef(false);
  const lastAppliedCreditRuleMtRef = useRef("");
  useEffect(() => {
    const prevDriven = prevCreditRuleDrivenModeRef.current;
    prevCreditRuleDrivenModeRef.current = !!creditRuleDrivenMode;

    if (!creditRuleMortgageTypeValue) return;
    if (mortgageTypeManualOverride) return;

    const forcedLaneActive =
      solarEval.blocksAgency ||
      selfEmployedNoDocsPivot ||
      ruralUsdaPivot ||
      isOnlyNonQmByBankruptcy ||
      String(form.docType || "") !== "Full Doc";
    if (forcedLaneActive) return;

    const enteringDrivenMode = !prevDriven && !!creditRuleDrivenMode;
    const allowedChangedWhileStillOnApplied =
      !!creditRuleDrivenMode &&
      lastAppliedCreditRuleMtRef.current &&
      form.mortgageType === lastAppliedCreditRuleMtRef.current &&
      creditRuleMortgageTypeValue !== lastAppliedCreditRuleMtRef.current;

    if (!enteringDrivenMode && !allowedChangedWhileStillOnApplied) return;

    if (form.mortgageType === creditRuleMortgageTypeValue) {
      lastAppliedCreditRuleMtRef.current = creditRuleMortgageTypeValue;
      return;
    }

    lastAppliedCreditRuleMtRef.current = creditRuleMortgageTypeValue;
    setForm((prev) => ({ ...prev, mortgageType: creditRuleMortgageTypeValue }));
  }, [
    creditRuleDrivenMode,
    creditRuleMortgageTypeValue,
    mortgageTypeManualOverride,
    solarEval.blocksAgency,
    selfEmployedNoDocsPivot,
    ruralUsdaPivot,
    isOnlyNonQmByBankruptcy,
    form.docType,
    form.mortgageType,
  ]);

  // Auto-shift to Non-QM flow for housing-event scenarios when regular filters leave no options,
  // but Non-QM catalog products exist and are seasoning-eligible.
  useEffect(() => {
    const hasHousingInputs = !!(form.housingEvent && form.housingEventType && form.housingEventDate);
    if (!hasHousingInputs) return;
    if (form.mortgageType === NON_QM_MORTGAGE_TYPE) return;
    // If selected mortgageType still has eligible products, keep user on current mortgageType.
    if (strictSelectedFlowProducts.length > 0) return;
    if (anyNonQmCatalogProducts.length === 0) return;

    const housingEligibleNonQm = filterCatalogProductsByHousingSeasoning(anyNonQmCatalogProducts, {
      eventType: form.housingEventType,
      eventDate: form.housingEventDate,
    });
    if (housingEligibleNonQm.length === 0) return;

    const sample = housingEligibleNonQm[0];
    const inferred = inferRateTypeAndTermFromProductName(sample?.name || "");

    setForm((prev) => ({
      ...prev,
      mortgageType: NON_QM_MORTGAGE_TYPE,
      rateType: inferred.rateType,
      loanTerm: inferred.loanTerm,
    }));
  }, [
    form.housingEvent,
    form.housingEventType,
    form.housingEventDate,
    form.mortgageType,
    strictSelectedFlowProducts.length,
    anyNonQmCatalogProducts,
  ]);

  useEffect(() => {
    if (!loan) return;
    const currentLoanId = loan?._id ? String(loan._id) : null;
    if (initializedLoanIdRef.current && initializedLoanIdRef.current === currentLoanId) {
      return;
    }
    initializedLoanIdRef.current = currentLoanId;
    const ld = loan.loanDetails || {};
    const prop = loan.property || {};
    const fc = loan.financialCalculations || {};
    const decl = loan.declarations || {};
    const lp = loan.loanParameters || {};
    const propertiesOwned = loan.propertiesOwned || {};

    const purchasePrice = ld.purchasePrice || prop.contractPurchasePrice || prop.propertyValue || "";
    const appraisedValue = prop.propertyValue || ld.purchasePrice || "";
    const baseLoanAmount = ld.loanAmount || ld.requestedLoanAmount || "";

    const mortgageType = deriveMortgageType(ld.loanType);
    const loanTerm = String(lp.loanTerm || "30");

    setForm((prev) => ({
      ...prev,
      loanPurpose: deriveLoanPurpose(ld.loanType),
      mortgageType,
      purchasePrice: String(purchasePrice),
      appraisedValue: String(appraisedValue),
      baseLoanAmount: String(baseLoanAmount),
      docType: loan.docType || "Full Doc",
      propertyZip: prop.zipCode || "",
      county: prop.county || "",
      propertyState: prop.state || "",
      fico: String(loan.creditScore || fc.creditScore || ""),
      dti: fc.dti ? String(fc.dti) : "",
      occupancy: mapOccupancy(prop.occupancyType),
      propertyType: mapPropertyType(prop.propertyType),
      attachmentType: mapAttachment(prop.propertyType),
      numberOfUnits: String(prop.numberOfUnits || 1),
      firstTimeHomebuyer: decl.firstTimeBuyer || false,
      loanTerm,
      productCategory: deriveProductCategory(mortgageType),
      lockDays: "30",
      hoaMonthly: String(propertiesOwned.hoaDues || lp.hoaFees || ""),
      hazardInsurance: String(lp.homeownersInsurance || ""),
      propertyTaxes: String(lp.propertyTaxes || ""),
      compPercent: String(lp.interestRate || ""),
      ...(loan.solar
        ? {
            solar: !!loan.solar.hasSolar,
            solarDetails: hydrateSolarFromLoan(loan.solar),
          }
        : {}),
      ...(loan.miDetails
        ? {
            estimateMI: !!loan.miDetails.enabled,
            miDetails: hydrateMiFromLoan(loan.miDetails),
          }
        : {}),
      ...(loan.pricingSelection && loan.pricingSelection.compensation
        ? {
            compPayer: loan.pricingSelection.compensation.type || prev.compPayer,
            compensation: hydrateCompensationFromLoan(loan.pricingSelection.compensation),
          }
        : {}),
    }));
    setCreditRuleDrivenMode(false);
    setMortgageTypeManualOverride(false);
    // Restore saved pricing selection when loan data loads
    if (loan.pricingSelection) {
      setSelectedRate(loan.pricingSelection);
    }
  }, [loan]);

  const onField = useCallback((field) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    if (RULE_DRIVEN_FIELDS.has(field)) {
      setCreditRuleDrivenMode(true);
      setMortgageTypeManualOverride(false);
    }
    if (field === "affordable" && val) {
      setMortgageTypeManualOverride(false);
    }
    if (field === "mortgageType") {
      setMortgageTypeManualOverride(true);
    }
    // Solar checkbox opens the details modal on enable; clears on disable.
    if (field === "solar") {
      if (val) {
        setSolarModalOpen(true);
        setForm((prev) => ({
          ...prev,
          solar: true,
          solarDetails: {
            ...SOLAR_INITIAL,
            ...(prev.solarDetails || {}),
            hasSolar: true,
          },
        }));
        return;
      }
      setForm((prev) => {
        const sd = prev.solarDetails || {};
        let base = parseNum(prev.baseLoanAmount);
        if (
          sd.hasPaceLien &&
          sd.pacePayoff === "new_loan" &&
          parseNum(sd.paceLienBalance) > 0 &&
          sd.noteIncludesFinancedPace
        ) {
          base = Math.max(0, base - parseNum(sd.paceLienBalance));
        }
        return {
          ...prev,
          solar: false,
          solarDetails: { ...SOLAR_INITIAL },
          baseLoanAmount: String(base),
        };
      });
      setSolarModalOpen(false);
      return;
    }
    // Estimate MI toggle: keep miDetails.enabled in sync so backend sees it.
    if (field === "estimateMI") {
      setForm((prev) => ({
        ...prev,
        estimateMI: val,
        miDetails: {
          ...(prev.miDetails || MI_INITIAL),
          enabled: !!val,
        },
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: val }));
  }, []);

  // Nested updater for miDetails.* sub-fields (company, coverageType, noMIMode, financeMI).
  const onMiField = useCallback((field) => (e) => {
    const raw = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => {
      const cur = prev.miDetails || MI_INITIAL;
      let value = raw;
      if (field === "company") value = Number(raw);
      return { ...prev, miDetails: { ...cur, [field]: value } };
    });
  }, []);

  const handleSolarModalCancel = useCallback(() => {
    setSolarModalOpen(false);
    // If the user opened the modal but never confirmed and no prior details exist,
    // un-tick the Solar flag so we don't leave it in a half-configured state.
    setForm((prev) => {
      const d = prev.solarDetails || {};
      const hasAnyInput =
        d.hasPaceLien || d.hasLease || d.pacePayoff || d.paceLienBalance || d.monthlyLeasePayment;
      if (hasAnyInput) return prev;
      return { ...prev, solar: false, solarDetails: { ...SOLAR_INITIAL } };
    });
  }, []);

  const handleSolarModalSubmit = useCallback((nextSolar) => {
    setForm((prev) => {
      const prevSd = prev.solarDetails || {};
      const prevPaceAmt =
        prevSd.hasPaceLien &&
        prevSd.pacePayoff === "new_loan" &&
        parseNum(prevSd.paceLienBalance) > 0 &&
        prevSd.noteIncludesFinancedPace
          ? parseNum(prevSd.paceLienBalance)
          : 0;
      const currentBase = parseNum(prev.baseLoanAmount);
      const netFirstLien = Math.max(0, currentBase - prevPaceAmt);

      const nextPaceAmt =
        nextSolar.hasPaceLien &&
        nextSolar.pacePayoff === "new_loan" &&
        parseNum(nextSolar.paceLienBalance) > 0
          ? parseNum(nextSolar.paceLienBalance)
          : 0;
      const nextFinanced = nextPaceAmt > 0;
      const noteIncludesFinancedPace = nextFinanced;
      const newLoanAmount = nextFinanced ? netFirstLien + nextPaceAmt : netFirstLien;
      const shouldUpdateLoanField = nextFinanced || prevPaceAmt > 0;

      return {
        ...prev,
        solar: true,
        solarDetails: {
          ...SOLAR_INITIAL,
          ...nextSolar,
          hasSolar: true,
          noteIncludesFinancedPace,
        },
        ...(shouldUpdateLoanField
          ? {
              baseLoanAmount: String(newLoanAmount),
            }
          : {}),
      };
    });
    setSolarModalOpen(false);
  }, []);

  const handleCompModalApply = useCallback((nextCompensation) => {
    setForm((prev) => ({
      ...prev,
      compensation: {
        ...COMP_INITIAL,
        ...prev.compensation,
        ...nextCompensation,
        borrowerPaidFeePct: FIXED_BORROWER_SECTION_A_FEE_PCT,
        bpcEqualsLpc: false,
      },
    }));
    setCompModalOpen(false);
  }, []);

  const onStateChange = useCallback((e) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      propertyState: val,
      county: "",
      propertyZip: "",
    }));
  }, []);

  const onCountyChange = useCallback(
    (e) => {
      const countyName = e.target.value;
      setForm((prev) => ({
        ...prev,
        county: countyName,
      }));
    },
    [countyOptions]
  );

  // Controls bidirectional sync between LTV and Base Loan Amount.
  // - If the user edits loan amount / values → auto-compute LTV.
  // - If the user edits LTV → back-calculate loan amount (and keep it updated if collateral value changes).
  const lastLtvDriverRef = useRef("amount"); // "amount" | "ltv"

  const ltv = useMemo(() => {
    const base = parseNum(form.baseLoanAmount);
    const val = ltvDenominatorValue(form);
    if (!val) return 0;
    return (base / val) * 100;
  }, [form.baseLoanAmount, form.appraisedValue, form.purchasePrice, form.loanPurpose]);

  useEffect(() => {
    if (lastLtvDriverRef.current === "ltv") return;
    setForm((prev) => {
      const base = parseNum(prev.baseLoanAmount);
      const val = ltvDenominatorValue(prev);
      if (!val || base <= 0) {
        if (prev.ltv === "") return prev;
        return { ...prev, ltv: "" };
      }
      const next = ((base / val) * 100).toFixed(3);
      return prev.ltv === next ? prev : { ...prev, ltv: next };
    });
  }, [form.baseLoanAmount, form.appraisedValue, form.purchasePrice, form.loanPurpose]);

  useEffect(() => {
    if (lastLtvDriverRef.current !== "ltv") return;
    setForm((prev) => {
      const pct = parseNum(prev.ltv);
      const val = ltvDenominatorValue(prev);
      if (!val || pct <= 0) return prev;
      const nextBase = Number(((pct / 100) * val).toFixed(2));
      const nextBaseStr = nextBase ? String(nextBase) : "";
      return prev.baseLoanAmount === nextBaseStr ? prev : { ...prev, baseLoanAmount: nextBaseStr };
    });
  }, [form.ltv, form.appraisedValue, form.purchasePrice, form.loanPurpose]);

  const cltv = useMemo(() => {
    const base = parseNum(form.baseLoanAmount);
    const second = parseNum(form.secondMortgageAmount);
    const val = ltvDenominatorValue(form);
    if (!val) return 0;
    return ((base + second) / val) * 100;
  }, [form.baseLoanAmount, form.secondMortgageAmount, form.appraisedValue, form.purchasePrice, form.loanPurpose]);

  const hcltv = cltv;

  const pricingMetrics = useMemo(() => {
    const annual = parseNum(form.annualIncome);
    let monthlyIncome = 0;
    if (annual > 0) {
      monthlyIncome = annual / 12;
    } else if (loan?.financialCalculations?.totalIncome > 0) {
      monthlyIncome = parseNum(loan.financialCalculations.totalIncome);
    } else {
      const incomeSrc = loan?.income || loan?.loanParameters?.income;
      if (hasLoanIncomeObject(incomeSrc)) {
        monthlyIncome = getTotalIncome(incomeSrc);
      }
    }

    const principal = parseNum(form.baseLoanAmount);
    const rate =
      parseNum(loan?.loanParameters?.interestRate) ||
      parseNum(form.compPercent) ||
      6.75;
    const termYears = parseNum(form.loanTerm) || 30;
    const pi = monthlyPrincipalAndInterest(principal, rate, termYears);
    const taxesMo = parseNum(form.propertyTaxes) / 12;
    const insMo = parseNum(form.hazardInsurance) / 12;
    const hoaMo = parseNum(form.hoaMonthly);
    const suppInsMo = parseNum(form.suppPropertyInsurance) / 12;
    let miMo = 0;
    // Prefer the persisted loan-level MI value when the estimator is NOT active.
    // When the LO has "Estimate MI" on AND the LTV is in-scope, we compute a
    // UI-side BPMI estimate using LTV + FICO for an immediate DTI preview.
    // Mortech will return an authoritative monthlyPremium once rates are priced.
    const miEstimatorActive =
      !!form.miDetails?.enabled &&
      shouldShowMiFields(form.mortgageType, ltv);
    if (miEstimatorActive) {
      miMo = estimateBpmiMonthly({
        baseLoanAmount: principal,
        ltv,
        fico: parseNum(form.fico),
      });
    } else if (loan?.loanParameters && typeof loan.loanParameters.mortgageInsurance === "number") {
      miMo = parseNum(loan.loanParameters.mortgageInsurance);
    } else if (form.estimateMI && ltv > 0 && ltv > 80) {
      // Legacy shortcut: Estimate MI checked but mortgageType not in the
      // conventional set (e.g. the LO hasn't picked a type yet).
      miMo = ((0.5 / 100) * principal) / 12;
    }
    const monthlyHousing = pi + taxesMo + insMo + hoaMo + miMo + suppInsMo;
    let baseMonthlyDebts = getTotalDebts(loan?.debts || loan?.loanParameters?.debts);
    const isRefi = String(form.loanPurpose || "").toLowerCase().includes("refi");
    const paidOffDebtsMonthly = parseNum(form.debtsToBePaidOffMonthly);
    if (isRefi && paidOffDebtsMonthly > 0) {
      baseMonthlyDebts = Math.max(0, baseMonthlyDebts - paidOffDebtsMonthly);
    }

    // Subordinate lien: include an estimated monthly payment in DTI.
    // Best-effort only; detailed debts should be captured in the debts array for accuracy.
    const secondLienAmt = form.subordinateLiens ? parseNum(form.secondMortgageAmount) : 0;
    const secondLienMo =
      secondLienAmt > 0
        ? monthlyPrincipalAndInterest(secondLienAmt, rate, termYears)
        : 0;
    // RULE S4 — add assumed solar-lease payment to DTI numerator.
    const solarLeaseAddBack = form.solar ? solarEval.dtiAddBack : 0;
    const monthlyDebts = baseMonthlyDebts + secondLienMo + solarLeaseAddBack;
    const dtiComputed =
      monthlyIncome > 0 ? ((monthlyHousing + monthlyDebts) / monthlyIncome) * 100 : 0;

    // eslint-disable-next-line no-console
    console.log("[DTI-DEBUG] pricingMetrics", {
      inputs: {
        "form.annualIncome": form.annualIncome,
        "form.baseLoanAmount": form.baseLoanAmount,
        "form.loanTerm": form.loanTerm,
        "form.compPercent": form.compPercent,
        "loan.loanParameters.interestRate": loan?.loanParameters?.interestRate,
        rate_used: rate,
        "form.propertyTaxes (annual)": form.propertyTaxes,
        "form.hazardInsurance (annual)": form.hazardInsurance,
        "form.hoaMonthly": form.hoaMonthly,
        "form.suppPropertyInsurance (annual)": form.suppPropertyInsurance,
        "form.estimateMI": form.estimateMI,
        ltv,
        "loan.loanParameters.mortgageInsurance": loan?.loanParameters?.mortgageInsurance,
        debts_source_root_len: Array.isArray(loan?.debts) ? loan.debts.length : 0,
        debts_source_params_len: Array.isArray(loan?.loanParameters?.debts)
          ? loan.loanParameters.debts.length
          : 0,
      },
      monthly_breakdown: {
        monthlyIncome: Number(monthlyIncome.toFixed(2)),
        PI: Number(pi.toFixed(2)),
        taxesMo: Number(taxesMo.toFixed(2)),
        insMo: Number(insMo.toFixed(2)),
        hoaMo: Number(hoaMo.toFixed(2)),
        miMo: Number(miMo.toFixed(2)),
        suppInsMo: Number(suppInsMo.toFixed(2)),
        monthlyHousing_PITI: Number(monthlyHousing.toFixed(2)),
        monthlyDebts_fromDebtsArray: Number(baseMonthlyDebts.toFixed(2)),
        solarLeaseAddBack: Number(solarLeaseAddBack.toFixed(2)),
        monthlyDebts_total: Number(monthlyDebts.toFixed(2)),
        numerator_sum: Number((monthlyHousing + monthlyDebts).toFixed(2)),
      },
      result: {
        dtiComputed_pct: Number(dtiComputed.toFixed(4)),
      },
    });

    return {
      monthlyIncome,
      monthlyHousing,
      monthlyDebts,
      dtiComputed,
      solarLeaseAddBack,
      miMo,
    };
  }, [form, loan, ltv, solarEval.dtiAddBack]);

  const mortechPayload = useMemo(() => {
    const lowerVal = Math.min(
      parseNum(form.purchasePrice) || Infinity,
      parseNum(form.appraisedValue) || Infinity
    );
    const appraisedvalue = lowerVal === Infinity ? 0 : lowerVal;
    const downPayment = parseNum(form.purchasePrice) - parseNum(form.baseLoanAmount);
    const monthlyTaxes = parseNum(form.propertyTaxes) / 12;
    const monthlyInsurance = parseNum(form.hazardInsurance) / 12;

    const useProductList = form.selectedProductId && catalogProducts.length > 0;

    return {
      propertyZip: form.propertyZip,
      propertyState: form.propertyState,
      propertyCounty: form.county || undefined,
      appraisedvalue,
      loan_amount: parseNum(form.baseLoanAmount),
      downPayment: downPayment > 0 ? downPayment : undefined,
      fico: parseNum(form.fico) || 740,
      loanpurpose:
        String(form.loanPurpose || "").toLowerCase().includes("refi")
          ? (form.refinanceType === "Cash-out"
              ? "Cash-out refinance"
              : "Rate/term refinance")
          : form.loanPurpose,
      proptype: form.propertyType,
      attachmentType: form.attachmentType,
      numberOfUnits: form.numberOfUnits,
      mortgageType: form.mortgageType,
      occupancy: form.occupancy,
      ...(useProductList
        ? { productList: form.selectedProductId }
        : { productCategory: form.productCategory }),
      loanTerm: form.loanTerm,
      lockDays: form.lockDays || "30",
      lienPosition: form.lienPosition === "Second" ? "2" : "1",
      // NOTE: temporarily omit DTIPercent from outbound Mortech payload.
      // We still compute/show DTI locally in UI.
      ...(cltv > 0 && cltv !== ltv && { cltv: (cltv / 100).toFixed(4) }),
      ...(form.estClosingDate && { closingDate: form.estClosingDate }),
      ...(monthlyTaxes > 0 && { taxes: Math.round(monthlyTaxes * 100) / 100 }),
      ...(monthlyInsurance > 0 && { insurance: Math.round(monthlyInsurance * 100) / 100 }),
      firstTimeHomeBuyer: form.firstTimeHomebuyer ? 1 : 0,
      selfEmployed: form.selfEmployed ? 1 : 0,
      ownershipPercentage: parseNum(form.ownershipPercentage) || undefined,
      canProvideTaxReturns: form.canProvideTaxReturns || undefined,
      selfEmployedNonQmPivot: selfEmployedNoDocsPivot,
      ...(form.affordable && { amiIlpaWaiver: 1 }),
      interestOnly: form.interestOnly ? 1 : 0,
      waiveEscrow: form.escrow === "Waived",
      escrowWaived: form.escrow === "Waived",
      // ── MI Estimator (Mortech MI Pricing) ──
      // When enabled AND applicable to the current mortgage type / LTV, we send
      // the four MI params (pmiCompany, noMI, financeMI, coverageType) per the
      // client's SOP and also persist the full miDetails object so it can be
      // saved on the Loan. The legacy `includeMI` shortcut is dropped so the
      // backend receives an unambiguous request.
      ...(form.miDetails?.enabled && shouldShowMiFields(form.mortgageType, ltv)
        ? {
            miDetails: {
              ...form.miDetails,
              estimatedMonthlyPremium: Math.round(pricingMetrics.miMo * 100) / 100,
            },
            ...miMortechOverrides(form.miDetails, { ltv, mortgageType: form.mortgageType }),
          }
        : {}),
      // Compensation (BPC / LPC) post-processing block. Backend applies the
      // thin / Section A PFC math — Mortech never sees these percentages.
      compPayer: form.compPayer,
      compensation: {
        lenderPaidDefaultPct: Number(form.compensation?.lenderPaidDefaultPct) || 0,
        borrowerPaidFeePct: FIXED_BORROWER_SECTION_A_FEE_PCT,
        bpcEqualsLpc: false,
        updatedAt: form.compensation?.updatedAt || null,
      },
      ...(String(form.loanPurpose || "").toLowerCase().includes("refi") && {
        refinanceType: form.refinanceType,
        debtsToBePaidOff: parseNum(form.debtsToBePaidOff) || 0,
        debtsToBePaidOffMonthly: parseNum(form.debtsToBePaidOffMonthly) || 0,
      }),
      ...(form.secondMortgageAmount && parseNum(form.secondMortgageAmount) > 0
        ? { secondMortgageAmount: parseNum(form.secondMortgageAmount) }
        : {}),
      program: form.subordinateLiens ? 1 : 0,
      ...(parseNum(form.annualIncome) > 0 && { annualIncome: parseNum(form.annualIncome) }),
      // Legacy `form.mi` shortcut removed — MI is now governed by `miDetails`
      // (see the MI Estimator block above) which maps to Mortech's pmiCompany /
      // noMI / financeMI / coverageType per the MI Pricing SOP.
      ...((form.mortgageType === "FHA" || form.mortgageType === "VA") && { includeUpfrontFee: true }),
      ...(form.mortgageType === "VA" && {
        vaType: form.vaType,
        vaFirstTimeUse: !!form.vaFirstTimeUse,
      }),
      ...(form.housingEvent && {
        housingEvent: true,
        ...(form.housingEventType && { housingEventType: form.housingEventType }),
        ...(form.housingEventDate && { housingEventDate: form.housingEventDate }),
      }),
      ...(form.bankruptcy && {
        bankruptcy: true,
        ...(form.bankruptcyChapter && { bankruptcyChapter: form.bankruptcyChapter }),
        ...(form.bankruptcyStatus && { bankruptcyStatus: form.bankruptcyStatus }),
        ...(form.bankruptcyDischargeDate && { bankruptcyDischargeDate: form.bankruptcyDischargeDate }),
        bankruptcyCount: parseBankruptcyCount(form.bankruptcyCount),
      }),
      ltv: Math.round(ltv * 100) / 100,
      borrowers: pricingBorrowersForNonOccupant,
      nonOccupantCoBorrower: form.nonOccupantCoBorrower ? 1 : 0,
      // Rural / USDA RD pivot — only when truly eligible. Backend re-validates.
      ...(ruralUsdaPivot && {
        rural: 1,
        ruralFlag: 1,
        productGroups: ["USDA"],
        downPayment: 0,
        includeLTVOver100: true,
      }),
      // Solar (PACE / Lease) — always sent when Solar is ticked; backend re-evaluates.
      ...(form.solar && {
        solar: {
          hasSolar: !!form.solarDetails?.hasSolar,
          hasPaceLien: !!form.solarDetails?.hasPaceLien,
          paceLienBalance: parseNum(form.solarDetails?.paceLienBalance) || 0,
          pacePayoff: form.solarDetails?.pacePayoff || '',
          noteIncludesFinancedPace: !!form.solarDetails?.noteIncludesFinancedPace,
          hasLease: !!form.solarDetails?.hasLease,
          leaseAssumed: !!form.solarDetails?.leaseAssumed,
          monthlyLeasePayment: parseNum(form.solarDetails?.monthlyLeasePayment) || 0,
        },
        ...solarMortechOverrides(form.solarDetails, {
          baseLoanAmount: parseNum(form.baseLoanAmount),
        }),
      }),
    };
  }, [
    form,
    ltv,
    cltv,
    catalogProducts,
    pricingMetrics,
    pricingBorrowersForNonOccupant,
    selfEmployedNoDocsPivot,
    ruralUsdaPivot,
  ]);

  const handlePriceLoan = async () => {
    setLoading(true);
    setPricingError("");
    setPricingResult(null);
    setRateGroups([]);
    setExpandedCards({});
    setExpandedRows({});
    setSelectedRate(null);
    if (mortgagePayloadViolatesBankruptcyHardStop(mortechPayload, catalogProducts)) {
      setPricingError(
        "Subject to Investor Overlay: No Agency products are eligible."
      );
      setLoading(false);
      return;
    }
    if (!nonOccupantValidation.eligible) {
      setPricingError(
        `${nonOccupantValidation.reason || "Non-occupant co-borrower not eligible."} ${NON_OCCUPANT_FNMA_HELP_TEXT}`
      );
      setLoading(false);
      return;
    }
    if (!escrowWaiverValidation.eligible) {
      setPricingError(
        `${escrowWaiverValidation.reason || "Escrow waiver not eligible."} ${ESCROW_WAIVER_HELP_TEXT}`
      );
      setLoading(false);
      return;
    }
    if (selfEmployedNoDocsPivot && !selfEmployedNonQmLtvValidation.eligible) {
      setPricingError(
        selfEmployedNonQmLtvValidation.reason ||
          "Self-employed without tax returns: LTV exceeds typical Non-QM Bank Statement limit."
      );
      setLoading(false);
      return;
    }
    if (form.solar && !solarValidation.ok) {
      const firstError =
        Object.values(solarValidation.errors)[0] ||
        "Complete the Solar / PACE details before pricing.";
      setPricingError(firstError);
      setSolarModalOpen(true);
      setLoading(false);
      return;
    }
    if (form.rural && !selfEmployedNoDocsPivot) {
      if (usdaEligibilityView?.eligible === false) {
        const reason =
          (usdaEligibilityView.reasons && usdaEligibilityView.reasons[0]) ||
          "USDA RD eligibility check failed.";
        setPricingError(reason);
        setLoading(false);
        return;
      }
      if (!usdaEligibilityView || usdaEligibilityView.eligible !== true) {
        setPricingError(
          "USDA RD requires state, county, annual income, and Primary Residence occupancy."
        );
        setLoading(false);
        return;
      }
    }
    if (isNonQmFlow) {
      setPricingResult({
        nonQmPlaceholder: true,
        message: NON_QM_DISCLAIMER,
      });
      setLoading(false);
      return;
    }
    try {
      const resp = await customAxios.post("/api/v1/mortech/search", mortechPayload);
      let allRates = resp.data?.rates || [];
      if (form.housingEvent && form.housingEventType && form.housingEventDate) {
        allRates = filterRatesByHousingEvent(allRates, {
          eventType: form.housingEventType,
          eventDate: form.housingEventDate,
        });
      }
      if (form.bankruptcy) {
        allRates = filterRatesByBankruptcy(allRates, {
          bankruptcy: true,
          bankruptcyStatus: form.bankruptcyStatus,
          bankruptcyChapter: form.bankruptcyChapter,
          bankruptcyDischargeDate: form.bankruptcyDischargeDate,
          bankruptcyCount: parseBankruptcyCount(form.bankruptcyCount),
        });
      }
      if (form.affordable && !ruralUsdaPivot) {
        allRates = filterByAffordableEligibility(allRates, affordableEligibility);
      }
      const selectedInvestor = form.lender;
      const rates = selectedInvestor
        ? allRates.filter((r) =>
            (r.lenderName || "").toLowerCase().includes(selectedInvestor.replace(/_/g, " ").toLowerCase())
          )
        : allRates;
      const desiredFilteredRates = filterRatesByDesiredRate(rates, form.desiredRate);
      const loanAmt = parseNum(form.baseLoanAmount);
      const termYrs = parseNum(form.loanTerm) || 30;
      const groups = buildRateGroups(desiredFilteredRates, loanAmt, termYrs, {
        compPayer: form.compPayer,
        compensation: form.compensation,
      });
      setRateGroups(groups);
      setPricingResult({
        count: allRates.length,
        filteredCount: rates.length,
        desiredRateCount: desiredFilteredRates.length,
      });
    } catch (err) {
      setPricingError(err.response?.data?.message || "Failed to fetch rates. Please check fields and try again.");
    } finally {
      setLoading(false);
    }
  };


  const applyRate = async (item, lenderName) => {
    const src = item.source || {};
    // Parse adjustments from Mortech response
    const adjustments = Array.isArray(src.adjustments)
      ? src.adjustments.map((a) => ({
          name: a.description || a.desc || "",
          rate: parseNum(a.rateAdj ?? a.rate_adj ?? 0),
          points: parseNum(a.priceAdj ?? a.price_adj ?? 0),
          amount: parseNum(a.priceAdj ?? a.price_adj ?? 0) !== 0
            ? Math.abs((parseNum(a.priceAdj ?? a.price_adj ?? 0) / 100) * parseNum(form.baseLoanAmount))
            : 0,
        }))
      : [];

    const compensation = buildPricingSelectionCompensation({
      compPayer: form.compPayer,
      compensation: form.compensation,
      rateItem: item,
    });

    const selection = {
      lenderName: lenderName,
      productName: src.productName || src.vendorProductName || "",
      interestRate: item.rate,
      apr: item.apr,
      discountPoints:
        item.quotePointsPct != null && Number.isFinite(Number(item.quotePointsPct))
          ? Math.abs(Number(item.quotePointsPct)) / 100
          : 0,
      discountPointsDollar: Math.abs(Number(item.quotePointsCost ?? item.cost) || 0),
      monthlyPI: item.pi,
      piti: parseNum(src.piti),
      lockDays: parseNum(src.lockTerm || form.lockDays || 30),
      lastUpdate: src.lastUpdate || "",
      basePrice: item.basePrice,
      adjustments,
      appliedAt: new Date().toISOString(),
      compensation,
    };

    setSelectedRate(selection);
    setRateGroups([]);
    setPricingResult(null);

    if (loan?._id) {
      setApplying(true);
      try {
        await customAxios.put(`/api/v1/loans/${loan._id}`, { pricingSelection: selection });
      } catch (_) { /* non-critical — selection is already shown in UI */ }
      finally { setApplying(false); }
    }
  };

  return (
    <div className="space-y-4">
      {!selectedRate && <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Products & Pricing Engine</h3>
            <p className="text-xs text-gray-500 mt-0.5">Auto-filled from loan data. Adjust any field before pricing.</p>
          </div>
          <span className={cls(
            "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
            form.loanPurpose === "Purchase" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
          )}>
            {form.loanPurpose}
          </span>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ══════════ LEFT COLUMN: Loan Basics & Math ══════════ */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1">Loan Basics & Math</div>

              <div>
                <label className={labelCls}>Loan Purpose</label>
                <div className="flex rounded-md overflow-hidden border border-gray-300">
                  {["Purchase", "Refinance"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        // If the user is driving by LTV, purpose changes can change the denominator
                        // (min(pp,av) vs av), so keep the current driver and let the sync effects run.
                        setForm((p) => ({ ...p, loanPurpose: v }));
                      }}
                      className={cls("flex-1 py-1.5 text-xs font-medium transition-colors", form.loanPurpose === v ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50")}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {form.loanPurpose === "Refinance" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Refinance Type</label>
                    <select
                      value={form.refinanceType}
                      onChange={onField("refinanceType")}
                      className={selectCls}
                    >
                      <option value="Rate & Term">Rate &amp; Term</option>
                      <option value="Cash-out">Cash-out</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Debts to be Paid Off</label>
                    <DollarNumberInput
                      value={form.debtsToBePaidOff}
                      onChange={(e) => {
                        lastLtvDriverRef.current = "amount";
                        const raw = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          debtsToBePaidOff: raw,
                          baseLoanAmount: raw, // baseline refi: new loan ≈ payoffs (costs can be added later)
                        }));
                      }}
                      className={inputCls}
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Monthly Payment Removed (paid-off debts)</label>
                    <input
                      type="number"
                      value={form.debtsToBePaidOffMonthly}
                      onChange={onField("debtsToBePaidOffMonthly")}
                      className={inputCls}
                      placeholder="0"
                      min={0}
                      step={0.01}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={labelCls}>Mortgage Type</label>
                <select value={form.mortgageType} onChange={onField("mortgageType")} className={selectCls}>
                  {creditRuleMortgageTypeValue && (
                    <option value={creditRuleMortgageTypeValue}>{creditRuleMortgageTypeValue}</option>
                  )}
                  {MORTGAGE_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {form.mortgageType === NON_QM_MORTGAGE_TYPE && (
                  <div className="mt-1 flex items-start gap-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                    <Info className="h-3.5 w-3.5 mt-[1px] flex-shrink-0" />
                    <div>
                      <div className="font-semibold">Non-QM pricing placeholder</div>
                      <div className="text-amber-700/90">{NON_QM_DISCLAIMER}</div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>Lien Position</label>
                <select value={form.lienPosition} onChange={onField("lienPosition")} className={selectCls}>
                  <option value="First">First</option>
                  <option value="Second">Second</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Purchase Price</label>
                  <DollarNumberInput
                    value={form.purchasePrice}
                    onChange={(e) => { lastLtvDriverRef.current = "amount"; onField("purchasePrice")(e); }}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className={labelCls}>Appraised Value</label>
                  <DollarNumberInput
                    value={form.appraisedValue}
                    onChange={(e) => { lastLtvDriverRef.current = "amount"; onField("appraisedValue")(e); }}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Base Loan Amount</label>
                  <DollarNumberInput
                    value={form.baseLoanAmount}
                    onChange={(e) => { lastLtvDriverRef.current = "amount"; onField("baseLoanAmount")(e); }}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className={labelCls}>LTV</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.ltv}
                      onChange={(e) => {
                        lastLtvDriverRef.current = "ltv";
                        const raw = e.target.value;
                        setForm((prev) => {
                          const pct = parseNum(raw);
                          const val = ltvDenominatorValue(prev);
                          if (!val || pct <= 0) {
                            return { ...prev, ltv: raw };
                          }
                          const nextBase = Number(((pct / 100) * val).toFixed(2));
                          const nextBaseStr = nextBase ? String(nextBase) : "";
                          return { ...prev, ltv: raw, baseLoanAmount: nextBaseStr };
                        });
                      }}
                      className={`${inputCls} pr-7`}
                      placeholder={ltv ? ltv.toFixed(3) : ""}
                      min={0}
                      step={0.001}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-gray-500">%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.subordinateLiens} onChange={onField("subordinateLiens")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Subordinate Liens</span>
                </label>
                {form.subordinateLiens && (
                  <div className="mt-1">
                    <DollarNumberInput value={form.secondMortgageAmount} onChange={onField("secondMortgageAmount")} className={inputCls} placeholder="0" />
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">LTV {fmtPct(ltv, 2)}</span>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">CLTV {fmtPct(cltv, 2)}</span>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">HCLTV {fmtPct(hcltv, 2)}</span>
                {computeIsSelfEmployed(form.selfEmployed, form.ownershipPercentage) && (
                  <span className="text-[10px] font-bold bg-violet-50 text-violet-800 px-2 py-0.5 rounded">
                    Borrower Type: Self-Employed
                  </span>
                )}
                {selfEmployedNoDocsPivot && (
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded">
                    Documentation: Alternative (Bank Statement)
                  </span>
                )}
                {ruralUsdaPivot && (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                    USDA RD (0% Down)
                  </span>
                )}
              </div>

              <div>
                <label className={labelCls}>Documentation Type</label>
                <select value={form.docType} onChange={onField("docType")} className={selectCls}>
                  <option value="Full Doc">Full Doc</option>
                  <option value="Bank Statement">Bank Statement</option>
                  <option value="Alt Doc">Alt Doc</option>
                  <option value="DSCR">DSCR</option>
                  <option value="Stated">Stated Income</option>
                </select>
              </div>
            </div>

            {/* ══════════ MIDDLE COLUMN: Property & Borrower ══════════ */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1">Property & Borrower Details</div>

              <div>
                <label className={labelCls}>Enter Zip / County / State</label>
                <div className="grid grid-cols-3 gap-2">
                  <input value={form.propertyZip} onChange={onField("propertyZip")} className={inputCls} placeholder="ZIP" />
                  <select
                    value={form.county}
                    onChange={onCountyChange}
                    className={selectCls}
                    disabled={!form.propertyState || countyLoading}
                  >
                    <option value="">
                      {!form.propertyState
                        ? "Select State First"
                        : countyLoading
                        ? "Loading counties..."
                        : "Select County"}
                    </option>
                    {countyOptions.map((row) => (
                      <option key={`${row.state}-${row.countyName}`} value={row.countyName}>
                        {row.countyName}
                      </option>
                    ))}
                  </select>
                  <select value={form.propertyState} onChange={onStateChange} className={selectCls}>
                    <option value="">{stateLoading ? "Loading states..." : "Select State"}</option>
                    {stateOptions.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── Est FICO / DTI / Annual Income ── */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Est FICO</label>
                  <input type="number" value={form.fico} onChange={onField("fico")} className={inputCls} placeholder="740" />
                </div>

                <div>
                  <label className={labelCls}>DTI</label>
                  {pricingMetrics.monthlyIncome > 0 ? (
                    <div
                      className={`${readOnlyCls} flex items-center gap-1 min-h-[2.125rem]`}
                      title="(Housing P&I + taxes + ins + HOA + MI + debts + assumed solar lease) ÷ monthly income"
                    >
                      <span className="font-semibold text-blue-700">{pricingMetrics.dtiComputed.toFixed(2)}%</span>
                      <span className="text-gray-500 text-[11px]">est.</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={form.dti}
                      onChange={onField("dti")}
                      className={inputCls}
                      placeholder="% (manual)"
                      min={0}
                      step={0.01}
                    />
                  )}
                </div>

                <div>
                  <label className={labelCls}>Annual Income</label>
                  <DollarNumberInput value={form.annualIncome} onChange={onField("annualIncome")} className={inputCls} placeholder="0" />
                </div>
              </div>

              {/* Assumed solar-lease add-back — full-width note under the FICO/DTI/Income row */}
              {form.solar &&
                form.solarDetails?.hasLease &&
                form.solarDetails?.leaseAssumed &&
                pricingMetrics.solarLeaseAddBack > 0 && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 leading-snug">
                    <span aria-hidden className="mt-[1px] text-amber-600">☀</span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-semibold">Assumed Solar-Lease Payment</span>
                        <span className="tabular-nums font-bold text-amber-900">
                          {fmtCurrency(pricingMetrics.solarLeaseAddBack)}/mo
                        </span>
                      </div>
                      <p className="text-amber-800/90 mt-0.5">
                        Added to the borrower&apos;s monthly debts in the DTI calculation.
                      </p>
                    </div>
                  </div>
                )}


              <div>
                <label className={labelCls}>Occupancy</label>
                <select value={form.occupancy} onChange={onField("occupancy")} className={selectCls}>
                  <option value="Primary Residence">Primary Residence</option>
                  <option value="Second Home">Second Home</option>
                  <option value="Investment">Investment</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Property Type</label>
                  <select value={form.propertyType} onChange={onField("propertyType")} className={selectCls}>
                    <option value="Single Family (1-4 Units)">Single Family (1-4 Units)</option>
                    <option value="Condo">Condo</option>
                    <option value="Townhouse">Townhouse</option>
                    <option value="Multi-Family">Multi-Family</option>
                    <option value="Manufactured">Manufactured</option>
                    <option value="Cooperative">Cooperative</option>
                    <option value="PUD">PUD</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Attachment Type</label>
                  <select value={form.attachmentType} onChange={onField("attachmentType")} className={selectCls}>
                    <option value="Detached">Detached</option>
                    <option value="Attached">Attached</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>No. of Units</label>
                  <select value={form.numberOfUnits} onChange={onField("numberOfUnits")} className={selectCls}>
                    {["1", "2", "3", "4"].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>No. of Borrowers</label>
                  <input type="number" min="1" max="10" value={form.numberOfBorrowers} onChange={onField("numberOfBorrowers")} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Reserves (months)</label>
                <input type="number" min="0" value={form.reserves} onChange={onField("reserves")} className={inputCls} placeholder="0" />
              </div>

              <div className="border-t border-gray-100 pt-2 space-y-1">
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.firstTimeHomebuyer} onChange={onField("firstTimeHomebuyer")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">First-Time Homebuyer</span>
                </label>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.affordable} onChange={onField("affordable")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Affordable</span>
                </label>
                {form.affordable && (
                  <div
                    className={cls(
                      "text-[11px] rounded px-2 py-1 border",
                      affordableEligibility?.affordableEligible
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-amber-50 border-amber-200 text-amber-700"
                    )}
                  >
                    {affordableEligibility
                      ? affordableEligibility.affordableEligible == null
                        ? `AMI check needed: ${affordableEligibility.reason || "Provide inputs"}`
                        : affordableEligibility.affordableEligible
                        ? `Affordable eligible: showing HomeReady / HomePossible only (Income ${fmtMoney(affordableEligibility.borrowerIncome)} <= ${fmtMoney(affordableEligibility.incomeLimit)})`
                        : `Affordable not eligible: hiding HomeReady / HomePossible (Income ${fmtMoney(affordableEligibility.borrowerIncome)} > ${fmtMoney(affordableEligibility.incomeLimit)})`
                      : "Checking AMI eligibility..."}
                  </div>
                )}
                <div className="space-y-1.5 pt-1">
                  <label className={checkboxLabelCls}>
                    <input
                      type="checkbox"
                      checked={form.nonOccupantCoBorrower}
                      onChange={onField("nonOccupantCoBorrower")}
                      className={checkboxCls}
                    />
                    <span className="text-xs text-gray-700">Non-Occupant Co-Borrower</span>
                  </label>
                  <p className="text-[10px] text-gray-500 leading-snug pl-5">
                    Subject property use is set under <span className="font-medium">Occupancy</span> above (Primary Residence / Second Home / Investment).
                    Check this only when a co-borrower provides income but will not occupy the property (FNMA B2-2-04).
                  </p>
                  <div className="text-[11px] text-gray-700 pl-5">
                    <span className="font-semibold text-gray-800">Non-Occupant Co-Borrower: </span>
                    {form.nonOccupantCoBorrower ? "Yes" : "No"}
                  </div>
                  {!nonOccupantValidation.skipped && !nonOccupantValidation.eligible && (
                    <div className="text-[11px] rounded px-2 py-1.5 border border-red-200 bg-red-50 text-red-800">
                      <div className="font-semibold">Non-Occupant Co-Borrower restriction</div>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        <li>Max LTV 95% for 1-unit properties</li>
                        <li>Not allowed for multi-unit (2–4) properties</li>
                      </ul>
                      {nonOccupantValidation.reason && (
                        <div className="mt-1 font-medium">{nonOccupantValidation.reason}</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  <label className={checkboxLabelCls}>
                    <input type="checkbox" checked={form.selfEmployed} onChange={onField("selfEmployed")} className={checkboxCls} />
                    <span className="text-xs text-gray-700">Self-Employed</span>
                  </label>
                  <div>
                    <label className={labelCls}>Business ownership % (optional)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={form.ownershipPercentage}
                      onChange={onField("ownershipPercentage")}
                      className={inputCls}
                      placeholder="≥ 25% counts as self-employed for routing"
                    />
                  </div>
                  {computeIsSelfEmployed(form.selfEmployed, form.ownershipPercentage) && (
                    <div>
                      <label className={labelCls}>Can you provide 2 years of tax returns?</label>
                      <select value={form.canProvideTaxReturns} onChange={onField("canProvideTaxReturns")} className={selectCls}>
                        <option value="">Select…</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  )}
                  {selfEmployedNoDocsPivot && (
                    <div className="text-[11px] rounded px-2 py-1.5 border border-amber-200 bg-amber-50 text-amber-900">
                      <div className="font-semibold">Standard programs unavailable</div>
                      <div className="mt-0.5">Showing Non-QM / Bank Statement / DSCR options only.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ══════════ RIGHT COLUMN: Lender & Rate Parameters ══════════ */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1">Lender & Rate Parameters</div>

              <div>
                <label className={labelCls}>Investor / Lender</label>
                <select value={form.lender} onChange={onField("lender")} className={selectCls}>
                  <option value="">All Investors</option>
                  <option value="click_n_close_nashville">Click n Close - Nashville</option>
                  <option value="freedom_mortgage_wholesale">Freedom Mortgage Wholesale</option>
                  <option value="jmac_broker">JMAC Broker</option>
                  <option value="pennymac_broker">PennyMac Broker</option>
                  <option value="pennymac_non_delegated">PennyMac Non-Delegated</option>
                  <option value="plains_commerce_ws">Plains Commerce WS</option>
                  <option value="plaza_home_wholesale">Plaza Home Wholesale</option>
                  <option value="prmg_wholesale">PRMG Wholesale</option>
                  <option value="resicentral">ResiCentral</option>
                  <option value="rocket_wholesale">Rocket Wholesale</option>
                  <option value="the_loan_store_broker">The Loan Store Broker</option>
                  <option value="uwm">UWM</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Est Closing Date</label>
                <input type="date" value={form.estClosingDate} onChange={onField("estClosingDate")} className={inputCls} />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className={labelCls}>Comp Payer</label>
                  {form.compPayer === "Borrower Paid" && (
                    <button
                      type="button"
                      onClick={() => setCompModalOpen(true)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 focus:outline-none"
                      title="Edit Broker Compensation"
                    >
                      Thin %
                    </button>
                  )}
                </div>
                <select value={form.compPayer} onChange={onField("compPayer")} className={selectCls}>
                  <option value="Borrower Paid">Borrower Paid</option>
                  <option value="Lender Paid">Lender Paid</option>
                </select>
                {form.compPayer === "Borrower Paid" && (
                  <button
                    type="button"
                    onClick={() => setCompModalOpen(true)}
                    className="mt-1 text-[11px] text-gray-600 hover:text-gray-900 underline-offset-2 hover:underline"
                  >
                    {Number(form.compensation?.lenderPaidDefaultPct ?? 1.25).toFixed(3)}%
                    {" / "}
                    {(() => {
                      const la = parseNum(form.baseLoanAmount) || 0;
                      const amt = (la * (Number(form.compensation?.lenderPaidDefaultPct) || 0)) / 100;
                      return `$${amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    })()}
                  </button>
                )}
                {form.compPayer === "Borrower Paid" && (
                  <div className="mt-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    Section A fee (fixed): {FIXED_BORROWER_SECTION_A_FEE_PCT.toFixed(3)}%
                    {" · "}
                    {(() => {
                      const la = parseNum(form.baseLoanAmount) || 0;
                      const amt = (la * FIXED_BORROWER_SECTION_A_FEE_PCT) / 100;
                      return `$${amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    })()}
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>Rate Type</label>
                <select value={form.rateType} onChange={onField("rateType")} className={selectCls}>
                  <option value="Fixed">Fixed</option>
                  <option value="ARM">ARM</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Lock Period (days)</label>
                <input type="number" value={form.lockDays} onChange={onField("lockDays")} className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Loan Term</label>
                <select value={form.loanTerm} onChange={onField("loanTerm")} className={selectCls}>
                  {LOAN_TERM_OPTIONS.map((t) => <option key={t} value={t}>{t} Years</option>)}
                </select>
              </div>

              {form.mortgageType === "VA" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>VA Type</label>
                    <select value={form.vaType} onChange={onField("vaType")} className={selectCls}>
                      <option value="0">Regular military</option>
                      <option value="1">National Guard / Reserves</option>
                      <option value="2">Exempt</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>VA Use</label>
                    <select
                      value={form.vaFirstTimeUse ? "first" : "subsequent"}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          vaFirstTimeUse: e.target.value === "first",
                        }))
                      }
                      className={selectCls}
                    >
                      <option value="first">First time use</option>
                      <option value="subsequent">Subsequent use</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Rate</label>
                  <input value={form.desiredRate} onChange={onField("desiredRate")} className={inputCls} placeholder="Desired Rate" />
                </div>
                <div>
                  <label className={labelCls}>&nbsp;</label>
                  <input className={inputCls} placeholder="%" disabled />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls + " mb-0"}>Product</label>
                  <button
                    type="button"
                    onClick={handleSyncCatalog}
                    disabled={catalogSyncing}
                    className="flex items-center gap-1 text-[9px] font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    title="Sync products from Mortech"
                  >
                    {catalogSyncing
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <RefreshCw className="h-3 w-3" />}
                    {catalogSyncing ? "Syncing…" : "Sync"}
                  </button>
                </div>
                {catalogLoading ? (
                  <div className="border border-gray-200 bg-gray-50 rounded-md px-2.5 py-1.5 text-xs text-gray-400">Loading products…</div>
                ) : filteredProducts.length > 0 ? (
                  <select
                    value={form.selectedProductId}
                    onChange={onField("selectedProductId")}
                    className={selectCls}
                  >
                    {filteredProducts.map((p) => (
                      <option key={p.productId} value={p.productId}>
                        {cleanProductLabel(p.name)}
                      </option>
                    ))}
                  </select>
                ) : catalogProducts.length === 0 ? (
                  <div className="border border-gray-200 bg-gray-50 rounded-md px-2.5 py-1.5 text-[10px] text-gray-500">
                    No catalog synced. Click Sync or using fallback category.
                  </div>
                ) : mortgageFilteredCatalog.length === 0 ? (
                  <div className="border border-amber-200 bg-amber-50 rounded-md px-2.5 py-1.5 text-[10px] text-amber-700">
                    No products match {form.mortgageType} + {form.rateType} + {form.loanTerm}yr. Using fallback.
                  </div>
                ) : (
                  <div className="border border-amber-200 bg-amber-50 rounded-md px-2.5 py-1.5 text-[10px] text-amber-700">
                    No catalog products pass current housing event and/or bankruptcy rules. Using fallback.
                  </div>
                )}
                {filteredProducts.length === 0 && (
                  <div className="mt-1">
                    <select value={form.productCategory} onChange={onField("productCategory")} className={selectCls + " text-gray-400"}>
                      <option value="conv_30yr">Conventional (fallback)</option>
                      <option value="fha_30yr">FHA (fallback)</option>
                      <option value="va_30yr">VA (fallback)</option>
                      <option value="usda_30yr">USDA (fallback)</option>
                      <option value="jumbo_30yr">Jumbo (fallback)</option>
                      <option value="non_qm_30yr">Non-QM (Non-Conforming) (fallback)</option>
                    </select>
                  </div>
                )}
                {isNonQmFlow && (
                  <div className="mt-1 flex items-start gap-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                    <Info className="h-3.5 w-3.5 mt-[1px] flex-shrink-0" />
                    <div>
                      <div className="font-semibold">Non-QM pricing placeholder</div>
                      <div className="text-amber-700/90">{NON_QM_DISCLAIMER}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Mortgage Insurance (MI) Estimator ── */}
              {(() => {
                const miApplicable = shouldShowMiFields(form.mortgageType, ltv);
                const miValidation = validateMiDetails(form.miDetails, ltv);
                const monthlyMiEst = pricingMetrics.miMo || 0;
                return (
                  <div className="border-t border-gray-100 pt-2 space-y-1.5">
                    <label className={checkboxLabelCls}>
                      <input
                        type="checkbox"
                        checked={!!form.estimateMI}
                        onChange={onField("estimateMI")}
                        disabled={!miApplicable}
                        className={checkboxCls}
                        title={
                          miApplicable
                            ? "Include MI pricing from Mortech"
                            : "MI applies to Conventional / Jumbo / HomeReady / HomePossible with LTV > 80"
                        }
                      />
                      <span className="text-xs text-gray-700">Estimate MI</span>
                      {!miApplicable && (
                        <span className="ml-1 text-[10px] text-gray-400">
                          (LTV &gt; 80 on conventional only)
                        </span>
                      )}
                    </label>

                    {form.estimateMI && miApplicable && (
                      <div className="rounded-md border border-blue-200 bg-blue-50/60 px-2.5 py-2 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={labelCls}>MI Company</label>
                            <select
                              value={form.miDetails?.company ?? -999}
                              onChange={onMiField("company")}
                              className={selectCls}
                            >
                              {MI_COMPANY_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>MI Type</label>
                            <select
                              value={form.miDetails?.noMIMode || "standard"}
                              onChange={onMiField("noMIMode")}
                              className={selectCls}
                            >
                              {MI_NO_MI_MODE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Coverage type is only relevant for "standard" MI — LPMI
                            and reduced-coverage modes use noMI alone. */}
                        {form.miDetails?.noMIMode === "standard" && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className={labelCls}>Coverage</label>
                              <select
                                value={form.miDetails?.coverageType || "monthly"}
                                onChange={onMiField("coverageType")}
                                className={selectCls}
                              >
                                {MI_COVERAGE_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-end">
                              <label
                                className={
                                  checkboxLabelCls +
                                  (form.miDetails?.coverageType !== "single"
                                    ? " opacity-50 cursor-not-allowed"
                                    : "")
                                }
                                title={
                                  form.miDetails?.coverageType === "single"
                                    ? "Add single-premium MI into the loan amount (Mortech financeMI=1)"
                                    : "Financing applies only to Single-Premium MI"
                                }
                              >
                                <input
                                  type="checkbox"
                                  checked={!!form.miDetails?.financeMI}
                                  onChange={onMiField("financeMI")}
                                  disabled={form.miDetails?.coverageType !== "single"}
                                  className={checkboxCls}
                                />
                                <span className="text-[11px] text-gray-700">
                                  Finance MI into loan
                                </span>
                              </label>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-blue-200/70">
                          <span className="text-gray-600">Est. monthly MI</span>
                          <span className="font-semibold text-gray-900">
                            {monthlyMiEst > 0 ? fmtMoney(monthlyMiEst, 2) : "—"}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 leading-snug">
                          Included in DTI. Mortech will return authoritative
                          monthlyPremium with priced rates.
                        </div>
                        {!miValidation.ok && (
                          <div className="text-[10px] text-red-600 leading-snug">
                            {Object.values(miValidation.errors)[0]}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>}

      {/* ─── ADVANCED FEATURES ─── */}
      {!selectedRate && <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-5 py-3 flex items-center justify-between text-left"
        >
          <span className="text-sm font-semibold text-blue-600">Advanced Features</span>
          {showAdvanced ? <ChevronUp className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4 text-blue-600" />}
        </button>

        {showAdvanced && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-4">
              {/* Sub-col 1: Escrow & Expenses */}
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Escrow</label>
                  <select value={form.escrow === "Waived" ? "Waived" : "None"} onChange={onField("escrow")} className={selectCls}>
                    <option value="None">None (escrow included)</option>
                    <option value="Waived">Waived</option>
                  </select>
                  {!escrowWaiverValidation.eligible && (
                    <div className="mt-1.5 text-[11px] rounded px-2 py-1.5 border border-red-200 bg-red-50 text-red-800">
                      <div className="font-semibold">Escrow Waiver Ineligible</div>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        <li>FHA loans do not allow waivers</li>
                        <li>Conventional/VA require LTV ≤ 80%</li>
                        <li>Non-QM allows up to 90% LTV</li>
                      </ul>
                      {escrowWaiverValidation.reason && (
                        <div className="mt-1 font-medium">{escrowWaiverValidation.reason}</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Hazard Insurance</label>
                  <div className="grid grid-cols-2 gap-2">
                    <DollarNumberInput value={form.hazardInsurance} onChange={onField("hazardInsurance")} className={inputCls} placeholder=" / year" />
                    <input value={form.hazardInsurancePct} onChange={onField("hazardInsurancePct")} className={inputCls} placeholder="%" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Property Taxes</label>
                  <div className="grid grid-cols-2 gap-2">
                    <DollarNumberInput value={form.propertyTaxes} onChange={onField("propertyTaxes")} className={inputCls} placeholder=" / year" />
                    <input value={form.propertyTaxesPct} onChange={onField("propertyTaxesPct")} className={inputCls} placeholder="%" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>HOA (Monthly)</label>
                  <DollarNumberInput value={form.hoaMonthly} onChange={onField("hoaMonthly")} className={inputCls} placeholder=" / month" />
                </div>
                <div>
                  <label className={labelCls}>Supp. Property Insurance</label>
                  <DollarNumberInput value={form.suppPropertyInsurance} onChange={onField("suppPropertyInsurance")} className={inputCls} placeholder=" / year" />
                </div>
              </div>

              {/* Sub-col 2: Property & Financial */}
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Properties Financed</label>
                  <input type="number" min="0" value={form.propertiesFinanced} onChange={onField("propertiesFinanced")} className={inputCls} placeholder="0" />
                </div>
                <div>
                  <label className={labelCls}>Title Seasoning (months)</label>
                  <input type="number" min="0" value={form.titleSeasoning} onChange={onField("titleSeasoning")} className={inputCls} placeholder="months" />
                </div>
                <div>
                  <label className={labelCls}>Acres</label>
                  <input type="number" value={form.acres} onChange={onField("acres")} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>MI</label>
                  <select value={form.mi} onChange={onField("mi")} className={selectCls}>
                    <option value="BPMI">BPMI</option>
                    <option value="LPMI">LPMI</option>
                    <option value="No MI">No MI</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Improvements, Renovations & Repairs</label>
                  <DollarNumberInput value={form.improvementsAmount} onChange={onField("improvementsAmount")} className={inputCls} placeholder="0" />
                </div>
              </div>

              {/* Sub-col 3: Loan Parameters & Status */}
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Residency Status</label>
                  <select value={form.residencyStatus} onChange={onField("residencyStatus")} className={selectCls}>
                    <option value="US Citizen">US Citizen</option>
                    <option value="Permanent Resident">Permanent Resident</option>
                    <option value="Non-Permanent Resident">Non-Permanent Resident</option>
                    <option value="Foreign National">Foreign National</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>AUS</label>
                  <select value={form.aus} onChange={onField("aus")} className={selectCls}>
                    <option value="All">All</option>
                    <option value="DU">DU (Desktop Underwriter)</option>
                    <option value="LP">LP (Loan Prospector)</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Loan Officer</label>
                  <div className="border border-gray-200 bg-gray-50 rounded-md px-2.5 py-1.5 text-xs text-gray-600">
                    {loan?.assignedLoanOfficer?.name || "Current User"}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-2">
                  <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Payment Type</div>
                  <label className={checkboxLabelCls}>
                    <input type="checkbox" checked={form.interestOnly} onChange={onField("interestOnly")} className={checkboxCls} />
                    <span className="text-xs text-gray-700">Interest Only</span>
                  </label>
                  <label className={checkboxLabelCls}>
                    <input type="checkbox" checked={form.principalAndInterest} onChange={onField("principalAndInterest")} className={checkboxCls} />
                    <span className="text-xs text-gray-700">Principal and Interest</span>
                  </label>
                </div>
              </div>

              {/* Sub-col 4: Boolean Flags */}
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Derogatory Credit</div>
                <label className={checkboxLabelCls}>
                  <input
                    type="checkbox"
                    checked={form.mortgageLates}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setCreditRuleDrivenMode(true);
                      const loanId = loan?._id;
                      const lenderId = loan?.lender?._id || loan?.lender;
                      if (checked) {
                        if (!loanId || !lenderId) {
                          window.alert("Missing loan or lender context. Please reload the loan and try again.");
                          setForm((prev) => ({ ...prev, mortgageLates: false }));
                          return;
                        }
                        // Optimistic enable while fetching.
                        setMortgageTypeManualOverride(false);
                        setForm((prev) => ({
                          ...prev,
                          mortgageLates: true,
                        }));
                        customAxios
                          .get(`/api/v1/credit-report/${loanId}/${lenderId}/mortgage-lates-summary`)
                          .then((resp) => {
                            const data = resp.data || {};
                            if (data.found !== true) {
                              window.alert(
                                "Credit report exists, but no mortgage late-count data was found."
                              );
                              setForm((prev) => ({
                                ...prev,
                                mortgageLates: false,
                                mortgageLate30Count: "",
                                mortgageLate60Count: "",
                                mortgageLate90Count: "",
                              }));
                              return;
                            }
                            // Use totals across mortgage liabilities as the default UI values.
                            setForm((prev) => ({
                              ...prev,
                              mortgageLates: true,
                              mortgageLate30Count: String(data.total30 ?? ""),
                              mortgageLate60Count: String(data.total60 ?? ""),
                              mortgageLate90Count: String(data.total90 ?? ""),
                            }));
                          })
                          .catch((err) => {
                            const msg =
                              err?.response?.data?.message ||
                              err?.response?.data?.error ||
                              err?.message ||
                              "Failed to load credit report mortgage late-count data.";
                            if (String(msg).toLowerCase().includes("credit report not found")) {
                              window.alert("Please create credit report first.");
                            } else {
                              window.alert(msg);
                            }
                            setForm((prev) => ({
                              ...prev,
                              mortgageLates: false,
                              mortgageLate30Count: "",
                              mortgageLate60Count: "",
                              mortgageLate90Count: "",
                            }));
                          });
                        return;
                      }
                      setMortgageTypeManualOverride(false);
                      setForm((prev) => ({
                        ...prev,
                        mortgageLates: checked,
                        ...(!checked
                          ? {
                              mortgageLate30Count: "",
                              mortgageLate60Count: "",
                              mortgageLate90Count: "",
                            }
                          : {}),
                      }));
                    }}
                    className={checkboxCls}
                  />
                  <span className="text-xs text-gray-700">Mortgage Lates</span>
                </label>
                {form.mortgageLates && (
                  <div className="ml-5 mt-2 space-y-2 pl-1 border-l border-gray-200">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className={labelCls}>30D Late Count</label>
                        <input
                          type="number"
                          min="0"
                          value={form.mortgageLate30Count}
                          onChange={onField("mortgageLate30Count")}
                          className={inputCls}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>60D Late Count</label>
                        <input
                          type="number"
                          min="0"
                          value={form.mortgageLate60Count}
                          onChange={onField("mortgageLate60Count")}
                          className={inputCls}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>90D Late Count</label>
                        <input
                          type="number"
                          min="0"
                          value={form.mortgageLate90Count}
                          onChange={onField("mortgageLate90Count")}
                          className={inputCls}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <label className={checkboxLabelCls}>
                  <input
                    type="checkbox"
                    checked={form.housingEvent}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setCreditRuleDrivenMode(true);
                      setForm((prev) => ({
                        ...prev,
                        housingEvent: checked,
                        ...(!checked ? { housingEventType: "", housingEventDate: "" } : {}),
                      }));
                    }}
                    className={checkboxCls}
                  />
                  <span className="text-xs text-gray-700">Housing Event</span>
                </label>
                {form.housingEvent && (
                  <div className="ml-5 mt-2 space-y-2 pl-1 border-l border-gray-200">
                    <div>
                      <label className={labelCls}>Event Type</label>
                      <select
                        value={form.housingEventType}
                        onChange={onField("housingEventType")}
                        className={selectCls}
                      >
                        <option value="">Select…</option>
                        {HOUSING_EVENT_TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Event Date</label>
                      <input
                        type="date"
                        value={form.housingEventDate}
                        onChange={onField("housingEventDate")}
                        className={inputCls}
                      />
                    </div>
                  </div>
                )}
                <label className={checkboxLabelCls}>
                  <input
                    type="checkbox"
                    checked={form.bankruptcy}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setCreditRuleDrivenMode(true);
                      if (!checked) {
                        setForm((prev) => ({
                          ...prev,
                          bankruptcy: false,
                          bankruptcyChapter: "",
                          bankruptcyStatus: "",
                          bankruptcyDischargeDate: "",
                          bankruptcyCount: "1",
                        }));
                        return;
                      }

                      const loanId = loan?._id;
                      const lenderId = loan?.lender?._id || loan?.lender;
                      if (!loanId || !lenderId) {
                        window.alert("Missing loan or lender context. Please reload the loan and try again.");
                        setForm((prev) => ({ ...prev, bankruptcy: false }));
                        return;
                      }

                      // Optimistic enable while fetching.
                      setForm((prev) => ({ ...prev, bankruptcy: true }));

                      customAxios
                        .get(`/api/v1/credit-report/${loanId}/${lenderId}/bankruptcy-summary`)
                        .then((resp) => {
                          const data = resp.data || {};
                          if (data.found !== true || !data.bkCount) {
                            window.alert(
                              "Credit report exists, but no bankruptcy public record found."
                            );
                            setForm((prev) => ({
                              ...prev,
                              bankruptcy: false,
                              bankruptcyChapter: "",
                              bankruptcyStatus: "",
                              bankruptcyDischargeDate: "",
                              bankruptcyCount: "1",
                            }));
                            return;
                          }

                          const chapter =
                            data.bkType === "Chapter7"
                              ? "Chapter7"
                              : data.bkType === "Chapter13"
                                ? "Chapter13"
                                : "";
                          const status = String(data.bkStatus || "");
                          const dischargeDate = String(data.dischargeDate || "");
                          const count = String(data.bkCount || "1");

                          setForm((prev) => ({
                            ...prev,
                            bankruptcy: true,
                            bankruptcyChapter: chapter,
                            bankruptcyStatus: status,
                            bankruptcyDischargeDate: dischargeDate,
                            bankruptcyCount: count,
                          }));
                        })
                        .catch((err) => {
                          const msg =
                            err?.response?.data?.message ||
                            err?.response?.data?.error ||
                            err?.message ||
                            "Failed to load credit report bankruptcy data.";
                          if (String(msg).toLowerCase().includes("credit report not found")) {
                            window.alert("Please create credit report first.");
                          } else {
                            window.alert(msg);
                          }
                          setForm((prev) => ({
                            ...prev,
                            bankruptcy: false,
                            bankruptcyChapter: "",
                            bankruptcyStatus: "",
                            bankruptcyDischargeDate: "",
                            bankruptcyCount: "1",
                          }));
                        });
                    }}
                    className={checkboxCls}
                  />
                  <span className="text-xs text-gray-700">Bankruptcy</span>
                </label>
                {form.bankruptcy && (
                  <div className="ml-5 mt-2 space-y-2 pl-1 border-l border-gray-200">
                    <div>
                      <label className={labelCls}>Type</label>
                      <select
                        value={form.bankruptcyChapter}
                        onChange={onField("bankruptcyChapter")}
                        className={selectCls}
                      >
                        <option value="">Select…</option>
                        {BANKRUPTCY_CHAPTER_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Status</label>
                      <select
                        value={form.bankruptcyStatus}
                        onChange={onField("bankruptcyStatus")}
                        className={selectCls}
                      >
                        <option value="">Select…</option>
                        {BANKRUPTCY_STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Discharge Date</label>
                      <input
                        type="date"
                        value={form.bankruptcyDischargeDate}
                        onChange={onField("bankruptcyDischargeDate")}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Bankruptcy count</label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={form.bankruptcyCount}
                        onChange={onField("bankruptcyCount")}
                        className={inputCls}
                        title="Number of bankruptcy filings (multiple filings use stricter seasoning)"
                      />
                    </div>
                  </div>
                )}

                <div className="text-[10px] font-semibold text-gray-500 uppercase mt-3 mb-1">Property / Loan Flags</div>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.rural} onChange={onField("rural")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Rural (USDA RD)</span>
                </label>
                {form.rural && (
                  <div className="ml-5 mt-1 mb-2 pl-1 border-l border-gray-200 space-y-1.5">
                    {selfEmployedNoDocsPivot ? (
                      <div className="flex items-start gap-2 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                        <Info className="h-3.5 w-3.5 mt-[1px] flex-shrink-0" />
                        <div>
                          <div className="font-semibold">Non-QM pivot takes precedence</div>
                          <div className="text-amber-700/90">
                            Self-employed without tax returns routes to Non-QM; Rural/USDA is ignored.
                          </div>
                        </div>
                      </div>
                    ) : usdaLoading ? (
                      <div className="text-[10px] text-gray-500">Checking USDA eligibility…</div>
                    ) : usdaEligibilityView?.eligible === true ? (
                      <div className="space-y-1">
                        <div className="flex items-start gap-2 text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1.5">
                          <Info className="h-3.5 w-3.5 mt-[1px] flex-shrink-0" />
                          <div>
                            <div className="font-semibold">USDA RD eligible</div>
                            <div className="text-emerald-700/90">
                              0% down / up to 101.01% LTV available. Only USDA RD products will be shown.
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-600 space-y-0.5">
                          <div>
                            <span className="font-semibold">Occupancy:</span>{" "}
                            {usdaEligibilityView.occupancyOk ? "Primary Residence ✓" : "Not eligible ✗"}
                          </div>
                          <div>
                            <span className="font-semibold">County AMI:</span>{" "}
                            {usdaEligibilityView.countyLimit != null
                              ? `${fmtCurrency(usdaEligibilityView.countyLimit)} (115% cap: ${fmtCurrency(
                                  usdaEligibilityView.cap
                                )})`
                              : "—"}
                          </div>
                          <div>
                            <span className="font-semibold">Income Check:</span>{" "}
                            {usdaEligibilityView.borrowerIncome != null
                              ? `${fmtCurrency(usdaEligibilityView.borrowerIncome)} ${
                                  usdaEligibilityView.incomeOk ? "✓" : "✗"
                                }`
                              : "—"}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-start gap-2 text-[10px] text-red-800 bg-red-50 border border-red-200 rounded-md px-2.5 py-1.5">
                          <Info className="h-3.5 w-3.5 mt-[1px] flex-shrink-0" />
                          <div>
                            <div className="font-semibold">
                              {(usdaEligibilityView?.reasons && usdaEligibilityView.reasons[0]) ||
                                "USDA eligibility pending"}
                            </div>
                            <div className="text-red-700/90">
                              {usdaEligibilityView?.missingInputs && usdaEligibilityView.missingInputs.length > 0
                                ? `Provide: ${usdaEligibilityView.missingInputs.join(", ")} to complete the check.`
                                : "Pricing is blocked until this is resolved."}
                            </div>
                          </div>
                        </div>
                        {usdaEligibilityView?.countyLimit != null && (
                          <div className="text-[10px] text-gray-600 space-y-0.5">
                            <div>
                              <span className="font-semibold">County AMI:</span>{" "}
                              {fmtCurrency(usdaEligibilityView.countyLimit)} (115% cap:{" "}
                              {fmtCurrency(usdaEligibilityView.cap)})
                            </div>
                            {usdaEligibilityView.borrowerIncome != null && (
                              <div>
                                <span className="font-semibold">Income:</span>{" "}
                                {fmtCurrency(usdaEligibilityView.borrowerIncome)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.solar} onChange={onField("solar")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Solar</span>
                  {form.solar && (
                    <button
                      type="button"
                      onClick={() => setSolarModalOpen(true)}
                      className="ml-auto text-[10px] font-semibold text-blue-600 hover:text-blue-700 underline"
                    >
                      Edit details
                    </button>
                  )}
                </label>
                {form.solar && (
                  <div className="ml-5 mt-1 mb-2 pl-1 border-l border-gray-200 space-y-1.5">
                    {!solarValidation.ok && (
                      <div className="flex items-start gap-2 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                        <Info className="h-3.5 w-3.5 mt-[1px] flex-shrink-0" />
                        <div>
                          <div className="font-semibold">Solar details incomplete</div>
                          <div className="text-amber-700/90">
                            {Object.values(solarValidation.errors)[0] ||
                              "Open Solar details and complete the required fields."}
                          </div>
                        </div>
                      </div>
                    )}
                    {solarEval.banners.map((b, i) => {
                      const tone = b.tone || "blue";
                      const cls =
                        tone === "red"
                          ? "text-red-800 bg-red-50 border-red-200"
                          : tone === "yellow"
                          ? "text-amber-800 bg-amber-50 border-amber-200"
                          : "text-blue-800 bg-blue-50 border-blue-200";
                      return (
                        <div
                          key={`solar-banner-${i}`}
                          className={`flex items-start gap-2 text-[10px] border rounded-md px-2.5 py-1.5 ${cls}`}
                        >
                          <Info className="h-3.5 w-3.5 mt-[1px] flex-shrink-0" />
                          <div>{b.text}</div>
                        </div>
                      );
                    })}
                    {solarLtvAdjustment.adjusted && (
                      <div className="text-[10px] text-gray-600 space-y-0.5">
                        <div>
                          <span className="font-semibold">Base LTV:</span>{" "}
                          {solarLtvAdjustment.baseLtv.toFixed(2)}%
                        </div>
                        <div>
                          <span className="font-semibold">Effective LTV (w/ financed PACE):</span>{" "}
                          {solarLtvAdjustment.effectiveLtv.toFixed(2)}% (loan{" "}
                          {fmtCurrency(solarLtvAdjustment.effectiveLoanAmount)})
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>}

      <SolarDetailsModal
        isOpen={solarModalOpen}
        initialValue={form.solarDetails}
        onCancel={handleSolarModalCancel}
        onSubmit={handleSolarModalSubmit}
      />

      <BrokerCompensationModal
        isOpen={compModalOpen}
        loanAmount={parseNum(form.baseLoanAmount)}
        initialValue={form.compensation}
        onCancel={() => setCompModalOpen(false)}
        onApply={handleCompModalApply}
      />

      {/* ─── FLOAT CONFIRMATION (rate selected) ─── */}
      {selectedRate && !pricingResult && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          {/* Header */}
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Float Confirmation</h3>
              {selectedRate.appliedAt && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Applied {new Date(selectedRate.appliedAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRate(null);
                  if (loan?._id) {
                    customAxios.put(`/api/v1/loans/${loan._id}`, { pricingSelection: null }).catch(() => {});
                  }
                }}
                className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Rate Change
              </button>
              <button
                type="button"
                onClick={handlePriceLoan}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Pricing…" : "Re-Price"}
              </button>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Info */}
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Product Info</div>
              <div className="space-y-0">
                <div className="text-xs font-semibold text-gray-800 mb-1">
                  {selectedRate.lenderName}
                </div>
                <div className="text-xs text-gray-600 mb-3">{selectedRate.productName}</div>
                {[
                  ["Final Rate", <span className="text-green-700 font-bold">{selectedRate.interestRate?.toFixed(3)}%</span>],
                  ["APR", `${selectedRate.apr?.toFixed(3)}%`],
                  ["Discount Points", selectedRate.discountPoints != null
                    ? `${(selectedRate.discountPoints * 100).toFixed(3)}%  /  ${fmtMoney(selectedRate.discountPointsDollar)}`
                    : "—"],
                  ["Rate Lock Period", `${selectedRate.lockDays || 30} Days`],
                  ["Rate Published", selectedRate.lastUpdate ? selectedRate.lastUpdate.slice(0, 10) : "—"],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-1 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-xs text-gray-800 font-medium">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Loan Info */}
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Loan Info</div>
              <div className="space-y-0">
                {[
                  ["Loan Amount", fmtMoney(parseNum(form.baseLoanAmount))],
                  ["Loan Purpose", form.loanPurpose],
                  ["Occupancy", form.occupancy],
                  ["Property Type", form.propertyType],
                  ["Lien Position", `${form.lienPosition} Lien`],
                  ["FICO", form.fico || "—"],
                  [
                    "Compensation",
                    (() => {
                      const comp = selectedRate?.compensation || null;
                      const type = comp?.type || form.compPayer;
                      if (type === "Borrower Paid") {
                        const thin = Number(
                          comp?.thinPctApplied ?? form.compensation?.lenderPaidDefaultPct ?? 0
                        ).toFixed(3);
                        const feePct = FIXED_BORROWER_SECTION_A_FEE_PCT.toFixed(3);
                        const feeAmt = comp?.sectionAFee?.amount
                          ? fmtMoney(comp.sectionAFee.amount, 2)
                          : fmtMoney(
                              (parseNum(form.baseLoanAmount) * FIXED_BORROWER_SECTION_A_FEE_PCT) / 100,
                              2
                            );
                        return `Borrower Paid — thin ${thin}% / fee ${feePct}% (${feeAmt})`;
                      }
                      return "Lender Paid (built into rate)";
                    })(),
                  ],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-1 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-xs text-gray-800 font-medium">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Adjustments */}
          {selectedRate.adjustments && selectedRate.adjustments.length > 0 && (
            <div className="px-5 pb-5">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Pricing Adjustments</div>
              <div className="border border-gray-100 rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr className="text-[10px] uppercase text-gray-500">
                      <th className="text-left px-3 py-2 font-semibold">Adjustment Name</th>
                      <th className="text-right px-3 py-2 font-semibold">Rate</th>
                      <th className="text-right px-3 py-2 font-semibold">Point</th>
                      <th className="text-right px-3 py-2 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Base Price", rate: null, points: selectedRate.basePrice, amount: null },
                      ...selectedRate.adjustments,
                    ].map((adj, i) => (
                      <tr key={i} className={`border-t border-gray-50 ${adj.name === "Final Price" ? "font-semibold bg-gray-50" : ""}`}>
                        <td className="px-3 py-1.5 text-gray-700">{adj.name}</td>
                        <td className="px-3 py-1.5 text-right text-gray-600">{adj.rate != null ? adj.rate.toFixed(3) : "—"}</td>
                        <td className="px-3 py-1.5 text-right text-gray-600">{adj.points != null ? adj.points.toFixed(3) : "—"}</td>
                        <td className={`px-3 py-1.5 text-right font-medium ${adj.amount != null && adj.amount < 0 ? "text-red-600" : adj.amount != null && adj.amount > 0 ? "text-green-600" : "text-gray-600"}`}>
                          {adj.amount != null ? fmtMoney(Math.abs(adj.amount)) : "—"}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                      <td className="px-3 py-2 text-gray-900">Final Price</td>
                      <td className="px-3 py-2 text-right text-gray-900">{selectedRate.interestRate?.toFixed(3)}</td>
                      <td className="px-3 py-2 text-right text-gray-900">{((selectedRate.discountPoints || 0) * 100).toFixed(3)}</td>
                      <td className="px-3 py-2 text-right text-gray-900">{fmtMoney(selectedRate.discountPointsDollar)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {applying && (
            <div className="px-5 pb-3 text-xs text-gray-400">Saving selection…</div>
          )}
        </div>
      )}

      {/* ─── PRICE LOAN BUTTON (shown only when no rate selected or after re-price) ─── */}
      {(!selectedRate || pricingResult || pricingError) && (
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handlePriceLoan}
          disabled={loading}
          className="px-8 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-md shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Pricing..." : "Price Loan"}
        </button>
      </div>
      )}

      {/* ─── PRICING RESULT / ERROR ─── */}
      {bankruptcyEligibility?.hardStop && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          Subject to Investor Overlay: No Agency products are eligible.
        </div>
      )}
      {isOnlyNonQmByBankruptcy && !bankruptcyEligibility?.hardStop && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          Only Non-QM products available due to recent bankruptcy.
        </div>
      )}
      {pricingError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{pricingError}</div>
      )}

      {pricingResult && rateGroups.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Eligible Lenders</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {pricingResult.filteredCount ?? pricingResult.count} rate{(pricingResult.filteredCount ?? pricingResult.count) !== 1 ? "s" : ""} from {rateGroups.length} lender{rateGroups.length !== 1 ? "s" : ""}
                {form.lender && pricingResult.filteredCount !== pricingResult.count && (
                  <span className="ml-1 text-blue-500">(filtered from {pricingResult.count} total)</span>
                )}
                {" "}· Sorted by rate (low to high)
              </p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {rateGroups.map((group) => {
              const hero = group.hero;
              const isExpanded = !!expandedCards[group.lenderName];
              const isCost = hero.cost > 0;
              const costTxt = isCost
                ? `(${fmtMoney(Math.abs(hero.cost))})`
                : `+${fmtMoney(Math.abs(hero.cost))}`;
              const heroFeesKey = `hero:${group.lenderName}`;
              const heroFeesOpen = !!expandedFees[heroFeesKey];
              return (
                <div key={group.lenderName}>
                  {/* ── Hero row ── */}
                  <div className="px-5 py-3 flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-[140px]">
                      <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded mb-0.5">
                        {group.lenderName}
                      </span>
                      <div className="text-[11px] text-gray-500">{hero.source?.productName || `${form.loanTerm} Yr Fixed`}</div>
                      {hero.isBpc && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                          BPC · thin {Number(hero.thinPctApplied || 0).toFixed(3)}%
                        </div>
                      )}
                    </div>
                    <div className="text-center min-w-[70px]">
                      <div className="text-lg font-bold text-gray-900">{hero.rate.toFixed(3)}%</div>
                      <div className="text-[10px] text-gray-500" title={hero.isBpc ? `Includes ${Number(hero.feePctApplied || 0).toFixed(3)}% Borrower Paid Comp as PFC` : undefined}>
                        {hero.apr.toFixed(3)}% APR{hero.isBpc ? "*" : ""}
                      </div>
                    </div>
                    <div className="text-center min-w-[90px]">
                      <div className={`text-sm font-semibold ${isCost ? "text-red-600" : "text-green-600"}`}>{costTxt}</div>
                      <div className="text-[10px] text-gray-500">
                        {isCost ? "Points / Cost" : "Lender Credit"}
                        {hero.isBpc && (
                          <div className="text-[10px] text-gray-400">Price {Number(hero.basePrice).toFixed(3)}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-center min-w-[80px]">
                      <div className="text-sm font-semibold text-gray-900">{fmtMoney(hero.pi)}/mo</div>
                      <div className="text-[10px] text-gray-500">P&I</div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedFees((p) => ({ ...p, [heroFeesKey]: !p[heroFeesKey] }))}
                        className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
                      >
                        {heroFeesOpen ? "Hide fees" : `View fees${Array.isArray(hero.fees) ? ` (${hero.fees.length})` : ""}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => applyRate(hero, group.lenderName)}
                        className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedCards((p) => ({ ...p, [group.lenderName]: !p[group.lenderName] }))}
                        className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
                      >
                        {isExpanded ? "Hide rates" : `All rates (${group.stack.length})`}
                      </button>
                    </div>
                  </div>

                  {/* ── Hero fees breakdown ── */}
                  {heroFeesOpen && (
                    <div className="px-5 pb-3 bg-gray-50 border-t border-gray-100">
                      <FeesBreakdown item={hero} />
                    </div>
                  )}

                  {/* ── Expanded rate stack ── */}
                  {isExpanded && (
                    <div className="bg-gray-50 border-t border-gray-100 px-5 pb-3">
                      <table className="w-full text-xs mt-2">
                        <thead>
                          <tr className="text-[10px] uppercase text-gray-500 border-b border-gray-200">
                            <th className="text-left py-1.5 font-semibold">Rate</th>
                            <th className="text-left py-1.5 font-semibold">APR</th>
                            <th className="text-left py-1.5 font-semibold">Cost / Credit</th>
                            <th className="text-left py-1.5 font-semibold">P&I / mo</th>
                            <th className="text-left py-1.5 font-semibold">Product</th>
                            <th className="py-1.5" />
                          </tr>
                        </thead>
                        <tbody>
                          {group.stack.map((item, idx) => {
                            const rowKey = `${group.lenderName}-${idx}`;
                            const rowExpanded = !!expandedRows[rowKey];
                            const c = item.cost > 0;
                            const cTxt = c
                              ? `(${fmtMoney(Math.abs(item.cost))})`
                              : `+${fmtMoney(Math.abs(item.cost))}`;
                            return (
                              <React.Fragment key={rowKey}>
                                <tr
                                  className={`border-b border-gray-100 cursor-pointer hover:bg-white transition-colors ${rowExpanded ? "bg-white" : ""}`}
                                  onClick={() => setExpandedRows((p) => ({ ...p, [rowKey]: !p[rowKey] }))}
                                >
                                  <td className="py-1.5 font-semibold text-gray-900">{item.rate.toFixed(3)}%</td>
                                  <td className="py-1.5 text-gray-600">{item.apr.toFixed(3)}%</td>
                                  <td className={`py-1.5 font-medium ${c ? "text-red-600" : "text-green-600"}`}>{cTxt}</td>
                                  <td className="py-1.5 text-gray-700">{fmtMoney(item.pi)}</td>
                                  <td className="py-1.5 text-gray-500 truncate max-w-[140px]">{item.source?.productName || "—"}</td>
                                  <td className="py-1.5 pl-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => applyRate(item, group.lenderName)}
                                      className="text-[10px] px-2.5 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                                    >
                                      Apply
                                    </button>
                                  </td>
                                </tr>
                                {rowExpanded && (
                                  <tr>
                                    <td colSpan={6} className="py-2 px-3 bg-white">
                                      <div className="grid grid-cols-2 gap-4 text-[11px] text-gray-600">
                                        <div className="space-y-0.5">
                                          <div className="flex justify-between border-b border-dashed border-gray-200 pb-0.5">
                                            <span className="text-gray-500">Base Price</span>
                                            <span className="font-medium">
                                              {Number(item.basePrice).toFixed(3)}
                                              {item.isBpc && item.rawBasePrice != null && (
                                                <span className="ml-1 text-[10px] text-gray-400">
                                                  (raw {Number(item.rawBasePrice).toFixed(3)})
                                                </span>
                                              )}
                                            </span>
                                          </div>
                                          <div className="flex justify-between border-b border-dashed border-gray-200 pb-0.5">
                                            <span className="text-gray-500">Lock Period</span>
                                            <span className="font-medium">{item.source?.lockTerm ?? form.lockDays ?? "30"} days</span>
                                          </div>
                                          <div className="flex justify-between border-b border-dashed border-gray-200 pb-0.5">
                                            <span className="text-gray-500">Lender</span>
                                            <span className="font-medium truncate max-w-[120px]">{item.source?.vendorProductName || group.lenderName}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">Last Updated</span>
                                            <span className="font-medium">{item.source?.lastUpdate ? item.source.lastUpdate.slice(0, 10) : "—"}</span>
                                          </div>
                                        </div>
                                        <div className="space-y-0.5">
                                          <div className="flex justify-between border-b border-dashed border-gray-200 pb-0.5">
                                            <span className="text-gray-500">P&I payment</span>
                                            <span className="font-medium">{fmtMoney(item.pi)}/mo</span>
                                          </div>
                                          <div className="flex justify-between border-b border-dashed border-gray-200 pb-0.5">
                                            <span className="text-gray-500">PITI (est.)</span>
                                            <span className="font-medium">{item.source?.piti ? fmtMoney(item.source.piti) : "—"}/mo</span>
                                          </div>
                                          <div className="flex justify-between border-b border-dashed border-gray-200 pb-0.5">
                                            <span className={`font-semibold ${c ? "text-red-600" : "text-green-600"}`}>{c ? "Points / Cost" : "Lender Credit"}</span>
                                            <span className={`font-semibold ${c ? "text-red-600" : "text-green-600"}`}>{cTxt}</span>
                                          </div>
                                          {item.isBpc && item.bpcApr != null && item.mortechApr != null && (
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">APR (Mortech raw)</span>
                                              <span className="font-medium">{Number(item.mortechApr).toFixed(3)}%</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="mt-3">
                                        <FeesBreakdown item={item} />
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pricingResult?.nonQmPlaceholder && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">Non-QM Loan (Non-Conforming)</div>
              <div className="text-xs text-gray-600 mt-1">Rate: Not Available</div>
              <div className="text-xs text-gray-500 mt-2">{pricingResult.message || NON_QM_DISCLAIMER}</div>
            </div>
          </div>
        </div>
      )}

      {pricingResult && !pricingResult?.nonQmPlaceholder && rateGroups.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          No rates returned from Mortech. Try adjusting your parameters.
        </div>
      )}

    </div>
  );
};

export default ProductsPricingTab;
