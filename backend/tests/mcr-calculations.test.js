/**
 * MCR Calculation Engine — Unit Tests
 *
 * Tests the internal calculation functions used to generate
 * NMLS Mortgage Call Report data across all 5 tabs.
 */

// Mock Mongoose models before require
jest.mock('../src/models/mcrReport.model', () => ({}));
jest.mock('../src/models/mcrStateConfig.model', () => ({}));
jest.mock('../src/models/financialCondition.model', () => ({}));
jest.mock('../src/models/loan.model', () => ({}));
jest.mock('../src/models/loanCompensation.model', () => ({}));
jest.mock('../src/models/loanStatusHistory.model', () => ({}));
jest.mock('../src/models/lender.model', () => ({}));
jest.mock('../src/models/user.model', () => ({}));
jest.mock('../src/utils/apiError', () => class ApiError extends Error { constructor(m, c) { super(m); this.statusCode = c; } });
jest.mock('../src/config/conformingLimits', () => ({
  isJumbo: (amount, state, units) => amount > 766550
}));
jest.mock('../src/services/mcrExport.service', () => ({}));

const {
  _internal: {
    getPeriodDates,
    getMcrApplicationDate,
    loanIsInMcrReportingPeriod,
    getFundedLoansInPeriod,
    getLoanAmount,
    calculateApplicationData,
    calculateClosedLoanData,
    calculateRevenueData,
    calculateMLOData,
    calculateRMLAData
  }
} = require('../src/controllers/mcr.controller');

const { ObjectId } = require('mongoose').Types;

// ── Helper factories ──

function makeLoan(overrides = {}) {
  const id = overrides._id || new ObjectId();
  return {
    _id: id,
    status: 'Application Submitted',
    loanDetails: { loanAmount: 300000, loanType: 'Purchase' },
    property: { propertyType: 'Single Family Home', occupancyType: 'Primary Residence', state: 'CA' },
    assignedLoanOfficer: null,
    hoeparFlag: false,
    qmStatus: null,
    leadSource: null,
    docType: null,
    ...overrides
  };
}

function makeComp(loanId, overrides = {}) {
  return {
    loan: loanId,
    fundedDate: null,
    applicationDate: null,
    originationFee: 0,
    srpAmount: 0,
    yspAmount: 0,
    discountPoints: 0,
    brokerCompensation: 0,
    processingFee: 0,
    passThruFees: 0,
    brokerFlatFees: 0,
    lenderFeesCollected: 0,
    lienPosition: '1st',
    servicingDisposition: null,
    ...overrides
  };
}

function makeCompMap(pairs) {
  const map = {};
  pairs.forEach(([loanId, comp]) => { map[loanId.toString()] = comp; });
  return map;
}

// ── Tests ──

describe('getPeriodDates', () => {
  test('Q1 returns Jan 1 – Mar 31', () => {
    const { startDate, endDate } = getPeriodDates(2025, 'Q1');
    expect(startDate.getUTCMonth()).toBe(0); // Jan
    expect(startDate.getUTCDate()).toBe(1);
    expect(endDate.getUTCMonth()).toBe(2); // Mar
    expect(endDate.getUTCDate()).toBe(31);
  });

  test('Q3 returns Jul 1 – Sep 30', () => {
    const { startDate, endDate } = getPeriodDates(2025, 'Q3');
    expect(startDate.getUTCMonth()).toBe(6);
    expect(endDate.getUTCMonth()).toBe(8);
    expect(endDate.getUTCDate()).toBe(30);
  });

  test('Annual returns Jan 1 – Dec 31', () => {
    const { startDate, endDate } = getPeriodDates(2025, 'Annual');
    expect(startDate.getUTCMonth()).toBe(0);
    expect(endDate.getUTCMonth()).toBe(11);
    expect(endDate.getUTCDate()).toBe(31);
  });
});

