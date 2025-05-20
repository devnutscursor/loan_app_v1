// src/data/documentRequirements.js
export const standardDocumentRequirements = [
  {
    id: 'identification',
    title: 'Identification',
    description: 'State issued ID, Driver\'s License or Passport',
    category: 'Identity',
    documentType: 'Driver License',
    required: true
  },
  {
    id: 'proofOfIncome',
    title: 'Proof of Income',
    description: 'Recent pay stubs, W-2, or tax returns',
    category: 'Income',
    documentType: 'Pay Stub',
    required: true
  },
  
  
  {
    id: 'selfEmployedPL',
    title: 'Self Employed P&L',
    description: 'Business tax returns, P&Ls and K-1s - Must be within past 2 years',
    category: 'Income',
    documentType: 'Business Tax Return',
    required: true
  },
  {
    id: 'scheduleC',
    title: 'Schedule C or Corp/S-Corp/Partnership',
    description: 'YTD profit and loss, and balance sheet, signed and dated',
    category: 'Income',
    documentType: 'Schedule C',
    required: true
  },
  {
    id: 'bankStatements',
    title: 'Bank Statements',
    description: 'Most recent consecutive two months (all pages). Note: Very important that you submit ALL pages of each statement, even the last page that says "this page intentionally left blank"',
    category: 'Financial',
    documentType: 'Bank Statement',
    required: true
  },
  {
    id: 'employmentVerification',
    title: 'Employment Verification',
    description: 'Letter from employer confirming employment status',
    category: 'Employment',
    documentType: 'Employment Letter',
    required: false
  },
  {
    id: 'addressVerification',
    title: 'Proof of Address',
    description: 'Utility bill, lease agreement, or bank statement',
    category: 'Address',
    documentType: 'Utility Bill',
    required: false
  },
  {
    id: 'retirementAccount',
    title: 'Retirement account',
    description: 'If applicable, please submit the following: a) Most recent quarterly statement by name b) Conditions for hardship withdrawal and loans',
    category: 'Financial',
    documentType: 'Retirement Statement',
    required: true
  },
  {
    id: 'mortgageStatement',
    title: 'Mortgage Statement',
    description: 'Please upload your most recent monthly mortgage statement for all real estate owned',
    category: 'Property',
    documentType: 'Mortgage Statement',
    required: true
  },
  {
    id: 'propertyTax',
    title: 'Property Taxes (most recent full year)',
    description: 'Please upload the most recent full year property tax bills for all real estate owned',
    category: 'Property',
    documentType: 'Property Tax Bill',
    required: true
  },
  {
    id: 'homeownersInsurance',
    title: 'Homeowner\'s Insurance',
    description: 'Please upload a copy of your homeowner\'s insurance policy for all real estate owned',
    category: 'Insurance',
    documentType: 'Homeowners Insurance',
    required: true
  }
];
