/**
 * Extract bankruptcy public record summary from SmartAPI raw MISMO XML.
 *
 * We rely on CREDIT_PUBLIC_RECORD_DETAIL blocks and look for CreditPublicRecordType containing "Bankruptcy".
 * The full raw XML is stored in CreditReport.smartApiData.rawResponse.
 */

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function parseIsoDate(value) {
  const s = String(value || '').trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatDateYYYYMMDD(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function yearsSince(date, asOf = new Date()) {
  const d = date instanceof Date ? date : parseIsoDate(date);
  if (!d) return null;
  const ms = asOf.getTime() - d.getTime();
  if (ms < 0) return 0;
  return ms / MS_PER_YEAR;
}

function extractTag(block, tagName) {
  const re = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i');
  const m = String(block || '').match(re);
  return m ? String(m[1]).trim() : '';
}

function normalizeBkStatus(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return '';
  if (s.includes('discharg')) return 'Discharged';
  if (s.includes('dismiss')) return 'Dismissed';
  if (s.includes('open')) return 'Open';
  if (s.includes('pend')) return 'Pending';
  return '';
}

function normalizeBkChapterFromType(rawType) {
  const t = String(rawType || '').toLowerCase();
  if (t.includes('chapter7') || t.includes('ch7') || t.includes('bankruptcychapter7')) return 'Chapter7';
  if (t.includes('chapter13') || t.includes('ch13') || t.includes('bankruptcychapter13')) return 'Chapter13';
  return '';
}

function extractPublicRecordDetailBlocks(rawXml) {
  const xml = String(rawXml || '');
  const re = new RegExp('<CREDIT_PUBLIC_RECORD_DETAIL>[\\s\\S]*?<\\/CREDIT_PUBLIC_RECORD_DETAIL>', 'g');
  return xml.match(re) || [];
}

/**
 * @param {string} rawXml
 * @param {{ asOf?: Date }} [options]
 * @returns {{
 *  found: boolean,
 *  bkCount: number,
 *  bkType: 'Chapter7'|'Chapter13'|null,
 *  bkStatus: 'Discharged'|'Dismissed'|'Open'|'Pending'|null,
 *  dischargeDate: string|null,
 *  matchedRecords: Array<{ type: string, status: string, dispositionDate: string, filedDate: string }>,
 * }}
 */
function extractBankruptcySummaryFromRawXml(rawXml, options = {}) {
  const asOf = options.asOf || new Date();
  const blocks = extractPublicRecordDetailBlocks(rawXml);
  if (blocks.length === 0) {
    return { found: false, bkCount: 0, bkType: null, bkStatus: null, dischargeDate: null, matchedRecords: [] };
  }

  const cutoff = new Date(asOf.getTime() - 7 * MS_PER_YEAR); // last 7 years

  const bankruptcyRecords = blocks
    .map((block) => {
      const type = extractTag(block, 'CreditPublicRecordType');
      const status = extractTag(block, 'CreditPublicRecordDispositionType');
      const dispositionDate = extractTag(block, 'CreditPublicRecordDispositionDate');
      const filedDate = extractTag(block, 'CreditPublicRecordFiledDate');
      return { type, status, dispositionDate, filedDate };
    })
    .filter((r) => /bankruptcy/i.test(r.type));

  const inLookback = bankruptcyRecords.filter((r) => {
    const d = parseIsoDate(r.dispositionDate) || parseIsoDate(r.filedDate);
    if (!d) return true; // keep if date missing; better to not undercount
    return d.getTime() >= cutoff.getTime();
  });

  if (inLookback.length === 0) {
    return { found: false, bkCount: 0, bkType: null, bkStatus: null, dischargeDate: null, matchedRecords: [] };
  }

  // Representative record selection:
  // - If any record is Open/Pending → hard stop status is Open/Pending (prefer Open over Pending)
  // - Otherwise choose the most recent by dispositionDate/ filedDate
  const normalized = inLookback.map((r) => {
    const normStatus = normalizeBkStatus(r.status);
    const disp = parseIsoDate(r.dispositionDate);
    const filed = parseIsoDate(r.filedDate);
    const bestDate = disp || filed;
    return { ...r, normStatus, bestDate };
  });

  const openRec = normalized.find((r) => r.normStatus === 'Open');
  const pendingRec = normalized.find((r) => r.normStatus === 'Pending');
  const activeRec = openRec || pendingRec;

  const pickMostRecent = () => {
    const withDates = normalized.filter((r) => r.bestDate instanceof Date && !Number.isNaN(r.bestDate.getTime()));
    if (withDates.length === 0) return normalized[0];
    withDates.sort((a, b) => b.bestDate.getTime() - a.bestDate.getTime());
    return withDates[0];
  };

  const rep = activeRec || pickMostRecent();
  const repStatus = activeRec ? (openRec ? 'Open' : 'Pending') : (rep.normStatus || null);
  const repChapter = normalizeBkChapterFromType(rep.type) || null;
  const repDate = formatDateYYYYMMDD(rep.bestDate) || null;

  return {
    found: true,
    bkCount: inLookback.length,
    bkType: repChapter,
    bkStatus: repStatus,
    dischargeDate: repDate,
    matchedRecords: inLookback,
  };
}

module.exports = {
  extractPublicRecordDetailBlocks,
  extractBankruptcySummaryFromRawXml,
  yearsSince,
};

