import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import theme from '../../../styles/theme';
import RequiredFieldIndicator from '../../common/RequiredFieldIndicator';

/**
 * Loan Details Form
 * 
 * @param {Object} props - Component props
 * @param {Object} props.loanInfo - Loan information data
 * @param {Function} props.onChange - Function to handle input changes
 * @param {Array} props.loanTypes - Available loan types
 * @param {Object} props.errors - Form validation errors
 * @param {String} props.userType - Type of user (borrower or lender)
 * @returns {JSX.Element} Loan details form component
 */
const LoanDetails = ({ loanInfo = {}, onChange, loanTypes = [], errors = {}, userType = 'borrower' }) => {
  // Individual state variables for each field for immediate feedback
  const [loanType, setLoanType] = useState(loanInfo.loanType || '');
  
  // Purchase loan fields
  const [purchasePrice, setPurchasePrice] = useState(loanInfo.purchasePrice || '');
  const [downPayment, setDownPayment] = useState(loanInfo.downPayment || '');
  
  // Refinance loan fields
  const [yearAcquired, setYearAcquired] = useState(loanInfo.yearAcquired || '');
  const [currentLoanBalance, setCurrentLoanBalance] = useState(loanInfo.currentLoanBalance || '');
  const [requestedLoanAmount, setRequestedLoanAmount] = useState(loanInfo.requestedLoanAmount || '');
  const [refinanceType, setRefinanceType] = useState(loanInfo.refinanceType || '');
  
  // Construction loan fields
  const [loanAmount, setLoanAmount] = useState(loanInfo.loanAmount || '');
  const [yearLotAcquired, setYearLotAcquired] = useState(loanInfo.yearLotAcquired || '');
  const [originalCost, setOriginalCost] = useState(loanInfo.originalCost || '');
  const [existingLoans, setExistingLoans] = useState(loanInfo.existingLoans || '');
  const [presentValueOfLot, setPresentValueOfLot] = useState(loanInfo.presentValueOfLot || '');
  const [costOfImprovements, setCostOfImprovements] = useState(loanInfo.costOfImprovements || '');
  const [constructionType, setConstructionType] = useState(loanInfo.constructionType || '');
  
  // Update all state variables when loanInfo changes from parent
  useEffect(() => {
    setLoanType(loanInfo.loanType || '');
    
    // Purchase loan fields
    setPurchasePrice(loanInfo.purchasePrice || '');
    setDownPayment(loanInfo.downPayment || '');
    
    // Refinance loan fields
    setYearAcquired(loanInfo.yearAcquired || '');
    setCurrentLoanBalance(loanInfo.currentLoanBalance || '');
    setRequestedLoanAmount(loanInfo.requestedLoanAmount || '');
    setRefinanceType(loanInfo.refinanceType || '');
    
    // Construction loan fields
    setLoanAmount(loanInfo.loanAmount || '');
    setYearLotAcquired(loanInfo.yearLotAcquired || '');
    setOriginalCost(loanInfo.originalCost || '');
    setExistingLoans(loanInfo.existingLoans || '');
    setPresentValueOfLot(loanInfo.presentValueOfLot || '');
    setCostOfImprovements(loanInfo.costOfImprovements || '');
    setConstructionType(loanInfo.constructionType || '');
  }, [loanInfo]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Use checked for checkboxes, value for other inputs
    const fieldValue = type === 'checkbox' ? checked : value;
    
    // Update local state for immediate feedback
    switch(name) {
      case 'loanType':
        setLoanType(value);
        // Auto-set loanPurpose to match loanType
        // setLoanPurpose(value); // Removed as per edit hint
        break;
      // case 'loanPurpose': // Removed as per edit hint
      //   setLoanPurpose(value);
      //   break;
      // Purchase fields
      case 'purchasePrice':
        setPurchasePrice(value);
        break;
      case 'downPayment':
        setDownPayment(value);
        break;
      // Refinance fields
      case 'yearAcquired':
        setYearAcquired(value);
        break;
      case 'currentLoanBalance':
        setCurrentLoanBalance(value);
        break;
      case 'requestedLoanAmount':
        setRequestedLoanAmount(value);
        break;
      case 'refinanceType':
        setRefinanceType(value);
        break;
      // Construction fields
      case 'loanAmount':
        setLoanAmount(value);
        break;
      case 'yearLotAcquired':
        setYearLotAcquired(value);
        break;
      case 'originalCost':
        setOriginalCost(value);
        break;
      case 'existingLoans':
        setExistingLoans(value);
        break;
      case 'presentValueOfLot':
        setPresentValueOfLot(value);
        break;
      case 'costOfImprovements':
        setCostOfImprovements(value);
        break;
      case 'constructionType':
        setConstructionType(value);
        break;
      default:
        break;
    }
    
    // Send to parent component
    onChange({
      target: {
        name: `loanInfo.${name}`,
        value
      }
    });
  };

  // Format currency input
  const formatCurrency = (value) => {
    if (!value) return '';
    const digits = String(value).replace(/[^\d]/g, '');
    if (!digits) return '';
    return new Intl.NumberFormat('en-US').format(Number(digits));
  };

  // Handle currency field changes (loan amount, down payment, etc.)
  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    // Remove non-numeric characters for storing the value
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Update local state for immediate feedback
    switch(name) {
      // Purchase loan fields
      case 'purchasePrice':
        setPurchasePrice(numericValue);
        break;
      case 'downPayment':
        setDownPayment(numericValue);
        break;
      
      // Refinance loan fields
      case 'currentLoanBalance':
        setCurrentLoanBalance(numericValue);
        break;
      case 'requestedLoanAmount':
        setRequestedLoanAmount(numericValue);
        break;
      
      // Construction loan fields
      case 'loanAmount':
        setLoanAmount(numericValue);
        break;
      case 'originalCost':
        setOriginalCost(numericValue);
        break;
      case 'existingLoans':
        setExistingLoans(numericValue);
        break;
      case 'presentValueOfLot':
        setPresentValueOfLot(numericValue);
        break;
      case 'costOfImprovements':
        setCostOfImprovements(numericValue);
        break;
      default:
        break;
    }
    
    // Send to parent component
    onChange({
      target: {
        name: `loanInfo.${name}`,
        value: numericValue
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Loan Details</h2>
        {userType === 'borrower' && (
          <p className="text-sm text-gray-500 mb-4">
            Tell us more about the loan you're looking for.
          </p>
        )}
        <hr className="border-t border-gray-300 mb-6" />
      </div>

      {/* Loan Type */}
      <div>
        <label htmlFor="loanType" className="block text-xs uppercase font-medium text-gray-500 mb-1">
          Loan Type<RequiredFieldIndicator />
        </label>
        <div className="relative">
          <select
            id="loanType"
            name="loanType"
            value={loanType}
            onChange={handleChange}
            className={`text-xs appearance-none w-full border ${errors['loanInfo.loanType'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2`}
            style={{ '--focus-ring-color': theme.colors.primary }}
          >
            <option value="">Select</option>
            <option value="Purchase">Purchase</option>
            <option value="Refinance">Refinance</option>
            <option value="Construction">Construction</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
        {errors['loanInfo.loanType'] && (
          <p className="text-red-500 text-xs mt-1">{errors['loanInfo.loanType']}</p>
        )}
      </div>

      {/* Purchase Details */}
      {loanType === 'Purchase' && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Purchase Details</h3>
          {userType === 'borrower' && (
            <p className="text-sm text-gray-500 mb-4">
              Please provide details about the property you're planning to purchase.
            </p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="purchasePrice" className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Purchase Price
                <RequiredFieldIndicator />
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  id="purchasePrice"
                  name="purchasePrice"
                  value={formatCurrency(purchasePrice || '')}
                  onChange={handleCurrencyChange}
                  className={`text-xs pl-7 w-full border ${errors['loanInfo.purchasePrice'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  style={{ '--focus-ring-color': theme.colors.primary }}
                  placeholder="0.00"
                />
              </div>
              {errors['loanInfo.purchasePrice'] && (
                <p className="text-red-500 text-xs mt-1">{errors['loanInfo.purchasePrice']}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="downPayment" className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Down Payment
                <RequiredFieldIndicator />
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  id="downPayment"
                  name="downPayment"
                  value={formatCurrency(downPayment || '')}
                  onChange={handleCurrencyChange}
                  className={`text-xs pl-7 w-full border ${errors['loanInfo.downPayment'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  style={{ '--focus-ring-color': theme.colors.primary }}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refinance Details */}
      {loanType === 'Refinance' && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Refinance Details</h3>
          {userType === 'borrower' && (
            <p className="text-sm text-gray-500 mb-4">
              Please provide details about your current mortgage and refinancing goals.
            </p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="yearAcquired" className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Year Acquired
                <RequiredFieldIndicator/>
              </label>
              <input
                type="number"
                id="yearAcquired"
                name="yearAcquired"
                value={yearAcquired}
                onChange={handleChange}
                className={`text-xs w-full border ${errors['loanInfo.yearAcquired'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                style={{ '--focus-ring-color': theme.colors.primary }}
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            
            <div>
              <label htmlFor="currentLoanBalance" className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Current Loan Balance
                <RequiredFieldIndicator/>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  id="currentLoanBalance"
                  name="currentLoanBalance"
                  value={formatCurrency(currentLoanBalance)}
                  onChange={handleCurrencyChange}
                  className={`text-xs pl-7 w-full border ${errors['loanInfo.currentLoanBalance'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  style={{ '--focus-ring-color': theme.colors.primary }}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="requestedLoanAmount" className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Requested Loan Amount
                <RequiredFieldIndicator/>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  id="requestedLoanAmount"
                  name="requestedLoanAmount"
                  value={formatCurrency(requestedLoanAmount || '')}
                  onChange={handleCurrencyChange}
                  className={`text-xs pl-7 w-full border ${errors['loanInfo.requestedLoanAmount'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  style={{ '--focus-ring-color': theme.colors.primary }}
                  placeholder="0.00"
                />
              </div>
              {errors['loanInfo.requestedLoanAmount'] && (
                <p className="text-red-500 text-xs mt-1">{errors['loanInfo.requestedLoanAmount']}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="refinanceType" className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Refinance Type
                <RequiredFieldIndicator/>
              </label>
              <div className="relative">
                <select
                  id="refinanceType"
                  name="refinanceType"
                  value={refinanceType || ''}
                  onChange={handleChange}
                  className={`text-xs appearance-none w-full border ${errors['loanInfo.refinanceType'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  style={{ '--focus-ring-color': theme.colors.primary }}
                >
                  <option value="">Select</option>
                  <option value="Refinance">Refinance</option>
                  <option value="Home Equity Line of Credit">Home Equity Line of Credit</option>
                  <option value="Cash-Out Refinance">Cash-Out Refinance</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Construction Details */}
      {loanType === 'Construction' && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Construction Details</h3>
          {userType === 'borrower' && (
            <p className="text-sm text-gray-500 mb-4">
              Please provide details about your construction project and financing needs.
            </p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="loanAmount" className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Loan Amount<RequiredFieldIndicator />
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-xs">$</span>
                </div>
                <input
                  type="text"
                  id="loanAmount"
                  name="loanAmount"
                  value={formatCurrency(loanAmount || '')}
                  onChange={handleCurrencyChange}
                  className={`text-xs pl-7 w-full border ${errors['loanInfo.loanAmount'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  style={{ '--focus-ring-color': theme.colors.primary }}
                  placeholder="0.00"
                />
              </div>
              {errors['loanInfo.loanAmount'] && (
                <p className="text-red-500 text-xs mt-1">{errors['loanInfo.loanAmount']}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="yearLotAcquired" className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Year Lot Acquired
                <RequiredFieldIndicator />
              </label>
              <input
                type="number"
                id="yearLotAcquired"
                name="yearLotAcquired"
                value={yearLotAcquired}
                onChange={handleChange}
                className={`text-xs w-full border ${errors['loanInfo.yearLotAcquired'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                style={{ '--focus-ring-color': theme.colors.primary }}
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            
            <div>
              <label htmlFor="originalCost" className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Original Cost
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  id="originalCost"
                  name="originalCost"
                  value={formatCurrency(originalCost || '')}
                  onChange={handleCurrencyChange}
                  className={`text-xs pl-7 w-full border ${errors['loanInfo.originalCost'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  style={{ '--focus-ring-color': theme.colors.primary }}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="existingLoans" className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Existing Loans
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  id="existingLoans"
                  name="existingLoans"
                  value={formatCurrency(existingLoans || '')}
                  onChange={handleCurrencyChange}
                  className={`text-xs pl-7 w-full border ${errors['loanInfo.existingLoans'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  style={{ '--focus-ring-color': theme.colors.primary }}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="presentValueOfLot" className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Present Value Of Lot
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  id="presentValueOfLot"
                  name="presentValueOfLot"
                  value={formatCurrency(presentValueOfLot || '')}
                  onChange={handleCurrencyChange}
                  className={`text-xs pl-7 w-full border ${errors['loanInfo.presentValueOfLot'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  style={{ '--focus-ring-color': theme.colors.primary }}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="costOfImprovements" className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Cost Of Improvements
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  id="costOfImprovements"
                  name="costOfImprovements"
                  value={formatCurrency(costOfImprovements || '')}
                  onChange={handleCurrencyChange}
                  className={`text-xs pl-7 w-full border ${errors['loanInfo.costOfImprovements'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  style={{ '--focus-ring-color': theme.colors.primary }}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <label htmlFor="constructionType" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Construction Type
            </label>
            <div className="relative">
              <select
                id="constructionType"
                name="constructionType"
                value={constructionType || ''}
                onChange={handleChange}
                className={`text-xs appearance-none w-full border ${errors['loanInfo.constructionType'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                style={{ '--focus-ring-color': theme.colors.primary }}
              >
                <option value="">Select</option>
                <option value="Construction">Construction</option>
                <option value="Construction-Permanent">Construction-Permanent</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

LoanDetails.propTypes = {
  loanInfo: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  loanTypes: PropTypes.array,
  errors: PropTypes.object,
  userType: PropTypes.oneOf(['borrower', 'lender'])
};

export default LoanDetails;