describe('loanIsInMcrReportingPeriod', () => {
  const q2Start = new Date('2026-04-01T00:00:00.000Z');
  const q2End = new Date('2026-06-30T23:59:59.999Z');

  test('includes prior-quarter application still in pipeline (Q2 AC010 carry-over)', () => {
    const loan = makeLoan({ status: 'Application Submitted' });
    const comp = makeComp(loan._id, { applicationDate: new Date('2026-03-15') });
    expect(loanIsInMcrReportingPeriod(loan, comp, q2Start, q2End)).toBe(true);
  });

  test('includes prior-quarter application funded in this period', () => {
    const loan = makeLoan({ status: 'Funded' });
    const comp = makeComp(loan._id, {
      applicationDate: new Date('2026-03-15'),
      fundedDate: new Date('2026-04-10')
    });
    expect(loanIsInMcrReportingPeriod(loan, comp, q2Start, q2End)).toBe(true);
  });

  test('excludes prior-quarter application already funded before this period', () => {
    const loan = makeLoan({ status: 'Funded' });
    const comp = makeComp(loan._id, {
      applicationDate: new Date('2026-03-15'),
      fundedDate: new Date('2026-03-20')
    });
    expect(loanIsInMcrReportingPeriod(loan, comp, q2Start, q2End)).toBe(false);
  });

  test('uses loanDetails.applicationDate when compensation has none', () => {
    const loan = makeLoan({
      status: 'Processing',
      loanDetails: {
        loanAmount: 300000,
        loanType: 'Purchase',
        applicationDate: new Date('2026-03-01')
      }
    });
    const comp = makeComp(loan._id, { applicationDate: null });
    expect(loanIsInMcrReportingPeriod(loan, comp, q2Start, q2End)).toBe(true);
  });
});

describe('getMcrApplicationDate', () => {
  test('prefers compensation applicationDate over loan details', () => {
    const loan = makeLoan({ loanDetails: { applicationDate: new Date('2025-01-01') } });
    const comp = makeComp(loan._id, { applicationDate: new Date('2025-06-01') });
    expect(getMcrApplicationDate(loan, comp).getTime()).toBe(new Date('2025-06-01').getTime());
  });
});

describe('getLoanAmount', () => {
  test('returns loanDetails.loanAmount when not Purchase with purchase price', () => {
    const loan = { loanDetails: { loanAmount: 500000, requestedLoanAmount: 400000 }, loanParameters: { loanAmount: 300000 } };
    expect(getLoanAmount(loan)).toBe(500000);
  });

  test('Purchase: uses purchasePrice minus downPayment (matches dashboard)', () => {
    const loan = {
      loanDetails: {
        loanType: 'Purchase',
        purchasePrice: 450000,
        downPayment: 90000,
        loanAmount: 450000,
        requestedLoanAmount: 450000
      },
      loanParameters: { loanAmount: 450000 }
    };
    expect(getLoanAmount(loan)).toBe(360000);
  });

  test('Purchase: falls back to stored amounts when no purchase price', () => {
    const loan = {
      loanDetails: { loanType: 'Purchase', loanAmount: 275000 },
      loanParameters: {}
    };
    expect(getLoanAmount(loan)).toBe(275000);
  });

  test('Refinance: prefers requestedLoanAmount over loanAmount', () => {
    const loan = {
      loanDetails: {
        loanType: 'Refinance',
        requestedLoanAmount: 320000,
        loanAmount: 400000
      },
      loanParameters: {}
    };
    expect(getLoanAmount(loan)).toBe(320000);
  });

  test('falls back to requestedLoanAmount', () => {
    const loan = { loanDetails: { requestedLoanAmount: 400000 }, loanParameters: { loanAmount: 300000 } };
    expect(getLoanAmount(loan)).toBe(400000);
  });

  test('falls back to loanParameters.loanAmount', () => {
    const loan = { loanDetails: {}, loanParameters: { loanAmount: 300000 } };
    expect(getLoanAmount(loan)).toBe(300000);
  });

  test('returns 0 when no amount found', () => {
    expect(getLoanAmount({})).toBe(0);
  });
});

