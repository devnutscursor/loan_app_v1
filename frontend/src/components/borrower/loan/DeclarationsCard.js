import React from 'react';

/**
 * DeclarationsCard component displays declarations information in a visually appealing card
 * @param {Object} loan - The loan data object with declarations information
 * @param {Function} formatCurrency - Function to format currency values
 */
const DeclarationsCard = ({ loan, formatCurrency }) => {
  if (!loan || !loan.declarations) return null;
  
  const { declarations } = loan;
  
  // Helper function to format Yes/No values
  const formatYesNo = (value) => {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    return 'Not Specified';
  };
  
  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100 my-6">
      <div className="px-6 py-5 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="ml-2 text-lg font-semibold text-gray-900">Declarations</h3>
        </div>
        <p className="mt-1 text-sm text-gray-600">Borrower declarations and property information</p>
      </div>
      
      <div className="px-6 py-5">
        <div className="space-y-6">
          {/* Property Declarations */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Property Declarations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-sm font-medium text-gray-500 block">Will you occupy the property as your primary residence?</span>
                <span className="text-sm text-gray-900">{formatYesNo(declarations.occupyAsPrimary)}</span>
              </div>
              
              {declarations.occupyAsPrimary && (
                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                  <span className="text-sm font-medium text-gray-500 block">Have you had an ownership interest in another property in the last three years?</span>
                  <span className="text-sm text-gray-900">{formatYesNo(declarations.hadOwnershipInterest)}</span>
                  
                  {declarations.hadOwnershipInterest && declarations.ownedPropertyType && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-500 block">Property Type</span>
                      <span className="text-sm text-gray-900">{declarations.ownedPropertyType}</span>
                    </div>
                  )}
                  
                  {declarations.hadOwnershipInterest && declarations.titleHoldingType && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-500 block">Title Holding Type</span>
                      <span className="text-sm text-gray-900">{declarations.titleHoldingType}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-sm font-medium text-gray-500 block">Are you borrowing money for this transaction?</span>
                <span className="text-sm text-gray-900">{formatYesNo(declarations.borrowingMoney)}</span>
                
                {declarations.borrowingMoney && declarations.borrowingMoneyAmount && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-500 block">Amount</span>
                    <span className="text-sm text-gray-900">{formatCurrency(declarations.borrowingMoneyAmount)}</span>
                  </div>
                )}
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-sm font-medium text-gray-500 block">Applying for mortgage on another property?</span>
                <span className="text-sm text-gray-900">{formatYesNo(declarations.applyingForMortgage)}</span>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-sm font-medium text-gray-500 block">Applying for new credit?</span>
                <span className="text-sm text-gray-900">{formatYesNo(declarations.applyingForNewCredit)}</span>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-sm font-medium text-gray-500 block">Property subject to lien?</span>
                <span className="text-sm text-gray-900">{formatYesNo(declarations.propertySubjectToLien)}</span>
              </div>
            </div>
          </div>
          
          {/* Financial Declarations */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Financial Declarations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-sm font-medium text-gray-500 block">Co-signer on any debt or loan?</span>
                <span className="text-sm text-gray-900">{formatYesNo(declarations.coSigner)}</span>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-sm font-medium text-gray-500 block">Delinquent on Federal debt?</span>
                <span className="text-sm text-gray-900">{formatYesNo(declarations.delinquent)}</span>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-sm font-medium text-gray-500 block">Party to a lawsuit?</span>
                <span className="text-sm text-gray-900">{formatYesNo(declarations.partyToLawsuit)}</span>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-sm font-medium text-gray-500 block">Conveyed title to property in lieu of foreclosure?</span>
                <span className="text-sm text-gray-900">{formatYesNo(declarations.conveyedTitle)}</span>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-sm font-medium text-gray-500 block">Completed pre-foreclosure sale?</span>
                <span className="text-sm text-gray-900">{formatYesNo(declarations.preForeclosureSale)}</span>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-sm font-medium text-gray-500 block">Property foreclosed in last 7 years?</span>
                <span className="text-sm text-gray-900">{formatYesNo(declarations.propertyForeclosed)}</span>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-sm font-medium text-gray-500 block">Outstanding judgements?</span>
                <span className="text-sm text-gray-900">{formatYesNo(declarations.outstandingJudgements)}</span>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-sm font-medium text-gray-500 block">Declared bankruptcy in past 7 years?</span>
                <span className="text-sm text-gray-900">{formatYesNo(declarations.declaredBankruptcy)}</span>
                
                {declarations.declaredBankruptcy && declarations.bankruptcyType && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-500 block">Bankruptcy Type</span>
                    <span className="text-sm text-gray-900">{declarations.bankruptcyType}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Additional Declarations */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Additional Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-sm font-medium text-gray-500 block">Employed by family member, property seller, real estate agent, or other party to the transaction?</span>
                <span className="text-sm text-gray-900">{formatYesNo(declarations.familyRelationship)}</span>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-sm font-medium text-gray-500 block">First time homebuyer?</span>
                <span className="text-sm text-gray-900">{formatYesNo(declarations.firstTimeBuyer)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeclarationsCard;
