import { useState, useEffect } from 'react';
import { X, Edit, Save, ChevronDown, ChevronUp } from 'lucide-react';

const LoanParametersModal = ({
  isOpen,
  onClose,
  loan,
  loanPrograms,
  loanRates,
  selectedProgram,
  calculations: initialCalculations,
  onProgramChange,
  onUpdate
}) => {
  const [localParams, setLocalParams] = useState({
    loanAmount: 0,
    downPayment: 0,
    downPaymentPercent: 0,
    propertyTaxes: 0,
    homeownersInsurance: 0,
    hoaFees: 0,
    income: 0,
    debts: 0,
    assets: 0,
    selectedProgramId: '',
    interestRate: 0,
    loanTerm: 30
  });
  
  // Toggle states for unit type ($ or %) and frequency (monthly or yearly)
  const [toggleStates, setToggleStates] = useState({
    propertyTaxes: { isPercent: false, isYearly: true },
    homeownersInsurance: { isPercent: false, isYearly: true },
    hoaFees: { isPercent: false, isYearly: false }
  });

  // State to track accordion visibility
  const [showFinanceFees, setShowFinanceFees] = useState(false);

  const [calculations, setCalculations] = useState({
    principalAndInterest: 0,
    taxes: 0,
    insurance: 0,
    mortgageInsurance: 0,
    hoa: 0,
    monthlyPayment: 0,
    dti: 0,
    isQualified: false
  });

  // Initialize local state from props
  useEffect(() => {
    if (loan && selectedProgram) {
      const totalIncome = getTotalIncome();
      const totalDebts = getTotalDebts();
      const totalAssets = getTotalAssets();

      setLocalParams({
        loanAmount: getLoanAmount(),
        downPayment: loan.loanDetails?.downPayment || 0,
        downPaymentPercent: initialCalculations.downPaymentPercent,
        propertyTaxes: loan.loanDetails?.propertyTaxes || 0,
        homeownersInsurance: loan.loanDetails?.homeownersInsurance || 0,
        hoaFees: loan.loanDetails?.hoaFees || 0,
        income: totalIncome,
        debts: totalDebts,
        assets: totalAssets,
        selectedProgramId: selectedProgram._id,
        interestRate: getInterestRate(),
        loanTerm: selectedProgram.loanTerm || 30
      });

      setCalculations({
        principalAndInterest: initialCalculations.principalAndInterest,
        taxes: initialCalculations.taxes,
        insurance: initialCalculations.insurance,
        mortgageInsurance: initialCalculations.mortgageInsurance,
        hoa: initialCalculations.hoa,
        monthlyPayment: initialCalculations.monthlyPayment,
        dti: initialCalculations.dti,
        isQualified: initialCalculations.isQualified
      });
    }
  }, [loan, selectedProgram, initialCalculations]);

  // Recalculate when parameters change
  useEffect(() => {
    if (selectedProgram) {
      recalculateValues();
    }
  }, [localParams]);

  // Helper functions to calculate loan values
  const getLoanAmount = () => {
    if (!loan?.loanDetails) return 0;

    const { loanType = 'Purchase' } = loan.loanDetails;

    if (loanType.toLowerCase() === 'purchase') {
      return loan.loanDetails.purchasePrice || 0;
    } else if (loanType.toLowerCase() === 'refinance') {
      return loan.loanDetails.requestedLoanAmount || 0;
    } else if (loanType.toLowerCase() === 'construction') {
      return loan.loanDetails.loanAmount || 0;
    }

    return 0;
  };

  const getInterestRate = () => {
    if (!selectedProgram || !loanRates.length) return 7.0;

    const programRate = loanRates.find(rate =>
      rate.programType === selectedProgram.programType
    );

    return programRate ? programRate.rate : 7.0;
  };

  const getTotalIncome = () => {
    if (!loan?.income) return 0;

    let total = 0;
    const { baseIncome = 0, overtime = 0, commissions = 0, bonuses = 0, militaryEntitlements = 0 } = loan.income;

    total += parseFloat(baseIncome || 0);
    total += parseFloat(overtime || 0);
    total += parseFloat(commissions || 0);
    total += parseFloat(bonuses || 0);
    total += parseFloat(militaryEntitlements || 0);

    // Add other income if available
    if (loan.income.otherIncome && Array.isArray(loan.income.otherIncome)) {
      loan.income.otherIncome.forEach(income => {
        total += parseFloat(income.amount || 0);
      });
    }

    return total;
  };

  const getTotalDebts = () => {
    if (!loan?.debts || !Array.isArray(loan.debts)) return 0;

    return loan.debts.reduce((total, debt) => {
      return total + parseFloat(debt.monthlyPayment || 0);
    }, 0);
  };

  const getTotalAssets = () => {
    if (!loan?.assets) return 0;

    let total = 0;

    // Add checking and savings accounts
    if (loan.assets.checkingAndSavings && Array.isArray(loan.assets.checkingAndSavings)) {
      loan.assets.checkingAndSavings.forEach(account => {
        total += parseFloat(account.value || 0);
      });
    }

    // Add stocks and bonds
    if (loan.assets.stocksAndBonds && Array.isArray(loan.assets.stocksAndBonds)) {
      loan.assets.stocksAndBonds.forEach(asset => {
        total += parseFloat(asset.value || 0);
      });
    }

    // Add misc assets
    if (loan.assets.miscellaneous && Array.isArray(loan.assets.miscellaneous)) {
      loan.assets.miscellaneous.forEach(asset => {
        total += parseFloat(asset.value || 0);
      });
    }

    return total;
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Handle toggle changes for unit type ($ or %) and frequency (monthly or yearly)
  const handleToggleChange = (field, toggleType) => {
    setToggleStates(prev => {
      const newState = {
        ...prev,
        [field]: {
          ...prev[field],
          [toggleType]: !prev[field][toggleType]
        }
      };
      
      // Convert values when toggling between percentage and dollar
      if (toggleType === 'isPercent') {
        const isNowPercent = !prev[field].isPercent;
        let newValue;
        
        if (isNowPercent) {
          // Convert from dollar to percentage based on loan amount
          newValue = (localParams[field] / localParams.loanAmount) * 100;
        } else {
          // Convert from percentage to dollar amount
          newValue = (localParams[field] / 100) * localParams.loanAmount;
        }
        
        setLocalParams(prevParams => ({
          ...prevParams,
          [field]: parseFloat(newValue.toFixed(2))
        }));
      }
      
      // Convert values when toggling between monthly and yearly
      if (toggleType === 'isYearly') {
        const isNowYearly = !prev[field].isYearly;
        let newValue;
        
        if (isNowYearly) {
          // Convert from monthly to yearly
          newValue = localParams[field] * 12;
        } else {
          // Convert from yearly to monthly
          newValue = localParams[field] / 12;
        }
        
        setLocalParams(prevParams => ({
          ...prevParams,
          [field]: parseFloat(newValue.toFixed(2))
        }));
      }
      
      return newState;
    });
  };
  
  // Handle loan parameter changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    let numValue = type === 'number' ? parseFloat(value) : value;

    if (type === 'number' && isNaN(numValue)) {
      numValue = 0;
    }

    // Special handling for down payment which affects down payment percentage
    if (name === 'downPayment') {
      const downPaymentPercent = (numValue / localParams.loanAmount) * 100;
      setLocalParams(prev => ({
        ...prev,
        downPayment: numValue,
        downPaymentPercent: downPaymentPercent
      }));
    }
    // Special handling for down payment percentage which affects down payment
    else if (name === 'downPaymentPercent') {
      const downPayment = (numValue / 100) * localParams.loanAmount;
      setLocalParams(prev => ({
        ...prev,
        downPaymentPercent: numValue,
        downPayment: downPayment
      }));
    }
    // Handle program change
    else if (name === 'selectedProgramId') {
      const program = loanPrograms.find(p => p._id === value);
      if (program) {
        onProgramChange(value);

        // Get new interest rate
        const newRate = loanRates.find(rate => rate.programType === program.programType)?.rate || 7.0;

        setLocalParams(prev => ({
          ...prev,
          selectedProgramId: value,
          interestRate: newRate,
          loanTerm: program.loanTerm || 30
        }));
      }
    }
    // All other regular inputs
    else {
      setLocalParams(prev => ({
        ...prev,
        [name]: numValue
      }));
    }
  };

  // Calculate mortgage insurance based on LTV ratio
  const calculateMortgageInsurance = (loanAmount, downPaymentPercent) => {
    if (!selectedProgram?.privateMortgageInsurance || !Array.isArray(selectedProgram.privateMortgageInsurance)) {
      return 0;
    }

    // Calculate LTV (Loan-to-Value) ratio
    const ltv = 100 - downPaymentPercent;

    // Find the applicable PMI rate based on LTV
    const pmiRate = selectedProgram.privateMortgageInsurance.find(
      pmi => ltv >= pmi.minLTV && ltv <= pmi.maxLTV
    );

    if (!pmiRate) {
      return 0; // No PMI if LTV is below 80% (or no matching range found)
    }

    // Calculate annual PMI amount and divide by 12 for monthly amount
    return (pmiRate.rate / 100 * loanAmount * (1 - (downPaymentPercent / 100))) / 12;
  };

  // Recalculate all values based on parameters
  const recalculateValues = () => {
    // Get the actual loan amount (minus down payment)
    const principalAmount = localParams.loanAmount * (1 - (localParams.downPaymentPercent / 100));

    // Calculate P&I
    const monthlyRate = localParams.interestRate / 100 / 12;
    const totalPayments = localParams.loanTerm * 12;

    let principalAndInterest = 0;
    if (monthlyRate > 0 && totalPayments > 0 && principalAmount > 0) {
      principalAndInterest = principalAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
        (Math.pow(1 + monthlyRate, totalPayments) - 1);
    }

    // Get the monthly taxes, insurance, and HOA with appropriate conversions
    let taxes = localParams.propertyTaxes || 0;
    if (toggleStates.propertyTaxes.isPercent) {
      // If property taxes are entered as a percentage, convert to a dollar amount
      taxes = (taxes / 100) * localParams.loanAmount;
    }
    if (toggleStates.propertyTaxes.isYearly) {
      // If property taxes are entered as yearly, convert to monthly
      taxes = taxes / 12;
    }

    let insurance = localParams.homeownersInsurance || 0;
    if (toggleStates.homeownersInsurance.isPercent) {
      // If insurance is entered as a percentage, convert to a dollar amount
      insurance = (insurance / 100) * localParams.loanAmount;
    }
    if (toggleStates.homeownersInsurance.isYearly) {
      // If insurance is entered as yearly, convert to monthly
      insurance = insurance / 12;
    }

    let hoa = localParams.hoaFees || 0;
    if (toggleStates.hoaFees.isPercent) {
      // If HOA fees are entered as a percentage, convert to a dollar amount
      hoa = (hoa / 100) * localParams.loanAmount;
    }
    if (toggleStates.hoaFees.isYearly) {
      // If HOA fees are entered as yearly, convert to monthly
      hoa = hoa / 12;
    }

    // Calculate mortgage insurance
    const mortgageInsurance = calculateMortgageInsurance(localParams.loanAmount, localParams.downPaymentPercent);

    // Calculate total monthly payment
    const monthlyPayment = principalAndInterest + taxes + insurance + mortgageInsurance + hoa;

    // Calculate DTI
    const dti = localParams.income > 0 ?
      ((localParams.debts + monthlyPayment) / localParams.income) * 100 : 0;

    // Check if loan qualifies based on DTI limit
    const dtiLimit = selectedProgram?.restrictions?.dtiRestriction?.max || 43;
    const isQualified = dti <= dtiLimit;

    setCalculations({
      principalAndInterest,
      taxes,
      insurance,
      mortgageInsurance,
      hoa,
      monthlyPayment,
      dti,
      isQualified
    });
  };

  // Handle saving changes to the loan
  const handleSaveChanges = async () => {
    // Here you would normally save changes back to the server
    // For this implementation, we'll just notify parent component of changes
    if (onUpdate) {
      onUpdate({
        loanAmount: localParams.loanAmount,
        downPayment: localParams.downPayment,
        propertyTaxes: localParams.propertyTaxes,
        homeownersInsurance: localParams.homeownersInsurance,
        hoaFees: localParams.hoaFees,
        selectedProgramId: localParams.selectedProgramId
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 flex justify-end">
      <div className="w-full md:w-4/5 lg:w-3/4 h-full bg-white shadow-xl overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Loan Parameters</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 focus:outline-none"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Calculation Status Section */}
          <div className={`p-4 mb-6 rounded-md ${calculations.isQualified
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
            }`}>
            <div className="flex items-center">
              <div className={`rounded-full p-2 mr-3 ${calculations.isQualified ? 'bg-green-100' : 'bg-red-100'
                }`}>
                <span className="text-2xl">
                  {calculations.isQualified ? '😊' : '😔'}
                </span>
              </div>
              <div>
                <h3 className={`font-semibold ${calculations.isQualified ? 'text-green-700' : 'text-red-700'
                  }`}>
                  Calculation Status: {calculations.isQualified ? 'Qualified' : 'Not Qualified'}
                </h3>
                <p className={`text-sm ${calculations.isQualified ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {calculations.isQualified
                    ? 'Your calculations are looking good, and this scenario is Qualified!'
                    : 'Your debt is too high for this type of loan.'}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Breakdown Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Breakdown</h3>
            <div className="grid grid-cols-5 gap-2 mb-2">
              <div className="text-sm font-medium">P&I: {formatCurrency(calculations.principalAndInterest)}</div>
              <div className="text-sm font-medium">Taxes: {formatCurrency(calculations.taxes)}</div>
              <div className="text-sm font-medium">Insurance: {formatCurrency(calculations.insurance)}</div>
              <div className="text-sm font-medium">MI: {formatCurrency(calculations.mortgageInsurance)}</div>
              <div className="text-sm font-medium">HOA: {formatCurrency(calculations.hoa)}</div>
            </div>

            {/* Progress bar for DTI visualization */}
            <div className="mb-2">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${calculations.isQualified ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(calculations.dti, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <div>DTI: {calculations.dti.toFixed(2)}%</div>
                <div>Total: {formatCurrency(calculations.monthlyPayment)}</div>
              </div>
            </div>
          </div>

          {/* Income, Debts, and Assets Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">Income</h4>
                <button className="text-blue-600 hover:text-blue-800">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xl font-semibold">{formatCurrency(localParams.income)} /Month</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">Debts</h4>
                <button className="text-blue-600 hover:text-blue-800">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xl font-semibold">{formatCurrency(localParams.debts)} /Month</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">Assets</h4>
                <button className="text-blue-600 hover:text-blue-800">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xl font-semibold">{formatCurrency(localParams.assets)}</div>
            </div>

            
          </div>
          {/* Two-column layout for Loan Details and Program Guidelines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Loan Details Column */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Loan Details</h3>

                {/* Purchase Price / Loan Amount */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Price (Loan Amount: {formatCurrency(localParams.loanAmount * (1 - (localParams.downPaymentPercent / 100)))})
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md h-10">
                      $
                    </span>
                    <input
                      type="number"
                      name="loanAmount"
                      value={localParams.loanAmount}
                      onChange={handleInputChange}
                      className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                    />
                  </div>
                </div>

                {/* Down Payment */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Down Payment
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex">
                      <span className="inline-flex items-center px-3 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md h-10">
                        $
                      </span>
                      <input
                        type="number"
                        name="downPayment"
                        value={localParams.downPayment}
                        onChange={handleInputChange}
                        className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                      />
                    </div>
                    <div className="flex">
                      <input
                        type="number"
                        name="downPaymentPercent"
                        value={localParams.downPaymentPercent.toFixed(3)}
                        onChange={handleInputChange}
                        className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                      />
                      <span className="inline-flex items-center px-3 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md h-10">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rate Adjustment */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate Adjustment
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md h-10">
                      %
                    </span>
                    <input
                      type="number"
                      name="rateAdjustment"
                      value="0.000"
                      readOnly
                      className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                    />
                  </div>
                </div>

                {/* Interest Rate */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md h-10">
                      %
                    </span>
                    <input
                      type="number"
                      name="interestRate"
                      value={localParams.interestRate}
                      readOnly
                      className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                    />
                  </div>
                </div>

                {/* Loan Term */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Term
                  </label>
                  <div className="relative">
                    <select
                      name="loanTerm"
                      value={localParams.loanTerm}
                      readOnly
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-50 h-10 appearance-none"
                    >
                      <option value="30">30 Years</option>
                      <option value="20">20 Years</option>
                      <option value="15">15 Years</option>
                      <option value="10">10 Years</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Property Taxes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Taxes
                  </label>
                  <div className="flex items-center">
                    <div className="flex rounded-md">
                      {/* $ / % toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleChange('propertyTaxes', 'isPercent')}
                        className={`px-3 py-2 ${toggleStates.propertyTaxes.isPercent ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white'} border border-r-0 border-gray-300 rounded-l-md hover:bg-opacity-80 transition-colors h-10`}
                      >
                        $
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('propertyTaxes', 'isPercent')}
                        className={`px-3 py-2 ${!toggleStates.propertyTaxes.isPercent ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white'} border border-l-0 border-gray-300 rounded-r-md hover:bg-opacity-80 transition-colors h-10`}
                      >
                        %
                      </button>
                    </div>
                    <input
                      type="number"
                      name="propertyTaxes"
                      value={localParams.propertyTaxes}
                      onChange={handleInputChange}
                      className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10 mx-2"
                    />
                    {/* /mo / /yr toggle */}
                    <div className="flex rounded-md">
                      <button
                        type="button"
                        onClick={() => handleToggleChange('propertyTaxes', 'isYearly')}
                        className={`px-3 py-2 text-sm ${!toggleStates.propertyTaxes.isYearly ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} border border-r-0 border-gray-300 rounded-l-md hover:bg-opacity-80 transition-colors whitespace-nowrap h-10`}
                      >
                        /mo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('propertyTaxes', 'isYearly')}
                        className={`px-3 py-2 text-sm ${toggleStates.propertyTaxes.isYearly ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} border border-l-0 border-gray-300 rounded-r-md hover:bg-opacity-80 transition-colors whitespace-nowrap h-10`}
                      >
                        /yr
                      </button>
                    </div>
                  </div>
                </div>

                {/* Homeowners Insurance */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Homeowners Insurance
                  </label>
                  <div className="flex items-center">
                    <div className="flex rounded-md">
                      {/* $ / % toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleChange('homeownersInsurance', 'isPercent')}
                        className={`px-3 py-2 ${toggleStates.homeownersInsurance.isPercent ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white'} border border-r-0 border-gray-300 rounded-l-md hover:bg-opacity-80 transition-colors h-10`}
                      >
                        $
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('homeownersInsurance', 'isPercent')}
                        className={`px-3 py-2 ${!toggleStates.homeownersInsurance.isPercent ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white'} border border-l-0 border-gray-300 rounded-r-md hover:bg-opacity-80 transition-colors h-10`}
                      >
                        %
                      </button>
                    </div>
                    <input
                      type="number"
                      name="homeownersInsurance"
                      value={localParams.homeownersInsurance}
                      onChange={handleInputChange}
                      className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10 mx-2"
                    />
                    {/* /mo / /yr toggle */}
                    <div className="flex rounded-md">
                      <button
                        type="button"
                        onClick={() => handleToggleChange('homeownersInsurance', 'isYearly')}
                        className={`px-3 py-2 text-sm ${!toggleStates.homeownersInsurance.isYearly ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} border border-r-0 border-gray-300 rounded-l-md hover:bg-opacity-80 transition-colors whitespace-nowrap h-10`}
                      >
                        /mo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('homeownersInsurance', 'isYearly')}
                        className={`px-3 py-2 text-sm ${toggleStates.homeownersInsurance.isYearly ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} border border-l-0 border-gray-300 rounded-r-md hover:bg-opacity-80 transition-colors whitespace-nowrap h-10`}
                      >
                        /yr
                      </button>
                    </div>
                  </div>
                </div>

                {/* HOA Dues */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HOA Dues
                  </label>
                  <div className="flex items-center">
                    <div className="flex rounded-md">
                      {/* $ / % toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleChange('hoaFees', 'isPercent')}
                        className={`px-3 py-2 ${toggleStates.hoaFees.isPercent ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white'} border border-r-0 border-gray-300 rounded-l-md hover:bg-opacity-80 transition-colors h-10`}
                      >
                        $
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('hoaFees', 'isPercent')}
                        className={`px-3 py-2 ${!toggleStates.hoaFees.isPercent ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white'} border border-l-0 border-gray-300 rounded-r-md hover:bg-opacity-80 transition-colors h-10`}
                      >
                        %
                      </button>
                    </div>
                    <input
                      type="number"
                      name="hoaFees"
                      value={localParams.hoaFees}
                      onChange={handleInputChange}
                      className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10 mx-2"
                    />
                    {/* /mo / /yr toggle */}
                    <div className="flex rounded-md">
                      <button
                        type="button"
                        onClick={() => handleToggleChange('hoaFees', 'isYearly')}
                        className={`px-3 py-2 text-sm ${!toggleStates.hoaFees.isYearly ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} border border-r-0 border-gray-300 rounded-l-md hover:bg-opacity-80 transition-colors whitespace-nowrap h-10`}
                      >
                        /mo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('hoaFees', 'isYearly')}
                        className={`px-3 py-2 text-sm ${toggleStates.hoaFees.isYearly ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} border border-l-0 border-gray-300 rounded-r-md hover:bg-opacity-80 transition-colors whitespace-nowrap h-10`}
                      >
                        /yr
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Program Guidelines Column */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Program Guidelines</h3>

                {/* Loan Program Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Program
                  </label>
                  <div className="relative">
                    <select
                      name="selectedProgramId"
                      value={localParams.selectedProgramId}
                      onChange={handleInputChange}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-50 h-10 appearance-none"
                    >
                      {loanPrograms.map(program => (
                        <option key={program._id} value={program._id}>
                          {program.displayName}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Pre-Approval Letter Template */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pre-Approval Letter Template
                  </label>
                  <div className="relative">
                    <select
                      name="preApprovalTemplate"
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-50 h-10 appearance-none"
                    >
                      <option value="standard">Pre-Approval Letter</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* DTI Restriction */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DTI Letter Restriction (%)
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm h-10">
                      Max
                    </span>
                    <input
                      type="number"
                      name="dtiMax"
                      value={selectedProgram?.restrictions?.dtiRestriction?.max || 43}
                      readOnly
                      className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-r-md bg-gray-50 h-10"
                    />
                  </div>
                </div>

                {/* Down Payment Restriction */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Down Payment (%)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">
                        Min
                      </span>
                      <input
                        type="number"
                        name="downPaymentMin"
                        value={selectedProgram?.restrictions?.downPaymentRestriction?.min || 3}
                        readOnly
                        className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-r-md bg-gray-50 h-10"
                      />
                    </div>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">
                        Max
                      </span>
                      <input
                        type="number"
                        name="downPaymentMax"
                        value={selectedProgram?.restrictions?.downPaymentRestriction?.max || ''}
                        readOnly
                        className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-r-md bg-gray-50 h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Loan Amount Restriction */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Amount ($)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">
                        Min
                      </span>
                      <input
                        type="number"
                        name="loanAmountMin"
                        value={selectedProgram?.restrictions?.loanAmountRestriction?.min || ''}
                        readOnly
                        className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-r-md bg-gray-50 h-10"
                      />
                    </div>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">
                        Max
                      </span>
                      <input
                        type="number"
                        name="loanAmountMax"
                        value={selectedProgram?.restrictions?.loanAmountRestriction?.max || ''}
                        readOnly
                        className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-r-md bg-gray-50 h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Mortgage Insurance Section */}
                {/* Simple check to see if the program name is or contains 'FHA' */}
                {(() => {
                  // Get the selected program from the dropdown
                  const selectedProgramFromList = loanPrograms.find(p => p._id === localParams.selectedProgramId);
                  const programName = selectedProgramFromList?.displayName || '';
                  console.log('Program name:', programName);
                  
                  // This should detect any program with FHA in the name
                  return programName.includes('FHA') ? (
                  <div className="mb-4">
                    <h4 className="block text-sm font-medium text-gray-700 mb-3">Mortgage Insurance</h4>
                    
                    {/* Upfront Mortgage Insurance (UFMI %) */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upfront Mortgage Insurance (UFMI %)
                      </label>
                      <div className="flex">
                        <input
                          type="number"
                          name="upfrontMIP"
                          value={selectedProgram?.fhaMortgageInsurance?.upfrontMIP || 1.75}
                          readOnly
                          className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-l-md bg-gray-50 h-10"
                        />
                        <span className="inline-flex items-center px-3 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md h-10">
                          %
                        </span>
                      </div>
                    </div>
                    
                    {/* Monthly Mortgage Insurance (MI %) */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Mortgage Insurance (MI %)
                      </label>
                      <div className="flex">
                        <input
                          type="number"
                          name="annualMIP"
                          value={selectedProgram?.fhaMortgageInsurance?.annualMIP || 0.85}
                          readOnly
                          className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-l-md bg-gray-50 h-10"
                        />
                        <span className="inline-flex items-center px-3 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md h-10">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* PMI Table */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Private Mortgage Insurance (%)
                      </label>
                      <div className="border border-gray-300 rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">LTV Range</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {selectedProgram?.privateMortgageInsurance?.map((pmi, index) => (
                              <tr key={index}>
                                <td className="whitespace-nowrap px-3 py-2 text-xs">{pmi.minLTV}-{pmi.maxLTV}%</td>
                                <td className="whitespace-nowrap px-3 py-2 text-xs">{pmi.rate}%</td>
                              </tr>
                            )) || (
                                <tr>
                                  <td colSpan="2" className="whitespace-nowrap px-3 py-2 text-xs text-center text-gray-500">No PMI data available</td>
                                </tr>
                              )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* FMI Field */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        FMI (%) - Financed Mortgage Insurance
                      </label>
                      <div className="flex">
                        <input
                          type="number"
                          name="fmi"
                          value={selectedProgram?.fmi || 0}
                          readOnly
                          className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-l-md bg-gray-50 h-10"
                        />
                        <span className="inline-flex items-center px-3 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md h-10">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                );
                })()}

                {/* Finance Fees Section - Accordion */}
                <div className="mb-4 border border-gray-200 rounded-md overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
                    onClick={() => setShowFinanceFees(!showFinanceFees)}
                  >
                    <h4 className="text-sm font-medium text-gray-700">Hide Fees (fees are not displayed to customer)</h4>
                    {showFinanceFees ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                  </button>
                  
                  {showFinanceFees && (
                    <div className="p-4 bg-gray-50">
                      {/* Origination Fees */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Origination Fees
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Type toggle ($ or %) */}
                          <div className="grid grid-cols-2 h-10 w-20">
                            <button 
                              type="button"
                              className={`px-3 py-2 ${selectedProgram?.originationFees?.type !== 'percentage' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                              disabled
                            >
                              $
                            </button>
                            <button 
                              type="button"
                              className={`px-3 py-2 ${selectedProgram?.originationFees?.type === 'percentage' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                              disabled
                            >
                              %
                            </button>
                          </div>

                          {/* Value input */}
                          <div className="flex-1">
                            <div className="relative">
                              <input
                                type="number"
                                value={selectedProgram?.originationFees?.value || 0}
                                className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                                readOnly
                                style={{ height: '38px' }}
                              />
                            </div>
                          </div>

                          {/* Frequency toggle */}
                          <div className="grid grid-cols-3 h-10">
                            <button
                              type="button"
                              className={`px-3 py-2 ${selectedProgram?.originationFees?.frequency === 'once' || !selectedProgram?.originationFees?.frequency ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                              disabled
                            >
                              /once
                            </button>
                            <button
                              type="button"
                              className={`px-3 py-2 ${selectedProgram?.originationFees?.frequency === 'mo' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-400 transition text-sm font-medium`}
                              disabled
                            >
                              /mo
                            </button>
                            <button
                              type="button"
                              className={`px-3 py-2 ${selectedProgram?.originationFees?.frequency === 'yr' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                              disabled
                            >
                              /yr
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Closing Costs */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Closing Costs
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Type toggle ($ or %) */}
                          <div className="grid grid-cols-2 h-10 w-20">
                            <button 
                              type="button"
                              className={`px-3 py-2 ${selectedProgram?.closingCosts?.type !== 'percentage' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                              disabled
                            >
                              $
                            </button>
                            <button 
                              type="button"
                              className={`px-3 py-2 ${selectedProgram?.closingCosts?.type === 'percentage' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                              disabled
                            >
                              %
                            </button>
                          </div>

                          {/* Value input */}
                          <div className="flex-1">
                            <div className="relative">
                              <input
                                type="number"
                                value={selectedProgram?.closingCosts?.value || 0}
                                className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                                readOnly
                                style={{ height: '38px' }}
                              />
                            </div>
                          </div>

                          {/* Frequency toggle */}
                          <div className="grid grid-cols-3 h-10">
                            <button
                              type="button"
                              className={`px-3 py-2 ${selectedProgram?.closingCosts?.frequency === 'once' || !selectedProgram?.closingCosts?.frequency ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                              disabled
                            >
                              /once
                            </button>
                            <button
                              type="button"
                              className={`px-3 py-2 ${selectedProgram?.closingCosts?.frequency === 'mo' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-400 transition text-sm font-medium`}
                              disabled
                            >
                              /mo
                            </button>
                            <button
                              type="button"
                              className={`px-3 py-2 ${selectedProgram?.closingCosts?.frequency === 'yr' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                              disabled
                            >
                              /yr
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Other Fees */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Other Fees
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Type toggle ($ or %) */}
                          <div className="grid grid-cols-2 h-10 w-20">
                            <button 
                              type="button"
                              className={`px-3 py-2 ${selectedProgram?.otherFees?.type !== 'percentage' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                              disabled
                            >
                              $
                            </button>
                            <button 
                              type="button"
                              className={`px-3 py-2 ${selectedProgram?.otherFees?.type === 'percentage' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                              disabled
                            >
                              %
                            </button>
                          </div>

                          {/* Value input */}
                          <div className="flex-1">
                            <div className="relative">
                              <input
                                type="number"
                                value={selectedProgram?.otherFees?.value || 0}
                                className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                                readOnly
                                style={{ height: '38px' }}
                              />
                            </div>
                          </div>

                          {/* Frequency toggle */}
                          <div className="grid grid-cols-3 h-10">
                            <button
                              type="button"
                              className={`px-3 py-2 ${selectedProgram?.otherFees?.frequency === 'once' || !selectedProgram?.otherFees?.frequency ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                              disabled
                            >
                              /once
                            </button>
                            <button
                              type="button"
                              className={`px-3 py-2 ${selectedProgram?.otherFees?.frequency === 'mo' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-400 transition text-sm font-medium`}
                              disabled
                            >
                              /mo
                            </button>
                            <button
                              type="button"
                              className={`px-3 py-2 ${selectedProgram?.otherFees?.frequency === 'yr' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                              disabled
                            >
                              /yr
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2 inline-block" />
                  Save Changes
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanParametersModal;
