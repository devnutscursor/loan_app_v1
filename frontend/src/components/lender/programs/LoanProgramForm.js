import { useState, useEffect } from 'react';

// Import component sections
import BasicProgramSection from './BasicProgramSection';
import LoanRestrictionsSection from './LoanRestrictionsSection';
import MortgageInsuranceSection from './MortgageInsuranceSection';
import FinanceFeesSection from './FinanceFeesSection';
import AdditionalSettingsSection from './AdditionalSettingsSection';

export default function LoanProgramForm({
  program = {}, 
  isLoading, 
  onSave,
  error: serverError
}) {
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    programName: '',
    displayName: '',
    programType: 'conventional',
    isAvailableToBorrower: true,
    isDefaultForIntegrations: false,
    loanHelpText: '',
    preApprovalLetterTemplate: 'standard',
    rateAdjustment: 0,
    loanTerm: 30,
    restrictions: {
      dtiRestriction: {
        max: 43
      },
      downPaymentRestriction: {
        min: 3,
        max: null
      },
      loanAmountRestriction: {
        min: null,
        max: null
      }
    },
    privateMortgageInsurance: [
      {
        minLTV: 80.01,
        maxLTV: 85,
        rate: 0.30
      },
      {
        minLTV: 85.01,
        maxLTV: 90,
        rate: 0.49
      },
      {
        minLTV: 90.01,
        maxLTV: 95,
        rate: 0.68
      },
      {
        minLTV: 95.01,
        maxLTV: 97,
        rate: 0.88
      }
    ],
    upfrontMortgageInsurance: 0,
    mortgageInsurance: 0,
    fmi: 0,
    fundingFee: 0,
    // Updated fee structure with toggle support
    originationFees: {
      amount: 0,
      percentage: 0,
      isPercent: false,
      frequency: 'once'
    },
    closingCosts: {
      amount: 0,
      percentage: 0,
      isPercent: false,
      frequency: 'once'
    },
    otherFees: {
      amount: 0,
      percentage: 0,
      isPercent: false,
      frequency: 'once'
    },
    isAdjustableRateMortgage: false,
    allowSubjectPropertyAddress: true,
    allowPreApprovalLetter: true,
    lockLoanData: false
  });

  // Load program data if editing
  useEffect(() => {
    if (program && program._id) {
      // Convert the old fee format to the new toggle-based structure
      const convertFeeFormat = (oldFee) => {
        if (!oldFee) return {
          amount: 0,
          percentage: 0,
          isPercent: false,
          frequency: 'once'
        };
        
        // Determine if the fee is percentage-based
        const isPercent = oldFee.type === 'percentage' || oldFee.type === 'points';
        
        return {
          amount: !isPercent ? (oldFee.value || 0) : 0,
          percentage: isPercent ? (oldFee.value || 0) : 0,
          isPercent,
          frequency: oldFee.frequency || 'once'
        };
      };
      
      setFormData({
        ...formData,
        ...program,
        // Make sure all required nested objects exist
        restrictions: {
          ...formData.restrictions,
          ...(program.restrictions || {})
        },
        // Convert fee structures to new format
        originationFees: convertFeeFormat(program.originationFees),
        closingCosts: convertFeeFormat(program.closingCosts),
        otherFees: convertFeeFormat(program.otherFees),
        // Ensure other objects exist
        privateMortgageInsurance: program.privateMortgageInsurance || formData.privateMortgageInsurance
      });
    }
  }, [program]);

  // Main handler for simple field changes
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle nested object changes for component sections
  const handleNestedChange = (section, updatedData) => {
    // If this is a fee section that's receiving a complete fee object
    if (['originationFees', 'closingCosts', 'otherFees'].includes(section)) {
      // Update the entire fee object
      setFormData(prev => ({
        ...prev,
        [section]: updatedData
      }));
    } else {
      // For other sections, update as before
      setFormData(prev => ({
        ...prev,
        [section]: updatedData
      }));
    }
  };

  // Convert the form data to the format expected by the backend before submission
  const prepareFormDataForSubmission = () => {
    // Create a deep copy of the form data
    const submissionData = { ...formData };
    
    // Process fee data to match backend expectations
    ['originationFees', 'closingCosts', 'otherFees'].forEach(feeType => {
      const fee = submissionData[feeType];
      
      // Use the appropriate value based on the toggle state
      const value = fee.isPercent ? fee.percentage : fee.amount;
      
      // Convert to the structure expected by the backend model
      // The backend only expects { type, value } without frequency
      submissionData[feeType] = {
        type: value === 0 ? 'none' : (fee.isPercent ? 'percentage' : 'flat'),
        value
      };
      
      // Add frequency as an extension to the model for API transmission
      // The API can extract this data and store it appropriately
      if (fee.frequency && fee.frequency !== 'once') {
        submissionData[feeType].frequency = fee.frequency;
      }
    });
    
    return submissionData;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.programName || formData.programName.trim() === '') {
      setError('Program Name is required');
      return;
    }
    
    if (!formData.displayName || formData.displayName.trim() === '') {
      setError('Display Name is required');
      return;
    }
    
    if (!formData.programType || formData.programType.trim() === '') {
      setError('Program Type is required');
      return;
    }
    
    // Clear any previous errors
    setError('');
    
    // Prepare data for submission with the correct fee format
    const submissionData = prepareFormDataForSubmission();
    
    // Log the data being sent for debugging
    console.log('Submitting form data:', submissionData);
    
    // Submit the form data
    onSave(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Program Information */}
      <BasicProgramSection 
        formData={formData} 
        onChange={handleFieldChange} 
        isLoading={isLoading} 
      />
      
      {/* Loan Restrictions Section */}
      <LoanRestrictionsSection 
        formData={formData} 
        onChange={handleNestedChange} 
        isLoading={isLoading} 
      />
      
      {/* Mortgage Insurance Section */}
      <MortgageInsuranceSection 
        formData={formData} 
        onChange={handleFieldChange} 
        isLoading={isLoading} 
      />
      
      {/* Finance Fees Section - with the new toggle UI */}
      <FinanceFeesSection 
        formData={formData} 
        onChange={handleNestedChange} 
        isLoading={isLoading} 
      />
      
      {/* Additional Settings Section */}
      {/* <AdditionalSettingsSection 
        formData={formData} 
        onChange={handleFieldChange} 
        isLoading={isLoading} 
      /> */}

      {/* Error display */}
      {(error || serverError) && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
          {error || serverError}
        </div>
      )}

      {/* Submit button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className={`px-6 py-2 rounded-md text-white min-w-[150px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Program'}
        </button>
      </div>
    </form>
  );
}
