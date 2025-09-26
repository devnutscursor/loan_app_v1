import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { LoanProgramService } from '@/services';

export const useCompanyEditProgram = () => {
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
      dtiRestriction: { max: 43 },
      downPaymentRestriction: { min: 3, max: null },
      loanAmountRestriction: { min: null, max: null },
    },
    privateMortgageInsurance: [
      { minLTV: 80.01, maxLTV: 85, rate: 0.3 },
      { minLTV: 85.01, maxLTV: 90, rate: 0.49 },
      { minLTV: 90.01, maxLTV: 95, rate: 0.68 },
      { minLTV: 95.01, maxLTV: 97, rate: 0.88 },
    ],
    upfrontMortgageInsurance: 0,
    mortgageInsurance: 0,
    fmi: 0,
    fundingFee: 2.3,
    originationFees: { amount: 0, percentage: 0, isPercent: false, frequency: 'once' },
    closingCosts: { amount: 0, percentage: 0, isPercent: false, frequency: 'once' },
    otherFees: { amount: 0, percentage: 0, isPercent: false, frequency: 'once' },
    isAdjustableRateMortgage: false,
    allowSubjectPropertyAddress: true,
    lockLoanData: false,
  });

  // Load existing programs for validation
  useEffect(() => {
    const loadExistingPrograms = async () => {
      try {
        const response = await LoanProgramService.getAllPrograms();
        const programs = response?.data?.data || [];
        setExistingPrograms(programs);
        if (!isNewProgram && formData.programName) {
          setTimeout(() => {
            validateProgramNameRealTime(formData.programName);
          }, 50);
        }
      } catch (err) {
        setExistingPrograms([]);
      }
    };
    loadExistingPrograms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const programData = response.data.data;
        setProgram(programData);
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
            dtiRestriction: { max: programData.restrictions?.dtiRestriction?.max || 43 },
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
            { minLTV: 80.01, maxLTV: 85, rate: 0.3 },
            { minLTV: 85.01, maxLTV: 90, rate: 0.49 },
            { minLTV: 90.01, maxLTV: 95, rate: 0.68 },
            { minLTV: 95.01, maxLTV: 97, rate: 0.88 },
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

        setTimeout(() => {
          validateProgramNameRealTime(programData.programName || '');
        }, 100);
      }
    } catch (err) {
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
    if (!Array.isArray(existingPrograms)) {
      return;
    }
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
      await validateProgramName(formData.programName);

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
      setError(err.message || 'Failed to save program');
    } finally {
      setSaving(false);
    }
  };

  const validateProgramNameRealTime = (programName) => {
    if (!programName || !programName.trim()) {
      setValidationErrors(prev => ({ ...prev, programName: '' }));
      return;
    }
    if (!Array.isArray(existingPrograms)) {
      return;
    }
    const duplicateExists = existingPrograms.some(program => {
      const isDuplicate = program.programName.toLowerCase() === programName.toLowerCase();
      const shouldExclude = !isNewProgram ? program._id !== id : true;
      return isDuplicate && shouldExclude;
    });
    if (duplicateExists) {
      setValidationErrors(prev => ({ ...prev, programName: 'Already have a program with this name.' }));
    } else {
      setValidationErrors(prev => ({ ...prev, programName: '' }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'programName') {
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
        [childField]: value,
      },
    }));
  };

  const handleFinanceFeeChange = (feeType, updatedFee) => {
    setFormData(prev => ({ ...prev, [feeType]: updatedFee }));
  };

  const handleArrayChange = (field, index, subField, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? { ...item, [subField]: value } : item)),
    }));
  };

  const handleAddArrayItem = (field, newItem) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], newItem] }));
  };

  const handleRemoveArrayItem = (field, index) => {
    setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  return {
    // routing
    router,
    id,
    isNewProgram,
    // state
    program,
    loading,
    saving,
    error,
    success,
    validationErrors,
    existingPrograms,
    formData,
    // effects/handlers
    fetchProgram,
    handleSave,
    validateProgramName,
    validateProgramNameRealTime,
    handleInputChange,
    handleNestedInputChange,
    handleFinanceFeeChange,
    handleArrayChange,
    handleAddArrayItem,
    handleRemoveArrayItem,
  };
};