describe('getFundedLoansInPeriod', () => {
  const start = new Date('2025-01-01T00:00:00Z');
  const end = new Date('2025-03-31T23:59:59Z');

  test('includes loans funded within period with terminal status', () => {
    const loan = makeLoan({ status: 'Funded' });
    const comp = makeComp(loan._id, { fundedDate: new Date('2025-02-15') });
    const compMap = makeCompMap([[loan._id, comp]]);
    const statusAtEnd = { [loan._id.toString()]: 'Funded' };
    const result = getFundedLoansInPeriod([loan], compMap, statusAtEnd, start, end);
    expect(result).toHaveLength(1);
  });

  test('excludes loans funded outside period', () => {
    const loan = makeLoan();
    const comp = makeComp(loan._id, { fundedDate: new Date('2024-12-15') });
    const compMap = makeCompMap([[loan._id, comp]]);
    const statusAtEnd = { [loan._id.toString()]: 'Funded' };
    const result = getFundedLoansInPeriod([loan], compMap, statusAtEnd, start, end);
    expect(result).toHaveLength(0);
  });

  test('excludes loans with no compensation record', () => {
    const loan = makeLoan();
    const statusAtEnd = { [loan._id.toString()]: 'Funded' };
    const result = getFundedLoansInPeriod([loan], {}, statusAtEnd, start, end);
    expect(result).toHaveLength(0);
  });

  test('excludes loans with no fundedDate', () => {
    const loan = makeLoan();
    const comp = makeComp(loan._id, { fundedDate: null });
    const compMap = makeCompMap([[loan._id, comp]]);
    const statusAtEnd = { [loan._id.toString()]: 'Funded' };
    const result = getFundedLoansInPeriod([loan], compMap, statusAtEnd, start, end);
    expect(result).toHaveLength(0);
  });

  test('excludes loans that are not Closed/Funded at period end', () => {
    const loan = makeLoan({ status: 'Withdrawn' });
    const comp = makeComp(loan._id, { fundedDate: new Date('2025-02-15') });
    const compMap = makeCompMap([[loan._id, comp]]);
    const statusAtEnd = { [loan._id.toString()]: 'Withdrawn' };
    const result = getFundedLoansInPeriod([loan], compMap, statusAtEnd, start, end);
    expect(result).toHaveLength(0);
  });
});

describe('calculateApplicationData', () => {
  const start = new Date('2025-01-01T00:00:00Z');
  const end = new Date('2025-03-31T23:59:59Z');

  test('counts applications received in period', () => {
    const loan = makeLoan();
    const comp = makeComp(loan._id, { applicationDate: new Date('2025-02-01') });
    const compMap = makeCompMap([[loan._id, comp]]);
    const statusAtEnd = { [loan._id.toString()]: 'Processing' };
    const statusDuring = {};

    const result = calculateApplicationData([loan], compMap, statusAtEnd, statusDuring, start, end);
    expect(result.AC020.count).toBe(1);
    expect(result.AC020.amount).toBe(300000);
  });

  test('AC010 counts prior-period application still active at period end (carry-over)', () => {
    const q2Start = new Date('2026-04-01T00:00:00.000Z');
    const q2End = new Date('2026-06-30T23:59:59.999Z');
    const loan = makeLoan({ status: 'Application Submitted' });
    const comp = makeComp(loan._id, { applicationDate: new Date('2026-03-31') });
    const compMap = makeCompMap([[loan._id, comp]]);
    const statusAtEnd = { [loan._id.toString()]: 'Application Submitted' };

    const result = calculateApplicationData([loan], compMap, statusAtEnd, {}, q2Start, q2End);
    expect(result.AC010.count).toBe(1);
    expect(result.AC080.count).toBe(1);
    expect(result.AC020.count).toBe(0);
  });

  test('counts denials during period', () => {
    const loan = makeLoan();
    const comp = makeComp(loan._id);
    const compMap = makeCompMap([[loan._id, comp]]);
    const statusAtEnd = { [loan._id.toString()]: 'Declined' };
    const statusDuring = {
      [loan._id.toString()]: [{ newStatus: 'Declined' }]
    };

    const result = calculateApplicationData([loan], compMap, statusAtEnd, statusDuring, start, end);
    expect(result.AC040.count).toBe(1);
    expect(result.AC040.amount).toBe(300000);
  });

  test('counts withdrawals during period', () => {
    const loan = makeLoan();
    const comp = makeComp(loan._id);
    const compMap = makeCompMap([[loan._id, comp]]);
    const statusAtEnd = { [loan._id.toString()]: 'Withdrawn' };
    const statusDuring = {
      [loan._id.toString()]: [{ newStatus: 'Withdrawn' }]
    };

    const result = calculateApplicationData([loan], compMap, statusAtEnd, statusDuring, start, end);
    expect(result.AC050.count).toBe(1);
  });

  test('counts funded loans in period (AC070)', () => {
    const loan = makeLoan();
    const comp = makeComp(loan._id, { fundedDate: new Date('2025-03-01') });
    const compMap = makeCompMap([[loan._id, comp]]);
    const statusAtEnd = { [loan._id.toString()]: 'Funded' };

    const result = calculateApplicationData([loan], compMap, statusAtEnd, {}, start, end);
    expect(result.AC070.count).toBe(1);
    expect(result.AC070.amount).toBe(300000);
  });

  test('counts ending pipeline (active loans at end of period)', () => {
    const loan = makeLoan({ status: 'Processing' });
    const compMap = {};
    const statusAtEnd = { [loan._id.toString()]: 'Processing' };

    const result = calculateApplicationData([loan], compMap, statusAtEnd, {}, start, end);
    expect(result.AC080.count).toBe(1);
  });

  test('AC010 beginning pipeline = exit + funded + denied + withdrawn + closed_incomplete - received', () => {
    const loans = [];
    const compMap = {};

    // 2 in pipeline at end
    for (let i = 0; i < 2; i++) {
      const loan = makeLoan({ status: 'Processing' });
      loans.push(loan);
      compMap[loan._id.toString()] = makeComp(loan._id, { applicationDate: new Date('2024-12-20') });
    }

    // 1 funded
    const fundedLoan = makeLoan();
    const fundedComp = makeComp(fundedLoan._id, { applicationDate: new Date('2024-12-15'), fundedDate: new Date('2025-02-01') });
    loans.push(fundedLoan);
    compMap[fundedLoan._id.toString()] = fundedComp;

    // 1 new app received in period
    const newLoan = makeLoan({ status: 'Application Submitted' });
    const newComp = makeComp(newLoan._id, { applicationDate: new Date('2025-01-15') });
    loans.push(newLoan);
    compMap[newLoan._id.toString()] = newComp;

    const statusAtEnd = {};
    loans.forEach(l => {
      statusAtEnd[l._id.toString()] = l.status;
    });

    const result = calculateApplicationData(loans, compMap, statusAtEnd, {}, start, end);
    // AC010 = AC080 + AC070 + AC030 + AC040 + AC050 + AC060 - AC020
    const expected = result.AC080.count + result.AC070.count + result.AC030.count + result.AC040.count + result.AC050.count + result.AC060.count - result.AC020.count;
    expect(result.AC010.count).toBe(expected);
  });
});

