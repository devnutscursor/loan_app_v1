/**
 * Utility for generating MISMO 3.4 XML files from loan data
 */

/**
 * Generates a MISMO 3.4 XML string from loan application data
 * @param {Object} loan - The loan application data
 * @returns {string} - XML string in MISMO 3.4 format
 */
export const generateMismoXml = (loan) => {
  const createdDatetime = new Date().toISOString();
  
  // Basic XML structure
  let xml = `<?xml version="1.0" encoding="utf-8"?>
<MESSAGE xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ULAD="http://www.datamodelextension.org/Schema/ULAD" xmlns:DU="http://www.datamodelextension.org/Schema/DU" xmlns:xlink="http://www.w3.org/1999/xlink" MISMOReferenceModelIdentifier="3.4.032420160128" xsi:schemaLocation="http://www.mismo.org/residential/2009/schemas DU_Wrapper_3.4.0_B324.xsd" xmlns="http://www.mismo.org/residential/2009/schemas">
  <ABOUT_VERSIONS>
    <ABOUT_VERSION>
      <CreatedDatetime>${createdDatetime}</CreatedDatetime>
    </ABOUT_VERSION>
  </ABOUT_VERSIONS>`;

  // Start DEAL_SETS section
  xml += `
  <DEAL_SETS>
    <DEAL_SET>
      <DEALS>
        <DEAL>`;
          
  // Add ASSETS section
  xml += generateAssetsXml(loan);
  
  // Add COLLATERALS section
  xml += generateCollateralsXml(loan);
  
  // Add LIABILITIES section
  xml += generateLiabilitiesXml(loan);
  
  // Add EXPENSES section
  xml += generateExpensesXml(loan);
  
  // Add LOANS section
  xml += generateLoansXml(loan);
  
  // Add PARTIES section
  xml += generatePartiesXml(loan);
  
  // Add RELATIONSHIPS section
  xml += generateRelationshipsXml(loan);
  
  // Close DEAL section
  xml += `
        </DEAL>
      </DEALS>
    </DEAL_SET>
  </DEAL_SETS>`;
  
  // Add DOCUMENT_SETS section
  xml += `
  <DOCUMENT_SETS>
    <DOCUMENT_SET>
      <DOCUMENTS>
        <DOCUMENT>
          <SIGNATORIES>
            <SIGNATORY>
              <EXECUTION>
                <EXECUTION_DETAIL>
                  <ExecutionDate>${formatDate(new Date())}</ExecutionDate>
                </EXECUTION_DETAIL>
              </EXECUTION>
            </SIGNATORY>
          </SIGNATORIES>
        </DOCUMENT>
      </DOCUMENTS>
    </DOCUMENT_SET>
  </DOCUMENT_SETS>
</MESSAGE>`;

  return xml;
};

/**
 * Format date as YYYYMMDD
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
const formatDate = (date) => {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
};

/**
 * Generate Assets XML section
 * @param {Object} loan - Loan data
 * @returns {string} - XML string for assets
 */
const generateAssetsXml = (loan) => {
  let xml = `
          <ASSETS>`;
  
  // Check if loan has assets
  const assets = loan.assets || {};
  let assetCounter = 1;
  
  // Add checking and savings accounts
  if (assets.checkingAndSavings && assets.checkingAndSavings.length > 0) {
    assets.checkingAndSavings.forEach(account => {
      xml += `
            <ASSET SequenceNumber="${assetCounter}" xlink:label="ASSET_${assetCounter}">
              <ASSET_DETAIL>
                <AssetCashOrMarketValueAmount>${account.value || 0}</AssetCashOrMarketValueAmount>
                <AssetType>${account.accountType === 'Checking' ? 'CheckingAccount' : 
                           account.accountType === 'Savings' ? 'SavingsAccount' : 
                           account.accountType === 'Money Market' ? 'MoneyMarketAccount' : 
                           'CertificateOfDeposit'}</AssetType>
              </ASSET_DETAIL>
              <ASSET_HOLDER>
                <NAME>
                  <FullName>${account.bankName || ''}</FullName>
                </NAME>
              </ASSET_HOLDER>
            </ASSET>`;
      assetCounter++;
    });
  }
  
  // Add stocks and bonds
  if (assets.stocksAndBonds && assets.stocksAndBonds.length > 0) {
    assets.stocksAndBonds.forEach(stock => {
      xml += `
            <ASSET SequenceNumber="${assetCounter}" xlink:label="ASSET_${assetCounter}">
              <ASSET_DETAIL>
                <AssetCashOrMarketValueAmount>${stock.value || 0}</AssetCashOrMarketValueAmount>
                <AssetType>Stock</AssetType>
              </ASSET_DETAIL>
            </ASSET>`;
      assetCounter++;
    });
  }
  
  // Add gifts and grants
  if (assets.giftsAndGrants && assets.giftsAndGrants.length > 0) {
    assets.giftsAndGrants.forEach(gift => {
      xml += `
            <ASSET SequenceNumber="${assetCounter}" xlink:label="ASSET_${assetCounter}">
              <ASSET_DETAIL>
                <AssetCashOrMarketValueAmount>${gift.value || 0}</AssetCashOrMarketValueAmount>
                <AssetType>GiftOfCash</AssetType>
                <FundsSourceType>${mapGiftSource(gift.source)}</FundsSourceType>
              </ASSET_DETAIL>
            </ASSET>`;
      assetCounter++;
    });
  }
  
  // Add miscellaneous assets
  if (assets.miscellaneous) {
    const misc = assets.miscellaneous;
    
    // Earnest Money
    if (misc.earnestMoney) {
      xml += `
            <ASSET SequenceNumber="${assetCounter}" xlink:label="ASSET_${assetCounter}">
              <ASSET_DETAIL>
                <AssetCashOrMarketValueAmount>${misc.earnestMoney || 0}</AssetCashOrMarketValueAmount>
                <AssetType>Other</AssetType>
                <AssetTypeOtherDescription>EarnestMoney</AssetTypeOtherDescription>
              </ASSET_DETAIL>
            </ASSET>`;
      assetCounter++;
    }
    
    // Life Insurance
    if (misc.lifeInsurance) {
      xml += `
            <ASSET SequenceNumber="${assetCounter}" xlink:label="ASSET_${assetCounter}">
              <ASSET_DETAIL>
                <AssetCashOrMarketValueAmount>${misc.lifeInsurance || 0}</AssetCashOrMarketValueAmount>
                <AssetType>LifeInsurance</AssetType>
              </ASSET_DETAIL>
            </ASSET>`;
      assetCounter++;
    }
    
    // Vested Interest in Retirement
    if (misc.vestedInterestInRetirement) {
      xml += `
            <ASSET SequenceNumber="${assetCounter}" xlink:label="ASSET_${assetCounter}">
              <ASSET_DETAIL>
                <AssetCashOrMarketValueAmount>${misc.vestedInterestInRetirement || 0}</AssetCashOrMarketValueAmount>
                <AssetType>RetirementFund</AssetType>
              </ASSET_DETAIL>
            </ASSET>`;
      assetCounter++;
    }
    
    // Other Assets
    if (misc.otherAssets) {
      xml += `
            <ASSET SequenceNumber="${assetCounter}" xlink:label="ASSET_${assetCounter}">
              <ASSET_DETAIL>
                <AssetCashOrMarketValueAmount>${misc.otherAssets || 0}</AssetCashOrMarketValueAmount>
                <AssetType>Other</AssetType>
                <AssetTypeOtherDescription>OtherLiquidAsset</AssetTypeOtherDescription>
              </ASSET_DETAIL>
            </ASSET>`;
      assetCounter++;
    }
  }
  
  // Close ASSETS section
  xml += `
          </ASSETS>`;
  
  return xml;
};

