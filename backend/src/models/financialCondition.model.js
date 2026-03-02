const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * FinancialCondition - FC Schedules (Company-Level, Quarterly)
 * 
 * The Financial Condition section (Schedules A, B, C, CF, D, O) is a
 * company-level quarterly submission. Unlike loan-level data, this is
 * entered manually by finance/accounting staff.
 * 
 * Schedules:
 * - A: Assets (balance sheet)
 * - B: Liabilities & Equity (balance sheet)
 * - B-350R: Equity Rollforward
 * - C: Income (income statement)
 * - CF: Cash Flow
 * - D: Non-Interest Expense
 * - O: Reserves
 */
const FinancialConditionSchema = new Schema({
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  year: { type: Number, required: true },
  quarter: { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4'], required: true },

  // --- Schedule A: Assets ---
  scheduleA: {
    // A010: Cash and Cash Equivalents
    cashAndEquivalents: { type: Number, default: 0 },
    // A020: Accounts Receivable
    accountsReceivable: { type: Number, default: 0 },
    // A030: Mortgage-Backed Securities (sub-schedule)
    mortgageSecurities: {
      heldToMaturity: { type: Number, default: 0 },
      availableForSale: { type: Number, default: 0 },
      tradingSecurities: { type: Number, default: 0 },
      total: { type: Number, default: 0 }             // CALCULATED
    },
    // A060: Mortgage Loans (sub-schedule)
    mortgageLoans: {
      hfsAtCost: { type: Number, default: 0 },        // A060-010
      hfsAtFairValue: { type: Number, default: 0 },    // A062T
      hfiAtCost: { type: Number, default: 0 },         // A060-060
      hfiAtFairValue: { type: Number, default: 0 },    // A066T
      allowanceForLoanLoss: { type: Number, default: 0 }, // A068
      total: { type: Number, default: 0 }              // CALCULATED
    },
    // A090: Other Real Estate Owned (OREO)
    otherRealEstateOwned: { type: Number, default: 0 },
    // A120-A160: Mortgage Servicing Rights
    msrAmortized: { type: Number, default: 0 },        // A120
    msrFairValue: { type: Number, default: 0 },        // A130
    totalMSR: { type: Number, default: 0 },            // A160 CALCULATED
    // A220: Derivatives (Assets)
    derivativeAssets: { type: Number, default: 0 },
    // A230: Other Assets
    otherAssets: { type: Number, default: 0 },
    // A280: Investments in Unconsolidated Subsidiaries
    investmentsInSubs: { type: Number, default: 0 },
    // A290: Total Assets — CALCULATED
    totalAssets: { type: Number, default: 0 }
  },

  // --- Schedule B: Liabilities & Equity ---
  scheduleB: {
    // Short-Term Liabilities
    warehouseLines: { type: Number, default: 0 },       // B010
    otherShortTermDebt: { type: Number, default: 0 },   // B015
    accountsPayable: { type: Number, default: 0 },      // B016
    totalShortTermLiabilities: { type: Number, default: 0 }, // B217
    // Long-Term Liabilities
    notesPayable: { type: Number, default: 0 },          // B020
    capitalLeases: { type: Number, default: 0 },         // B030
    deferredRevenue: { type: Number, default: 0 },       // B050
    guarantyLiabilities: { type: Number, default: 0 },   // B160
    derivativeLiabilities: { type: Number, default: 0 }, // B180
    taxesPayable: { type: Number, default: 0 },          // B190
    deferredTaxLiability: { type: Number, default: 0 },  // B200
    repurchaseReserves: { type: Number, default: 0 },    // B210
    totalLongTermLiabilities: { type: Number, default: 0 }, // B219
    totalLiabilities: { type: Number, default: 0 },      // B220
    // Equity (Corporations)
    preferredStock: { type: Number, default: 0 },         // B250
    commonStock: { type: Number, default: 0 },            // B260
    additionalPaidInCapital: { type: Number, default: 0 },// B270
    retainedEarnings: { type: Number, default: 0 },       // B280
    treasuryStock: { type: Number, default: 0 },          // B290
    otherComprehensiveIncome: { type: Number, default: 0 },// B300
    noncontrollingInterest: { type: Number, default: 0 }, // B310
    subordinatedDebt: { type: Number, default: 0 },       // B240
    totalEquity: { type: Number, default: 0 },            // B350
    totalLiabilitiesAndEquity: { type: Number, default: 0 } // B360
  },

  // --- Schedule B-350R: Equity Rollforward ---
  equityRollforward: {
    beginningBalance: { type: Number, default: 0 },       // B350A
    netIncome: { type: Number, default: 0 },              // B350B
    newStockIssuance: { type: Number, default: 0 },       // B350C
    stockRepurchases: { type: Number, default: 0 },       // B350D
    otherCapitalContributions: { type: Number, default: 0 },// B350E
    ociUnrealizedGainsAFS: { type: Number, default: 0 },  // B350F
    ociUnrealizedGainsDerivatives: { type: Number, default: 0 }, // B350G
    ociOther: { type: Number, default: 0 },               // B350H
    dividendsDistributions: { type: Number, default: 0 }, // B350L
    equityAdjustments: { type: Number, default: 0 },      // B350N
    endingBalance: { type: Number, default: 0 }           // B350T CALCULATED
  },

  // --- Schedule C: Income ---
  scheduleC: {
    // Interest Income
    interestOnLoansHFS: { type: Number, default: 0 },     // C010
    interestOnLoansHFI: { type: Number, default: 0 },     // C020
    interestOnSecuritiesHTM: { type: Number, default: 0 },// C030
    interestOnSecuritiesAFS: { type: Number, default: 0 },// C040
    interestOnTradingSecurities: { type: Number, default: 0 },// C050
    otherInterestIncome: { type: Number, default: 0 },    // C060
    yieldAdjustment: { type: Number, default: 0 },        // C070
    servicingRelatedInterest: { type: Number, default: 0 },// C080
    totalInterestIncome: { type: Number, default: 0 },    // C090 CALCULATED
    // Origination-Related Non-Interest Income
    discountsOnFVofLHS: { type: Number, default: 0 },     // C200
    originationFees: { type: Number, default: 0 },        // C210
    feesFromCorrespondents: { type: Number, default: 0 }, // C220
    brokerFeesBrokeredOut: { type: Number, default: 0 },  // C230
    otherOriginationIncome: { type: Number, default: 0 }, // C240
    amountsReclassified: { type: Number, default: 0 },    // C250
    totalOriginationIncome: { type: Number, default: 0 }, // C260 CALCULATED
    // Secondary Marketing Gains/(Losses)
    gainOnLoansSoldServicingRetained: { type: Number, default: 0 },   // C300
    capitalizedServicing: { type: Number, default: 0 },                // C310
    gainOnLoansSoldServicingReleased: { type: Number, default: 0 },   // C320
    servicingReleasedPremiums: { type: Number, default: 0 },          // C330
    feesPaidToBrokers: { type: Number, default: 0 },                  // C340
    directFeesReclassified: { type: Number, default: 0 },             // C350
    directExpensesReclassified: { type: Number, default: 0 },         // C360
    recognitionOfRetainedInterests: { type: Number, default: 0 },     // C370
    pairOffExpenses: { type: Number, default: 0 },                    // C380
    provisionForRepurchaseReserve: { type: Number, default: 0 },      // C390
    locomAdjustments: { type: Number, default: 0 },                   // C400
    irlcIncome: { type: Number, default: 0 },                         // C410
    gainsOnDerivativesHedging: { type: Number, default: 0 },          // C420
    gainOnFVChangesLHS: { type: Number, default: 0 },                 // C430
    otherSecondaryMarketGains: { type: Number, default: 0 },          // C440
    netSecondaryMarketingIncome: { type: Number, default: 0 },        // C450 CALCULATED
    // Servicing-Related Non-Interest Income
    servicingFeesFirstMortgages: { type: Number, default: 0 },        // C500
    servicingFeesOtherMortgages: { type: Number, default: 0 },        // C510
    subservicingFees: { type: Number, default: 0 },                   // C520
    lateFees: { type: Number, default: 0 },                           // C540
    amortizationOfMSRs: { type: Number, default: 0 },                 // C550
    changesMSRValuationAllowance: { type: Number, default: 0 },       // C570
    totalServicingIncome: { type: Number, default: 0 },               // C650 CALCULATED
    // Other Non-Interest Income
    gainFromSaleOfSecurities: { type: Number, default: 0 },           // C720
    otherNonInterestIncome: { type: Number, default: 0 },             // C770
    totalOtherNonInterestIncome: { type: Number, default: 0 },        // C780 CALCULATED
    totalGrossIncome: { type: Number, default: 0 },                   // C800 CALCULATED
    // Interest Expense
    warehousingInterestExpense: { type: Number, default: 0 },         // C100
    otherInterestExpense: { type: Number, default: 0 },               // C150
    totalInterestExpense: { type: Number, default: 0 }                // C160 CALCULATED
  },

  // --- Schedule CF: Cash Flow ---
  scheduleCF: {
    netCashFromOperating: { type: Number, default: 0 },    // CF010
    cashFromInvesting: { type: Number, default: 0 },       // CF020
    cashFromFinancing: { type: Number, default: 0 },       // CF030
    totalCashChange: { type: Number, default: 0 }          // CF040 CALCULATED
  },

  // --- Schedule D: Non-Interest Expense ---
  scheduleD: {
    // Personnel Compensation
    loanProductionOfficers: { type: Number, default: 0 },    // D010
    loanOrigination: { type: Number, default: 0 },           // D020
    warehousingSecondaryMktg: { type: Number, default: 0 },  // D030
    postCloseSupport: { type: Number, default: 0 },          // D040
    originationManagement: { type: Number, default: 0 },     // D050
    totalOriginationComp: { type: Number, default: 0 },      // D070 CALCULATED
    servicingManagement: { type: Number, default: 0 },       // D080
    otherServicingPersonnel: { type: Number, default: 0 },   // D090
    totalServicingComp: { type: Number, default: 0 },        // D100 CALCULATED
    // Other Expenses
    occupancyAndEquipment: { type: Number, default: 0 },     // D200
    technologyExpenses: { type: Number, default: 0 },        // D210
    outsourcingFees: { type: Number, default: 0 },           // D220
    professionalFees: { type: Number, default: 0 },          // D230
    allOtherExpenses: { type: Number, default: 0 },          // D280
    // Corporate Administration
    corporateManagement: { type: Number, default: 0 },       // D400
    corporateTech: { type: Number, default: 0 },             // D410
    otherCorporateExpenses: { type: Number, default: 0 },    // D430
    totalCorporateAdmin: { type: Number, default: 0 },       // D440 CALCULATED
    totalGrossExpenses: { type: Number, default: 0 },        // D310 CALCULATED
    preTaxNetOperatingIncome: { type: Number, default: 0 },  // D510 CALCULATED
    incomeTaxes: { type: Number, default: 0 },               // D520
    netIncome: { type: Number, default: 0 }                  // D600 CALCULATED
  },

  // --- Schedule O: Reserves ---
  scheduleO: {
    // Credit Loss Reserves
    creditLossBeginning: { type: Number, default: 0 },        // O010
    provisionForCreditLosses: { type: Number, default: 0 },   // O020
    chargeOffsNet: { type: Number, default: 0 },              // O030
    creditLossEnding: { type: Number, default: 0 },           // O060 CALCULATED
    // REO Valuation
    reoBeginning: { type: Number, default: 0 },               // O110
    reoChanges: { type: Number, default: 0 },                 // O120
    reoEnding: { type: Number, default: 0 },                  // O130 CALCULATED
    // Repurchase Reserves
    repurchaseBeginning: { type: Number, default: 0 },        // O310
    provisionForRepurchases: { type: Number, default: 0 },    // O320
    repurchaseChargeOffs: { type: Number, default: 0 },       // O330
    repurchaseEnding: { type: Number, default: 0 },           // O350 CALCULATED
    upbRepurchased: { type: Number, default: 0 },             // O360: Memo
    loansRepurchased: { type: Number, default: 0 }            // O370: Memo
  },

  // --- Explanatory Notes ---
  explanatoryNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

FinancialConditionSchema.index({ company: 1, year: 1, quarter: 1 }, { unique: true });

module.exports = mongoose.model('FinancialCondition', FinancialConditionSchema);