describe('calculateClosedLoanData', () => {
  const start = new Date('2025-01-01T00:00:00Z');
  const end = new Date('2025-03-31T23:59:59Z');
  const closed = { status: 'Closed' };

  test('counts total funded loans (AC100 conventional)', () => {
    const loan1 = makeLoan(closed);
    const loan2 = makeLoan({
      ...closed,
      loanDetails: { loanAmount: 450000, loanType: 'Refinance' },
    });
    const comp1 = makeComp(loan1._id, { fundedDate: new Date('2025-02-01') });
    const comp2 = makeComp(loan2._id, { fundedDate: new Date('2025-03-15') });
    const compMap = makeCompMap([[loan1._id, comp1], [loan2._id, comp2]]);

    const result = calculateClosedLoanData([loan1, loan2], compMap, {}, {}, start, end);
    expect(result.AC100.brokered.count).toBe(2);
    expect(result.AC100.brokered.amount).toBe(750000);
  });

  test('categorizes by loan purpose (AC300 purchase vs AC320 refinance)', () => {
    const purchase = makeLoan({
      ...closed,
      loanDetails: { loanAmount: 300000, loanType: 'Purchase' },
    });
    const refi = makeLoan({
      ...closed,
      loanDetails: { loanAmount: 400000, loanType: 'Refinance' },
    });
    const comp1 = makeComp(purchase._id, { fundedDate: new Date('2025-02-01') });
    const comp2 = makeComp(refi._id, { fundedDate: new Date('2025-02-15') });
    const compMap = makeCompMap([[purchase._id, comp1], [refi._id, comp2]]);

    const result = calculateClosedLoanData([purchase, refi], compMap, {}, {}, start, end);
    expect(result.AC300.brokered.count).toBe(1);
    expect(result.AC320.brokered.count).toBe(1);
  });

  test('non-manufactured property (e.g. condo) counts in AC200', () => {
    const loan = makeLoan({
      ...closed,
      property: { propertyType: 'Condominium', occupancyType: 'Primary Residence' },
    });
    const comp = makeComp(loan._id, { fundedDate: new Date('2025-02-01') });
    const compMap = makeCompMap([[loan._id, comp]]);

    const result = calculateClosedLoanData([loan], compMap, {}, {}, start, end);
    expect(result.AC200.brokered.count).toBe(1);
    expect(result.AC210.brokered.count).toBe(0);
  });

  test('manufactured housing counts in AC210', () => {
    const loan = makeLoan({
      ...closed,
      property: { propertyType: 'Manufactured Housing', occupancyType: 'Primary Residence' },
    });
    const comp = makeComp(loan._id, { fundedDate: new Date('2025-02-01') });
    const compMap = makeCompMap([[loan._id, comp]]);

    const result = calculateClosedLoanData([loan], compMap, {}, {}, start, end);
    expect(result.AC210.brokered.count).toBe(1);
    expect(result.AC200.brokered.count).toBe(0);
  });

  test('non-residential property does not count in AC200/AC210', () => {
    const loan = makeLoan({
      ...closed,
      property: { propertyType: 'Commercial', occupancyType: 'Investment' },
    });
    const comp = makeComp(loan._id, { fundedDate: new Date('2025-02-01') });
    const compMap = makeCompMap([[loan._id, comp]]);

    const result = calculateClosedLoanData([loan], compMap, {}, {}, start, end);
    expect(result.AC200.brokered.count).toBe(0);
    expect(result.AC210.brokered.count).toBe(0);
  });

  test('counts HOEPA loans', () => {
    const loan = makeLoan({ ...closed, hoeparFlag: true });
    const comp = makeComp(loan._id, { fundedDate: new Date('2025-02-01') });
    const compMap = makeCompMap([[loan._id, comp]]);

    const result = calculateClosedLoanData([loan], compMap, {}, {}, start, end);
    expect(result.AC400.brokered.count).toBe(1);
  });

  test('categorizes by QM status', () => {
    const loan = makeLoan({ ...closed, qmStatus: 'Non-QM' });
    const comp = makeComp(loan._id, { fundedDate: new Date('2025-02-01') });
    const compMap = makeCompMap([[loan._id, comp]]);

    const result = calculateClosedLoanData([loan], compMap, {}, {}, start, end);
    expect(result.AC930.brokered.count).toBe(1);
  });

  test('categorizes by lien position', () => {
    const loan = makeLoan(closed);
    const comp = makeComp(loan._id, { fundedDate: new Date('2025-02-01'), lienPosition: '2nd' });
    const compMap = makeCompMap([[loan._id, comp]]);

    const result = calculateClosedLoanData([loan], compMap, {}, {}, start, end);
    expect(result.AC510.brokered.count).toBe(1);
  });
});

