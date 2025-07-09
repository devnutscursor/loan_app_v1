import React, { useState, useEffect } from 'react';
import { LoanRateService, LoanProgramService } from '../../../services';

/**
 * LoanSummaryCard component displays a visual summary of a loan with key metrics
 * @param {Object} loan - The loan data object
 * @param {Function} formatCurrency - Function to format currency values
 */
const LoanSummaryCard = ({ loan, formatCurrency }) => {
  if (!loan) return null;
  
  // State for interest rate and loan term
  const [interestRate, setInterestRate] = useState(loan.loanDetails?.interestRate || null);
  const [loanTerm, setLoanTerm] = useState(loan.loanDetails?.loanTerm || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch interest rate based on loan type
  useEffect(() => {
    const fetchLoanData = async () => {
      // Only fetch if we have a loan type
      if (loan?.loanDetails?.loanType) {
        setIsLoading(true);
        setError(null);
        
        try {
          // Extract lender ID from loan object if available
          let lenderId = null;
          
          // Check for lender ID in different possible formats
          if (loan?.lender && typeof loan.lender === 'string') {
            lenderId = loan.lender;
          } else if (loan?.lender && loan.lender._id) {
            lenderId = loan.lender._id;
          } else if (loan?.lenderDetails && loan.lenderDetails.id) {
            lenderId = loan.lenderDetails.id;
          }
          
          console.log('Using lender ID:', lenderId);
          
          // Get interest rate from loanRates collection with lender ID
          try {
            // Try with lender ID first
            if (lenderId && typeof lenderId === 'string') {
              const rateResponse = await LoanRateService.getRateByType(loan.loanDetails.loanType, lenderId);
              if (rateResponse?.data?.data?.rate) {
                setInterestRate(rateResponse.data.data.rate);
                console.log('Successfully fetched interest rate:', rateResponse.data.data.rate);
              }
            } 
            
            // If we couldn't get the rate with lender ID, try without it
            if (!interestRate) {
              console.log('Trying to fetch rate without lender ID');
              const fallbackResponse = await LoanRateService.getRateByType(loan.loanDetails.loanType);
              if (fallbackResponse?.data?.data?.rate) {
                setInterestRate(fallbackResponse.data.data.rate);
                console.log('Successfully fetched fallback interest rate:', fallbackResponse.data.data.rate);
              }
            }

            // If we still don't have an interest rate, set a default
            if (!interestRate) {
              // Set default rates based on loan type as fallback
              const defaultRates = {
                'conventional': 6.75,
                'fha': 7.25,
                'va': 6.25,
                'usda': 6.5,
                'jumbo': 7.5,
                'Purchase': 6.85, // Use this if the loan type is 'Purchase'
                'default': 7.0
              };
              
              const fallbackRate = defaultRates[loan.loanDetails.loanType] || defaultRates.default;
              setInterestRate(fallbackRate);
              console.log('Using fallback interest rate:', fallbackRate);
            }
          } catch (rateError) {
            console.error('All rate fetch attempts failed', rateError);
            // Set a reasonable default rate
            setInterestRate(7.0);
          }
          
          // Get loan program based on loan type and lender to extract the term
          const programFilters = { 
            programType: loan.loanDetails.loanType
          };
          
          // Only add lender filter if we have a valid string ID
          if (lenderId && typeof lenderId === 'string') {
            programFilters.lender = lenderId;
          }
          
          let programResponse = null;
          try {
            programResponse = await LoanProgramService.getAllPrograms(programFilters);
          } catch (programError) {
            console.log('Program fetch failed', programError);
          }
          
          if (programResponse?.data?.data?.length > 0) {
            // Use the first matching program's loan term
            setLoanTerm(programResponse.data.data[0].loanTerm);
          } else {
            console.log('No loan programs available for this loan type and lender');
          }
        } catch (err) {
          console.error('Error fetching loan details:', err);
          // Don't set error state to avoid showing error in UI - just keep existing data or N/A
          // Instead log error to console for debugging
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchLoanData();
  }, [loan?.loanDetails?.loanType, loan?.lender, loan?.lenderDetails?.id]);
  
  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
      <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="ml-2 text-lg font-semibold text-gray-900">Loan Summary</h3>
        </div>
        <p className="mt-1 text-sm text-gray-600">Key details about your loan application</p>
      </div>
      
      {/* Financial highlights */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-xs font-medium text-green-700 uppercase tracking-wide">Loan Amount</div>
            <div className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(loan?.loanDetails?.loanAmount) || 'N/A'}</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Interest Rate</div>
            <div className="mt-1 text-xl font-bold text-gray-900">
              {isLoading ? (
                <span className="text-gray-500">Loading...</span>
              ) : interestRate ? (
                `${interestRate}%`
              ) : (
                'N/A'
              )}
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">Term</div>
            <div className="mt-1 text-xl font-bold text-gray-900">
              {isLoading ? (
                <span className="text-gray-500">Loading...</span>
              ) : loanTerm ? (
                `${loanTerm} years`
              ) : (
                'N/A'
              )}
            </div>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-3">
            <div className="text-xs font-medium text-indigo-700 uppercase tracking-wide">Loan Type</div>
            <div className="mt-1 text-xl font-bold text-gray-900 truncate">{loan?.loanDetails?.loanType || 'N/A'}</div>
          </div>
        </div>
      </div>
      
      {/* Detailed information */}
      <div className="px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Loan Information</h4>
            <div className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Loan Number</dt>
                <dd className="mt-0.5 text-sm font-semibold text-gray-900">{loan?.loanNumber || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Loan Type</dt>
                <dd className="mt-0.5 text-sm font-semibold text-gray-900">{loan?.loanDetails?.loanType || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-0.5 text-sm font-semibold">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {loan?.status?.toLowerCase() === 'conditional approval' ? 'Approved' : 
                     loan?.status?.toLowerCase() === 'declined' ? 'Rejected' : 
                     loan?.status || 'N/A'}
                  </span>
                </dd>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Financial Details</h4>
            <div className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Property Value</dt>
                <dd className="mt-0.5 text-sm font-semibold text-gray-900">{formatCurrency(loan.property?.propertyValue)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Purchase Price</dt>
                <dd className="mt-0.5 text-sm font-semibold text-gray-900">{formatCurrency(loan.loanDetails?.purchasePrice) || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Down Payment</dt>
                <dd className="mt-0.5 text-sm font-semibold text-gray-900">{formatCurrency(loan.loanDetails?.downPayment) || 'N/A'}</dd>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Approval Details</h4>
            <div className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Processing Status</dt>
                <dd className="mt-0.5 text-sm font-semibold text-gray-900">{loan.processingStatus || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Completion</dt>
                <dd className="mt-0.5 text-sm font-semibold text-gray-900">
                  {loan.completionPercentage ? (
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${loan.completionPercentage}%` }}
                        ></div>
                      </div>
                      <span>{loan.completionPercentage}%</span>
                    </div>
                  ) : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Approval Type</dt>
                <dd className="mt-0.5 text-sm font-semibold text-gray-900">{loan.approvalType || 'N/A'}</dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanSummaryCard;
