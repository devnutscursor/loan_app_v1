/**
 * Bankruptcy seasoning and hard-stop rules for Mortech products.
 * Mirrors backend/src/utils/bankruptcySeasoning.js — keep in sync when changing rules.
 */

import { classifyMortgageProductText } from "./housingEventSeasoning";

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

export const BANKRUPTCY_CHAPTER_OPTIONS = [
  { value: "Chapter7", label: "Chapter 7" },
  { value: "Chapter13", label: "Chapter 13" },
];

export const BANKRUPTCY_STATUS_OPTIONS = [
  { value: "Discharged", label: "Discharged" },
  { value: "Dismissed", label: "Dismissed" },
  { value: "Open", label: "Open" },
  { value: "Pending", label: "Pending" },
];

export function bankruptcyDischargeSeasoningYears(dischargeDate, asOf = new Date()) {
  if (dischargeDate == null || dischargeDate === "") return null;
  const d = dischargeDate instanceof Date ? dischargeDate : new Date(dischargeDate);
  if (Number.isNaN(d.getTime())) return null;
  const ms = asOf.getTime() - d.getTime();
  if (ms < 0) return 0;
  return ms / MS_PER_YEAR;
}

function normalizeStatus(status) {
  return String(status || "").trim();
}

export function isBankruptcyHardStopStatus(status) {
  const s = normalizeStatus(status).toLowerCase();
  return s === "open" || s === "pending";
}

export function parseBankruptcyCount(raw) {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function normalizeChapter(chapter) {
  const ch = String(chapter || "").toLowerCase().replace(/\s+/g, "");
  if (ch === "chapter7" || ch === "7" || ch === "ch7") return "Chapter7";
  if (ch === "chapter13" || ch === "13" || ch === "ch13") return "Chapter13";
  return "";
}

export function getBankruptcyThresholds(chapter, bkCount) {
  const ch = normalizeChapter(chapter);
  const mult = bkCount > 1;

  let minConv;
  let minGov;
  let nonQm;

  if (ch === "Chapter7") {
    minConv = 4;
    minGov = 2;
    nonQm = "gtZero";
  } else if (ch === "Chapter13") {
    minConv = 2;
    minGov = 1;
    nonQm = "always";
  } else {
    return null;
  }

  if (mult) {
    minConv = Math.max(minConv, 5);
    minGov = Math.max(minGov, 3);
    nonQm = "gt2";
  }

  return { minConv, minGov, nonQm };
}

export function isBucketEligibleForBankruptcy(bucket, seasoningYears, ctx) {
  const { bankruptcyStatus, bankruptcyChapter, bankruptcyCount } = ctx;
  const status = normalizeStatus(bankruptcyStatus);

  if (isBankruptcyHardStopStatus(status)) {
    if (bucket === "conventional" || bucket === "government") return false;
    return true;
  }

  if (status !== "Discharged" && status !== "Dismissed") {
    return true;
  }

  const bkCount = parseBankruptcyCount(bankruptcyCount);
  const thresholds = getBankruptcyThresholds(bankruptcyChapter, bkCount);
  if (!thresholds) return true;

  if (seasoningYears === null) return true;

  const { minConv, minGov, nonQm } = thresholds;
  const dismissedOverrideConvMin = status === "Dismissed" ? 4 : 0;

  if (bucket === "conventional") return seasoningYears >= Math.max(minConv, dismissedOverrideConvMin);
  if (bucket === "government") return seasoningYears >= minGov;
  if (bucket === "nonQm") {
    if (nonQm === "always") return true;
    if (nonQm === "gtZero") return seasoningYears > 0;
    if (nonQm === "gt2") return seasoningYears > 2;
  }
  return true;
}

export function isMortechRateEligibleForBankruptcy(rate, ctx, seasoningYears) {
  const bucket = classifyMortgageProductText(`${rate.productName || ""} ${rate.loanProgram || ""}`);
  return isBucketEligibleForBankruptcy(bucket, seasoningYears, ctx);
}

export function isCatalogProductEligibleForBankruptcy(product, ctx, seasoningYears) {
  const bucket = classifyMortgageProductText(product.name || "");
  return isBucketEligibleForBankruptcy(bucket, seasoningYears, ctx);
}

export function filterRatesByBankruptcy(rates, ctx) {
  if (!rates || rates.length === 0) return rates || [];
  if (!ctx || !ctx.bankruptcy) return rates;

  const seasoningYears = bankruptcyDischargeSeasoningYears(ctx.bankruptcyDischargeDate, ctx.asOf);

  return rates.filter((r) => isMortechRateEligibleForBankruptcy(r, ctx, seasoningYears));
}

export function filterCatalogProductsByBankruptcy(products, ctx) {
  if (!products || products.length === 0) return products || [];
  if (!ctx || !ctx.bankruptcy) return products;

  const seasoningYears = bankruptcyDischargeSeasoningYears(ctx.bankruptcyDischargeDate, ctx.asOf);

  return products.filter((p) => isCatalogProductEligibleForBankruptcy(p, ctx, seasoningYears));
}

/**
 * Hard stop: block pricing when payload targets conventional/government via fallback category
 * or a catalog product classified as conventional/government.
 */
export function mortgagePayloadViolatesBankruptcyHardStop(payload, catalogProducts) {
  if (!payload?.bankruptcy || !isBankruptcyHardStopStatus(payload.bankruptcyStatus)) {
    return false;
  }

  const list = payload.productList;
  if (list != null && String(list).trim() !== "" && catalogProducts?.length) {
    const firstId = String(list)
      .split(",")[0]
      .trim();
    const p = catalogProducts.find((x) => String(x.productId) === firstId);
    if (p) {
      const bucket = classifyMortgageProductText(p.name || "");
      return bucket === "conventional" || bucket === "government";
    }
  }

  const cat = String(payload.productCategory || "").toLowerCase();
  if (!cat) return false;
  return (
    cat.startsWith("conv_") ||
    cat.startsWith("fha_") ||
    cat.startsWith("va_") ||
    cat.startsWith("usda_") ||
    cat.startsWith("jumbo_") ||
    cat.startsWith("second_home") ||
    cat.startsWith("home_ready") ||
    cat.startsWith("home_possible")
  );
}