describe('calculateRevenueData', () => {
  const start = new Date('2025-01-01T00:00:00Z');
  const end = new Date('2025-03-31T23:59:59Z');

  test('aggregates all fee fields', () => {
    const loan = makeLoan();
    const comp = makeComp(loan._id, {
      fundedDate: new Date('2025-02-01'),
      originationFee: 2500,
      srpAmount: 1000,
      yspAmount: 500,
      discountPoints: 750,
      brokerCompensation: 3000,
      processingFee: 400,
      passThruFees: 100,
      brokerFlatFees: 200,
      lenderFeesCollected: 150
    });
    const compMap = makeCompMap([[loan._id, comp]]);

    const result = calculateRevenueData([loan], compMap, { [loan._id.toString()]: 'Funded' }, {}, start, end);
    expect(result.AC1010.amount).toBe(2500);
    expect(result.AC1020.amount).toBe(1000);
    expect(result.AC1030.amount).toBe(500);
    expect(result.AC1040.amount).toBe(750);
    expect(result.AC1050.amount).toBe(3000);
    expect(result.AC1060.amount).toBe(400);
    expect(result.AC1070.amount).toBe(100);
    expect(result.AC1080.amount).toBe(200);
    expect(result.AC1090.amount).toBe(150);
  });

  test('calculates total gross revenue (AC1100)', () => {
    const loan = makeLoan();
    const comp = makeComp(loan._id, {
      fundedDate: new Date('2025-02-01'),
      originationFee: 1000,
      srpAmount: 2000,
      processingFee: 500
    });
    const compMap = makeCompMap([[loan._id, comp]]);

    const result = calculateRevenueData([loan], compMap, { [loan._id.toString()]: 'Funded' }, {}, start, end);
    expect(result.AC1100.amount).toBe(3500);
  });

  test('tracks servicing disposition', () => {
    const loan1 = makeLoan();
    const loan2 = makeLoan({ loanDetails: { loanAmount: 500000 } });
    const comp1 = makeComp(loan1._id, { fundedDate: new Date('2025-02-01'), servicingDisposition: 'Released' });
    const comp2 = makeComp(loan2._id, { fundedDate: new Date('2025-02-15'), servicingDisposition: 'Retained' });
    const compMap = makeCompMap([[loan1._id, comp1], [loan2._id, comp2]]);

    const statusAtEnd = {
      [loan1._id.toString()]: 'Funded',
      [loan2._id.toString()]: 'Funded'
    };
    const result = calculateRevenueData([loan1, loan2], compMap, statusAtEnd, {}, start, end);
    expect(result.AC1200.count).toBe(1); // Retained
    expect(result.AC1210.count).toBe(1); // Released
    expect(result.AC1200.amount).toBe(500000);
  });
});

