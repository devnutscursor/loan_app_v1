/**
 * Debug MCR loan filtering — checks what loans are included/excluded and why
 */
const mongoose = require('mongoose');
const config = require('./src/config');

async function debug() {
  await mongoose.connect(config.mongoUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/loan_app');
  console.log('Connected to MongoDB');

  const Loan = require('./src/models/loan.model');
  const LoanCompensation = require('./src/models/loanCompensation.model');
  const LoanStatusHistory = require('./src/models/loanStatusHistory.model');
  const Lender = require('./src/models/lender.model');

  // Find first lender (the one with loans)
  const lenders = await Lender.find({}).lean();
  console.log(`\nFound ${lenders.length} lender(s)`);

  for (const lender of lenders) {
    const loans = await Loan.find({ lender: lender._id, excludeFromMCR: { $ne: true } })
      .select('status createdAt updatedAt property.state loanDetails.loanAmount loanDetails.requestedLoanAmount loanParameters.loanAmount borrower')
      .populate('borrower', 'firstName lastName')
      .lean();

    if (loans.length === 0) continue;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`Lender: ${lender._id}`);
    console.log(`Total loans (non-excluded): ${loans.length}`);
    console.log(`${'='.repeat(80)}`);

    const loanIds = loans.map(l => l._id);
    const comps = await LoanCompensation.find({ loan: { $in: loanIds } })
      .select('loan applicationDate fundedDate closingDate denialDate withdrawnDate closedIncompleteDate')
      .lean();
    const compMap = {};
    comps.forEach(c => { compMap[c.loan.toString()] = c; });

    // Q1 2026 dates
    const q1Start = new Date('2026-01-01T00:00:00.000Z');
    const q1End = new Date('2026-03-31T23:59:59.999Z');

    console.log(`\nQ1 2026 period: ${q1Start.toISOString()} to ${q1End.toISOString()}`);

    console.log('\n--- ALL LOANS ---');
    for (const loan of loans) {
      const comp = compMap[loan._id.toString()];
      const amount = loan.loanDetails?.loanAmount || loan.loanDetails?.requestedLoanAmount || loan.loanParameters?.loanAmount || 0;
      const relevantDate = comp?.applicationDate || loan.createdAt;
      const inPeriod = relevantDate <= q1End;
      const borrowerName = loan.borrower ? `${loan.borrower.firstName} ${loan.borrower.lastName}` : 'No borrower';

      console.log(`\n  Loan ${loan._id}:`);
      console.log(`    Borrower: ${borrowerName}`);
      console.log(`    Status: ${loan.status}`);
      console.log(`    State: ${loan.property?.state || 'N/A'}`);
      console.log(`    Amount: $${amount.toLocaleString()}`);
      console.log(`    createdAt: ${loan.createdAt?.toISOString()}`);
      console.log(`    updatedAt: ${loan.updatedAt?.toISOString()}`);
      console.log(`    comp.applicationDate: ${comp?.applicationDate?.toISOString() || 'null'}`);
      console.log(`    comp.fundedDate: ${comp?.fundedDate?.toISOString() || 'null'}`);
      console.log(`    comp.closingDate: ${comp?.closingDate?.toISOString() || 'null'}`);
      console.log(`    comp.denialDate: ${comp?.denialDate?.toISOString() || 'null'}`);
      console.log(`    comp.withdrawnDate: ${comp?.withdrawnDate?.toISOString() || 'null'}`);
      console.log(`    comp.closedIncompleteDate: ${comp?.closedIncompleteDate?.toISOString() || 'null'}`);
      console.log(`    relevantDate for filtering: ${relevantDate?.toISOString()}`);
      console.log(`    INCLUDED in Q1 2026 (relevantDate <= end): ${inPeriod}`);

      // Check status histories
      const histories = await LoanStatusHistory.find({ loan: loan._id })
        .sort({ createdAt: 1 })
        .select('previousStatus newStatus createdAt')
        .lean();
      if (histories.length > 0) {
        console.log(`    Status History:`);
        for (const h of histories) {
          const inQ1 = h.createdAt >= q1Start && h.createdAt <= q1End;
          console.log(`      ${h.createdAt.toISOString()} : ${h.previousStatus || '(none)'} -> ${h.newStatus} ${inQ1 ? '[IN Q1]' : ''}`);
        }
      } else {
        console.log(`    Status History: NONE`);
      }

      // Check what AC category this loan would fall into for Q1
      if (inPeriod) {
        const isAppReceivedInQ1 = comp?.applicationDate && comp.applicationDate >= q1Start && comp.applicationDate <= q1End;
        console.log(`    AC020 (App Received in Q1): ${isAppReceivedInQ1 ? 'YES' : 'NO'}`);
        console.log(`    AC090 (In pipeline at end): status=${loan.status}, terminal=${['Closed', 'Funded', 'Declined', 'Withdrawn', 'Closed-Incomplete'].includes(loan.status)}`);
      }
    }

    // Simulate the periodLoans filter
    const periodLoans = loans.filter(loan => {
      const comp = compMap[loan._id.toString()];
      const relevantDate = comp?.applicationDate || loan.createdAt;
      return relevantDate <= q1End;
    });
    console.log(`\n--- PERIOD LOANS (included in Q1 2026): ${periodLoans.length} ---`);
    for (const l of periodLoans) {
      console.log(`  ${l._id} - status: ${l.status}, state: ${l.property?.state}`);
    }
  }

  await mongoose.disconnect();
  console.log('\nDone');
}

debug().catch(e => { console.error(e); process.exit(1); });
