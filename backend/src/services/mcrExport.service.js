/**
 * MCR Export Service — NMLS-Compliant Format (v6)
 *
 * Generates NMLS-compliant XML (for direct upload) and matching Excel exports.
 *
 * NMLS XML structure:
 *   <Mcr type="E" year="YYYY" formVersion="v6" periodType="MCRQX">
 *     <Rmla stateCode="XX">
 *       <SectionISection>  … AC codes with _1/_2/_3/_4 (or _6) suffixes …  </SectionISection>
 *       <ListSectionOfSectionIMlosItem> … MLO entries … </ListSectionOfSectionIMlosItem>
 *       <SectionIISection>  … I codes with _1/_2 suffixes …  </SectionIISection>
 *     </Rmla>
 *   </Mcr>
 *
 * Internal AC code mapping to NMLS:
 *   Our AC030 (Denied)    → NMLS AC040
 *   Our AC040 (Withdrawn) → NMLS AC050
 *   Our AC050 (Funded)    → NMLS AC070
 *   Our AC090 (End Pipe)  → NMLS AC080
 *   NMLS AC030 = Approved but not Accepted (not tracked, always 0)
 *   NMLS AC065 = Net Changes in Dollar Amount (calculated plug)
 *   NMLS AC063 = Net Changes in # of Applications (calculated plug)
 */
const ExcelJS = require('exceljs');


// ─────────────────────────────────────────────────────
// NMLS HELPERS & CONSTANTS
// ─────────────────────────────────────────────────────

/** Safe numeric value */
function v(val) { return Number(val) || 0; }

/** XML-escape a string */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Map period enum → NMLS periodType attribute */
function getPeriodType(period) {
  const map = { Q1: 'MCRQ1', Q2: 'MCRQ2', Q3: 'MCRQ3', Q4: 'MCRQ4', Annual: 'MCRA' };
  return map[period] || period;
}

/**
 * Map our INTERNAL application pipeline data → NMLS AC codes.
 *
 *   Internal → NMLS
 *   AC010 → AC010  (Beginning Pipeline)
 *   AC020 → AC020  (Applications Received)
 *   ---   → AC030  (Approved but not Accepted — 0)
 *   AC030 → AC040  (Denied)
 *   AC040 → AC050  (Withdrawn)
 *   AC060 → AC060  (Closed Incomplete)
 *   calc  → AC065  (Net Dollar Amount Changes — plug)
 *   calc  → AC063  (Net Application Count Changes — plug)
 *   AC050 → AC070  (Loans Closed & Funded)
 *   AC090 → AC080  (Ending Pipeline)
 */
function mapAppPipeline(appData) {
  const d = appData || {};
  const nmls = {
    AC010: { amount: v(d.AC010?.amount), count: v(d.AC010?.count) },
    AC020: { amount: v(d.AC020?.amount), count: v(d.AC020?.count) },
    AC030: { amount: 0, count: 0 },                                      // Not tracked
    AC040: { amount: v(d.AC030?.amount), count: v(d.AC030?.count) },     // Our Denied → NMLS AC040
    AC050: { amount: v(d.AC040?.amount), count: v(d.AC040?.count) },     // Our Withdrawn → NMLS AC050
    AC060: { amount: v(d.AC060?.amount), count: v(d.AC060?.count) },
    AC070: { amount: v(d.AC050?.amount), count: v(d.AC050?.count) },     // Our Funded → NMLS AC070
    AC080: { amount: v(d.AC090?.amount), count: v(d.AC090?.count) },     // Our End Pipeline → NMLS AC080
  };

  // Pipeline balance: AC080 = AC010 + AC020 - AC030 - AC040 - AC050 - AC060 + AC065 + AC063 - AC070
  // Calculate plugs so the equation balances.
  const amtSum = nmls.AC010.amount + nmls.AC020.amount
    - nmls.AC030.amount - nmls.AC040.amount - nmls.AC050.amount
    - nmls.AC060.amount - nmls.AC070.amount;
  const cntSum = nmls.AC010.count + nmls.AC020.count
    - nmls.AC030.count - nmls.AC040.count - nmls.AC050.count
    - nmls.AC060.count - nmls.AC070.count;

  // AC065: net dollar amount change (only _1 and _3 in NMLS)
  nmls.AC065 = { amount: nmls.AC080.amount - amtSum };
  // AC063: net application count changes (_1 through _4)
  nmls.AC063 = { amount: 0, count: nmls.AC080.count - cntSum };

  return nmls;
}

/**
 * Get per-state sections from the report.
 * Returns [{ stateCode, data }].
 */
function getStateSections(report, stateFilter) {
  if (stateFilter && stateFilter !== 'all') {
    const stateData = report.perStateData instanceof Map
      ? report.perStateData.get(stateFilter)
      : report.perStateData?.[stateFilter];
    return [{ stateCode: stateFilter, data: stateData || {} }];
  }

  const sections = [];
  const statesList = report.states || [];
  for (const st of statesList) {
    const stateData = report.perStateData instanceof Map
      ? report.perStateData.get(st)
      : report.perStateData?.[st];
    sections.push({ stateCode: st, data: stateData || {} });
  }

  // Fallback: export aggregate if no per-state data
  if (sections.length === 0) {
    sections.push({
      stateCode: (statesList[0]) || 'ALL',
      data: {
        applicationData: report.applicationData,
        closedLoanData: report.closedLoanData,
        revenueData: report.revenueData,
        mloData: report.mloData,
        rmlaData: report.rmlaData,
      }
    });
  }
  return sections;
}

