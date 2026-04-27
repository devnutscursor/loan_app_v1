/* eslint-disable */
const fs = require('fs');
const path = require('path');

const FILE = process.argv[2]
  || 'backend/tmp/credit-report-raw-69e0d0e3ff78ad75b70c3a32-1776347431892.xml';

const raw = fs.readFileSync(path.resolve(FILE), 'utf8');

const blocks = raw.match(/<CREDIT_LIABILITY[\s\S]*?<\/CREDIT_LIABILITY>/g) || [];

const isMortgage = (b) =>
  /<CreditLiabilityAccountType>Mortgage<\/CreditLiabilityAccountType>/i.test(b) ||
  /<CreditLoanType>Mortgage<\/CreditLoanType>/i.test(b);

const mortgage = blocks.filter(isMortgage);

const num = (b, tag) => {
  const m = b.match(new RegExp(`<${tag}>(\\d+)</${tag}>`, 'i'));
  return m ? Number(m[1]) : 0;
};

const rows = mortgage.map((b, i) => ({
  i: i + 1,
  late30: num(b, 'CreditLiability30DaysLateCount'),
  late60: num(b, 'CreditLiability60DaysLateCount'),
  late90: num(b, 'CreditLiability90DaysLateCount'),
}));

const totals = rows.reduce(
  (acc, r) => ({
    late30: acc.late30 + r.late30,
    late60: acc.late60 + r.late60,
    late90: acc.late90 + r.late90,
  }),
  { late30: 0, late60: 0, late90: 0 }
);

const max = rows.reduce(
  (acc, r) => ({
    late30: Math.max(acc.late30, r.late30),
    late60: Math.max(acc.late60, r.late60),
    late90: Math.max(acc.late90, r.late90),
  }),
  { late30: 0, late60: 0, late90: 0 }
);

console.log('File:', FILE);
console.log('totalLiabilityBlocks:', blocks.length);
console.log('mortgageBlocksCount:', rows.length);
console.log('rows:', rows);
console.log('totals:', totals);
console.log('max:', max);