/**
 * Map gift source to MISMO standard values
 * @param {string} source - Application gift source
 * @returns {string} - MISMO gift source
 */
const mapGiftSource = (source) => {
  if (!source) return 'Other';
  
  const sourceMap = {
    'Relative': 'Relative',
    'Friend': 'Other',
    'Employer': 'Employer',
    'Municipality': 'Other',
    'Non-Profit': 'NonProfit',
    'Other': 'Other'
  };
  
  return sourceMap[source] || 'Other';
};

/**
 * Generate Collaterals XML section
 * @param {Object} loan - Loan data
 * @returns {string} - XML string for collaterals
 */
const generateCollateralsXml = (loan) => {
  const property = loan.property || {};
  
  return `
          <COLLATERALS>
            <COLLATERAL>
              <SUBJECT_PROPERTY>
                <ADDRESS>
                  <AddressLineText>${property.addressLine1 || ''}</AddressLineText>
                  <CityName>${property.city || ''}</CityName>
                  <PostalCode>${property.zipCode || ''}</PostalCode>
                  <StateCode>${property.state || ''}</StateCode>
                </ADDRESS>
                <PROPERTY_DETAIL>
                  <PropertyUsageType>${mapOccupancyType(property.occupancyType)}</PropertyUsageType>
                  <PropertyEstimatedValueAmount>${property.propertyValue || 0}</PropertyEstimatedValueAmount>
                </PROPERTY_DETAIL>
                <SALES_CONTRACTS>
                  <SALES_CONTRACT>
                    <SALES_CONTRACT_DETAIL>
                      <SalesContractAmount>${property.contractPurchasePrice || property.propertyValue || 0}</SalesContractAmount>
                    </SALES_CONTRACT_DETAIL>
                  </SALES_CONTRACT>
                </SALES_CONTRACTS>
              </SUBJECT_PROPERTY>
            </COLLATERAL>
          </COLLATERALS>`;
};

/**
 * Map occupancy type to MISMO standard values
 * @param {string} occupancyType - Application occupancy type
 * @returns {string} - MISMO occupancy type
 */
const mapOccupancyType = (occupancyType) => {
  if (!occupancyType) return 'PrimaryResidence';
  
  const typeMap = {
    'Primary Residence': 'PrimaryResidence',
    'Second Home': 'SecondaryResidence',
    'Investment': 'Investment',
    'Vacation Home': 'SecondaryResidence'
  };
  
  return typeMap[occupancyType] || 'PrimaryResidence';
};

/**
 * Generate Liabilities XML section
 * @param {Object} loan - Loan data
 * @returns {string} - XML string for liabilities
 */
const generateLiabilitiesXml = (loan) => {
  let xml = `
          <LIABILITIES>`;
  
  const debts = loan.debts || [];
  
  debts.forEach((debt, index) => {
    xml += `
            <LIABILITY SequenceNumber="${index + 1}" xlink:label="LIABILITY_${index + 1}">
              <LIABILITY_DETAIL>
                <LiabilityExclusionIndicator>false</LiabilityExclusionIndicator>
                <LiabilityMonthlyPaymentAmount>${debt.monthlyPayment || 0}</LiabilityMonthlyPaymentAmount>
                <LiabilityPayoffStatusIndicator>${debt.paidAtClosing ? 'true' : 'false'}</LiabilityPayoffStatusIndicator>
                <LiabilityType>${mapLiabilityType(debt)}</LiabilityType>
                <LiabilityUnpaidBalanceAmount>${debt.balance || 0}</LiabilityUnpaidBalanceAmount>
              </LIABILITY_DETAIL>
              <LIABILITY_HOLDER>
                <NAME>
                  <FullName>${debt.creditor || ''}</FullName>
                </NAME>
              </LIABILITY_HOLDER>
            </LIABILITY>`;
  });
  
  xml += `
          </LIABILITIES>`;
  
  return xml;
};

/**
 * Map liability type to MISMO standard values
 * @param {Object} debt - The debt object
 * @returns {string} - MISMO liability type
 */
const mapLiabilityType = (debt) => {
  // Map common debt types to MISMO liability types
  // Default to "Installment" if no specific mapping exists
  return "Installment";
};

/**
 * Generate Expenses XML section
 * @param {Object} loan - Loan data
 * @returns {string} - XML string for expenses
 */
const generateExpensesXml = (loan) => {
  let xml = `
          <EXPENSES>`;
  
  const expenses = loan.expenses || [];
  
  expenses.forEach((expense, index) => {
    xml += `
            <EXPENSE SequenceNumber="${index + 1}" xlink:label="EXPENSE_${index + 1}">
              <ExpenseType>${expense.expenseType || 'Other'}</ExpenseType>
              <ExpenseMonthlyPaymentAmount>${expense.amount || 0}</ExpenseMonthlyPaymentAmount>
            </EXPENSE>`;
  });
  
  xml += `
          </EXPENSES>`;
  
  return xml;
};

/**
 * Generate Loans XML section
 * @param {Object} loan - Loan data
 * @returns {string} - XML string for loans
 */