/**
 * Resolve filtered data for a single-state or aggregate view (used by Excel).
 */
function getFilteredReportData(report, stateFilter) {
  if (stateFilter && stateFilter !== 'all' && report.perStateData) {
    const stateData = report.perStateData instanceof Map
      ? report.perStateData.get(stateFilter)
      : report.perStateData[stateFilter];
    return stateData || {};
  }
  return {
    applicationData: report.applicationData,
    closedLoanData: report.closedLoanData,
    revenueData: report.revenueData,
    mloData: report.mloData,
    rmlaData: report.rmlaData,
  };
}

/**
 * Map RMLA sub-object keys → NMLS Section II I-codes.
 * Convention: _1 = dollar amount, _2 = loan count.
 */
function mapRMLAToICodes(rmla) {
  const r = rmla || {};
  const pt = r.productType || {};
  const ch = r.channel || {};
  const rc = r.riskCharacteristics || {};
  const purpose = r.purpose || {};

  // Total from all product types for I460
  let totalAmt = 0, totalCnt = 0;
  for (const val of Object.values(pt)) {
    totalAmt += v(val?.amount);
    totalCnt += v(val?.count);
  }

  const z = { amount: 0, count: 0 };

  return {
    // Product Type (I010-I080)
    I010: pt.governmentFixed || z,   I020: pt.governmentARM || z,
    I030: pt.conventionalFixed || z, I040: pt.conventionalARM || z,
    I050: pt.jumboFixed || z,        I060: pt.jumboARM || z,
    I070: pt.otherFixed || z,        I080: pt.otherARM || z,
    // Government subtypes — not tracked separately
    I110: z, I120: z, I130: z, I140: z, I170: z,
    // Channel
    I210: ch.brokered || z, I220: ch.closedRetail || z, I230: ch.closedCorrespondent || z,
    // LTV Ranges (not broken out in NMLS I-codes by us)
    I250: z, I251: z,
    // Credit Score / Documentation
    I260: z, I261: z,
    I270: rc.altDoc || z, I271: z,
    I280: rc.interestOnly || z, I281: z,
    I290: rc.optionARM || z, I291: z,
    I300: rc.prepaymentPenalty || z, I301: z,
    // Rate Lock
    I310: z, I311: z, I312: z, I313: z, I314: z,
    // Insurance / Piggyback
    I330: rc.mortgageInsurance || z, I331: z,
    I340: rc.piggybackSecond || z, I341: z,
    // Reverse mortgage (not tracked)
    I370: z, I371: z, I372: z, I373: z, I374: z, I375: z,
    // Purpose
    I400: purpose.purchase || z, I401: purpose.refinance || z,
    I402: z, I404: z, I405: z,
    // Additional
    I410: z, I421: z,
    // Total residential mortgage activity
    I460: { amount: totalAmt, count: totalCnt },
  };
}


// ═════════════════════════════════════════════════════
// XML EXPORT — NMLS Format v6
// ═════════════════════════════════════════════════════

/**
 * Generate NMLS-compliant XML for direct upload.
 *
 * @param {Object} report   - MCRReport document
 * @param {Object} [fcData] - FinancialCondition (not included in NMLS XML)
 * @param {String} [stateFilter] - 'all' or a specific state code
 * @param {Object} [companyInfo] - { nmlsId, name } (unused in NMLS XML format)
 * @returns {String} XML string ready for NMLS upload
 */
exports.generateXML = (report, fcData = null, stateFilter = 'all', companyInfo = {}) => {
  const sections = getStateSections(report, stateFilter);

  let xml = '<?xml version="1.0"?>\n';
  xml += `<Mcr type="E" year="${report.year}" formVersion="v6" periodType="${getPeriodType(report.period)}">\n`;

  for (const { stateCode, data } of sections) {
    xml += buildRmlaXML(stateCode, data);
  }

  xml += '</Mcr>\n';
  return xml;
};

/**
 * Build one <Rmla stateCode="XX"> section.
 */
function buildRmlaXML(stateCode, stateData) {
  let xml = `  <Rmla stateCode="${escapeXml(stateCode)}">\n`;

  // Section I
  xml += '    <SectionISection>\n';
  xml += buildSectionIXML(stateData);
  xml += '    </SectionISection>\n';

  // MLO List
  xml += '    <ListSectionOfSectionIMlosItem>\n';
  xml += buildMLOSectionXML(stateData.mloData);
  xml += '    </ListSectionOfSectionIMlosItem>\n';

  // Section II
  xml += '    <SectionIISection>\n';
  xml += buildSectionIIXML(stateData.rmlaData);
  xml += '    </SectionIISection>\n';

  xml += '  </Rmla>\n';
  return xml;
}

/**
 * Section I — Application Pipeline + Closed Loan Data + Revenue.
 * Flat AC-code elements with _1/_2/_3/_4 (or _6) suffixes.
 */
