import React from 'react';

/**
 * PropertiesOwnedCard component displays information about properties owned by the borrower
 * @param {Object} loan - The loan data object containing properties owned information
 * @param {Function} formatCurrency - Function to format currency values
 */
const PropertiesOwnedCard = ({ loan, formatCurrency }) => {
  if (!loan || !loan.propertiesOwned) return null;
  
  const hasProperties = Array.isArray(loan.propertiesOwned.properties) && loan.propertiesOwned.properties.length > 0;
  const hasFinancialInfo = 
    loan.propertiesOwned.firstMortgage > 0 || 
    loan.propertiesOwned.rent > 0 || 
    loan.propertiesOwned.hazardInsurance > 0 || 
    loan.propertiesOwned.realEstateTaxes > 0 || 
    loan.propertiesOwned.mortgageInsurance > 0 || 
    loan.propertiesOwned.hoaDues > 0;
  
  if (!hasProperties && !hasFinancialInfo) return null;
  
  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
      <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="ml-2 text-lg font-semibold text-gray-900">Properties Owned</h3>
        </div>
        <p className="mt-1 text-sm text-gray-600">Information about properties owned by the borrower</p>
      </div>
      
      <div className="px-6 py-5">
        {hasProperties && (
          <div className="mb-6">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Property Details</h4>
            <div className="space-y-4">
              {loan.propertiesOwned.properties.map((property, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600">Property {index + 1}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      property.propertyType === 'Primary Residence' 
                        ? 'bg-green-100 text-green-800' 
                        : property.propertyType === 'Investment' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {property.propertyType || 'Other'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Address</span>
                      <p className="mt-1 text-sm text-gray-900 break-words">
                        {(() => {
                          const address = property.propertyAddress;
                          if (!address) return 'N/A';
                          
                          const parts = [
                            address.streetAddress,
                            address.apt,
                            address.city,
                            address.state,
                            address.zipCode
                          ].filter(Boolean);
                          
                          return parts.length > 0 ? parts.join(', ') : 'N/A';
                        })()}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Market Value</span>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatCurrency(property.presentMarketValue || 0)}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unpaid Balance</span>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatCurrency(property.unpaidBalance || 0)}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monthly Payment</span>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatCurrency(property.monthlyPayment || 0)}
                      </p>
                    </div>
                    
                    {property.monthlyCosts > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monthly Costs</span>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {formatCurrency(property.monthlyCosts || 0)}
                        </p>
                      </div>
                    )}
                    
                    {property.grossRentalIncome > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rental Income</span>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {formatCurrency(property.grossRentalIncome || 0)}
                        </p>
                      </div>
                    )}
                    
                    {property.netRentalIncome > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Net Income</span>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {formatCurrency(property.netRentalIncome || 0)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {hasFinancialInfo && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Financial Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loan.propertiesOwned.firstMortgage > 0 && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">First Mortgage</div>
                  <div className="mt-1 text-base font-semibold text-gray-900">
                    {formatCurrency(loan.propertiesOwned.firstMortgage)}
                  </div>
                </div>
              )}
              
              {loan.propertiesOwned.rent > 0 && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Rent</div>
                  <div className="mt-1 text-base font-semibold text-gray-900">
                    {formatCurrency(loan.propertiesOwned.rent)}
                  </div>
                </div>
              )}
              
              {loan.propertiesOwned.hazardInsurance > 0 && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Hazard Insurance</div>
                  <div className="mt-1 text-base font-semibold text-gray-900">
                    {formatCurrency(loan.propertiesOwned.hazardInsurance)}
                  </div>
                </div>
              )}
              
              {loan.propertiesOwned.realEstateTaxes > 0 && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Real Estate Taxes</div>
                  <div className="mt-1 text-base font-semibold text-gray-900">
                    {formatCurrency(loan.propertiesOwned.realEstateTaxes)}
                  </div>
                </div>
              )}
              
              {loan.propertiesOwned.mortgageInsurance > 0 && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Mortgage Insurance</div>
                  <div className="mt-1 text-base font-semibold text-gray-900">
                    {formatCurrency(loan.propertiesOwned.mortgageInsurance)}
                  </div>
                </div>
              )}
              
              {loan.propertiesOwned.hoaDues > 0 && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">HOA Dues</div>
                  <div className="mt-1 text-base font-semibold text-gray-900">
                    {formatCurrency(loan.propertiesOwned.hoaDues)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesOwnedCard;