const generateLoansXml = (loan) => {
  const loanDetails = loan.loanDetails || {};
  const loanParams = loan.loanParameters || {};
  const propertiesOwned = loan.propertiesOwned || {};
  
  return `
          <LOANS>
            <LOAN LoanRoleType="SubjectLoan" xlink:label="LOAN_1">
              <AMORTIZATION>
                <AMORTIZATION_RULE>
                  <AmortizationType>Fixed</AmortizationType>
                  <LoanAmortizationPeriodCount>${(loanParams.loanTerm || 30) * 12}</LoanAmortizationPeriodCount>
                  <LoanAmortizationPeriodType>Month</LoanAmortizationPeriodType>
                </AMORTIZATION_RULE>
              </AMORTIZATION>
              <HOUSING_EXPENSES>
                ${generateHousingExpensesXml(loan)}
              </HOUSING_EXPENSES>
              <LOAN_DETAIL>
                <ApplicationReceivedDate>${formatDate(new Date(loan.createdAt || new Date()))}</ApplicationReceivedDate>
                <BorrowerCount>1</BorrowerCount>
                <ConstructionLoanIndicator>${loanDetails.loanType === 'Construction' ? 'true' : 'false'}</ConstructionLoanIndicator>
                <TotalMortgagedPropertiesCount>${countMortgagedProperties(loan)}</TotalMortgagedPropertiesCount>
                <HELOCIndicator>${loanDetails.refinanceType === 'Home Equity Line of Credit' ? 'true' : 'false'}</HELOCIndicator>
              </LOAN_DETAIL>
              <TERMS_OF_LOAN>
                <BaseLoanAmount>${loanDetails.loanAmount || 0}</BaseLoanAmount>
                <LoanPurposeType>${mapLoanPurposeType(loanDetails.loanType)}</LoanPurposeType>
                <MortgageType>${getMortgageType(loan)}</MortgageType>
                <NoteRatePercent>${loanParams.interestRate || 0}</NoteRatePercent>
                <NoteAmount>${loanDetails.loanAmount || 0}</NoteAmount>
              </TERMS_OF_LOAN>
              <PAYMENT>
                <PAYMENT_RULE>
                  <InitialPrincipalAndInterestPaymentAmount>${loan.loanCalculations?.principalAndInterest || calculateMonthlyPayment(loanDetails.loanAmount, loanParams.interestRate, (loanParams.loanTerm || 30))}</InitialPrincipalAndInterestPaymentAmount>
                </PAYMENT_RULE>
              </PAYMENT>
            </LOAN>
          </LOANS>`;
};

/**
 * Generate Housing Expenses XML section
 * @param {Object} loan - Loan data
 * @returns {string} - XML for housing expenses
 */
const generateHousingExpensesXml = (loan) => {
  let xml = '';
  const propertiesOwned = loan.propertiesOwned || {};
  const loanCalculations = loan.loanCalculations || {};
  
  // Present housing expenses
  if (propertiesOwned.firstMortgage || propertiesOwned.rent) {
    xml += `
                <HOUSING_EXPENSE>
                  <HousingExpensePaymentAmount>${propertiesOwned.firstMortgage || propertiesOwned.rent || 0}</HousingExpensePaymentAmount>
                  <HousingExpenseTimingType>Present</HousingExpenseTimingType>
                  <HousingExpenseType>${propertiesOwned.firstMortgage ? 'FirstMortgagePrincipalAndInterest' : 'Rent'}</HousingExpenseType>
                </HOUSING_EXPENSE>`;
  }
  
  // Other present housing expenses
  if (propertiesOwned.otherHousingExpenses) {
    xml += `
                <HOUSING_EXPENSE>
                  <HousingExpensePaymentAmount>${propertiesOwned.otherHousingExpenses || 0}</HousingExpensePaymentAmount>
                  <HousingExpenseTimingType>Present</HousingExpenseTimingType>
                  <HousingExpenseType>Other</HousingExpenseType>
                </HOUSING_EXPENSE>`;
  }
  
  // Proposed principal and interest
  if (loanCalculations.principalAndInterest) {
    xml += `
                <HOUSING_EXPENSE>
                  <HousingExpensePaymentAmount>${loanCalculations.principalAndInterest || 0}</HousingExpensePaymentAmount>
                  <HousingExpenseTimingType>Proposed</HousingExpenseTimingType>
                  <HousingExpenseType>FirstMortgagePrincipalAndInterest</HousingExpenseType>
                </HOUSING_EXPENSE>`;
  }
  
  // Proposed mortgage insurance
  if (loanCalculations.mortgageInsurance) {
    xml += `
                <HOUSING_EXPENSE>
                  <HousingExpensePaymentAmount>${loanCalculations.mortgageInsurance || 0}</HousingExpensePaymentAmount>
                  <HousingExpenseTimingType>Proposed</HousingExpenseTimingType>
                  <HousingExpenseType>MIPremium</HousingExpenseType>
                </HOUSING_EXPENSE>`;
  }
  
  // Proposed property taxes
  if (loanCalculations.taxes) {
    xml += `
                <HOUSING_EXPENSE>
                  <HousingExpensePaymentAmount>${loanCalculations.taxes || 0}</HousingExpensePaymentAmount>
                  <HousingExpenseTimingType>Proposed</HousingExpenseTimingType>
                  <HousingExpenseType>RealEstateTax</HousingExpenseType>
                </HOUSING_EXPENSE>`;
  }
  
  // Proposed homeowners insurance
  if (loanCalculations.insurance) {
    xml += `
                <HOUSING_EXPENSE>
                  <HousingExpensePaymentAmount>${loanCalculations.insurance || 0}</HousingExpensePaymentAmount>
                  <HousingExpenseTimingType>Proposed</HousingExpenseTimingType>
                  <HousingExpenseType>HazardInsurance</HousingExpenseType>
                </HOUSING_EXPENSE>`;
  }
  
  // Proposed HOA dues
  if (loanCalculations.hoa) {
    xml += `
                <HOUSING_EXPENSE>
                  <HousingExpensePaymentAmount>${loanCalculations.hoa || 0}</HousingExpensePaymentAmount>
                  <HousingExpenseTimingType>Proposed</HousingExpenseTimingType>
                  <HousingExpenseType>HomeownersAssociationDuesAndCondominiumFees</HousingExpenseType>
                </HOUSING_EXPENSE>`;
  }
  
  return xml;
};

/**
 * Calculate monthly principal and interest payment
 * @param {number} loanAmount - Principal loan amount
 * @param {number} interestRate - Annual interest rate (percentage)
 * @param {number} termYears - Loan term in years
 * @returns {number} - Monthly payment amount
 */
const calculateMonthlyPayment = (loanAmount, interestRate, termYears) => {
  if (!loanAmount || !interestRate || !termYears) return 0;
  
  const principal = parseFloat(loanAmount);
  const monthlyRate = parseFloat(interestRate) / 100 / 12;
  const numberOfPayments = parseFloat(termYears) * 12;
  
  // Avoid division by zero
  if (monthlyRate === 0) return principal / numberOfPayments;
  
  const monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments) / 
                        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  
  return parseFloat(monthlyPayment.toFixed(2));
};

/**
 * Count mortgaged properties
 * @param {Object} loan - Loan data
 * @returns {number} - Count of mortgaged properties
 */