function buildSectionIXML(stateData) {
  const app = mapAppPipeline(stateData.applicationData);
  const cl = stateData.closedLoanData || {};
  const rev = stateData.revenueData || {};
  let xml = '';

  // ─── Application Pipeline (AC010–AC060): 4 columns ───
  const pipelineCodes = ['AC010', 'AC020', 'AC030', 'AC040', 'AC050', 'AC060'];
  for (const code of pipelineCodes) {
    const d = app[code] || {};
    xml += `      <${code}_1>${v(d.amount)}</${code}_1>\n`;
    xml += `      <${code}_2>${v(d.count)}</${code}_2>\n`;
    xml += `      <${code}_3>0</${code}_3>\n`;
    xml += `      <${code}_4>0</${code}_4>\n`;
  }

  // AC065 — Net Dollar Changes (only _1 and _3)
  xml += `      <AC065_1>${v(app.AC065?.amount)}</AC065_1>\n`;
  xml += `      <AC065_3>0</AC065_3>\n`;

  // AC063 — Net Application Changes (_1 through _4)
  xml += `      <AC063_1>${v(app.AC063?.amount)}</AC063_1>\n`;
  xml += `      <AC063_2>${v(app.AC063?.count)}</AC063_2>\n`;
  xml += `      <AC063_3>0</AC063_3>\n`;
  xml += `      <AC063_4>0</AC063_4>\n`;

  // AC070, AC080 — 4 columns
  for (const code of ['AC070', 'AC080']) {
    const d = app[code] || {};
    xml += `      <${code}_1>${v(d.amount)}</${code}_1>\n`;
    xml += `      <${code}_2>${v(d.count)}</${code}_2>\n`;
    xml += `      <${code}_3>0</${code}_3>\n`;
    xml += `      <${code}_4>0</${code}_4>\n`;
  }

  // ─── Closed Loan Data — 6 columns each ───
  const closedCodes = [
    'AC100', 'AC110', 'AC120', 'AC130',   // Loan type
    'AC200', 'AC210',                       // Property type
    'AC300', 'AC310', 'AC320',              // Occupancy
    'AC400',                                 // HOEPA
    'AC500', 'AC510', 'AC520',              // Lien position
  ];
  for (const code of closedCodes) {
    const item = cl[code] || {};
    xml += `      <${code}_1>${v(item.amount)}</${code}_1>\n`;
    xml += `      <${code}_2>${v(item.count)}</${code}_2>\n`;
    xml += `      <${code}_3>0</${code}_3>\n`;
    xml += `      <${code}_4>0</${code}_4>\n`;
    xml += `      <${code}_5>0</${code}_5>\n`;
    xml += `      <${code}_6>0</${code}_6>\n`;
  }

  // ─── Revenue ───
  xml += `      <AC600_1>${v(rev.AC1100?.amount)}</AC600_1>\n`;
  xml += `      <AC610_3>0</AC610_3>\n`;
  xml += `      <AC610_5>0</AC610_5>\n`;

  // ─── Government / Conventional Breakdowns (AC700–AC810) — 6 columns, all 0 ───
  for (const code of ['AC700', 'AC710', 'AC720', 'AC800', 'AC810']) {
    for (let s = 1; s <= 6; s++) {
      xml += `      <${code}_${s}>0</${code}_${s}>\n`;
    }
  }

  // ─── More Revenue ───
  xml += `      <AC620_1>0</AC620_1>\n`;
  xml += `      <AC630_3>0</AC630_3>\n`;
  xml += `      <AC630_5>0</AC630_5>\n`;

  // ─── QM Status (AC920–AC940) — 6 columns ───
  for (const code of ['AC920', 'AC930', 'AC940']) {
    const item = cl[code] || {};
    xml += `      <${code}_1>${v(item.amount)}</${code}_1>\n`;
    xml += `      <${code}_2>${v(item.count)}</${code}_2>\n`;
    xml += `      <${code}_3>0</${code}_3>\n`;
    xml += `      <${code}_4>0</${code}_4>\n`;
    xml += `      <${code}_5>0</${code}_5>\n`;
    xml += `      <${code}_6>0</${code}_6>\n`;
  }

  // ─── Servicer / Revenue Totals ───
  xml += `      <AC1000_1>0</AC1000_1>\n`;
  xml += `      <AC1000_2>0</AC1000_2>\n`;
  xml += `      <AC1100_1>${v(rev.AC1100?.amount)}</AC1100_1>\n`;
  xml += `      <AC1200_1>${v(rev.AC1200?.amount)}</AC1200_1>\n`;
  xml += `      <AC1200_2>${v(rev.AC1200?.count)}</AC1200_2>\n`;
  xml += `      <AC1210_1>${v(rev.AC1210?.amount)}</AC1210_1>\n`;
  xml += `      <AC1210_2>${v(rev.AC1210?.count)}</AC1210_2>\n`;

  return xml;
}

/**
 * MLO section — NMLS format: ACMLO (ID), ACMLO_2 (amount), ACMLO_3 (count).
 */
function buildMLOSectionXML(mloData) {
  const officers = mloData?.loanOfficers || (Array.isArray(mloData) ? mloData : []);

  if (officers.length === 0) {
    return '      <DetailItemList/>\n';
  }

  let xml = '      <DetailItemList>\n';
  for (const mlo of officers) {
    const nmlsId = mlo.nmlsId || '';
    const amount = v(mlo.totalAmount || mlo.amount);
    const count = v(mlo.loanCount || mlo.count);
    xml += '        <SectionIMlosItem>\n';
    xml += `          <ACMLO>${escapeXml(String(nmlsId))}</ACMLO>\n`;
    xml += `          <ACMLO_2>${amount}</ACMLO_2>\n`;
    xml += `          <ACMLO_3>${count}</ACMLO_3>\n`;
    xml += '        </SectionIMlosItem>\n';
  }
  xml += '      </DetailItemList>\n';
  return xml;
}