describe('calculateMLOData', () => {
  const start = new Date('2025-01-01T00:00:00Z');
  const end = new Date('2025-03-31T23:59:59Z');

  test('groups funded loans by loan officer', () => {
    const lo1Id = new ObjectId();
    const lo2Id = new ObjectId();

    const loan1 = makeLoan({ assignedLoanOfficer: { _id: lo1Id, firstName: 'John', lastName: 'Doe', nmlsId: '12345' } });
    const loan2 = makeLoan({ loanDetails: { loanAmount: 400000 }, assignedLoanOfficer: { _id: lo1Id, firstName: 'John', lastName: 'Doe', nmlsId: '12345' } });
    const loan3 = makeLoan({ loanDetails: { loanAmount: 500000 }, assignedLoanOfficer: { _id: lo2Id, firstName: 'Jane', lastName: 'Smith', nmlsId: '67890' } });

    const comp1 = makeComp(loan1._id, { fundedDate: new Date('2025-02-01') });
    const comp2 = makeComp(loan2._id, { fundedDate: new Date('2025-02-10') });
    const comp3 = makeComp(loan3._id, { fundedDate: new Date('2025-03-05') });
    const compMap = makeCompMap([[loan1._id, comp1], [loan2._id, comp2], [loan3._id, comp3]]);

    const result = calculateMLOData([loan1, loan2, loan3], compMap, {}, {}, start, end);
    expect(result.totalLOCount).toBe(2);

    // LOs sorted by totalAmount desc: Jane (500k) > John (700k) — wait, John = 300k + 400k = 700k
    const john = result.loanOfficers.find(lo => lo.firstName === 'John');
    expect(john.loanCount).toBe(2);
    expect(john.totalAmount).toBe(700000);
    expect(john.averageAmount).toBe(350000);
  });

  test('skips loans without assigned loan officer', () => {
    const loan = makeLoan({ assignedLoanOfficer: null });
    const comp = makeComp(loan._id, { fundedDate: new Date('2025-02-01') });
    const compMap = makeCompMap([[loan._id, comp]]);

    const result = calculateMLOData([loan], compMap, {}, {}, start, end);
    expect(result.totalLOCount).toBe(0);
    expect(result.loanOfficers).toHaveLength(0);
  });
});