const countMortgagedProperties = (loan) => {
  const propertiesOwned = loan.propertiesOwned || {};
  
  // Count 1 for the current property plus any additional properties
  let count = 1;
  
  if (propertiesOwned.properties && Array.isArray(propertiesOwned.properties)) {
    // Add properties that have a mortgage
    propertiesOwned.properties.forEach(property => {
      if (property.hasLoan) count++;
    });
  }
  
  return count;
};

/**
 * Map loan purpose type to MISMO standard values
 * @param {string} loanType - Application loan type
 * @returns {string} - MISMO loan purpose type
 */
const mapLoanPurposeType = (loanType) => {
  if (!loanType) return 'Purchase';
  
  const typeMap = {
    'Purchase': 'Purchase',
    'Refinance': 'Refinance',
    'Construction': 'Construction'
  };
  
  return typeMap[loanType] || 'Purchase';
};

/**
 * Get mortgage type based on loan details
 * @param {Object} loan - Loan data
 * @returns {string} - MISMO mortgage type
 */
const getMortgageType = (loan) => {
  // This is a placeholder - in a real implementation,
  // you would determine the type based on various loan parameters
  return 'Conventional';
};

/**
 * Generate Parties XML section
 * @param {Object} loan - Loan data
 * @returns {string} - XML string for parties
 */
const generatePartiesXml = (loan) => {
  const borrower = loan.borrowerDetails || {};
  const declarations = loan.declarations || {};
  const demographics = loan.demographics || {};
  const militaryService = loan.militaryService || {};
  
  let xml = `
          <PARTIES>
            <PARTY>
              <INDIVIDUAL>
                <CONTACT_POINTS>`;
  
  // Email contact point
  if (borrower.email) {
    xml += `
                  <CONTACT_POINT>
                    <CONTACT_POINT_EMAIL>
                      <ContactPointEmailValue>${borrower.email || ''}</ContactPointEmailValue>
                    </CONTACT_POINT_EMAIL>
                  </CONTACT_POINT>`;
  }
  
  // Phone contact point
  if (borrower.phone) {
    xml += `
                  <CONTACT_POINT>
                    <CONTACT_POINT_TELEPHONE>
                      <ContactPointTelephoneValue>${borrower.phone || ''}</ContactPointTelephoneValue>
                    </CONTACT_POINT_TELEPHONE>
                    <CONTACT_POINT_DETAIL>
                      <ContactPointRoleType>Mobile</ContactPointRoleType>
                    </CONTACT_POINT_DETAIL>
                  </CONTACT_POINT>`;
  }
  
  xml += `
                </CONTACT_POINTS>
                <NAME>
                  <FirstName>${borrower.firstName || ''}</FirstName>
                  ${borrower.middleName ? `<MiddleName>${borrower.middleName}</MiddleName>` : ''}
                  <LastName>${borrower.lastName || ''}</LastName>
                  ${borrower.suffix ? `<NameSuffix>${borrower.suffix}</NameSuffix>` : ''}
                  <FullName>${[borrower.firstName, borrower.middleName, borrower.lastName, borrower.suffix].filter(Boolean).join(' ')}</FullName>
                </NAME>
              </INDIVIDUAL>
              <ROLES>
                <ROLE SequenceNumber="1" xlink:label="BORROWER_1">
                  <BORROWER>
                    <BORROWER_DETAIL>
                      <BorrowerBirthDate>${formatDate(new Date(borrower.dateOfBirth || new Date()))}</BorrowerBirthDate>
                      <DependentCount>${borrower.dependents?.length || 0}</DependentCount>
                      <MaritalStatusType>${mapMaritalStatus(borrower.maritalStatus)}</MaritalStatusType>
                      <SelfDeclaredMilitaryServiceIndicator>${militaryService?.hasServed ? 'true' : 'false'}</SelfDeclaredMilitaryServiceIndicator>
                      <SpousalVABenefitsEligibilityIndicator>${militaryService?.isSurvivingSpouse ? 'true' : 'false'}</SpousalVABenefitsEligibilityIndicator>
                    </BORROWER_DETAIL>
                    ${generateCurrentIncomeXml(loan)}
                    ${generateDeclarationsXml(loan)}
                    ${generateEmployersXml(loan)}
                    ${generateResidencesXml(loan)}
                    ${generateMilitaryServicesXml(loan)}
                    ${generateBankruptciesXml(loan)}
                    ${generateGovernmentMonitoringXml(loan)}
                  </BORROWER>
                  <ROLE_DETAIL>
                    <PartyRoleType>Borrower</PartyRoleType>
                  </ROLE_DETAIL>
                </ROLE>
              </ROLES>
              ${generateTaxpayerIdentifiersXml(loan)}
            </PARTY>
            ${generateLoanOriginationPartyXml(loan)}
          </PARTIES>`;
  
  return xml;
};

/**
 * Map marital status to MISMO standard values
 * @param {string} status - Application marital status
 * @returns {string} - MISMO marital status
 */
const mapMaritalStatus = (status) => {
  if (!status) return 'Unmarried';
  
  const statusMap = {
    'Married': 'Married',
    'Separated': 'Separated',
    'Unmarried': 'Unmarried',
    'Single': 'Unmarried',
    'Divorced': 'Unmarried',
    'Widowed': 'Unmarried',
  };
  
  return statusMap[status] || 'Unmarried';
};

/**
 * Generate Relationships XML section
 * @param {Object} loan - Loan data
 * @returns {string} - XML string for relationships
 */
