const CREDENTIAL_TYPES = {
  credit_account: {
    displayName: "Credit Account",
    description: "Credit reporting service account (SmartAPI, etc.)",
    category: "credit_reporting",
    isVisible: true,
    fields: {
      smartApiUrl: { required: true, label: "SmartAPI URL" },
      creditApiUrl: { required: true, label: "CreditAPI URL" },
      mclInterface: { required: false, label: "MCL Interface" },
      mlcId: { required: false, label: "MLC ID" }
    }
  },
  
  aus_du: {
    displayName: "AUS-DU",
    description: "Automated Underwriting System - Desktop Underwriter",
    category: "automated_underwriting",
    isVisible: true,
    fields: {}
  },
  
  aus_lpa: {
    displayName: "AUS-LPA", 
    description: "Automated Underwriting System - Loan Product Advisor",
    category: "automated_underwriting",
    isVisible: true,
    fields: {}
  },
  
  doc_magic: {
    displayName: "Doc-Magic",
    description: "Document generation and management system",
    category: "document_generation", 
    isVisible: false, // Hidden for now as requested
    fields: {}
  },
  
  freddie_lpa: {
    displayName: "FHLMC",
    description: "FreddieMac's automated underwriting system for loan eligibility and requirements",
    category: "automated_underwriting",
    isVisible: true,
    fields: {}
  },
  
  fannie_du: {
    displayName: "FNMA", 
    description: "FannieMae's automated underwriting system for loan eligibility and requirements",
    category: "automated_underwriting",
    isVisible: true,
    fields: {}
  }
};

module.exports = {
  CREDENTIAL_TYPES
};