describe('calculateRMLAData', () => {
  const start = new Date('2025-01-01T00:00:00Z');
  const end = new Date('2025-03-31T23:59:59Z');

  test('categorizes by purpose', () => {
    const purchase = makeLoan({ loanDetails: { loanAmount: 300000, loanType: 'Purchase' } });
    const refi = makeLoan({ loanDetails: { loanAmount: 400000, loanType: 'Refinance' } });
    const comp1 = makeComp(purchase._id, { fundedDate: new Date('2025-02-01') });
    const comp2 = makeComp(refi._id, { fundedDate: new Date('2025-02-15') });
    const compMap = makeCompMap([[purchase._id, comp1], [refi._id, comp2]]);

    const statusAtEnd = {
      [purchase._id.toString()]: 'Funded',
      [refi._id.toString()]: 'Funded'
    };
    const result = calculateRMLAData([purchase, refi], compMap, statusAtEnd, {}, start, end);
    expect(result.purpose.purchase.count).toBe(1);
    expect(result.purpose.refinance.count).toBe(1);
  });

  test('calculates pull-through ratio', () => {
    const loans = [];
    const compMap = {};

    // 4 apps received in period, 2 funded
    for (let i = 0; i < 4; i++) {
      const loan = makeLoan();
      loans.push(loan);
      compMap[loan._id.toString()] = makeComp(loan._id, {
        applicationDate: new Date('2025-01-15'),
        fundedDate: i < 2 ? new Date('2025-03-01') : null
      });
    }

    const statusAtEnd = {};
    loans.forEach((l, i) => {
      statusAtEnd[l._id.toString()] = i < 2 ? 'Funded' : 'Application Submitted';
    });
    const result = calculateRMLAData(loans, compMap, statusAtEnd, {}, start, end);
    expect(result.pullThrough.appsReceived).toBe(4);
    expect(result.pullThrough.loansFunded).toBe(2);
    expect(result.pullThrough.ratio).toBe(50);
  });

  test('handles zero apps gracefully', () => {
    const result = calculateRMLAData([], {}, {}, {}, start, end);
    expect(result.pullThrough.ratio).toBe(0);
  });

  test('uses HELOC credit line amount for 2nd-lien HELOCs', () => {
    const helocLoan = makeLoan({
      loanDetails: { loanAmount: 200000, loanType: 'HELOC' },
      property: { propertyType: 'Single Family Home', occupancyType: 'Primary Residence', state: 'CA' }
    });
    const comp = makeComp(helocLoan._id, {
      fundedDate: new Date('2025-02-01'),
      lienPosition: '2nd',
      secondLienType: 'HELOC',
      creditLineAmount: 100000
    });
    const compMap = makeCompMap([[helocLoan._id, comp]]);

    const result = calculateRMLAData([helocLoan], compMap, { [helocLoan._id.toString()]: 'Funded' }, {}, start, end);
    // In channel + purpose, the amount used for this loan should be 100k (credit line) not 200k
    expect(result.channel.brokered.amount).toBe(100000);
    expect(result.purpose.refinance.amount + result.purpose.purchase.amount).toBe(100000);
  });

  test('falls back to computed LTV when financialCalculations.ltv is missing', () => {
    const loan = makeLoan({
      loanDetails: { loanAmount: 360000, loanType: 'Purchase' },
      property: { propertyType: 'Single Family Home', occupancyType: 'Primary Residence', state: 'CA', propertyValue: 450000 },
      financialCalculations: { ltv: 0 }
    });
    const comp = makeComp(loan._id, {
      fundedDate: new Date('2025-02-01')
    });
    const compMap = makeCompMap([[loan._id, comp]]);

    const result = calculateRMLAData([loan], compMap, { [loan._id.toString()]: 'Funded' }, {}, start, end);
    // 360k / 450k = 80% → should fall into the 70.01–80 bucket (lt80)
    expect(result.ltvDistribution.lt80.count).toBe(1);
    expect(result._meta.fundedWithMissingLTV).toBe(0);
    expect(result.weightedAverages.ltv).toBeGreaterThan(0);
  });

  test('tracks funded loans missing LTV for readiness checks', () => {
    const loan = makeLoan({
      loanDetails: { loanAmount: 300000, loanType: 'Purchase' },
      property: { propertyType: 'Single Family Home', occupancyType: 'Primary Residence', state: 'CA' },
      financialCalculations: { ltv: 0 }
    });
    const comp = makeComp(loan._id, {
      fundedDate: new Date('2025-02-01')
    });
    const compMap = makeCompMap([[loan._id, comp]]);

    const result = calculateRMLAData([loan], compMap, { [loan._id.toString()]: 'Funded' }, {}, start, end);
    expect(result._meta.fundedWithMissingLTV).toBe(1);
  });
});