/**
 * Section II — RMLA I-codes.
 * Standard: _1 (amount) and _2 (count).
 * Exceptions: I380/I385/I390 only _2; I430/I450 only _3.
 */
function buildSectionIIXML(rmlaData) {
  const ic = mapRMLAToICodes(rmlaData);
  let xml = '';

  // Standard _1/_2 I-codes
  const standardCodes = [
    'I010', 'I020', 'I030', 'I040', 'I050', 'I060', 'I070', 'I080',
    'I110', 'I120', 'I130', 'I140', 'I170',
    'I210', 'I220', 'I230',
    'I250', 'I251',
    'I260', 'I261', 'I270', 'I271', 'I280', 'I281', 'I290', 'I291',
    'I300', 'I301',
    'I310', 'I311', 'I312', 'I313', 'I314',
    'I330', 'I331', 'I340', 'I341',
    'I370', 'I371', 'I372', 'I373', 'I374', 'I375',
  ];
  for (const code of standardCodes) {
    const item = ic[code] || {};
    xml += `      <${code}_1>${v(item.amount)}</${code}_1>\n`;
    xml += `      <${code}_2>${v(item.count)}</${code}_2>\n`;
  }

  // Special: only _2 suffix
  xml += `      <I380_2>0</I380_2>\n`;
  xml += `      <I385_2>0</I385_2>\n`;
  xml += `      <I390_2>0</I390_2>\n`;

  // More standard _1/_2 codes
  const moreCodes = ['I400', 'I401', 'I402', 'I404', 'I405', 'I410', 'I421'];
  for (const code of moreCodes) {
    const item = ic[code] || {};
    xml += `      <${code}_1>${v(item.amount)}</${code}_1>\n`;
    xml += `      <${code}_2>${v(item.count)}</${code}_2>\n`;
  }

  // Special: only _3 suffix
  xml += `      <I430_3>0</I430_3>\n`;
  xml += `      <I450_3>0</I450_3>\n`;

  // I460 — Total
  const i460 = ic.I460 || {};
  xml += `      <I460_1>${v(i460.amount)}</I460_1>\n`;
  xml += `      <I460_2>${v(i460.count)}</I460_2>\n`;

  return xml;
}


// ═════════════════════════════════════════════════════
// EXCEL EXPORT — NMLS Format
// ═════════════════════════════════════════════════════

/**
 * Generate an NMLS-formatted Excel workbook.
 *
 * @param {Object} report   - MCRReport document
 * @param {Object} [fcData] - FinancialCondition data (optional supplementary sheet)
 * @param {String} [stateFilter] - 'all' or specific state code
 * @returns {Buffer} Excel file buffer
 */
exports.generateExcel = async (report, fcData = null, stateFilter = 'all') => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'LoanApp360';
  workbook.created = new Date();
  workbook.properties.date1904 = false;

  const data = getFilteredReportData(report, stateFilter);

  // Sheet 1: Application Pipeline
  buildApplicationSheet(workbook, data.applicationData || {});

  // Sheet 2: Closed Loan Data
  buildClosedLoanSheet(workbook, data.closedLoanData || {});

  // Sheet 3: Revenue
  buildRevenueSheet(workbook, data.revenueData || {});

  // Sheet 4: MLO Data
  buildMLOSheet(workbook, data.mloData || []);

  // Sheet 5: Section II (RMLA)
  buildRMLASheet(workbook, data.rmlaData || {});

  // Sheet 6: Financial Condition (supplementary)
  if (fcData) {
    buildFinancialConditionSheet(workbook, fcData);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};


// ── Excel Styling Helpers ─────────────────────────────

function styleSheet(ws) {
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
  ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 24;
}

function addSectionHeader(ws, title) {
  ws.addRow([]);
  const headerRow = ws.addRow([title]);
  headerRow.getCell(1).font = { bold: true, size: 11 };
  headerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
}


// ── Sheet 1: Application Pipeline (NMLS AC010–AC080) ──

