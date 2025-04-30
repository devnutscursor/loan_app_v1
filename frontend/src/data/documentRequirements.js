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
    id: 'bankStatements',
    title: 'Bank Statements',
    description: 'Last 3 months of banking activity',
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
  }
];
