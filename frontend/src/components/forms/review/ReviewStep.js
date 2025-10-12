import React from 'react';
import { formatDate, formatCurrency, formatPhoneNumber } from '../../../utils/formatters';

/**
 * ReviewStep Component
 * 
 * Displays a summary of all entered information with edit options
 * for the final review & submit step of the loan application
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - The entire form data
 * @param {Function} props.setCurrentStep - Function to navigate to specific steps
 * @param {Function} props.handleSubmit - Function to submit the application
 * @param {Boolean} props.loading - Loading state for submission
 * @param {String} props.userType - User type (borrower/lender)
 * @param {Boolean} props.hasExistingConsent - Whether borrower has already consented
 * @param {Boolean} props.creditReportConsent - Current consent checkbox state
 * @param {Function} props.setCreditReportConsent - Function to update consent checkbox
 * @param {Boolean} props.loadingConsent - Loading state for consent check
 * @param {Object} props.consentData - Consent data from API
 * @returns {JSX.Element} Review & Submit step component
 */
const ReviewStep = ({ 
  formData, 
  setCurrentStep, 
  handleSubmit, 
  loading,
  userType = 'borrower',
  hasExistingConsent = false,
  creditReportConsent = false,
  setCreditReportConsent = () => {},
  loadingConsent = false,
  consentData = null
}) => {
  // Get primary borrower info
  const borrower = formData.borrowers?.[0] || {};
  
  // Format a simple address for display
  const formatAddress = (address) => {
    if (!address) return 'Not provided';
    
    // Check if any address data is present
    const hasAddressData = Object.values(address).some(val => val && String(val).trim() !== '');
    if (!hasAddressData) return 'Not provided';
    
    let formattedAddress = '';
    
    // Add street address - check multiple possible field names
    const streetAddress = address.streetAddress || address.street || '';
    if (streetAddress) {
      formattedAddress += streetAddress;
    }
    
    // Add apartment/unit - check multiple possible field names
    const aptUnit = address.aptSteNum || address.apt || address.unit || '';
    if (aptUnit) {
      if (formattedAddress) {
        formattedAddress += ` ${aptUnit}`;
      } else {
        formattedAddress += aptUnit;
      }
    }
    
    // Add city
    if (address.city) {
      if (formattedAddress) formattedAddress += ', ';
      formattedAddress += address.city;
    }
    
    // Add state
    if (address.state) {
      if (address.city || formattedAddress) {
        formattedAddress += ', ';
      }
      formattedAddress += address.state;
    }
    
    // Add zip code - check multiple possible field names
    const zipCode = address.zipCode || address.zip || '';
    if (zipCode) {
      formattedAddress += ' ' + zipCode;
    }
    
    return formattedAddress || 'Not provided';
  };

  // Helper to render an edit button for a specific step
  const renderEditButton = (step) => (
    <button
      type="button"
      onClick={() => setCurrentStep(step)}
      className="ml-2 text-blue-500 hover:text-blue-700"
      title="Edit this section"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  );

  // Helper to render a summary section
  const renderSection = (title, content, step) => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-md font-semibold text-gray-700">{title}</h3>
        {renderEditButton(step)}
      </div>
      <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
        {content}
      </div>
    </div>
  );

  // Render borrower personal details
  const renderPersonalDetails = () => (
    <div>
      <p className="mb-2"><strong>Full Name:</strong> {borrower.firstName || ''} {borrower.middleName || ''} {borrower.lastName || ''} {borrower.suffix || ''}</p>
      <p className="mb-2"><strong>Date of Birth:</strong> {formatDate(borrower.dateOfBirth) || 'Not provided'}</p>
      <p className="mb-2"><strong>SSN:</strong> XXX-XX-{borrower.ssn ? borrower.ssn.slice(-4) : 'XXXX'}</p>
      <p className="mb-2"><strong>Marital Status:</strong> {borrower.maritalStatus || 'Not provided'}</p>
      <p className="mb-2"><strong>Phone:</strong> {formatPhoneNumber(borrower.phone) || 'Not provided'}</p>
      <p className="mb-2"><strong>Email:</strong> {borrower.email || 'Not provided'}</p>
      <p className="mb-2"><strong>Citizenship:</strong> {borrower.citizenship || 'Not provided'}</p>
    </div>
  );

  // Render borrower address information
  const renderAddressInfo = () => (
    <div>
      <p className="mb-2"><strong>Current Address:</strong> {formatAddress(borrower.currentAddress)}</p>
      <p className="mb-2"><strong>Years at Address:</strong> {borrower.currentAddress?.yearsAtAddress || 'Not provided'}</p>
      <p className="mb-2"><strong>Months at Address:</strong> {borrower.currentAddress?.monthsAtAddress || 'Not provided'}</p>
      <p className="mb-2"><strong>Housing Status:</strong> {borrower.currentAddress?.housingStatus || 'Not provided'}</p>
      
      {borrower.mailingAddress && !borrower.mailingAddress.sameAsCurrentAddress && (
        <p className="mb-2"><strong>Mailing Address:</strong> {formatAddress(borrower.mailingAddress)}</p>
      )}
    </div>
  );

  // Render employment information
  const renderEmploymentInfo = () => (
    <div>
      {borrower.employers && borrower.employers.length > 0 ? (
        borrower.employers.map((employer, index) => (
          <div key={index} className={index > 0 ? 'mt-3 pt-3 border-t border-gray-200' : ''}>
            <p className="mb-2"><strong>Employer:</strong> {employer.companyName || 'Not provided'}</p>
            <p className="mb-2"><strong>Job Title:</strong> {employer.jobTitle || 'Not provided'}</p>
            <p className="mb-2"><strong>Employment Status:</strong> {employer.employmentStatus || 'Not provided'}</p>
            <p className="mb-2"><strong>Address:</strong> {formatAddress({
              streetAddress: employer.streetAddress,
              city: employer.city,
              state: employer.state,
              zipCode: employer.zipCode
            })}</p>
            <p className="mb-2"><strong>Start Date:</strong> {formatDate(employer.startDate) || 'Not provided'}</p>
            <p className="mb-2"><strong>Time in Profession:</strong> {employer.yearsInProfession || '0'} years, {employer.monthsInProfession || '0'} months</p>
          </div>
        ))
      ) : (
        <p>No employment information provided.</p>
      )}
    </div>
  );

  // Render property information
  const renderPropertyInfo = () => {
    const propertyInfo = formData.propertyInfo || {};
    
    return (
      <div>
        <p className="mb-2"><strong>Property Type:</strong> {propertyInfo?.propertyType || 'Not provided'}</p>
        <p className="mb-2"><strong>Property Value:</strong> {formatCurrency(propertyInfo?.propertyValue) || 'Not provided'}</p>
        <p className="mb-2"><strong>Occupancy Type:</strong> {propertyInfo?.occupancyType || 'Not provided'}</p>
        
        {propertyInfo?.hasAcceptedOffer && (
          <>
            <p className="mb-2"><strong>Has Accepted Offer:</strong> Yes</p>
            <p className="mb-2"><strong>Contract Purchase Price:</strong> {formatCurrency(propertyInfo?.contractPurchasePrice) || 'Not provided'}</p>
          </>
        )}
        
        {propertyInfo?.numberOfUnits && <p className="mb-2"><strong>Number of Units:</strong> {propertyInfo?.numberOfUnits}</p>}
        {propertyInfo?.yearBuilt && <p className="mb-2"><strong>Year Built:</strong> {propertyInfo?.yearBuilt}</p>}
        {propertyInfo?.isMixedUse && <p className="mb-2"><strong>Mixed-Use Property:</strong> Yes</p>}
        {propertyInfo?.isManufactured && <p className="mb-2"><strong>Manufactured Home:</strong> Yes</p>}
        {propertyInfo?.proposedRentalIncome && (
          <p className="mb-2"><strong>Proposed Rental Income:</strong> {formatCurrency(propertyInfo?.proposedRentalIncome)}</p>
        )}
      </div>
    );
  };

  // Render loan details
  const renderLoanInfo = () => (
    <div>
      <p className="mb-2"><strong>Loan Type:</strong> {formData.loanInfo?.loanType || 'Not provided'}</p>
      
      {formData.loanInfo?.loanType === 'Refinance' ? (
        <>
          <p className="mb-2"><strong>Current Loan Balance:</strong> {formatCurrency(formData.loanInfo?.currentLoanBalance) || 'Not provided'}</p>
          <p className="mb-2"><strong>Requested Loan Amount:</strong> {formatCurrency(formData.loanInfo?.requestedLoanAmount) || 'Not provided'}</p>
          <p className="mb-2"><strong>Refinance Type:</strong> {formData.loanInfo?.refinanceType || 'Not provided'}</p>
        </>
      ) : formData.loanInfo?.loanType === 'Purchase' ? (
        <>
          <p className="mb-2"><strong>Purchase Price:</strong> {formatCurrency(formData.loanInfo?.purchasePrice) || 'Not provided'}</p>
          <p className="mb-2"><strong>Down Payment:</strong> {formatCurrency(formData.loanInfo?.downPayment) || 'Not provided'}</p>
        </>
      ) : formData.loanInfo?.loanType === 'Construction' ? (
        <>
          <p className="mb-2"><strong>Loan Amount:</strong> {formatCurrency(formData.loanInfo?.loanAmount) || 'Not provided'}</p>
        </>
      ) : (
        <>
          <p className="mb-2"><strong>Loan Amount:</strong> {formatCurrency(formData.loanInfo?.loanAmount) || 'Not provided'}</p>
          <p className="mb-2"><strong>Down Payment:</strong> {formatCurrency(formData.loanInfo?.downPayment) || 'Not provided'}</p>
        </>
      )}
    </div>
  );

  // Render assets
  const renderAssets = () => {
    const assets = formData.assets || {};
    const checkingAndSavings = assets.checkingAndSavings || [];
    const stocksAndBonds = assets.stocksAndBonds || [];
    const giftsAndGrants = assets.giftsAndGrants || [];
    const miscellaneous = assets.miscellaneous || {};
    
    const hasAssets = checkingAndSavings.length > 0 || stocksAndBonds.length > 0 || 
                     giftsAndGrants.length > 0 || Object.values(miscellaneous).some(val => val > 0);
    
    return (
      <div>
        {hasAssets ? (
          <div>
            {/* Checking and Savings */}
            {checkingAndSavings.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Checking and Savings</h4>
                {checkingAndSavings.map((account, index) => (
                  <div key={`checking-${index}`} className={index > 0 ? 'mt-3 pt-3 border-t border-gray-200' : ''}>
                    <p className="mb-1"><strong>Account Type:</strong> {account.accountType || 'Not specified'}</p>
                    <p className="mb-1"><strong>Financial Institution:</strong> {account.institution || 'Not specified'}</p>
                    <p className="mb-1"><strong>Account Number (last 4):</strong> {account.accountNumber ? `XXXX${account.accountNumber.slice(-4)}` : 'XXXX'}</p>
                    <p className="mb-1"><strong>Value:</strong> {formatCurrency(account.value) || '$0.00'}</p>
                    <p className="mb-1"><strong>Verified:</strong> {account.isVerified ? 'Yes' : 'No'}</p>
                    <p className="mb-1"><strong>Liquid:</strong> {account.isLiquid ? 'Yes' : 'No'}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Stocks and Bonds */}
            {stocksAndBonds.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Stocks and Bonds</h4>
                {stocksAndBonds.map((investment, index) => (
                  <div key={`investment-${index}`} className={index > 0 ? 'mt-3 pt-3 border-t border-gray-200' : ''}>
                    <p className="mb-1"><strong>Type:</strong> {investment.investmentType || 'Not specified'}</p>
                    <p className="mb-1"><strong>Description:</strong> {investment.description || 'Not specified'}</p>
                    <p className="mb-1"><strong>Value:</strong> {formatCurrency(investment.value) || '$0.00'}</p>
                    <p className="mb-1"><strong>Verified:</strong> {investment.isVerified ? 'Yes' : 'No'}</p>
                    <p className="mb-1"><strong>Liquid:</strong> {investment.isLiquid ? 'Yes' : 'No'}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Gifts and Grants */}
            {giftsAndGrants.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Gifts and Grants</h4>
                {giftsAndGrants.map((gift, index) => (
                  <div key={`gift-${index}`} className={index > 0 ? 'mt-3 pt-3 border-t border-gray-200' : ''}>
                    <p className="mb-1"><strong>Source:</strong> {gift.source || 'Not specified'}</p>
                    <p className="mb-1"><strong>Type:</strong> {gift.giftType || 'Not specified'}</p>
                    <p className="mb-1"><strong>Value:</strong> {formatCurrency(gift.value) || '$0.00'}</p>
                    <p className="mb-1"><strong>Verified:</strong> {gift.isVerified ? 'Yes' : 'No'}</p>
                    <p className="mb-1"><strong>Liquid:</strong> {gift.isLiquid ? 'Yes' : 'No'}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Miscellaneous Assets */}
            {Object.values(miscellaneous).some(val => val > 0) && (
              <div>
                <h4 className="font-medium mb-2">Other Assets</h4>
                {miscellaneous.earnestMoney > 0 && (
                  <p className="mb-1"><strong>Earnest Money:</strong> {formatCurrency(miscellaneous.earnestMoney) || '$0.00'}</p>
                )}
                {miscellaneous.lifeInsurance > 0 && (
                  <p className="mb-1"><strong>Life Insurance Value:</strong> {formatCurrency(miscellaneous.lifeInsurance) || '$0.00'}</p>
                )}
                {miscellaneous.vestedInterestInRetirement > 0 && (
                  <p className="mb-1"><strong>Retirement Funds:</strong> {formatCurrency(miscellaneous.vestedInterestInRetirement) || '$0.00'}</p>
                )}
                {miscellaneous.otherAssets > 0 && (
                  <p className="mb-1"><strong>Other Assets:</strong> {formatCurrency(miscellaneous.otherAssets) || '$0.00'}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <p>No assets provided.</p>
        )}
      </div>
    );
  };

  // Render income
  const renderIncome = () => (
    <div>
      {formData.income ? (
        <>
          <p className="mb-2"><strong>Base Income:</strong> {formatCurrency(formData.income.baseIncome) || '$0.00'}/month</p>
          
          {formData.income.overtime && (
            <p className="mb-2"><strong>Overtime:</strong> {formatCurrency(formData.income.overtime) || '$0.00'}/month</p>
          )}
          
          {formData.income.bonuses && (
            <p className="mb-2"><strong>Bonuses:</strong> {formatCurrency(formData.income.bonuses) || '$0.00'}/month</p>
          )}
          
          {formData.income.commissions && (
            <p className="mb-2"><strong>Commissions:</strong> {formatCurrency(formData.income.commissions) || '$0.00'}/month</p>
          )}
          
          {Array.isArray(formData.income.otherIncome) && formData.income.otherIncome.length > 0 && (
            <div className="mt-2">
              <p className="font-medium">Other Income Sources:</p>
              {formData.income.otherIncome.map((item, index) => (
                <div key={index} className="pl-4 mt-1">
                  <p><strong>{item.type || 'Income'}:</strong> {formatCurrency(item.amount) || '$0.00'}/month</p>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p>No income information provided.</p>
      )}
    </div>
  );

  // Render debts
  const renderDebts = () => (
    <div>
      {Array.isArray(formData.debts) && formData.debts.length > 0 ? (
        <div>
          {formData.debts.map((debt, index) => (
            <div key={index} className={index > 0 ? 'mt-3 pt-3 border-t border-gray-200' : ''}>
              <p className="mb-2"><strong>Type:</strong> {debt.debtType || 'Not specified'}</p>
              <p className="mb-2"><strong>Creditor:</strong> {debt.creditor || 'Not specified'}</p>
              <p className="mb-2"><strong>Monthly Payment:</strong> {formatCurrency(debt.monthlyPayment) || '$0.00'}</p>
              <p className="mb-2"><strong>Outstanding Balance:</strong> {formatCurrency(debt.outstandingBalance) || '$0.00'}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No debts provided.</p>
      )}
    </div>
  );

  // Render additional information - Property Owned
  const renderPropertyOwned = () => (
    <div>
      {formData.propertiesOwned ? (
        <>
          <p className="mb-2"><strong>Owns Additional Property:</strong> {formData.propertiesOwned.ownsProperty ? 'Yes' : 'No'}</p>
          
          {formData.propertiesOwned.ownsProperty && Array.isArray(formData.propertiesOwned.properties) && formData.propertiesOwned.properties.length > 0 && (
            <div className="mt-2">
              {formData.propertiesOwned.properties.map((property, index) => {
                // Check for all possible property address formats
                const propertyAddress = property.propertyAddress || property.address || {};
                
                return (
                  <div key={index} className={index > 0 ? 'mt-3 pt-3 border-t border-gray-200' : ''}>
                    <p className="mb-2"><strong>Address:</strong> {formatAddress(propertyAddress)}</p>
                    <p className="mb-2"><strong>Property Type:</strong> {property.propertyType || 'Not specified'}</p>
                    <p className="mb-2"><strong>Market Value:</strong> {formatCurrency(property.presentMarketValue) || 'Not provided'}</p>
                    <p className="mb-2"><strong>Status:</strong> {property.statusOfProperty || 'Not specified'}</p>
                    {property.intendedOccupancy && <p className="mb-2"><strong>Intended Occupancy:</strong> {property.intendedOccupancy}</p>}
                    {property.monthlyCosts && <p className="mb-2"><strong>Monthly Costs:</strong> {formatCurrency(property.monthlyCosts)}</p>}
                    {property.grossRentalIncome && <p className="mb-2"><strong>Gross Rental Income:</strong> {formatCurrency(property.grossRentalIncome)}</p>}
                    {property.netRentalIncome && <p className="mb-2"><strong>Net Rental Income:</strong> {formatCurrency(property.netRentalIncome)}</p>}
                    {property.hasLoan && <p className="mb-2"><strong>Has Loan:</strong> Yes</p>}
                    {property.monthlyPayment && <p className="mb-2"><strong>Monthly Payment:</strong> {formatCurrency(property.monthlyPayment)}</p>}
                    {property.unpaidBalance && <p className="mb-2"><strong>Unpaid Balance:</strong> {formatCurrency(property.unpaidBalance)}</p>}
                  </div>
                );
              })}
            </div>
          )}
          
          {!formData.propertiesOwned.ownsProperty && (
            <p className="mb-2"><strong>Monthly Rent:</strong> {formatCurrency(formData.propertiesOwned.rent) || 'Not provided'}</p>
          )}
          
          {/* Display housing expenses if available */}
          {formData.propertiesOwned.firstMortgage && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h4 className="font-medium mb-2">Housing Expenses</h4>
              {formData.propertiesOwned.firstMortgage && <p className="mb-1"><strong>First Mortgage:</strong> {formatCurrency(formData.propertiesOwned.firstMortgage)}</p>}
              {formData.propertiesOwned.otherFinancing && <p className="mb-1"><strong>Other Financing:</strong> {formatCurrency(formData.propertiesOwned.otherFinancing)}</p>}
              {formData.propertiesOwned.hazardInsurance && <p className="mb-1"><strong>Hazard Insurance:</strong> {formatCurrency(formData.propertiesOwned.hazardInsurance)}</p>}
              {formData.propertiesOwned.realEstateTaxes && <p className="mb-1"><strong>Real Estate Taxes:</strong> {formatCurrency(formData.propertiesOwned.realEstateTaxes)}</p>}
              {formData.propertiesOwned.mortgageInsurance && <p className="mb-1"><strong>Mortgage Insurance:</strong> {formatCurrency(formData.propertiesOwned.mortgageInsurance)}</p>}
              {formData.propertiesOwned.hoaDues && <p className="mb-1"><strong>HOA Dues:</strong> {formatCurrency(formData.propertiesOwned.hoaDues)}</p>}
              {formData.propertiesOwned.otherHousingExpenses && <p className="mb-1"><strong>Other Housing Expenses:</strong> {formatCurrency(formData.propertiesOwned.otherHousingExpenses)}</p>}
            </div>
          )}
        </>
      ) : (
        <p>No property ownership information provided.</p>
      )}
    </div>
  );

  // Render military service
  const renderMilitaryService = () => (
    <div>
      {formData.militaryService ? (
        <>
          <p className="mb-2"><strong>Military Service:</strong> {formData.militaryService.hasServed ? 'Yes' : 'No'}</p>
          
          {formData.militaryService.hasServed && (
            <>
              <p className="mb-2"><strong>Currently Serving on Active Duty:</strong> {formData.militaryService.currentlyServing ? 'Yes' : 'No'}</p>
              <p className="mb-2"><strong>Retired/Discharged/Separated:</strong> {formData.militaryService.isRetired ? 'Yes' : 'No'}</p>
              <p className="mb-2"><strong>Non-Activated Member:</strong> {formData.militaryService.isNonActivated ? 'Yes' : 'No'}</p>
              <p className="mb-2"><strong>Surviving Spouse:</strong> {formData.militaryService.isSurvivingSpouse ? 'Yes' : 'No'}</p>
            </>
          )}
        </>
      ) : (
        <p>No military service information provided.</p>
      )}
    </div>
  );

  // Render declarations
  const renderDeclarations = () => (
    <div>
      {formData.declarations ? (
        <>
          <p className="mb-2"><strong>Primary Residence:</strong> {formData.declarations.occupyAsPrimary ? 'Yes' : 'No'}</p>
          <p className="mb-2"><strong>Borrowing Money for Transaction:</strong> {formData.declarations.borrowingMoney ? 'Yes' : 'No'}</p>
          <p className="mb-2"><strong>Applying for Mortgage on Another Property:</strong> {formData.declarations.applyingForMortgage ? 'Yes' : 'No'}</p>
          <p className="mb-2"><strong>Applying for New Credit:</strong> {formData.declarations.applyingForNewCredit ? 'Yes' : 'No'}</p>
          <p className="mb-2"><strong>Subject to Lien:</strong> {formData.declarations.propertySubjectToLien ? 'Yes' : 'No'}</p>
          <p className="mb-2"><strong>Co-signer:</strong> {formData.declarations.coSigner ? 'Yes' : 'No'}</p>
          <p className="mb-2"><strong>Delinquent on Federal Debt:</strong> {formData.declarations.delinquent ? 'Yes' : 'No'}</p>
          <p className="mb-2"><strong>Party to Lawsuit:</strong> {formData.declarations.partyToLawsuit ? 'Yes' : 'No'}</p>
          <p className="mb-2"><strong>Conveyed Title to Property:</strong> {formData.declarations.conveyedTitle ? 'Yes' : 'No'}</p>
          <p className="mb-2"><strong>Completed Pre-foreclosure Sale:</strong> {formData.declarations.preForeclosureSale ? 'Yes' : 'No'}</p>
          <p className="mb-2"><strong>Property Foreclosed Upon:</strong> {formData.declarations.propertyForeclosed ? 'Yes' : 'No'}</p>
          <p className="mb-2"><strong>Outstanding Judgements:</strong> {formData.declarations.outstandingJudgements ? 'Yes' : 'No'}</p>
          <p className="mb-2"><strong>Declared Bankruptcy:</strong> {formData.declarations.declaredBankruptcy ? 'Yes' : 'No'}</p>
          
          {formData.declarations.declaredBankruptcy && (
            <p className="mb-2"><strong>Bankruptcy Type:</strong> {formData.declarations.bankruptcyType || 'Not specified'}</p>
          )}
          
          <p className="mb-2"><strong>Family/Party Relationship:</strong> {formData.declarations.familyRelationship ? 'Yes' : 'No'}</p>
          <p className="mb-2"><strong>First-time Homebuyer:</strong> {formData.declarations.firstTimeBuyer ? 'Yes' : 'No'}</p>
        </>
      ) : (
        <p>No declarations provided.</p>
      )}
    </div>
  );

  // Render demographics
  const renderDemographics = () => (
    <div>
      {formData.demographics ? (
        <>
          <p className="mb-2"><strong>Ethnicity:</strong> {formData.demographics.ethnicity || 'Not provided'}</p>
          
          {formData.demographics.ethnicity === 'hispanic' && (
            <p className="mb-2"><strong>Origin:</strong> {formData.demographics.origin || 'Not specified'}</p>
          )}
          
          <p className="mb-2"><strong>Gender:</strong> {formData.demographics.gender || 'Not provided'}</p>
          <p className="mb-2"><strong>Race:</strong> {formData.demographics.race || 'Not provided'}</p>
          
          {formData.demographics.race === 'american-indian' && (
            <p className="mb-2"><strong>Tribe:</strong> {formData.demographics.tribe || 'Not specified'}</p>
          )}
        </>
      ) : (
        <p>No demographic information provided.</p>
      )}
    </div>
  );

  // Credit report consent section
  const renderCreditReportConsent = () => (
    <div className="mt-6 border border-blue-200 rounded-lg p-6 bg-blue-50">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Credit Report Authorization <span className="text-sm font-normal text-gray-600">(Optional)</span>
      </h3>
      
      {loadingConsent ? (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Checking authorization status...
        </div>
      ) : hasExistingConsent ? (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-md">
            <svg className="h-5 w-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">
                ✓ Authorization on file
              </p>
              <p className="text-sm text-green-700 mt-1">
                You provided consent on {consentData?.consentDate ? new Date(consentData.consentDate).toLocaleDateString() : 'a previous application'}.
              </p>
              <p className="text-xs text-green-600 mt-2">
                Your credit report authorization remains valid for this and future loan applications with your lender.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-blue-300 rounded-md">
            <p className="text-sm text-gray-700 mb-3">
              By checking this box, you authorize your lender to obtain your credit report from credit reporting 
              agencies for the purpose of evaluating your loan application. This authorization will remain valid 
              for future loan applications with this lender.
            </p>
            <p className="text-xs text-blue-600 font-medium mb-3">
              Note: You can provide this authorization now or later. Your lender will request it when needed for credit evaluation.
            </p>
            
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={creditReportConsent}
                onChange={(e) => setCreditReportConsent(e.target.checked)}
                className="mt-1 form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-900">
                I authorize the lender to pull my credit report for loan evaluation purposes
              </span>
            </label>
          </div>
          
        </div>
      )}
    </div>
  );

  // Legal agreement and submission
  const renderLegalAgreement = () => (
    <div className="mt-6 border-t border-gray-300 pt-6">
      <div className="mb-4">
        <label className="flex items-start">
          <input
            type="checkbox"
            id="agreementCheckbox"
            name="agreementCheckbox"
            className="mt-1 form-checkbox h-4 w-4 text-blue-500"
            required
          />
          <span className="ml-2 text-sm text-gray-700">
            I confirm that all the information I have provided is accurate and complete to the best of my knowledge. 
            I understand that providing false information may result in denial of my application or other legal consequences.
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting Application...
          </>
        ) : (
          'Submit Application'
        )}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Review & Submit</h2>
        <p className="text-gray-600 mb-4">
          Please review your application details carefully. If you need to make changes, click the edit icon next to any section.
        </p>
        <hr className="border-t border-gray-300 mb-6" />
      </div>

        <div className="space-y-6">
          {/* Personal Information */}
          {renderSection('Personal Details', renderPersonalDetails(), 1)}
          {renderSection('Residence History', renderAddressInfo(), 1)}
          {renderSection('Employment History', renderEmploymentInfo(), 1)}
          
          {/* Property & Loan */}
          {renderSection('Property Information', renderPropertyInfo(), 2)}
          {renderSection('Loan Details', renderLoanInfo(), 2)}
          
          {/* Assets & Debts */}
          {renderSection('Assets', renderAssets(), 3)}
          {renderSection('Income', renderIncome(), 3)}
          {renderSection('Debts', renderDebts(), 3)}
          
          {/* Additional Information */}
          {renderSection('Property Owned', renderPropertyOwned(), 4)}
          {renderSection('Military Service', renderMilitaryService(), 4)}
          
          {/* Declarations & Demographics */}
          {renderSection('Declarations', renderDeclarations(), 5)}
          {renderSection('Demographics', renderDemographics(), 5)}
          
          {/* Credit Report Consent - Only visible for borrowers, not lenders */}
          {userType === 'borrower' && renderCreditReportConsent()}
          
          {/* Legal agreement and submission */}
          {renderLegalAgreement()}
        </div>
    </div>
  );
};

export default ReviewStep;