function buildApplicationSheet(wb, appData) {
  const ws = wb.addWorksheet('Section I - Pipeline');
  ws.columns = [
    { header: 'NMLS Code', key: 'code', width: 14 },
    { header: 'Description', key: 'desc', width: 50 },
    { header: 'Direct Amount ($)', key: 'dirAmt', width: 20 },
    { header: 'Direct Count', key: 'dirCnt', width: 14 },
    { header: '3rd Party Amount ($)', key: 'tpAmt', width: 20 },
    { header: '3rd Party Count', key: 'tpCnt', width: 16 },
  ];
  styleSheet(ws);

  const app = mapAppPipeline(appData);

  const rows = [
    ['AC010', 'Applications in Process at Beginning of the Period', app.AC010],
    ['AC020', 'Applications Received During the Period', app.AC020],
    ['AC030', 'Applications Approved but Not Accepted', app.AC030],
    ['AC040', 'Applications Denied', app.AC040],
    ['AC050', 'Applications Withdrawn', app.AC050],
    ['AC060', 'Files Closed for Incompleteness', app.AC060],
    ['AC065', 'Net Changes in Dollar Amount of Pipeline', app.AC065],
    ['AC063', 'Net Changes in Number of Applications in Pipeline', app.AC063],
    ['AC070', 'Loans Closed and Funded', app.AC070],
    ['AC080', 'Applications in Process at End of the Period', app.AC080],
  ];

  for (const [code, desc, data] of rows) {
    const row = ws.addRow({
      code, desc,
      dirAmt: v(data?.amount), dirCnt: v(data?.count),
      tpAmt: 0, tpCnt: 0,
    });
    row.getCell('dirAmt').numFmt = '#,##0';
    row.getCell('tpAmt').numFmt = '#,##0';
  }

  // Pipeline balance check
  ws.addRow([]);
  const balAmt = app.AC010.amount + app.AC020.amount
    - app.AC030.amount - app.AC040.amount - app.AC050.amount - app.AC060.amount
    + v(app.AC065?.amount) + v(app.AC063?.amount) - app.AC070.amount - app.AC080.amount;
  const balCnt = app.AC010.count + app.AC020.count
    - app.AC030.count - app.AC040.count - app.AC050.count - app.AC060.count
    + v(app.AC063?.count) - app.AC070.count - app.AC080.count;
  const checkRow = ws.addRow({ code: 'CHECK', desc: 'Pipeline Balance (should be 0)', dirAmt: balAmt, dirCnt: balCnt, tpAmt: '', tpCnt: '' });
  if (balAmt !== 0 || balCnt !== 0) {
    checkRow.getCell('dirAmt').font = { bold: true, color: { argb: 'FFDC2626' } };
    checkRow.getCell('dirCnt').font = { bold: true, color: { argb: 'FFDC2626' } };
  }
}


// ── Sheet 2: Closed Loan Data (NMLS AC100+) ──

function buildClosedLoanSheet(wb, closedData) {
  const ws = wb.addWorksheet('Section I - Closed Loans');
  ws.columns = [
    { header: 'NMLS Code', key: 'code', width: 14 },
    { header: 'Description', key: 'desc', width: 44 },
    { header: 'Direct Amt ($)', key: 'dirAmt', width: 18 },
    { header: 'Direct Count', key: 'dirCnt', width: 14 },
    { header: '3rd Party Amt ($)', key: 'tpAmt', width: 18 },
    { header: '3rd Party Count', key: 'tpCnt', width: 16 },
    { header: 'Corresp. Amt ($)', key: 'corrAmt', width: 18 },
    { header: 'Corresp. Count', key: 'corrCnt', width: 16 },
  ];
  styleSheet(ws);

  const cl = closedData || {};

  function add6(code, desc) {
    const item = cl[code] || {};
    const row = ws.addRow({
      code, desc,
      dirAmt: v(item.amount), dirCnt: v(item.count),
      tpAmt: 0, tpCnt: 0, corrAmt: 0, corrCnt: 0,
    });
    row.getCell('dirAmt').numFmt = '#,##0';
    row.getCell('tpAmt').numFmt = '#,##0';
    row.getCell('corrAmt').numFmt = '#,##0';
  }

  add6('AC100', 'Total Closed Loans');

  addSectionHeader(ws, 'By Loan Type');
  add6('AC110', 'Purchase');
  add6('AC120', 'Refinance');
  add6('AC130', 'Cash-Out Refinance');

  addSectionHeader(ws, 'By Property Type');
  add6('AC200', 'Single Family (1 Unit)');
  add6('AC210', 'Condo / Co-op');

  addSectionHeader(ws, 'By Occupancy');
  add6('AC300', 'Primary / Owner Occupied');
  add6('AC310', 'Second / Vacation Home');
  add6('AC320', 'Investment Property');

  addSectionHeader(ws, 'HOEPA');
  add6('AC400', 'HOEPA Loans');

  addSectionHeader(ws, 'By Lien Position');
  add6('AC500', '1st Lien Position');
  add6('AC510', '2nd Lien Position');
  add6('AC520', 'Not Secured by a Lien on Real Property');

  addSectionHeader(ws, 'Government / Conventional Breakdown');
  add6('AC700', 'Government Insured/Guaranteed - FHA');
  add6('AC710', 'Government Insured/Guaranteed - VA');
  add6('AC720', 'Government Insured/Guaranteed - Other');
  add6('AC800', 'Conventional Conforming');
  add6('AC810', 'Jumbo');

  addSectionHeader(ws, 'QM Status');
  add6('AC920', 'QM - Safe Harbor');
  add6('AC930', 'QM - Rebuttable Presumption');
  add6('AC940', 'Non-QM / Non-Qualifying');
}


// ── Sheet 3: Revenue (NMLS AC600, AC1100, AC1200, AC1210) ──

