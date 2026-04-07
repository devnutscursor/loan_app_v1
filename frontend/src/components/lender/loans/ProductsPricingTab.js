import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ChevronUp, ChevronDown, Search, RefreshCw, Loader2 } from "lucide-react";
import customAxios from "../../../utils/axios";
import { getTotalIncome, getTotalDebts } from "./utils/LoanCalculationUtils";

const LOAN_TERM_OPTIONS = ["30", "25", "20", "15", "10"];

const MORTGAGE_TYPE_OPTIONS = [
  "Conforming",
  "FHA",
  "VA",
  "JUMBO",
  "Second Home",
  "Home Ready Program",
  "Home Possible Program",
];

const MORTGAGE_TYPE_KEYWORDS = {
  Conforming: { include: ["conf"], exclude: ["home ready", "home poss"] },
  FHA: { include: ["fha"] },
  VA: { include: ["va"] },
  JUMBO: { include: ["jumbo"] },
  "Second Home": { include: ["conf"], exclude: ["home ready", "home poss"] },
  "Home Ready Program": { include: ["home ready"] },
  "Home Possible Program": { include: ["home poss"] },
};

const filterCatalogProducts = (products, mortgageType, rateType, loanTerm) => {
  if (!products || products.length === 0) return [];
  const mtConfig = MORTGAGE_TYPE_KEYWORDS[mortgageType];
  if (!mtConfig) return products;

  const termStr = `${loanTerm} yr`;

  return products.filter((p) => {
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

const parseNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
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

const cls = (...args) => args.filter(Boolean).join(" ");

const inputCls = "w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none";
const readOnlyCls = `${inputCls} bg-gray-50 text-gray-800 cursor-default`;
const selectCls = `${inputCls} appearance-none bg-white`;
const labelCls = "block text-[10px] uppercase font-semibold text-gray-500 mb-1 tracking-wide";
const checkboxLabelCls = "flex items-center gap-2 py-1 cursor-pointer";
const checkboxCls = "h-3.5 w-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer";

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
  if (key === "jumbo") return "jumbo_30yr";
  return "conv_30yr";
};

const INITIAL = {
  loanPurpose: "Purchase",
  mortgageType: "Conforming",
  lienPosition: "First",
  purchasePrice: "",
  appraisedValue: "",
  baseLoanAmount: "",
  totalLoanAmount: "",
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

  lender: "",
  estClosingDate: "",
  compPayer: "Borrower Paid",
  compPercent: "",
  rateType: "Fixed",
  lockDays: "30",
  loanTerm: "30",
  vaType: "0",
  vaFirstTimeUse: true,
  desiredRate: "",
  closingType: "Select",
  uwFeeInPrice: false,
  estimateMI: false,
  cyp: false,
  refiIncentive: false,
  appraisalCredit: false,

  productCategory: "conv_30yr",
  selectedProductId: "",

  escrow: "None Waived",
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
  housingEvent: false,
  bankruptcy: false,
  constructionLoan: false,
  mixedUseProperty: false,
  rural: false,
  solar: false,
  pastClientLoan: false,
  supplementalAssetUtilization: false,
  rentFree: false,
  balloon: false,
  fullAppraisal: false,
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

const buildRateGroups = (rates, loanAmount, termYears) => {
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
          const apr = Number(r.apr);
          if (!Number.isFinite(rate)) return null;
          const sheet = Number(r.ratesheetPrice);
          const pts = Number(r.points);
          let cost;
          if (Number.isFinite(sheet) && sheet > 0) {
            cost = ((100 - sheet) / 100) * loanAmount;
          } else if (Number.isFinite(pts)) {
            cost = (pts / 100) * loanAmount;
          } else {
            cost = 0;
          }
          return {
            source: r,
            rate,
            apr: Number.isFinite(apr) ? apr : rate,
            pi: calcPI(loanAmount, rate, termYears),
            cost,
            basePrice: Number.isFinite(sheet) && sheet > 0 ? sheet : (Number.isFinite(pts) ? pts : 100),
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.rate - b.rate);

      return { lenderName, hero: stack[0] || null, stack };
    })
    .filter((g) => g.hero)
    .sort((a, b) => a.hero.rate - b.hero.rate);
};

const ProductsPricingTab = ({ loan }) => {
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

  const filteredProducts = useMemo(
    () => filterCatalogProducts(catalogProducts, form.mortgageType, form.rateType, form.loanTerm),
    [catalogProducts, form.mortgageType, form.rateType, form.loanTerm]
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

  useEffect(() => {
    if (!loan) return;
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
      totalLoanAmount: String(baseLoanAmount),
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
    }));
    // Restore saved pricing selection when loan data loads
    if (loan.pricingSelection) {
      setSelectedRate(loan.pricingSelection);
    }
  }, [loan]);

  const onField = useCallback((field) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
  }, []);

  const ltv = useMemo(() => {
    const base = parseNum(form.baseLoanAmount);
    const val = parseNum(form.appraisedValue) || parseNum(form.purchasePrice);
    if (!val) return 0;
    return (base / val) * 100;
  }, [form.baseLoanAmount, form.appraisedValue, form.purchasePrice]);

  const cltv = useMemo(() => {
    const base = parseNum(form.baseLoanAmount);
    const second = parseNum(form.secondMortgageAmount);
    const val = parseNum(form.appraisedValue) || parseNum(form.purchasePrice);
    if (!val) return 0;
    return ((base + second) / val) * 100;
  }, [form.baseLoanAmount, form.secondMortgageAmount, form.appraisedValue, form.purchasePrice]);

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
    if (loan?.loanParameters && typeof loan.loanParameters.mortgageInsurance === "number") {
      miMo = parseNum(loan.loanParameters.mortgageInsurance);
    } else if (form.estimateMI && ltv > 0 && ltv > 80) {
      miMo = ((0.5 / 100) * principal) / 12;
    }
    const monthlyHousing = pi + taxesMo + insMo + hoaMo + miMo + suppInsMo;
    const monthlyDebts = getTotalDebts(loan?.debts || loan?.loanParameters?.debts);
    const dtiComputed =
      monthlyIncome > 0 ? ((monthlyHousing + monthlyDebts) / monthlyIncome) * 100 : 0;

    return {
      monthlyIncome,
      monthlyHousing,
      monthlyDebts,
      dtiComputed,
    };
  }, [form, loan, ltv]);

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
      loanpurpose: form.loanPurpose,
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
      ...(() => {
        let dtiVal = 0;
        if (pricingMetrics.monthlyIncome > 0) {
          dtiVal = Math.round(pricingMetrics.dtiComputed * 100) / 100;
        } else {
          dtiVal = parseNum(form.dti);
        }
        return dtiVal > 0 ? { DTIPercent: dtiVal } : {};
      })(),
      ...(cltv > 0 && cltv !== ltv && { cltv: (cltv / 100).toFixed(4) }),
      ...(form.estClosingDate && { closingDate: form.estClosingDate }),
      ...(monthlyTaxes > 0 && { taxes: Math.round(monthlyTaxes * 100) / 100 }),
      ...(monthlyInsurance > 0 && { insurance: Math.round(monthlyInsurance * 100) / 100 }),
      firstTimeHomeBuyer: form.firstTimeHomebuyer ? 1 : 0,
      selfEmployed: form.selfEmployed ? 1 : 0,
      ...(form.affordable && { amiIlpaWaiver: 1 }),
      interestOnly: form.interestOnly ? 1 : 0,
      waiveEscrow: form.escrow !== "None Waived",
      ...(form.estimateMI && { includeMI: true }),
      ...(form.compPayer === "Lender Paid" && { lenderPaidYSP: 1 }),
      ...(form.desiredRate ? { targetPrice: parseNum(form.desiredRate) } : {}),
      ...(form.secondMortgageAmount && parseNum(form.secondMortgageAmount) > 0
        ? { secondMortgageAmount: parseNum(form.secondMortgageAmount) }
        : {}),
      program: form.subordinateLiens ? 1 : 0,
      ...(parseNum(form.annualIncome) > 0 && { annualIncome: parseNum(form.annualIncome) }),
      ...(form.mi === "LPMI" ? { coverageType: 16 } : form.mi === "BPMI" ? { coverageType: 1 } : {}),
      ...((form.mortgageType === "FHA" || form.mortgageType === "VA") && { includeUpfrontFee: true }),
      ...(form.mortgageType === "VA" && {
        vaType: form.vaType,
        vaFirstTimeUse: !!form.vaFirstTimeUse,
      }),
    };
  }, [form, ltv, cltv, catalogProducts, pricingMetrics]);

  const handlePriceLoan = async () => {
    setLoading(true);
    setPricingError("");
    setPricingResult(null);
    setRateGroups([]);
    setExpandedCards({});
    setExpandedRows({});
    setSelectedRate(null);
    try {
      const resp = await customAxios.post("/api/v1/mortech/search", mortechPayload);
      const allRates = resp.data?.rates || [];
      const selectedInvestor = form.lender;
      const rates = selectedInvestor
        ? allRates.filter((r) =>
            (r.lenderName || "").toLowerCase().includes(selectedInvestor.replace(/_/g, " ").toLowerCase())
          )
        : allRates;
      const loanAmt = parseNum(form.baseLoanAmount);
      const termYrs = parseNum(form.loanTerm) || 30;
      const groups = buildRateGroups(rates, loanAmt, termYrs);
      setRateGroups(groups);
      setPricingResult({ count: allRates.length, filteredCount: rates.length });
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

    const selection = {
      lenderName: lenderName,
      productName: src.productName || src.vendorProductName || "",
      interestRate: item.rate,
      apr: item.apr,
      discountPoints: item.basePrice !== 100 ? Math.abs((100 - item.basePrice) / 100) : 0,
      discountPointsDollar: Math.abs(item.cost),
      monthlyPI: item.pi,
      piti: parseNum(src.piti),
      lockDays: parseNum(src.lockTerm || form.lockDays || 30),
      lastUpdate: src.lastUpdate || "",
      basePrice: item.basePrice,
      adjustments,
      appliedAt: new Date().toISOString(),
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
                    <button key={v} type="button" onClick={() => setForm((p) => ({ ...p, loanPurpose: v }))}
                      className={cls("flex-1 py-1.5 text-xs font-medium transition-colors", form.loanPurpose === v ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50")}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Mortgage Type</label>
                <select value={form.mortgageType} onChange={onField("mortgageType")} className={selectCls}>
                  {MORTGAGE_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
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
                  <input type="number" value={form.purchasePrice} onChange={onField("purchasePrice")} className={inputCls} placeholder="$0" />
                </div>
                <div>
                  <label className={labelCls}>Appraised Value</label>
                  <input type="number" value={form.appraisedValue} onChange={onField("appraisedValue")} className={inputCls} placeholder="$0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Base Loan Amount</label>
                  <input type="number" value={form.baseLoanAmount} onChange={onField("baseLoanAmount")} className={inputCls} placeholder="$0" />
                </div>
                <div>
                  <label className={labelCls}>LTV</label>
                  <div className="border border-gray-200 bg-gray-50 rounded-md px-2.5 py-1.5 text-xs font-semibold text-gray-700">
                    {fmtPct(ltv)}
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Total Loan Amount</label>
                <input type="number" value={form.totalLoanAmount} onChange={onField("totalLoanAmount")} className={inputCls} />
              </div>

              <div>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.subordinateLiens} onChange={onField("subordinateLiens")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Subordinate Liens</span>
                </label>
                {form.subordinateLiens && (
                  <div className="mt-1">
                    <input type="number" value={form.secondMortgageAmount} onChange={onField("secondMortgageAmount")} className={inputCls} placeholder="2nd mortgage amount" />
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">LTV {fmtPct(ltv, 2)}</span>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">CLTV {fmtPct(cltv, 2)}</span>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">HCLTV {fmtPct(hcltv, 2)}</span>
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
                  <input value={form.county} onChange={onField("county")} className={inputCls} placeholder="County" />
                  <input value={form.propertyState} onChange={onField("propertyState")} className={inputCls} placeholder="State" />
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
                      title="(Housing P&I + taxes + ins + HOA + MI + debts) ÷ monthly income"
                    >
                      <span className="font-semibold text-blue-700">{pricingMetrics.dtiComputed.toFixed(2)}%</span>
                      <span className="text-gray-500 text-xs">est.</span>
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
                  <input type="number" value={form.annualIncome} onChange={onField("annualIncome")} className={inputCls} placeholder="$0" />
                </div>
              </div>


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
                  <span className="text-xs text-gray-700">First Time Homebuyer</span>
                </label>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.affordable} onChange={onField("affordable")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Affordable</span>
                </label>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.nonOccupantCoBorrower} onChange={onField("nonOccupantCoBorrower")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Non Occupant Co-Borrower</span>
                </label>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.selfEmployed} onChange={onField("selfEmployed")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Self Employed</span>
                </label>
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
                <label className={labelCls}>Comp Payer</label>
                <select value={form.compPayer} onChange={onField("compPayer")} className={selectCls}>
                  <option value="Borrower Paid">Borrower Paid</option>
                  <option value="Lender Paid">Lender Paid</option>
                </select>
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
                <label className={labelCls}>Closing Type</label>
                <select value={form.closingType} onChange={onField("closingType")} className={selectCls}>
                  <option value="Select">Select</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Refinance">Refinance</option>
                </select>
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
                ) : catalogProducts.length > 0 ? (
                  <div className="border border-amber-200 bg-amber-50 rounded-md px-2.5 py-1.5 text-[10px] text-amber-700">
                    No products match {form.mortgageType} + {form.rateType} + {form.loanTerm}yr. Using fallback.
                  </div>
                ) : (
                  <div className="border border-gray-200 bg-gray-50 rounded-md px-2.5 py-1.5 text-[10px] text-gray-500">
                    No catalog synced. Click Sync or using fallback category.
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
                    </select>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-2 space-y-1">
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.uwFeeInPrice} onChange={onField("uwFeeInPrice")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">UW Fee-In Price</span>
                </label>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.estimateMI} onChange={onField("estimateMI")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Estimate MI</span>
                </label>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.cyp} onChange={onField("cyp")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">CYP</span>
                </label>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.refiIncentive} onChange={onField("refiIncentive")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Refi Incentive</span>
                </label>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.appraisalCredit} onChange={onField("appraisalCredit")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Appraisal Credit</span>
                </label>
              </div>
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
                  <select value={form.escrow} onChange={onField("escrow")} className={selectCls}>
                    <option value="None Waived">None Waived</option>
                    <option value="Taxes Waived">Taxes Waived</option>
                    <option value="Insurance Waived">Insurance Waived</option>
                    <option value="All Waived">All Waived</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Hazard Insurance</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={form.hazardInsurance} onChange={onField("hazardInsurance")} className={inputCls} placeholder="$ / year" />
                    <input value={form.hazardInsurancePct} onChange={onField("hazardInsurancePct")} className={inputCls} placeholder="%" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Property Taxes</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={form.propertyTaxes} onChange={onField("propertyTaxes")} className={inputCls} placeholder="$ / year" />
                    <input value={form.propertyTaxesPct} onChange={onField("propertyTaxesPct")} className={inputCls} placeholder="%" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>HOA (Monthly)</label>
                  <input type="number" value={form.hoaMonthly} onChange={onField("hoaMonthly")} className={inputCls} placeholder="$ / month" />
                </div>
                <div>
                  <label className={labelCls}>Supp. Property Insurance</label>
                  <input type="number" value={form.suppPropertyInsurance} onChange={onField("suppPropertyInsurance")} className={inputCls} placeholder="$ / year" />
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
                  <input type="number" value={form.improvementsAmount} onChange={onField("improvementsAmount")} className={inputCls} placeholder="$0" />
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
                  <input type="checkbox" checked={form.mortgageLates} onChange={onField("mortgageLates")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Mortgage Lates</span>
                </label>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.housingEvent} onChange={onField("housingEvent")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Housing Event</span>
                </label>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.bankruptcy} onChange={onField("bankruptcy")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Bankruptcy</span>
                </label>

                <div className="text-[10px] font-semibold text-gray-500 uppercase mt-3 mb-1">Property / Loan Flags</div>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.constructionLoan} onChange={onField("constructionLoan")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Construction Loan</span>
                </label>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.mixedUseProperty} onChange={onField("mixedUseProperty")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Mixed Use Property</span>
                </label>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.rural} onChange={onField("rural")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Rural</span>
                </label>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.solar} onChange={onField("solar")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Solar</span>
                </label>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.pastClientLoan} onChange={onField("pastClientLoan")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Past Client Loan</span>
                </label>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.supplementalAssetUtilization} onChange={onField("supplementalAssetUtilization")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Supplemental Asset Utilization</span>
                </label>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.rentFree} onChange={onField("rentFree")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Rent Free</span>
                </label>

                <div className="text-[10px] font-semibold text-gray-500 uppercase mt-3 mb-1">Other</div>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.balloon} onChange={onField("balloon")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Balloon</span>
                </label>
                <label className={checkboxLabelCls}>
                  <input type="checkbox" checked={form.fullAppraisal} onChange={onField("fullAppraisal")} className={checkboxCls} />
                  <span className="text-xs text-gray-700">Full Appraisal</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>}

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
                  ["Compensation", form.compPayer],
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
              return (
                <div key={group.lenderName}>
                  {/* ── Hero row ── */}
                  <div className="px-5 py-3 flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-[140px]">
                      <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded mb-0.5">
                        {group.lenderName}
                      </span>
                      <div className="text-[11px] text-gray-500">{hero.source?.productName || `${form.loanTerm} Yr Fixed`}</div>
                    </div>
                    <div className="text-center min-w-[70px]">
                      <div className="text-lg font-bold text-gray-900">{hero.rate.toFixed(3)}%</div>
                      <div className="text-[10px] text-gray-500">{hero.apr.toFixed(3)}% APR</div>
                    </div>
                    <div className="text-center min-w-[90px]">
                      <div className={`text-sm font-semibold ${isCost ? "text-red-600" : "text-green-600"}`}>{costTxt}</div>
                      <div className="text-[10px] text-gray-500">{isCost ? "Points / Cost" : "Lender Credit"}</div>
                    </div>
                    <div className="text-center min-w-[80px]">
                      <div className="text-sm font-semibold text-gray-900">{fmtMoney(hero.pi)}/mo</div>
                      <div className="text-[10px] text-gray-500">P&I</div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
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
                                    <td colSpan={5} className="py-2 px-3 bg-white">
                                      <div className="grid grid-cols-2 gap-4 text-[11px] text-gray-600">
                                        <div className="space-y-0.5">
                                          <div className="flex justify-between border-b border-dashed border-gray-200 pb-0.5">
                                            <span className="text-gray-500">Base Price</span>
                                            <span className="font-medium">{Number(item.basePrice).toFixed(3)}</span>
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
                                          <div className="flex justify-between">
                                            <span className={`font-semibold ${c ? "text-red-600" : "text-green-600"}`}>{c ? "Points / Cost" : "Lender Credit"}</span>
                                            <span className={`font-semibold ${c ? "text-red-600" : "text-green-600"}`}>{cTxt}</span>
                                          </div>
                                        </div>
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

      {pricingResult && rateGroups.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          No rates returned from Mortech. Try adjusting your parameters.
        </div>
      )}

    </div>
  );
};

export default ProductsPricingTab;
