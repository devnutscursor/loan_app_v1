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

describe('getLoanAmount', () => {
  test('returns loanDetails.loanAmount first', () => {
    const loan = { loanDetails: { loanAmount: 500000, requestedLoanAmount: 400000 }, loanParameters: { loanAmount: 300000 } };
    expect(getLoanAmount(loan)).toBe(500000);
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

  test('includes loans funded within period', () => {
    const loan = makeLoan();
    const comp = makeComp(loan._id, { fundedDate: new Date('2025-02-15') });
    const compMap = makeCompMap([[loan._id, comp]]);
    const result = getFundedLoansInPeriod([loan], compMap, start, end);
    expect(result).toHaveLength(1);
  });

  test('excludes loans funded outside period', () => {
    const loan = makeLoan();
    const comp = makeComp(loan._id, { fundedDate: new Date('2024-12-15') });
    const compMap = makeCompMap([[loan._id, comp]]);
    const result = getFundedLoansInPeriod([loan], compMap, start, end);
    expect(result).toHaveLength(0);
  });

  test('excludes loans with no compensation record', () => {
    const loan = makeLoan();
    const result = getFundedLoansInPeriod([loan], {}, start, end);
    expect(result).toHaveLength(0);
  });

  test('excludes loans with no fundedDate', () => {
    const loan = makeLoan();
    const comp = makeComp(loan._id, { fundedDate: null });
    const compMap = makeCompMap([[loan._id, comp]]);
    const result = getFundedLoansInPeriod([loan], compMap, start, end);
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

  test('counts denials during period', () => {
    const loan = makeLoan();
    const comp = makeComp(loan._id);
    const compMap = makeCompMap([[loan._id, comp]]);
    const statusAtEnd = { [loan._id.toString()]: 'Declined' };
    const statusDuring = {
      [loan._id.toString()]: [{ newStatus: 'Declined' }]
    };

    const result = calculateApplicationData([loan], compMap, statusAtEnd, statusDuring, start, end);
    expect(result.AC030.count).toBe(1);
    expect(result.AC030.amount).toBe(300000);
  });

  test('counts withdrawals during period', () => {
    const loan = makeLoan();
    const comp = makeComp(loan._id);
    const compMap = makeCompMap([[loan._id, comp]]);
    const statusAtEnd = {};
    const statusDuring = {
      [loan._id.toString()]: [{ newStatus: 'Withdrawn' }]
    };

    const result = calculateApplicationData([loan], compMap, statusAtEnd, statusDuring, start, end);
    expect(result.AC040.count).toBe(1);
  });

  test('counts funded loans in period (AC050)', () => {
    const loan = makeLoan();
    const comp = makeComp(loan._id, { fundedDate: new Date('2025-03-01') });
    const compMap = makeCompMap([[loan._id, comp]]);
    const statusAtEnd = { [loan._id.toString()]: 'Funded' };

    const result = calculateApplicationData([loan], compMap, statusAtEnd, {}, start, end);
    expect(result.AC050.count).toBe(1);
    expect(result.AC050.amount).toBe(300000);
  });

  test('counts ending pipeline (active loans at end of period)', () => {
    const loan = makeLoan({ status: 'Processing' });
    const compMap = {};
    const statusAtEnd = { [loan._id.toString()]: 'Processing' };

    const result = calculateApplicationData([loan], compMap, statusAtEnd, {}, start, end);
    expect(result.AC090.count).toBe(1);
  });

  test('AC010 beginning pipeline = exit + funded + denied + withdrawn + closed_incomplete - received', () => {
    const loans = [];
    const compMap = {};

    // 2 in pipeline at end
    for (let i = 0; i < 2; i++) {
      const loan = makeLoan({ status: 'Processing' });
      loans.push(loan);
      compMap[loan._id.toString()] = makeComp(loan._id);
    }

    // 1 funded
    const fundedLoan = makeLoan();
    const fundedComp = makeComp(fundedLoan._id, { fundedDate: new Date('2025-02-01') });
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
    // AC010 = AC090 + AC050 + AC030 + AC040 + AC060 - AC020
    const expected = result.AC090.count + result.AC050.count + result.AC030.count + result.AC040.count + result.AC060.count - result.AC020.count;
    expect(result.AC010.count).toBe(expected);
  });
});

describe('calculateClosedLoanData', () => {
  const start = new Date('2025-01-01T00:00:00Z');
  const end = new Date('2025-03-31T23:59:59Z');

  test('counts total funded loans (AC100)', () => {
    const loan1 = makeLoan();
    const loan2 = makeLoan({ loanDetails: { loanAmount: 450000, loanType: 'Refinance' } });
    const comp1 = makeComp(loan1._id, { fundedDate: new Date('2025-02-01') });
    const comp2 = makeComp(loan2._id, { fundedDate: new Date('2025-03-15') });
    const compMap = makeCompMap([[loan1._id, comp1], [loan2._id, comp2]]);

    const result = calculateClosedLoanData([loan1, loan2], compMap, {}, {}, start, end);
    expect(result.AC100.count).toBe(2);
    expect(result.AC100.amount).toBe(750000);
  });

  test('categorizes by loan type', () => {
    const purchase = makeLoan({ loanDetails: { loanAmount: 300000, loanType: 'Purchase' } });
    const refi = makeLoan({ loanDetails: { loanAmount: 400000, loanType: 'Refinance' } });
    const comp1 = makeComp(purchase._id, { fundedDate: new Date('2025-02-01') });
    const comp2 = makeComp(refi._id, { fundedDate: new Date('2025-02-15') });
    const compMap = makeCompMap([[purchase._id, comp1], [refi._id, comp2]]);

    const result = calculateClosedLoanData([purchase, refi], compMap, {}, {}, start, end);
    expect(result.AC110.count).toBe(1); // Purchase
    expect(result.AC120.count).toBe(1); // Refinance
  });

  test('categorizes by property type', () => {
    const loan = makeLoan({ property: { propertyType: 'Condominium', occupancyType: 'Primary Residence' } });
    const comp = makeComp(loan._id, { fundedDate: new Date('2025-02-01') });
    const compMap = makeCompMap([[loan._id, comp]]);

    const result = calculateClosedLoanData([loan], compMap, {}, {}, start, end);
    expect(result.AC210.count).toBe(1); // Condo
  });

  test('categorizes by occupancy', () => {
    const loan = makeLoan({ property: { propertyType: 'Single Family Home', occupancyType: 'Investment' } });
    const comp = makeComp(loan._id, { fundedDate: new Date('2025-02-01') });
    const compMap = makeCompMap([[loan._id, comp]]);

    const result = calculateClosedLoanData([loan], compMap, {}, {}, start, end);
    expect(result.AC320.count).toBe(1); // Investment
  });

  test('counts HOEPA loans', () => {
    const loan = makeLoan({ hoeparFlag: true });
    const comp = makeComp(loan._id, { fundedDate: new Date('2025-02-01') });
    const compMap = makeCompMap([[loan._id, comp]]);

    const result = calculateClosedLoanData([loan], compMap, {}, {}, start, end);
    expect(result.AC400.count).toBe(1);
  });

  test('categorizes by QM status', () => {
    const loan = makeLoan({ qmStatus: 'Non-QM' });
    const comp = makeComp(loan._id, { fundedDate: new Date('2025-02-01') });
    const compMap = makeCompMap([[loan._id, comp]]);

    const result = calculateClosedLoanData([loan], compMap, {}, {}, start, end);
    expect(result.AC940.count).toBe(1); // Non-QM
  });

  test('categorizes by lien position', () => {
    const loan = makeLoan();
    const comp = makeComp(loan._id, { fundedDate: new Date('2025-02-01'), lienPosition: '2nd' });
    const compMap = makeCompMap([[loan._id, comp]]);

    const result = calculateClosedLoanData([loan], compMap, {}, {}, start, end);
    expect(result.AC510.count).toBe(1); // 2nd lien
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

    const result = calculateRevenueData([loan], compMap, {}, {}, start, end);
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

    const result = calculateRevenueData([loan], compMap, {}, {}, start, end);
    expect(result.AC1100.amount).toBe(3500);
  });

  test('tracks servicing disposition', () => {
    const loan1 = makeLoan();
    const loan2 = makeLoan({ loanDetails: { loanAmount: 500000 } });
    const comp1 = makeComp(loan1._id, { fundedDate: new Date('2025-02-01'), servicingDisposition: 'Released' });
    const comp2 = makeComp(loan2._id, { fundedDate: new Date('2025-02-15'), servicingDisposition: 'Retained' });
    const compMap = makeCompMap([[loan1._id, comp1], [loan2._id, comp2]]);

    const result = calculateRevenueData([loan1, loan2], compMap, {}, {}, start, end);
    expect(result.AC1200.count).toBe(1); // Released
    expect(result.AC1210.count).toBe(1); // Retained
    expect(result.AC1210.amount).toBe(500000);
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

    const result = calculateRMLAData([purchase, refi], compMap, {}, {}, start, end);
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

    const result = calculateRMLAData(loans, compMap, {}, {}, start, end);
    expect(result.pullThrough.appsReceived).toBe(4);
    expect(result.pullThrough.loansFunded).toBe(2);
    expect(result.pullThrough.ratio).toBe(50);
  });

  test('handles zero apps gracefully', () => {
    const result = calculateRMLAData([], {}, {}, {}, start, end);
    expect(result.pullThrough.ratio).toBe(0);
  });
});