function buildRevenueSheet(wb, revData) {
  const ws = wb.addWorksheet('Section I - Revenue');
  ws.columns = [
    { header: 'NMLS Code', key: 'code', width: 14 },
    { header: 'Description', key: 'desc', width: 44 },
    { header: 'Amount ($)', key: 'amount', width: 20 },
    { header: 'Count', key: 'count', width: 14 },
  ];
  styleSheet(ws);

  const r = revData || {};

  function addRevRow(code, desc, amount, count) {
    const row = ws.addRow({ code, desc, amount: v(amount), count: count !== undefined ? v(count) : '' });
    row.getCell('amount').numFmt = '#,##0';
  }

  addSectionHeader(ws, 'Revenue Detail');
  addRevRow('', r.AC1010?.label || 'Origination Fees', r.AC1010?.amount);
  addRevRow('', r.AC1020?.label || 'Service Release Premiums (SRP)', r.AC1020?.amount);
  addRevRow('', r.AC1030?.label || 'Yield Spread Premiums (YSP)', r.AC1030?.amount);
  addRevRow('', r.AC1040?.label || 'Discount Points', r.AC1040?.amount);
  addRevRow('', r.AC1050?.label || 'Broker Compensation', r.AC1050?.amount);
  addRevRow('', r.AC1060?.label || 'Processing Fees', r.AC1060?.amount);
  addRevRow('', r.AC1070?.label || 'Pass-Through Fees', r.AC1070?.amount);
  addRevRow('', r.AC1080?.label || 'Broker Flat Fees', r.AC1080?.amount);
  addRevRow('', r.AC1090?.label || 'Lender Fees Collected', r.AC1090?.amount);

  addSectionHeader(ws, 'NMLS Revenue Summary');
  addRevRow('AC600', 'Total Gross Revenue — Directly Originated', r.AC1100?.amount);
  addRevRow('AC610', 'Revenue from Third Party Originators', 0);
  addRevRow('AC620', 'Revenue from Affiliates (Direct)', 0);
  addRevRow('AC630', 'Revenue from Affiliates (Third Party)', 0);

  addSectionHeader(ws, 'NMLS Totals');
  const totalRow1 = ws.addRow({ code: 'AC1100', desc: 'Total Gross Revenue', amount: v(r.AC1100?.amount), count: '' });
  totalRow1.font = { bold: true };
  totalRow1.getCell('amount').numFmt = '#,##0';

  addSectionHeader(ws, 'Servicing Disposition');
  addRevRow('AC1200', r.AC1200?.label || 'Servicing Released', r.AC1200?.amount, r.AC1200?.count);
  addRevRow('AC1210', r.AC1210?.label || 'Servicing Retained', r.AC1210?.amount, r.AC1210?.count);
}


// ── Sheet 4: MLO Data (NMLS ACMLO format) ──

function buildMLOSheet(wb, mloData) {
  const ws = wb.addWorksheet('Section I - MLOs');
  ws.columns = [
    { header: 'MLO NMLS ID (ACMLO)', key: 'nmlsId', width: 22 },
    { header: 'MLO Name', key: 'name', width: 28 },
    { header: 'Funded Amount ($) (ACMLO_2)', key: 'amount', width: 26 },
    { header: 'Funded Count (ACMLO_3)', key: 'count', width: 22 },
  ];
  styleSheet(ws);

  const officers = mloData?.loanOfficers || (Array.isArray(mloData) ? mloData : []);
  for (const mlo of officers) {
    const row = ws.addRow({
      nmlsId: mlo.nmlsId || '',
      name: mlo.firstName ? `${mlo.firstName} ${mlo.lastName || ''}`.trim() : (mlo.name || 'Unknown'),
      amount: v(mlo.totalAmount || mlo.amount),
      count: v(mlo.loanCount || mlo.count),
    });
    row.getCell('amount').numFmt = '#,##0';
  }

  if (officers.length > 0) {
    ws.addRow({});
    const totalCount = officers.reduce((s, m) => s + v(m.loanCount || m.count), 0);
    const totalAmount = officers.reduce((s, m) => s + v(m.totalAmount || m.amount), 0);
    const totalRow = ws.addRow({ nmlsId: 'TOTAL', name: '', amount: totalAmount, count: totalCount });
    totalRow.font = { bold: true };
    totalRow.getCell('amount').numFmt = '#,##0';
  }
}


// ── Sheet 5: Section II — RMLA (NMLS I-codes) ──

function buildRMLASheet(wb, rmlaData) {
  const ws = wb.addWorksheet('Section II - RMLA');
  ws.columns = [
    { header: 'NMLS Code', key: 'code', width: 14 },
    { header: 'Description', key: 'desc', width: 50 },
    { header: 'Amount ($)', key: 'amount', width: 20 },
    { header: 'Count', key: 'count', width: 14 },
  ];
  styleSheet(ws);

  const r = rmlaData || {};
  const pt = r.productType || {};
  const ch = r.channel || {};
  const rc = r.riskCharacteristics || {};
  const purpose = r.purpose || {};

  function addIRow(code, desc, data) {
    const row = ws.addRow({ code, desc, amount: v(data?.amount), count: v(data?.count) });
    row.getCell('amount').numFmt = '#,##0';
  }

  addSectionHeader(ws, 'Product Type');
  addIRow('I010', 'Government Fixed', pt.governmentFixed);
  addIRow('I020', 'Government ARM', pt.governmentARM);
  addIRow('I030', 'Conventional Fixed', pt.conventionalFixed);
  addIRow('I040', 'Conventional ARM', pt.conventionalARM);
  addIRow('I050', 'Jumbo Fixed', pt.jumboFixed);
  addIRow('I060', 'Jumbo ARM', pt.jumboARM);
  addIRow('I070', 'Other Fixed', pt.otherFixed);
  addIRow('I080', 'Other ARM', pt.otherARM);

  addSectionHeader(ws, 'Channel');
  addIRow('I210', 'Brokered (Table-Funded or Non Table-Funded)', ch.brokered);
  addIRow('I220', 'Retail (Directly Funded)', ch.closedRetail);
  addIRow('I230', 'Correspondent', ch.closedCorrespondent);

  addSectionHeader(ws, 'Risk Characteristics');
  addIRow('I270', 'Alternative / Reduced Documentation', rc.altDoc);
  addIRow('I280', 'Interest Only', rc.interestOnly);
  addIRow('I290', 'Negative Amortization / Option ARM', rc.optionARM);
  addIRow('I300', 'Prepayment Penalty', rc.prepaymentPenalty);
  addIRow('I330', 'Mortgage Insurance', rc.mortgageInsurance);
  addIRow('I340', 'Simultaneous 2nd / Piggyback', rc.piggybackSecond);

  addSectionHeader(ws, 'Loan Purpose');
  addIRow('I400', 'Purchase', purpose.purchase);
  addIRow('I401', 'Refinance', purpose.refinance);

  // Weighted Averages
  const wa = r.weightedAverages || {};
  addSectionHeader(ws, 'Weighted Averages');
  ws.addRow({ code: '', desc: 'Weighted Avg LTV (%)', amount: wa.ltv || 0, count: '' });
  ws.addRow({ code: '', desc: 'Weighted Avg Coupon Rate (%)', amount: wa.couponRate || 0, count: '' });
  ws.addRow({ code: '', desc: 'Avg Warehouse Period (days)', amount: wa.warehousePeriod || 0, count: '' });

  // Pull-Through
  const pull = r.pullThrough || {};
  addSectionHeader(ws, 'Pull-Through');
  ws.addRow({ code: '', desc: 'Applications Received', amount: '', count: v(pull.appsReceived) });
  ws.addRow({ code: '', desc: 'Loans Funded', amount: '', count: v(pull.loansFunded) });
  ws.addRow({ code: '', desc: 'Pull-Through Ratio (%)', amount: pull.ratio || 0, count: '' });

  // Total (I460)
  let totalAmt = 0, totalCnt = 0;
  for (const val of Object.values(pt)) {
    totalAmt += v(val?.amount);
    totalCnt += v(val?.count);
  }
  addSectionHeader(ws, 'Total');
  addIRow('I460', 'Total Residential Mortgage Loan Activity', { amount: totalAmt, count: totalCnt });
}


