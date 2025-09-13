import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Save } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import Head from 'next/head';
import Link from 'next/link';
import { LoanProgramService } from '@/services';

import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Import component sections
import BasicProgramSection from '../../../components/lender/programs/BasicProgramSection';
import LoanRestrictionsSection from '../../../components/lender/programs/LoanRestrictionsSection';
import MortgageInsuranceSection from '../../../components/lender/programs/MortgageInsuranceSection';
import FinanceFeesSection from '../../../components/lender/programs/FinanceFeesSection';

export default function CompanyEditLoanProgram() {
  const router = useRouter();
  const { id } = router.query;
  const isNewProgram = id === 'create';

  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(!isNewProgram);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [validationErrors, setValidationErrors] = useState({});
  const [existingPrograms, setExistingPrograms] = useState([]);

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
        max: 43,
      },
      downPaymentRestriction: {
        min: 3,
        max: null,
      },
      loanAmountRestriction: {
        min: null,
        max: null,
      },
    },
    privateMortgageInsurance: [
      {
        minLTV: 80.01,
        maxLTV: 85,
        rate: 0.3,
      },
      {
        minLTV: 85.01,
        maxLTV: 90,
        rate: 0.49,
      },
      {
        minLTV: 90.01,
        maxLTV: 95,
        rate: 0.68,
      },
      {
        minLTV: 95.01,
        maxLTV: 97,
        rate: 0.88,
      },
    ],
    upfrontMortgageInsurance: 0,
    mortgageInsurance: 0,
    fmi: 0,
    fundingFee: 2.3, // Default funding fee for VA loans (will be overridden for USDA)
    // Fee structure matching FinanceFeesSection component
    originationFees: {
      amount: 0,
      percentage: 0,
      isPercent: false,
      frequency: 'once',
    },
    closingCosts: {
      amount: 0,
      percentage: 0,
      isPercent: false,
      frequency: 'once',
    },
    otherFees: {
      amount: 0,
      percentage: 0,
      isPercent: false,
      frequency: 'once',
    },
    isAdjustableRateMortgage: false,
    allowSubjectPropertyAddress: true,
    lockLoanData: false,
  });

  // Load existing programs for validation
  useEffect(() => {
    const loadExistingPrograms = async () => {
      try {
        const response = await LoanProgramService.getAllPrograms();
        console.log('API Response structure:', response);
        console.log('Response.data:', response?.data);
        console.log('Response.data.data:', response?.data?.data);
        
        // Extract the data array from the response
        const programs = response?.data?.data || [];
        console.log('Extracted programs:', programs);
        setExistingPrograms(programs);
        
        // If we're in edit mode and have form data, validate the current program name
        if (!isNewProgram && formData.programName) {
          setTimeout(() => {
            validateProgramNameRealTime(formData.programName);
          }, 50);
        }
      } catch (error) {
        console.warn('Could not load existing programs for validation:', error);
        setExistingPrograms([]); // Set empty array as fallback
      }
    };

    loadExistingPrograms();
  }, []);

  // Validate program name when both existing programs and form data are available
  useEffect(() => {
    if (Array.isArray(existingPrograms) && existingPrograms.length > 0 && formData.programName) {
      validateProgramNameRealTime(formData.programName);
    }
  }, [existingPrograms, formData.programName, isNewProgram, id]);

  // Fetch program data when component mounts (for edit mode)
  useEffect(() => {
    if (!isNewProgram && id) {
      fetchProgram();
    }
  }, [id, isNewProgram]);

  const fetchProgram = async () => {
    try {
      setLoading(true);
      const response = await LoanProgramService.getProgram(id);
      
      if (response && response.data) {
        console.log("Program data:", response.data);
        const programData = response.data.data;
        setProgram(programData);
        
        // Map the program data to form data
        setFormData({
          programName: programData.programName || '',
          displayName: programData.displayName || '',
          programType: programData.programType || 'conventional',
          isAvailableToBorrower: programData.isAvailableToBorrower ?? true,
          isDefaultForIntegrations: programData.isDefaultForIntegrations ?? false,
          loanHelpText: programData.loanHelpText || '',
          preApprovalLetterTemplate: programData.preApprovalLetterTemplate || 'standard',
          rateAdjustment: programData.rateAdjustment || 0,
          loanTerm: programData.loanTerm || 30,
          restrictions: {
            dtiRestriction: {
              max: programData.restrictions?.dtiRestriction?.max || 43,
            },
            downPaymentRestriction: {
              min: programData.restrictions?.downPaymentRestriction?.min || 3,
              max: programData.restrictions?.downPaymentRestriction?.max || null,
            },
            loanAmountRestriction: {
              min: programData.restrictions?.loanAmountRestriction?.min || null,
              max: programData.restrictions?.loanAmountRestriction?.max || null,
            },
          },
          privateMortgageInsurance: programData.privateMortgageInsurance || [
            {
              minLTV: 80.01,
              maxLTV: 85,
              rate: 0.3,
            },
            {
              minLTV: 85.01,
              maxLTV: 90,
              rate: 0.49,
            },
            {
              minLTV: 90.01,
              maxLTV: 95,
              rate: 0.68,
            },
            {
              minLTV: 95.01,
              maxLTV: 97,
              rate: 0.88,
            },
          ],
          upfrontMortgageInsurance: programData.upfrontMortgageInsurance || 0,
          mortgageInsurance: programData.mortgageInsurance || 0,
          fmi: programData.fmi || 0,
          fundingFee: programData.fundingFee || 2.3,
          originationFees: {
            amount: programData.originationFees?.type === 'flat' ? (programData.originationFees?.value || 0) : 0,
            percentage: programData.originationFees?.type === 'percentage' ? (programData.originationFees?.value || 0) : 0,
            isPercent: programData.originationFees?.type === 'percentage',
            frequency: programData.originationFees?.frequency || 'once',
          },
          closingCosts: {
            amount: programData.closingCosts?.type === 'flat' ? (programData.closingCosts?.value || 0) : 0,
            percentage: programData.closingCosts?.type === 'percentage' ? (programData.closingCosts?.value || 0) : 0,
            isPercent: programData.closingCosts?.type === 'percentage',
            frequency: programData.closingCosts?.frequency || 'once',
          },
          otherFees: {
            amount: programData.otherFees?.type === 'flat' ? (programData.otherFees?.value || 0) : 0,
            percentage: programData.otherFees?.type === 'percentage' ? (programData.otherFees?.value || 0) : 0,
            isPercent: programData.otherFees?.type === 'percentage',
            frequency: programData.otherFees?.frequency || 'once',
          },
          isAdjustableRateMortgage: programData.isAdjustableRateMortgage || false,
          allowSubjectPropertyAddress: programData.allowSubjectPropertyAddress ?? true,
          lockLoanData: programData.lockLoanData || false,
        });
        
        // Validate the loaded program name after form data is set
        // This ensures validation works when editing existing programs
        setTimeout(() => {
          validateProgramNameRealTime(programData.programName || '');
        }, 100); // Small delay to ensure existingPrograms is loaded
      }
    } catch (err) {
      console.error('Error fetching program:', err);
      setError(err.message || 'Failed to load program');
    } finally {
      setLoading(false);
    }
  };

  // Validate program name for duplicates
  const validateProgramName = async (programName) => {
    if (!programName || !programName.trim()) {
      throw new Error('Program name is required');
    }

    // Ensure existingPrograms is an array
    if (!Array.isArray(existingPrograms)) {
      console.warn('existingPrograms is not an array for validation:', existingPrograms);
      return; // Skip validation if data is not available
    }

    // Check if program name already exists (case-insensitive)
    // Exclude current program if editing
    const duplicateExists = existingPrograms.some(program => 
      program.programName.toLowerCase() === programName.toLowerCase() && 
      (!isNewProgram ? program._id !== id : true)
    );
    
    if (duplicateExists) {
      throw new Error('Already have a program with this name.');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate program name before saving
      await validateProgramName(formData.programName);

      // Transform form data to backend format
      const backendFormData = {
        ...formData,
        originationFees: {
          type: formData.originationFees.isPercent ? 'percentage' : 'flat',
          value: formData.originationFees.isPercent ? formData.originationFees.percentage : formData.originationFees.amount,
          frequency: formData.originationFees.frequency,
        },
        closingCosts: {
          type: formData.closingCosts.isPercent ? 'percentage' : 'flat',
          value: formData.closingCosts.isPercent ? formData.closingCosts.percentage : formData.closingCosts.amount,
          frequency: formData.closingCosts.frequency,
        },
        otherFees: {
          type: formData.otherFees.isPercent ? 'percentage' : 'flat',
          value: formData.otherFees.isPercent ? formData.otherFees.percentage : formData.otherFees.amount,
          frequency: formData.otherFees.frequency,
        },
      };

      if (isNewProgram) {
        // For company users, we need to specify which lender to create the program for
        // This should be handled by a lender selection modal or passed as a query parameter
        const response = await LoanProgramService.createProgram(backendFormData);
        
        if (response && response.data) {
          setSuccess(true);
          setTimeout(() => {
            router.push('/company/programs');
          }, 1500);
        }
      } else {
        const response = await LoanProgramService.updateProgram(id, backendFormData);
        
        if (response && response.data) {
          setSuccess(true);
          setTimeout(() => {
            router.push('/company/programs');
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Error saving program:', err);
      setError(err.message || 'Failed to save program');
    } finally {
      setSaving(false);
    }
  };

  // Real-time validation for program name
  const validateProgramNameRealTime = (programName) => {
    if (!programName || !programName.trim()) {
      setValidationErrors(prev => ({ ...prev, programName: '' }));
      return;
    }

    // Ensure existingPrograms is an array
    if (!Array.isArray(existingPrograms)) {
      console.warn('existingPrograms is not an array:', existingPrograms);
      return;
    }

    console.log('Validating program name:', programName);
    console.log('Existing programs:', existingPrograms.map(p => ({ id: p._id, name: p.programName })));
    console.log('Is new program:', isNewProgram);
    console.log('Current program ID:', id);

    // Check for duplicates (case-insensitive)
    // Exclude current program if editing
    const duplicateExists = existingPrograms.some(program => {
      const isDuplicate = program.programName.toLowerCase() === programName.toLowerCase();
      const isCurrentProgram = !isNewProgram && program._id === id;
      const shouldExclude = !isNewProgram ? program._id !== id : true;
      
      console.log(`Program: ${program.programName}, isDuplicate: ${isDuplicate}, isCurrentProgram: ${isCurrentProgram}, shouldExclude: ${shouldExclude}`);
      
      return isDuplicate && shouldExclude;
    });

    console.log('Duplicate exists:', duplicateExists);

    if (duplicateExists) {
      setValidationErrors(prev => ({ 
        ...prev, 
        programName: 'Already have a program with this name.' 
      }));
    } else {
      setValidationErrors(prev => ({ ...prev, programName: '' }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Real-time validation for program name
    if (field === 'programName') {
      // Debounce validation to avoid excessive checks
      clearTimeout(window.programNameValidationTimeout);
      window.programNameValidationTimeout = setTimeout(() => {
        validateProgramNameRealTime(value);
      }, 500);
    }
  };

  const handleNestedInputChange = (parentField, childField, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
  };

  const handleFinanceFeeChange = (feeType, updatedFee) => {
    setFormData(prev => ({
      ...prev,
      [feeType]: updatedFee
    }));
  };

  const handleArrayChange = (field, index, subField, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => 
        i === index ? { ...item, [subField]: value } : item
      )
    }));
  };

  const handleAddArrayItem = (field, newItem) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], newItem]
    }));
  };

  const handleRemoveArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['company']}>
        <MainLayout>
          <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['company']}>
      <MainLayout>
        <Head>
          <title>
            {isNewProgram ? 'Create Loan Program' : 'Edit Loan Program'} - Company Dashboard
          </title>
        </Head>
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link
                href="/company/programs"
                className="group flex items-center px-2.5 py-1.5 rounded hover:bg-gray-100 transition"
              >
                <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-primary transition" />
                <span className="ml-1 text-sm font-medium text-gray-500 group-hover:text-primary transition">
                  Back to Programs
                </span>
              </Link>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isNewProgram ? 'Create New Loan Program' : 'Edit Loan Program'}
                </h1>
                <p className="mt-2 text-gray-600">
                  {isNewProgram 
                    ? 'Configure a new loan program for your company lenders'
                    : 'Update the loan program configuration'
                  }
                </p>
              </div>
              
              <button
                onClick={handleSave}
                disabled={saving || validationErrors.programName}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Program'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    {isNewProgram ? 'Loan program created successfully!' : 'Loan program updated successfully!'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Sections */}
          <div className="space-y-6">
            {/* Validation Error for Program Name */}
            {validationErrors.programName && (
              <div className="mb-4">
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationErrors.programName}
                </p>
              </div>
            )}
            <BasicProgramSection
              formData={formData}
              onChange={handleInputChange}
              isLoading={saving}
            />

            <LoanRestrictionsSection
              formData={formData}
              onChange={handleNestedInputChange}
              isLoading={saving}
            />

            <MortgageInsuranceSection
              formData={formData}
              onChange={handleInputChange}
              onArrayChange={handleArrayChange}
              onAddArrayItem={handleAddArrayItem}
              onRemoveArrayItem={handleRemoveArrayItem}
              isLoading={saving}
            />

            <FinanceFeesSection
              formData={formData}
              onChange={handleFinanceFeeChange}
              isLoading={saving}
            />

          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}