const generateRelationshipsXml = (loan) => {
  const assets = loan.assets || {};
  const debts = loan.debts || [];
  const income = loan.income || {};
  
  let xml = `
          <RELATIONSHIPS xsi:type="RELATIONSHIPS">`;
  
  let relationshipCounter = 1;
  
  // Asset relationships
  if (assets.checkingAndSavings && assets.checkingAndSavings.length > 0) {
    assets.checkingAndSavings.forEach((_, index) => {
      xml += `
            <RELATIONSHIP SequenceNumber="${relationshipCounter}" xlink:from="ASSET_${index + 1}" xlink:to="BORROWER_1" xlink:arcrole="urn:fdc:mismo.org:2009:residential/ASSET_IsAssociatedWith_ROLE" />`;
      relationshipCounter++;
    });
  }
  
  if (assets.stocksAndBonds && assets.stocksAndBonds.length > 0) {
    const startIndex = (assets.checkingAndSavings?.length || 0) + 1;
    assets.stocksAndBonds.forEach((_, index) => {
      xml += `
            <RELATIONSHIP SequenceNumber="${relationshipCounter}" xlink:from="ASSET_${startIndex + index}" xlink:to="BORROWER_1" xlink:arcrole="urn:fdc:mismo.org:2009:residential/ASSET_IsAssociatedWith_ROLE" />`;
      relationshipCounter++;
    });
  }
  
  // Liability relationships
  debts.forEach((_, index) => {
    xml += `
            <RELATIONSHIP SequenceNumber="${relationshipCounter}" xlink:from="LIABILITY_${index + 1}" xlink:to="BORROWER_1" xlink:arcrole="urn:fdc:mismo.org:2009:residential/LIABILITY_IsAssociatedWith_ROLE" />`;
    relationshipCounter++;
  });
  
  // Income relationships
  if (income && loan.borrowerDetails?.employers) {
    const employers = loan.borrowerDetails.employers;
    let incomeCounter = 1;
    
    // Base income - connect to first employer
    if (income.baseIncome && employers.length > 0) {
      xml += `
            <RELATIONSHIP SequenceNumber="${relationshipCounter}" xlink:from="CURRENT_INCOME_ITEM_${incomeCounter}" xlink:to="EMPLOYER_1" xlink:arcrole="urn:fdc:mismo.org:2009:residential/CURRENT_INCOME_ITEM_IsAssociatedWith_EMPLOYER" />`;
      relationshipCounter++;
      incomeCounter++;
    }
    
    // Overtime income - connect to first employer
    if (income.overtime && employers.length > 0) {
      xml += `
            <RELATIONSHIP SequenceNumber="${relationshipCounter}" xlink:from="CURRENT_INCOME_ITEM_${incomeCounter}" xlink:to="EMPLOYER_1" xlink:arcrole="urn:fdc:mismo.org:2009:residential/CURRENT_INCOME_ITEM_IsAssociatedWith_EMPLOYER" />`;
      relationshipCounter++;
      incomeCounter++;
    }
    
    // Bonuses income - connect to first employer
    if (income.bonuses && employers.length > 0) {
      xml += `
            <RELATIONSHIP SequenceNumber="${relationshipCounter}" xlink:from="CURRENT_INCOME_ITEM_${incomeCounter}" xlink:to="EMPLOYER_1" xlink:arcrole="urn:fdc:mismo.org:2009:residential/CURRENT_INCOME_ITEM_IsAssociatedWith_EMPLOYER" />`;
      relationshipCounter++;
      incomeCounter++;
    }
  }
  
  xml += `
          </RELATIONSHIPS>`;
  
  return xml;
};

/**
 * Download XML as a file
 * @param {string} xmlString - XML content to download
 * @param {string} filename - Name of the file to download
 */