// ── Sheet 6: Financial Condition (supplementary, not NMLS upload) ──

function buildFinancialConditionSheet(wb, fc) {
  const ws = wb.addWorksheet('Financial Condition');
  ws.columns = [
    { header: 'Line Item', key: 'lineItem', width: 14 },
    { header: 'Description', key: 'desc', width: 42 },
    { header: 'Amount ($)', key: 'amount', width: 20 },
  ];
  styleSheet(ws);

  function addFCRow(lineItem, desc, amount) {
    const row = ws.addRow({ lineItem, desc, amount: amount || 0 });
    row.getCell('amount').numFmt = '#,##0.00';
  }

  // Schedule A — Assets
  addSectionHeader(ws, 'Schedule A — Assets');
  const a = fc.scheduleA || {};
  addFCRow('A010', 'Cash & Cash Equivalents', a.cashAndEquivalents);
  addFCRow('A020', 'Accounts Receivable', a.accountsReceivable);
  addFCRow('A030', 'MBS: Held to Maturity', a.mortgageSecurities?.heldToMaturity);
  addFCRow('A040', 'MBS: Available for Sale', a.mortgageSecurities?.availableForSale);
  addFCRow('A050', 'MBS: Trading Securities', a.mortgageSecurities?.tradingSecurities);
  addFCRow('A055', 'Total MBS', a.mortgageSecurities?.total);
  addFCRow('A060', 'HFS at Cost', a.mortgageLoans?.hfsAtCost);
  addFCRow('A070', 'HFS at Fair Value', a.mortgageLoans?.hfsAtFairValue);
  addFCRow('A080', 'HFI at Cost', a.mortgageLoans?.hfiAtCost);
  addFCRow('A085', 'HFI at Fair Value', a.mortgageLoans?.hfiAtFairValue);
  addFCRow('A086', 'Allowance for Loan Loss', a.mortgageLoans?.allowanceForLoanLoss);
  addFCRow('A087', 'Total Mortgage Loans', a.mortgageLoans?.total);
  addFCRow('A090', 'Other Real Estate Owned', a.otherRealEstateOwned);
  addFCRow('A120', 'MSR Amortized', a.msrAmortized);
  addFCRow('A130', 'MSR Fair Value', a.msrFairValue);
  addFCRow('A160', 'Total MSR', a.totalMSR);
  addFCRow('A220', 'Derivative Assets', a.derivativeAssets);
  addFCRow('A230', 'Other Assets', a.otherAssets);
  addFCRow('A280', 'Investments in Subsidiaries', a.investmentsInSubs);
  addFCRow('A290', 'Total Assets', a.totalAssets);

  // Schedule B — Liabilities & Equity
  addSectionHeader(ws, 'Schedule B — Liabilities & Equity');
  const b = fc.scheduleB || {};
  addFCRow('B010', 'Warehouse Lines', b.warehouseLines);
  addFCRow('B015', 'Other Short-Term Debt', b.otherShortTermDebt);
  addFCRow('B016', 'Accounts Payable', b.accountsPayable);
  addFCRow('B217', 'Total Short-Term Liabilities', b.totalShortTermLiabilities);
  addFCRow('B020', 'Notes Payable', b.notesPayable);
  addFCRow('B030', 'Capital Leases', b.capitalLeases);
  addFCRow('B050', 'Deferred Revenue', b.deferredRevenue);
  addFCRow('B160', 'Guaranty Liabilities', b.guarantyLiabilities);
  addFCRow('B180', 'Derivative Liabilities', b.derivativeLiabilities);
  addFCRow('B190', 'Taxes Payable', b.taxesPayable);
  addFCRow('B200', 'Deferred Tax Liability', b.deferredTaxLiability);
  addFCRow('B210', 'Repurchase Reserves', b.repurchaseReserves);
  addFCRow('B219', 'Total Long-Term Liabilities', b.totalLongTermLiabilities);
  addFCRow('B220', 'Total Liabilities', b.totalLiabilities);
  addFCRow('B240', 'Subordinated Debt', b.subordinatedDebt);
  addFCRow('B250', 'Preferred Stock', b.preferredStock);
  addFCRow('B260', 'Common Stock', b.commonStock);
  addFCRow('B270', 'Additional Paid-in Capital', b.additionalPaidInCapital);
  addFCRow('B280', 'Retained Earnings', b.retainedEarnings);
  addFCRow('B290', 'Treasury Stock', b.treasuryStock);
  addFCRow('B300', 'Other Comprehensive Income', b.otherComprehensiveIncome);
  addFCRow('B310', 'Noncontrolling Interest', b.noncontrollingInterest);
  addFCRow('B350', 'Total Equity', b.totalEquity);
  addFCRow('B360', 'Total Liabilities & Equity', b.totalLiabilitiesAndEquity);

  // Equity Rollforward
  addSectionHeader(ws, 'Equity Rollforward');
  const er = fc.equityRollforward || {};
  addFCRow('B350A', 'Beginning Balance', er.beginningBalance);
  addFCRow('B350B', 'Net Income', er.netIncome);
  addFCRow('B350C', 'New Stock Issuance', er.newStockIssuance);
  addFCRow('B350D', 'Stock Repurchases', er.stockRepurchases);
  addFCRow('B350E', 'Other Capital Contributions', er.otherCapitalContributions);
  addFCRow('B350F', 'OCI: Unrealized Gains AFS', er.ociUnrealizedGainsAFS);
  addFCRow('B350G', 'OCI: Unrealized Derivatives', er.ociUnrealizedGainsDerivatives);
  addFCRow('B350H', 'OCI: Other', er.ociOther);
  addFCRow('B350L', 'Dividends/Distributions', er.dividendsDistributions);
  addFCRow('B350N', 'Equity Adjustments', er.equityAdjustments);
  addFCRow('B350T', 'Ending Balance', er.endingBalance);

  // Schedule C — Income
  addSectionHeader(ws, 'Schedule C — Income');
  const c = fc.scheduleC || {};
  addFCRow('C090', 'Total Interest Income', c.totalInterestIncome);
  addFCRow('C260', 'Total Origination Income', c.totalOriginationIncome);
  addFCRow('C450', 'Net Secondary Marketing Income', c.netSecondaryMarketingIncome);
  addFCRow('C650', 'Total Servicing Income', c.totalServicingIncome);
  addFCRow('C780', 'Total Other Non-Interest Income', c.totalOtherNonInterestIncome);
  addFCRow('C800', 'Total Gross Income', c.totalGrossIncome);
  addFCRow('C160', 'Total Interest Expense', c.totalInterestExpense);

  // Schedule CF — Cash Flow
  addSectionHeader(ws, 'Schedule CF — Cash Flow');
  const cf = fc.scheduleCF || {};
  addFCRow('CF010', 'Net Cash from Operating', cf.netCashFromOperating);
  addFCRow('CF020', 'Cash from Investing', cf.cashFromInvesting);
  addFCRow('CF030', 'Cash from Financing', cf.cashFromFinancing);
  addFCRow('CF040', 'Total Cash Change', cf.totalCashChange);

  // Schedule D — Non-Interest Expense
  addSectionHeader(ws, 'Schedule D — Non-Interest Expense');
  const d = fc.scheduleD || {};
  addFCRow('D070', 'Total Origination Comp', d.totalOriginationComp);
  addFCRow('D100', 'Total Servicing Comp', d.totalServicingComp);
  addFCRow('D310', 'Total Gross Expenses', d.totalGrossExpenses);
  addFCRow('D440', 'Total Corporate Admin', d.totalCorporateAdmin);
  addFCRow('D510', 'Pre-Tax Net Operating Income', d.preTaxNetOperatingIncome);
  addFCRow('D520', 'Income Taxes', d.incomeTaxes);
  addFCRow('D600', 'Net Income', d.netIncome);

  // Schedule O — Reserves
  addSectionHeader(ws, 'Schedule O — Reserves');
  const o = fc.scheduleO || {};
  addFCRow('O010', 'Credit Loss Beginning', o.creditLossBeginning);
  addFCRow('O020', 'Provision for Credit Losses', o.provisionForCreditLosses);
  addFCRow('O030', 'Charge-offs (Net)', o.chargeOffsNet);
  addFCRow('O060', 'Credit Loss Ending', o.creditLossEnding);
  addFCRow('O110', 'REO Beginning', o.reoBeginning);
  addFCRow('O120', 'REO Changes', o.reoChanges);
  addFCRow('O130', 'REO Ending', o.reoEnding);
  addFCRow('O310', 'Repurchase Beginning', o.repurchaseBeginning);
  addFCRow('O320', 'Provision for Repurchases', o.provisionForRepurchases);
  addFCRow('O330', 'Repurchase Charge-offs', o.repurchaseChargeOffs);
  addFCRow('O350', 'Repurchase Ending', o.repurchaseEnding);
}
