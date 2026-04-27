const path = require('path');
const ExcelJS = require('exceljs');

const AMI_FILE_NAME = '2025-mfi-cnty-ami-counties-by-state (1).xlsx';
const AMI_FILE_PATH = path.resolve(__dirname, '../../', AMI_FILE_NAME);

let cache = null;
const STATE_CODE_TO_NAME = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
  CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
};

function normalizeText(value) {
  return String(value || '').trim();
}

function normKey(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeStateName(value) {
  const raw = normalizeText(value);
  if (!raw) return '';
  const upper = raw.toUpperCase();
  return STATE_CODE_TO_NAME[upper] || raw;
}

function valueToNumber(v) {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[$,\s]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function getCellValue(cell) {
  if (!cell) return null;
  const v = cell.value;
  if (v == null) return null;
  if (typeof v === 'object' && v.richText) {
    return v.richText.map((x) => x.text || '').join('');
  }
  if (typeof v === 'object' && v.text != null) return v.text;
  if (typeof v === 'object' && v.result != null) return v.result;
  return v;
}

function parseHeaderColumns(headerRow) {
  const map = {};
  headerRow.eachCell((cell, colIdx) => {
    const raw = normalizeText(getCellValue(cell));
    const norm = raw.toLowerCase().replace(/\s+/g, ' ');
    if (!norm) return;
    if (norm.includes('county') && norm.includes('name')) map.countyName = colIdx;
    if (norm.includes('area median income') && norm.includes('2025')) map.ami = colIdx;
    if (norm.includes('5-digit') || norm.includes('key') || norm.includes('fips')) map.fips = colIdx;
    if (norm.includes('low-income') && norm.includes('80%')) map.low80 = colIdx;
  });
  return map;
}

async function loadAmiData() {
  if (cache) return cache;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(AMI_FILE_PATH);

  const rows = [];

  for (const ws of workbook.worksheets) {
    const stateName = normalizeText(ws.name);
    if (!stateName) continue;

    const headerRow = ws.getRow(4);
    const cols = parseHeaderColumns(headerRow);
    if (!cols.countyName || !cols.ami) continue;

    for (let r = 5; r <= ws.rowCount; r += 1) {
      const row = ws.getRow(r);
      const countyName = normalizeText(getCellValue(row.getCell(cols.countyName)));
      const amiValue = valueToNumber(getCellValue(row.getCell(cols.ami)));
      const fips = cols.fips ? normalizeText(getCellValue(row.getCell(cols.fips))) : '';
      const low80 = cols.low80 ? valueToNumber(getCellValue(row.getCell(cols.low80))) : null;

      if (!countyName || amiValue == null) continue;
      rows.push({
        state: stateName,
        countyName,
        countyKey: normKey(countyName),
        fips: fips || undefined,
        amiValue,
        low80Limit: low80,
      });
    }
  }

  cache = rows;
  return rows;
}

async function getCountyOptions(state) {
  const data = await loadAmiData();
  const stateKey = normKey(normalizeStateName(state));
  let filtered = stateKey
    ? data.filter((x) => normKey(x.state) === stateKey)
    : data;
  // If incoming state text doesn't match workbook state names/codes,
  // fall back to full county list so dropdown is never empty.
  if (stateKey && filtered.length === 0) {
    filtered = data;
  }

  const unique = new Map();
  for (const row of filtered) {
    const key = stateKey ? `${row.state}__${row.countyKey}` : row.countyKey;
    if (!unique.has(key)) {
      unique.set(key, {
        state: row.state,
        countyName: row.countyName,
        zipCode: row.fips || '',
      });
    }
  }
  return Array.from(unique.values()).sort((a, b) => a.countyName.localeCompare(b.countyName));
}

async function getStateOptions() {
  const data = await loadAmiData();
  const unique = new Map();
  for (const row of data) {
    const key = normKey(row.state);
    if (!unique.has(key)) unique.set(key, row.state);
  }
  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b));
}

async function findAmiByCounty({ propertyState, propertyCounty }) {
  const data = await loadAmiData();
  const stateKey = normKey(normalizeStateName(propertyState));
  const countyKey = normKey(propertyCounty);
  if (!stateKey || !countyKey) return null;

  return data.find((x) => normKey(x.state) === stateKey && x.countyKey === countyKey) || null;
}

async function checkAffordableEligibility({
  borrowerIncome,
  propertyState,
  propertyCounty,
  propertyZip,
  censusTract,
}) {
  const income = valueToNumber(borrowerIncome);
  if (income == null || income < 0) {
    return {
      amiValue: null,
      incomeLimit: null,
      borrowerIncome: income,
      affordableEligible: false,
      reason: 'Borrower income is required',
      propertyState,
      propertyCounty,
      propertyZip,
      censusTract,
    };
  }

  const row = await findAmiByCounty({ propertyState, propertyCounty });
  if (!row || row.amiValue == null) {
    return {
      amiValue: null,
      incomeLimit: null,
      borrowerIncome: income,
      affordableEligible: false,
      reason: 'AMI data not found for location',
      propertyState,
      propertyCounty,
      propertyZip,
      censusTract,
    };
  }

  const incomeLimit = row.amiValue * 0.8;
  const eligible = income <= incomeLimit;
  return {
    amiValue: row.amiValue,
    incomeLimit,
    borrowerIncome: income,
    affordableEligible: eligible,
    reason: eligible ? '' : 'Income exceeds 80% AMI',
    propertyState: row.state,
    propertyCounty: row.countyName,
    propertyZip,
    censusTract,
  };
}

const { computeUsdaEligibility } = require('../utils/ruralUsdaRouting');

/**
 * USDA RD eligibility: primary residence + household income <= 115% of county AMI.
 * Uses the same HUD county AMI table as the Affordable (HomeReady/HomePossible)
 * flow, but applies the 115% cap instead of 80%.
 */
async function checkUsdaEligibility({
  borrowerIncome,
  propertyState,
  propertyCounty,
  propertyZip,
  occupancy,
}) {
  const row = await findAmiByCounty({ propertyState, propertyCounty });
  const countyLimit = row && row.amiValue != null ? row.amiValue : null;

  const result = computeUsdaEligibility({
    rural: true,
    occupancy,
    annualIncome: borrowerIncome,
    countyLimit,
  });

  if (!row) {
    const reasons = result.reasons.slice();
    if (!reasons.some((r) => r.includes('AMI data not found'))) {
      reasons.push('AMI data not found for location.');
    }
    return {
      ...result,
      reasons,
      eligible: false,
      propertyState,
      propertyCounty,
      propertyZip,
    };
  }

  return {
    ...result,
    propertyState: row.state,
    propertyCounty: row.countyName,
    propertyZip,
  };
}

module.exports = {
  loadAmiData,
  getStateOptions,
  getCountyOptions,
  checkAffordableEligibility,
  checkUsdaEligibility,
};