export const downloadXmlFile = (xmlString, filename) => {
  const blob = new Blob([xmlString], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate Current Income XML section
 * @param {Object} loan - Loan data
 * @returns {string} - XML for current income
 */
const generateCurrentIncomeXml = (loan) => {
  const income = loan.income || {};
  let xml = '';
  let incomeCounter = 1;
  
  if (Object.keys(income).length > 0) {
    xml = `
                    <CURRENT_INCOME>
                      <CURRENT_INCOME_ITEMS>`;
    
    // Base income
    if (income.baseIncome) {
      xml += `
                        <CURRENT_INCOME_ITEM SequenceNumber="${incomeCounter}" xlink:label="CURRENT_INCOME_ITEM_${incomeCounter}">
                          <CURRENT_INCOME_ITEM_DETAIL>
                            <CurrentIncomeMonthlyTotalAmount>${income.baseIncome || 0}</CurrentIncomeMonthlyTotalAmount>
                            <EmploymentIncomeIndicator>true</EmploymentIncomeIndicator>
                            <IncomeType>Base</IncomeType>
                          </CURRENT_INCOME_ITEM_DETAIL>
                        </CURRENT_INCOME_ITEM>`;
      incomeCounter++;
    }
    
    // Overtime income
    if (income.overtime) {
      xml += `
                        <CURRENT_INCOME_ITEM SequenceNumber="${incomeCounter}" xlink:label="CURRENT_INCOME_ITEM_${incomeCounter}">
                          <CURRENT_INCOME_ITEM_DETAIL>
                            <CurrentIncomeMonthlyTotalAmount>${income.overtime || 0}</CurrentIncomeMonthlyTotalAmount>
                            <EmploymentIncomeIndicator>true</EmploymentIncomeIndicator>
                            <IncomeType>Overtime</IncomeType>
                          </CURRENT_INCOME_ITEM_DETAIL>
                        </CURRENT_INCOME_ITEM>`;
      incomeCounter++;
    }
    
    // Bonuses income
    if (income.bonuses) {
      xml += `
                        <CURRENT_INCOME_ITEM SequenceNumber="${incomeCounter}" xlink:label="CURRENT_INCOME_ITEM_${incomeCounter}">
                          <CURRENT_INCOME_ITEM_DETAIL>
                            <CurrentIncomeMonthlyTotalAmount>${income.bonuses || 0}</CurrentIncomeMonthlyTotalAmount>
                            <EmploymentIncomeIndicator>true</EmploymentIncomeIndicator>
                            <IncomeType>Bonus</IncomeType>
                          </CURRENT_INCOME_ITEM_DETAIL>
                        </CURRENT_INCOME_ITEM>`;
      incomeCounter++;
    }
    
    // Commissions income
    if (income.commissions) {
      xml += `
                        <CURRENT_INCOME_ITEM SequenceNumber="${incomeCounter}" xlink:label="CURRENT_INCOME_ITEM_${incomeCounter}">
                          <CURRENT_INCOME_ITEM_DETAIL>
                            <CurrentIncomeMonthlyTotalAmount>${income.commissions || 0}</CurrentIncomeMonthlyTotalAmount>
                            <EmploymentIncomeIndicator>true</EmploymentIncomeIndicator>
                            <IncomeType>Commission</IncomeType>
                          </CURRENT_INCOME_ITEM_DETAIL>
                        </CURRENT_INCOME_ITEM>`;
      incomeCounter++;
    }
    
    // Military entitlements
    if (income.militaryEntitlements) {
      xml += `
                        <CURRENT_INCOME_ITEM SequenceNumber="${incomeCounter}" xlink:label="CURRENT_INCOME_ITEM_${incomeCounter}">
                          <CURRENT_INCOME_ITEM_DETAIL>
                            <CurrentIncomeMonthlyTotalAmount>${income.militaryEntitlements || 0}</CurrentIncomeMonthlyTotalAmount>
                            <EmploymentIncomeIndicator>true</EmploymentIncomeIndicator>
                            <IncomeType>MilitaryEntitlement</IncomeType>
                          </CURRENT_INCOME_ITEM_DETAIL>
                        </CURRENT_INCOME_ITEM>`;
      incomeCounter++;
    }
    
    // Other income items
    if (income.otherIncome && Array.isArray(income.otherIncome)) {
      income.otherIncome.forEach(otherIncome => {
        if (otherIncome.amount) {
          xml += `
                        <CURRENT_INCOME_ITEM SequenceNumber="${incomeCounter}" xlink:label="CURRENT_INCOME_ITEM_${incomeCounter}">
                          <CURRENT_INCOME_ITEM_DETAIL>
                            <CurrentIncomeMonthlyTotalAmount>${otherIncome.amount || 0}</CurrentIncomeMonthlyTotalAmount>
                            <EmploymentIncomeIndicator>false</EmploymentIncomeIndicator>
                            <IncomeType>Other</IncomeType>
                            <OtherIncomeType>${otherIncome.incomeType || 'Other'}</OtherIncomeType>
                          </CURRENT_INCOME_ITEM_DETAIL>
                        </CURRENT_INCOME_ITEM>`;
          incomeCounter++;
        }
      });
    }
    
    xml += `
                      </CURRENT_INCOME_ITEMS>
                    </CURRENT_INCOME>`;
  }
  
  return xml;
};

/**
 * Generate Declarations XML section
 * @param {Object} loan - Loan data
 * @returns {string} - XML for declarations
 */
const generateDeclarationsXml = (loan) => {
  const declarations = loan.declarations || {};
  
  return `
                    <DECLARATION>
                      <DECLARATION_DETAIL>
                        <BankruptcyIndicator>${declarations.declaredBankruptcy ? 'true' : 'false'}</BankruptcyIndicator>
                        <CitizenshipResidencyType>${mapCitizenshipType(loan.borrowerDetails?.citizenship)}</CitizenshipResidencyType>
                        <HomeownerPastThreeYearsType>${declarations.hadOwnershipInterest ? 'Yes' : 'No'}</HomeownerPastThreeYearsType>
                        <IntentToOccupyType>${declarations.occupyAsPrimary ? 'Yes' : 'No'}</IntentToOccupyType>
                        <OutstandingJudgmentsIndicator>${declarations.outstandingJudgements ? 'true' : 'false'}</OutstandingJudgmentsIndicator>
                        <PartyToLawsuitIndicator>${declarations.partyToLawsuit ? 'true' : 'false'}</PartyToLawsuitIndicator>
                        <PresentlyDelinquentIndicator>${declarations.delinquent ? 'true' : 'false'}</PresentlyDelinquentIndicator>
                        <PriorPropertyForeclosureCompletedIndicator>${declarations.propertyForeclosed ? 'true' : 'false'}</PriorPropertyForeclosureCompletedIndicator>
                        <UndisclosedBorrowedFundsIndicator>${declarations.borrowingMoney ? 'true' : 'false'}</UndisclosedBorrowedFundsIndicator>
                        ${declarations.borrowingMoneyAmount ? `<UndisclosedBorrowedFundsAmount>${declarations.borrowingMoneyAmount}</UndisclosedBorrowedFundsAmount>` : ''}
                        <UndisclosedComakerOfNoteIndicator>${declarations.coSigner ? 'true' : 'false'}</UndisclosedComakerOfNoteIndicator>
                        <UndisclosedMortgageApplicationIndicator>${declarations.applyingForMortgage ? 'true' : 'false'}</UndisclosedMortgageApplicationIndicator>
                      </DECLARATION_DETAIL>
                    </DECLARATION>`;
};

/**
 * Generate Employers XML section
 * @param {Object} loan - Loan data
 * @returns {string} - XML for employers
 */
const generateEmployersXml = (loan) => {
  const borrowerDetails = loan.borrowerDetails || {};
  const employers = borrowerDetails.employers || [];
  let xml = '';
  
  if (employers.length > 0) {
    xml = `
                    <EMPLOYERS>`;
    
    employers.forEach((employer, index) => {
      xml += `
                      <EMPLOYER SequenceNumber="${index + 1}" xlink:label="EMPLOYER_${index + 1}">
                        <LEGAL_ENTITY>
                          <CONTACTS>
                            <CONTACT>
                              <CONTACT_POINTS>
                                <CONTACT_POINT>
                                  <CONTACT_POINT_TELEPHONE>
                                    <ContactPointTelephoneValue>${employer.companyPhone || ''}</ContactPointTelephoneValue>
                                  </CONTACT_POINT_TELEPHONE>
                                  <CONTACT_POINT_DETAIL>
                                    <ContactPointRoleType>Work</ContactPointRoleType>
                                  </CONTACT_POINT_DETAIL>
                                </CONTACT_POINT>
                              </CONTACT_POINTS>
                            </CONTACT>
                          </CONTACTS>
                          <LEGAL_ENTITY_DETAIL>
                            <FullName>${employer.companyName || ''}</FullName>
                          </LEGAL_ENTITY_DETAIL>
                        </LEGAL_ENTITY>
                        <ADDRESS>
                          <AddressLineText>${employer.streetAddress || ''}</AddressLineText>
                          ${employer.aptSteNum ? `<AddressUnitIdentifier>${employer.aptSteNum}</AddressUnitIdentifier>` : ''}
                          <CityName>${employer.city || ''}</CityName>
                          <PostalCode>${employer.zipCode || ''}</PostalCode>
                          <StateCode>${employer.state || ''}</StateCode>
                        </ADDRESS>
                        <EMPLOYMENT>
                          <EmploymentBorrowerSelfEmployedIndicator>${employer.isSelfEmployed === 'Yes' ? 'true' : 'false'}</EmploymentBorrowerSelfEmployedIndicator>
                          <EmploymentMonthlyIncomeAmount>${employer.monthlyIncome || 0}</EmploymentMonthlyIncomeAmount>
                          <EmploymentClassificationType>${index === 0 ? 'Primary' : 'Secondary'}</EmploymentClassificationType>
                          <EmploymentPositionDescription>${employer.jobTitle || ''}</EmploymentPositionDescription>
                          <EmploymentStartDate>${formatDate(new Date(employer.startDate || new Date()))}</EmploymentStartDate>
                          <EmploymentStatusType>${employer.employmentStatus || 'Current'}</EmploymentStatusType>
                          ${employer.endDate ? `<EmploymentEndDate>${formatDate(new Date(employer.endDate))}</EmploymentEndDate>` : ''}
                          <SpecialBorrowerEmployerRelationshipIndicator>false</SpecialBorrowerEmployerRelationshipIndicator>
                          <OwnershipInterestType>${employer.ownsMoreThan25Percent === 'Yes' ? 'GreaterThanOrEqual25Percent' : 'LessThan25Percent'}</OwnershipInterestType>
                        </EMPLOYMENT>
                      </EMPLOYER>`;
    });
    
    xml += `
                    </EMPLOYERS>`;
  }
  
  return xml;
};

/**
 * Generate Residences XML section
 * @param {Object} loan - Loan data
 * @returns {string} - XML for residences
 */
const generateResidencesXml = (loan) => {
  const borrowerDetails = loan.borrowerDetails || {};
  let xml = '';
  
  if (borrowerDetails.currentAddress) {
    xml = `
                    <RESIDENCES>
                      <RESIDENCE>
                        <ADDRESS>
                          <AddressLineText>${borrowerDetails.currentAddress.streetAddress || ''}</AddressLineText>
                          ${borrowerDetails.currentAddress.aptSteNum ? `<AddressUnitIdentifier>${borrowerDetails.currentAddress.aptSteNum}</AddressUnitIdentifier>` : ''}
                          <CityName>${borrowerDetails.currentAddress.city || ''}</CityName>
                          <PostalCode>${borrowerDetails.currentAddress.zipCode || ''}</PostalCode>
                          <StateCode>${borrowerDetails.currentAddress.state || ''}</StateCode>
                        </ADDRESS>
                        <RESIDENCE_DETAIL>
                          <BorrowerResidencyBasisType>${mapHousingStatus(borrowerDetails.currentAddress.housingStatus)}</BorrowerResidencyBasisType>
                          <BorrowerResidencyDurationMonthsCount>${(borrowerDetails.currentAddress.yearsAtAddress || 0) * 12 + (borrowerDetails.currentAddress.monthsAtAddress || 0)}</BorrowerResidencyDurationMonthsCount>
                          <BorrowerResidencyType>Current</BorrowerResidencyType>
                        </RESIDENCE_DETAIL>
                      </RESIDENCE>`;
    
    // Add previous addresses
    if (borrowerDetails.previousAddresses && borrowerDetails.previousAddresses.length > 0) {
      borrowerDetails.previousAddresses.forEach((address, index) => {
        xml += `
                      <RESIDENCE>
                        <ADDRESS>
                          <AddressLineText>${address.streetAddress || ''}</AddressLineText>
                          ${address.aptSteNum ? `<AddressUnitIdentifier>${address.aptSteNum}</AddressUnitIdentifier>` : ''}
                          <CityName>${address.city || ''}</CityName>
                          <PostalCode>${address.zipCode || ''}</PostalCode>
                          <StateCode>${address.state || ''}</StateCode>
                        </ADDRESS>
                        <RESIDENCE_DETAIL>
                          <BorrowerResidencyBasisType>${mapHousingStatus(address.housingStatus)}</BorrowerResidencyBasisType>
                          <BorrowerResidencyDurationMonthsCount>${(address.yearsAtAddress || 0) * 12 + (address.monthsAtAddress || 0)}</BorrowerResidencyDurationMonthsCount>
                          <BorrowerResidencyType>Former</BorrowerResidencyType>
                        </RESIDENCE_DETAIL>
                      </RESIDENCE>`;
      });
    }
    
    xml += `
                    </RESIDENCES>`;
  }
  
  return xml;
};

/**
 * Map housing status to MISMO standard values
 * @param {string} status - Application housing status
 * @returns {string} - MISMO housing status
 */
const mapHousingStatus = (status) => {
  if (!status) return 'Own';
  
  const statusMap = {
    'Own': 'Own',
    'Rent': 'Rent',
    'Living Rent Free': 'Other',
    'Living with Parents': 'Other',
    'Other': 'Other'
  };
  
  return statusMap[status] || 'Own';
};

/**
 * Map citizenship type to MISMO standard values
 * @param {string} citizenship - Application citizenship
 * @returns {string} - MISMO citizenship type
 */
const mapCitizenshipType = (citizenship) => {
  if (!citizenship) return 'USCitizen';
  
  const citizenshipMap = {
    'U.S. Citizen': 'USCitizen',
    'Permanent Resident Alien': 'PermanentResidentAlien',
    'Non-Permanent Resident Alien': 'NonPermanentResidentAlien'
  };
  
  return citizenshipMap[citizenship] || 'USCitizen';
};

/**
 * Generate Military Services XML section
 * @param {Object} loan - Loan data
 * @returns {string} - XML for military services
 */
const generateMilitaryServicesXml = (loan) => {
  const militaryService = loan.militaryService || {};
  let xml = '';
  
  if (militaryService.hasServed || militaryService.isSurvivingSpouse) {
    xml = `
                    <MILITARY_SERVICES>
                      <MILITARY_SERVICE>
                        <MILITARY_SERVICE_DETAIL>`;
    
    if (militaryService.currentlyServing) {
      xml += `
                          <MilitaryStatusType>ActiveDuty</MilitaryStatusType>`;
    } else if (militaryService.isRetired) {
      xml += `
                          <MilitaryStatusType>Retired</MilitaryStatusType>`;
    } else if (militaryService.isNonActivated) {
      xml += `
                          <MilitaryStatusType>ReserveNationalGuardNeverActivated</MilitaryStatusType>`;
    } else if (militaryService.isSurvivingSpouse) {
      xml += `
                          <MilitaryStatusType>SurvivingSpouse</MilitaryStatusType>`;
    } else {
      xml += `
                          <MilitaryStatusType>Veteran</MilitaryStatusType>`;
    }
    
    xml += `
                        </MILITARY_SERVICE_DETAIL>
                      </MILITARY_SERVICE>
                    </MILITARY_SERVICES>`;
  }
  
  return xml;
};

/**
 * Generate Bankruptcies XML section
 * @param {Object} loan - Loan data
 * @returns {string} - XML for bankruptcies
 */
const generateBankruptciesXml = (loan) => {
  const declarations = loan.declarations || {};
  let xml = '';
  
  if (declarations.declaredBankruptcy) {
    xml = `
                    <BANKRUPTCIES>
                      <BANKRUPTCY>
                        <BANKRUPTCY_DETAIL>
                          <BankruptcyChapterType>${mapBankruptcyType(declarations.bankruptcyType)}</BankruptcyChapterType>
                        </BANKRUPTCY_DETAIL>
                      </BANKRUPTCY>
                    </BANKRUPTCIES>`;
  }
  
  return xml;
};

/**
 * Map bankruptcy type to MISMO standard values
 * @param {string} type - Application bankruptcy type
 * @returns {string} - MISMO bankruptcy type
 */
const mapBankruptcyType = (type) => {
  if (!type) return 'ChapterSeven';
  
  const typeMap = {
    'Chapter 7': 'ChapterSeven',
    'Chapter 11': 'ChapterEleven',
    'Chapter 12': 'ChapterTwelve',
    'Chapter 13': 'ChapterThirteen'
  };
  
  return typeMap[type] || 'ChapterSeven';
};

/**
 * Generate Government Monitoring XML section
 * @param {Object} loan - Loan data
 * @returns {string} - XML for government monitoring
 */
const generateGovernmentMonitoringXml = (loan) => {
  const demographics = loan.demographics || {};
  let xml = '';
  
  xml = `
                    <GOVERNMENT_MONITORING>
                      <GOVERNMENT_MONITORING_DETAIL>
                        <EXTENSION>
                          <OTHER>
                            <ULAD:GOVERNMENT_MONITORING_DETAIL_EXTENSION>
                              <ULAD:ApplicationTakenMethodType>Internet</ULAD:ApplicationTakenMethodType>
                              <ULAD:HMDAGenderType>${mapGender(demographics.gender)}</ULAD:HMDAGenderType>
                            </ULAD:GOVERNMENT_MONITORING_DETAIL_EXTENSION>
                          </OTHER>
                        </EXTENSION>
                      </GOVERNMENT_MONITORING_DETAIL>`;
  
  // Add Race information
  if (demographics.race) {
    xml += `
                      <HMDA_RACES>
                        <HMDA_RACE>
                          <HMDA_RACE_DETAIL>
                            <HMDARaceType>${mapRace(demographics.race)}</HMDARaceType>
                            ${demographics.tribe ? `<HMDARaceTypeAdditionalDescription>${demographics.tribe}</HMDARaceTypeAdditionalDescription>` : ''}
                          </HMDA_RACE_DETAIL>
                        </HMDA_RACE>
                      </HMDA_RACES>`;
  }
  
  // Add Ethnicity information
  if (demographics.ethnicity) {
    xml += `
                      <EXTENSION>
                        <OTHER>
                          <ULAD:GOVERNMENT_MONITORING_EXTENSION>
                            <ULAD:HMDA_ETHNICITIES>
                              <ULAD:HMDA_ETHNICITY>
                                <ULAD:HMDAEthnicityType>${mapEthnicity(demographics.ethnicity)}</ULAD:HMDAEthnicityType>
                              </ULAD:HMDA_ETHNICITY>
                            </ULAD:HMDA_ETHNICITIES>
                          </ULAD:GOVERNMENT_MONITORING_EXTENSION>
                        </OTHER>
                      </EXTENSION>`;
  }
  
  // Add Ethnicity Origin information
  if (demographics.origin) {
    xml += `
                      <HMDA_ETHNICITY_ORIGINS>
                        <HMDA_ETHNICITY_ORIGIN>
                          <HMDAEthnicityOriginType>${mapEthnicityOrigin(demographics.origin)}</HMDAEthnicityOriginType>
                        </HMDA_ETHNICITY_ORIGIN>
                      </HMDA_ETHNICITY_ORIGINS>`;
  }
  
  xml += `
                    </GOVERNMENT_MONITORING>`;
  
  return xml;
};

/**
 * Map gender to MISMO standard values
 * @param {string} gender - Application gender
 * @returns {string} - MISMO gender
 */
const mapGender = (gender) => {
  if (!gender) return 'InformationNotProvided';
  
  const genderMap = {
    'Male': 'Male',
    'Female': 'Female',
    'Not applicable': 'NotApplicable',
    'I do not wish to provide this information': 'InformationNotProvided'
  };
  
  return genderMap[gender] || 'InformationNotProvided';
};

/**
 * Map race to MISMO standard values
 * @param {string} race - Application race
 * @returns {string} - MISMO race
 */
const mapRace = (race) => {
  if (!race) return 'InformationNotProvided';
  
  const raceMap = {
    'american-indian': 'AmericanIndianOrAlaskaNative',
    'asian': 'Asian',
    'black': 'BlackOrAfricanAmerican',
    'pacific-islander': 'NativeHawaiianOrOtherPacificIslander',
    'white': 'White',
    'refuse': 'InformationNotProvided'
  };
  
  return raceMap[race] || 'InformationNotProvided';
};

/**
 * Map ethnicity to MISMO standard values
 * @param {string} ethnicity - Application ethnicity
 * @returns {string} - MISMO ethnicity
 */
const mapEthnicity = (ethnicity) => {
  if (!ethnicity) return 'InformationNotProvided';
  
  const ethnicityMap = {
    'hispanic': 'HispanicOrLatino',
    'not-hispanic': 'NotHispanicOrLatino',
    'refuse': 'InformationNotProvided'
  };
  
  return ethnicityMap[ethnicity] || 'InformationNotProvided';
};

/**
 * Map ethnicity origin to MISMO standard values
 * @param {string} origin - Application ethnicity origin
 * @returns {string} - MISMO ethnicity origin
 */
const mapEthnicityOrigin = (origin) => {
  if (!origin) return 'Other';
  
  const originMap = {
    'mexican': 'Mexican',
    'puerto-rican': 'PuertoRican',
    'cuban': 'Cuban',
    'other': 'Other'
  };
  
  return originMap[origin] || 'Other';
};

/**
 * Generate Loan Origination Party XML section
 * @param {Object} loan - Loan data
 * @returns {string} - XML for loan origination party
 */
const generateLoanOriginationPartyXml = (loan) => {
  return `
            <PARTY>
              <LEGAL_ENTITY>
                <LEGAL_ENTITY_DETAIL>
                  <FullName>Capitol Coast Lending</FullName>
                </LEGAL_ENTITY_DETAIL>
              </LEGAL_ENTITY>
              <ROLES>
                <ROLE SequenceNumber="1" xlink:label="LOAN_ORIGINATION_COMPANY_1">
                  <LICENSES>
                    <LICENSE>
                      <LICENSE_DETAIL>
                        <LicenseAuthorityLevelType>PublicState</LicenseAuthorityLevelType>
                        <LicenseIdentifier>2042983</LicenseIdentifier>
                      </LICENSE_DETAIL>
                    </LICENSE>
                  </LICENSES>
                  <ROLE_DETAIL>
                    <PartyRoleType>LoanOriginationCompany</PartyRoleType>
                  </ROLE_DETAIL>
                </ROLE>
              </ROLES>
            </PARTY>`;
};

/**
 * Generate Taxpayer Identifiers XML section
 * @param {Object} loan - Loan data
 * @returns {string} - XML for taxpayer identifiers
 */
const generateTaxpayerIdentifiersXml = (loan) => {
  const borrowerDetails = loan.borrowerDetails || {};
  let xml = '';
  
  if (borrowerDetails.ssn) {
    xml = `
              <TAXPAYER_IDENTIFIERS>
                <TAXPAYER_IDENTIFIER>
                  <TaxpayerIdentifierType>SocialSecurityNumber</TaxpayerIdentifierType>
                  <TaxpayerIdentifierValue>${borrowerDetails.ssn || ''}</TaxpayerIdentifierValue>
                </TAXPAYER_IDENTIFIER>
              </TAXPAYER_IDENTIFIERS>`;
  }
  
  return xml;
}; 