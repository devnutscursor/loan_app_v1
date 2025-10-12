import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { LoanService } from '../services';
import { validateStep as validateStepRules } from '../utils/validationRules';
import ConsentService from '../services/consent.service';

export const useLoanApplication = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { draft } = router.query;
  
  // User context detection for lender vs borrower usage
  const isLenderContext = router.pathname.includes('/lender/');
  const userRole = user?.role;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [currentSubStep, setCurrentSubStep] = useState('personalDetails');
  const [loading, setLoading] = useState(false);
  const [draftId, setDraftId] = useState(draft || null);
  const [loanTypes, setLoanTypes] = useState([]);
  
  // Credit report consent state
  const [hasExistingConsent, setHasExistingConsent] = useState(false);
  const [creditReportConsent, setCreditReportConsent] = useState(false);
  const [loadingConsent, setLoadingConsent] = useState(false);
  const [consentData, setConsentData] = useState(null);
  const [formData, setFormData] = useState({
    borrowers: [
      {
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        maritalStatus: '',
        dateOfBirth: '',
        ssn: '',
        citizenship: '',
        phone: '',
        email: '',
        dependents: [],
        currentAddress: {},
        mailingAddress: {
          sameAsCurrentAddress: false,
          aptSteNum: '',
          city: '',
          state: '',
          zipCode: ''
        },
        previousAddresses: [],
        employers: [
          {
            companyName: '',
            companyPhone: '',
            employmentStatus: '',
            jobTitle: '',
            startDate: '',
            yearsInProfession: '',
            monthsInProfession: '',
            streetAddress: '',
            aptSteNum: '',
            city: '',
            state: '',
            zipCode: ''
          }
        ]
      }
    ],
    propertyInfo: {
      address: {
        streetAddress: '',
        aptSteNum: '',
        city: '',
        state: '',
        zipCode: ''
      },
      propertyValue: '',
      propertyType: '',
      occupancyType: '',
      hasAcceptedOffer: '',
      contractPurchasePrice: '',
      isMixedUse: '',
      isManufactured: '',
      numberOfUnits: '',
      yearBuilt: '',
      proposedRentalIncome: ''
    },
    loanInfo: {
      loanType: '',
      loanPurpose: '',
      loanAmount: '',
      loanTerm: '',
      interestRate: '',
      purchasePrice: '',
      downPayment: '',
      yearAcquired: '',
      currentLoanBalance: '',
      requestedLoanAmount: '',
      refinanceType: '',
      yearLotAcquired: '',
      originalCost: '',
      existingLoans: '',
      presentValueOfLot: '',
      costOfImprovements: '',
      constructionType: ''
    },
    assets: {
      checkingAndSavings: [],
      stocksAndBonds: [],
      giftsAndGrants: [],
      miscellaneous: {
        earnestMoney: 0,
        lifeInsurance: 0,
        vestedInterestInRetirement: 0,
        otherAssets: 0
      }
    },
    income: {
      baseIncome: '',
      overtime: '',
      commissions: '',
      bonuses: '',
      militaryEntitlements: '',
      otherIncome: []
    },
    debts: [],
    expenses: [],
    propertiesOwned: {
      ownsProperty: true,
      properties: [{
        id: `property-${Date.now()}`,
        address: {
          streetAddress: '123 Rental St',
          apt: '',
          city: 'Investment City',
          state: 'TX',
          zipCode: '77777'
        },
        propertyType: 'Single Family',
        presentMarketValue: '300000',
        statusOfProperty: 'retained',
        intendedOccupancy: 'investment',
        monthlyCosts: '450',
        grossRentalIncome: '1800',
        netRentalIncome: '1500',
        hasLoan: true,
        monthlyPayment: '1200',
        unpaidBalance: '200000'
      }],
      rent: '',
      firstMortgage: '1500',
      otherFinancing: '0',
      hazardInsurance: '120',
      realEstateTaxes: '350',
      mortgageInsurance: '75',
      hoaDues: '0',
      otherHousingExpenses: '0'
    },
    militaryService: {
      hasServed: false,
      currentlyServing: false,
      isRetired: false,
      isNonActivated: false,
      isSurvivingSpouse: false,
      serviceBranch: '',
      serviceType: '',
      yearsOfService: 0,
      dischargeType: '',
      dischargeDate: '',
      expirationDate: ''
    },
    declarations: {},
    demographics: {},
    documents: []
  });
  const [errors, setErrors] = useState({});

  // Local storage keys for form persistence
  const STORAGE_KEYS = {
    FORM_DATA: 'borrower_loan_form_data',
    CURRENT_STEP: 'borrower_loan_current_step',
    CURRENT_SUB_STEP: 'borrower_loan_current_sub_step',
    TIMESTAMP: 'borrower_loan_form_timestamp'
  };

  // Form persistence functions
  const saveFormToStorage = (formData, currentStep, currentSubStep) => {
    try {
      const hasData = formData.borrowers?.[0]?.firstName || 
                     formData.propertyInfo?.propertyAddress?.streetAddress ||
                     formData.loanInfo?.loanAmount ||
                     formData.assets?.checkingAccount ||
                     formData.additionalInfo?.hasDeclaredBankruptcy;
      
      if (hasData) {
        const dataToSave = {
          formData,
          currentStep,
          currentSubStep,
          timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEYS.FORM_DATA, JSON.stringify(dataToSave));
        localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
      }
    } catch (error) {
      console.error('Error saving form to localStorage:', error);
    }
  };

  const loadFormFromStorage = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEYS.FORM_DATA);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const isRecent = Date.now() - parsedData.timestamp < 24 * 60 * 60 * 1000;
        if (isRecent) {
          return parsedData;
        } else {
          clearFormFromStorage();
        }
      }
    } catch (error) {
      console.error('Error loading form from localStorage:', error);
    }
    return null;
  };

  const clearFormFromStorage = () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing form from localStorage:', error);
    }
  };

  // Auto-save form data whenever it changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveFormToStorage(formData, currentStep, currentSubStep);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formData, currentStep, currentSubStep]);

  // Ensure form data structure is properly initialized
  useEffect(() => {
    setFormData(prevData => {
      if (!prevData.borrowers || !Array.isArray(prevData.borrowers) || prevData.borrowers.length === 0) {
        console.log('Initializing borrowers array - was missing or empty');
        return {
          ...prevData,
          borrowers: [{
            firstName: '',
            middleName: '',
            lastName: '',
            suffix: '',
            maritalStatus: '',
            dateOfBirth: '',
            ssn: '',
            citizenship: '',
            phone: '',
            email: '',
            dependents: [],
            currentAddress: {},
            mailingAddress: {
              sameAsCurrentAddress: false,
              aptSteNum: '',
              city: '',
              state: '',
              zipCode: ''
            },
            previousAddresses: [],
            employers: []
          }]
        };
      }
      return prevData;
    });
  }, []);

  // Load draft when router is ready and draft ID is available
  useEffect(() => {
    const loadDraft = async () => {
      try {
        if (draft && router.isReady) {
          console.log('Loading draft with ID:', draft);
          const result = await LoanService.getDraft(draft);
          if (result.success && result.data) {
            console.log('Draft data loaded:', result.data);
            setFormData(prev => ({ ...prev, ...result.data }));
            
            const isLoanNumber = /^\d{11}$/.test(draft) || draft.startsWith('DRAFT-') || draft.startsWith('LN');
            if (isLoanNumber) {
              setDraftId(draft);
              if (result.data._id) {
                setFormData(prev => ({ 
                  ...prev, 
                  originalLoanId: result.data._id,
                  isExistingLoan: true
                }));
              }
            } else {
              setDraftId(result.data._id);
            }
            
            if (result.data.isExistingLoan) {
              toast.success('Existing loan application loaded for editing');
            } else {
              toast.success('Draft application loaded');
            }
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error);
        toast.error('Failed to load draft or loan data');
      }
    };

    const fetchLoanTypes = async () => {
      try {
        const result = await LoanService.getLoanTypes();
        if (result.success) {
          setLoanTypes(result.data);
        }
      } catch (error) {
        console.error('Error fetching loan types:', error);
      }
    };

    const loadSavedFormData = () => {
      if (!draft) {
        const savedData = loadFormFromStorage();
        if (savedData) {
          setFormData(savedData.formData);
          setCurrentStep(savedData.currentStep);
          setCurrentSubStep(savedData.currentSubStep);
        }
      }
    };

    if (router.isReady) {
      loadDraft();
      fetchLoanTypes();
      loadSavedFormData();
    }
  }, [router.isReady, draft]);

  // Check credit report consent status for borrowers
  useEffect(() => {
    const checkConsentStatus = async () => {
      // Only check for borrower role (not lender creating loans)
      if (user?.role !== 'borrower' || isLenderContext) {
        return;
      }
      
      try {
        setLoadingConsent(true);
        const result = await ConsentService.checkCreditReportConsentStatus();
        
        if (result.success && result.data) {
          setHasExistingConsent(result.data.hasConsent);
          setConsentData(result.data);
          
          // Auto-check consent checkbox if already consented
          if (result.data.hasConsent) {
            setCreditReportConsent(true);
          }
          
          console.log('Consent status loaded:', result.data);
        }
      } catch (error) {
        console.error('Error checking consent status:', error);
      } finally {
        setLoadingConsent(false);
      }
    };
    
    if (user && user.role === 'borrower' && !isLenderContext) {
      checkConsentStatus();
    }
  }, [user, isLenderContext]);

  // Handle form input changes
  const handleChange = (nameOrEvent, valueOrNull = null) => {
    if (nameOrEvent && nameOrEvent.target) {
      const { name, value, type, files, checked } = nameOrEvent.target;
      const actualValue = type === 'checkbox' ? checked : value;
      console.log(`Updating field (from event): ${name} with value:`, actualValue);
      
      if (type === 'file') {
        setFormData({
          ...formData,
          documents: [...formData.documents, ...files]
        });
        return;
      }
      
      if (name.includes('[') && name.includes(']')) {
        const newFormData = JSON.parse(JSON.stringify(formData));
        const pathSegments = [];
        const parts = name.split('.');
        
        parts.forEach(part => {
          if (part.includes('[')) {
            const arrayMatch = part.match(/([^\[]+)\[(\d+)\]/);
            if (arrayMatch) {
              pathSegments.push(arrayMatch[1]);
              pathSegments.push(parseInt(arrayMatch[2], 10));
            }
          } else {
            pathSegments.push(part);
          }
        });
        
        let current = newFormData;
        
        for (let i = 0; i < pathSegments.length - 1; i++) {
          const segment = pathSegments[i];
          const nextSegment = pathSegments[i + 1];
          
          if (typeof segment === 'string') {
            if (!current[segment]) {
              current[segment] = typeof nextSegment === 'number' ? [] : {};
            }
            current = current[segment];
          } else if (typeof segment === 'number') {
            if (!current[segment]) {
              current[segment] = typeof nextSegment === 'number' ? [] : {};
            }
            current = current[segment];
          }
        }
        
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (current) {
          current[lastSegment] = actualValue;
        }
        
        setFormData(newFormData);
      } else if (name.includes('.')) {
        const props = name.split('.');
        const newFormData = JSON.parse(JSON.stringify(formData));
        let current = newFormData;
        
        for (let i = 0; i < props.length - 1; i++) {
          if (!current[props[i]]) {
            current[props[i]] = {};
          }
          current = current[props[i]];
        }
        
        if (current) {
          current[props[props.length - 1]] = actualValue;
          setFormData(newFormData);
        }
      } else {
        setFormData({
          ...formData,
          [name]: actualValue
        });
      }
      
      if (errors[name]) {
        setErrors({ ...errors, [name]: '' });
      }
    } else {
      const fieldName = nameOrEvent;
      const fieldValue = valueOrNull;
      console.log(`Updating field (direct): ${fieldName} with value:`, fieldValue);
      
      setFormData(prev => ({
        ...prev,
        [fieldName]: fieldValue
      }));
    }
  };

  const nextStep = () => {
    console.log('Current form data:', formData);
  
    if (window._tempValidateOverride) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      saveFormToStorage(formData, newStep, currentSubStep);
      return;
    }
    
    const validationErrors = validateStep(currentStep);
    
    if (Object.keys(validationErrors).length === 0) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      saveFormToStorage(formData, newStep, currentSubStep);
    } else {
      const errorMessages = Object.values(validationErrors);
      
      if (errorMessages.length > 0) {
        const displayMessages = errorMessages.slice(0, 3);
        const message = displayMessages.length === 1 
          ? displayMessages[0]
          : `Please complete the following required fields: ${displayMessages.join(', ')}${errorMessages.length > 3 ? ` and ${errorMessages.length - 3} more` : ''}`;
        
        toast.error(message);
      } else {
        toast.error('Please complete all required fields for the loan application');
      }
      console.log('Validation errors:', validationErrors);
    }
  };

  const prevStep = () => {
    const newStep = currentStep - 1;
    setCurrentStep(newStep);
    saveFormToStorage(formData, newStep, currentSubStep);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    console.log('Form submission started - draftId:', draftId);
    console.log('Is existing loan?', formData.isExistingLoan);
    console.log('Lender context detection - isLenderContext:', isLenderContext, 'userRole:', userRole);
    
    try {
      const validationErrors = {};
      for (let i = 1; i <= 5; i++) {
        const stepErrors = validateStep(i);
        Object.assign(validationErrors, stepErrors);
      }
      
      if (Object.keys(validationErrors).length > 0) {
        console.log('FORM SUBMISSION - Validation errors:', validationErrors);
        setErrors(validationErrors);
        toast.error('Please fix all errors before submitting the application');
        setLoading(false);
        return;
      }

      // Check credit report consent (only for borrowers, not lender context)
      // Consent is OPTIONAL during application - can be provided later when credit is pulled
      if (user?.role === 'borrower' && !isLenderContext) {
        // Grant consent if they checked the box (optional)
        if (creditReportConsent && !hasExistingConsent) {
          try {
            console.log('Granting credit report consent during application submission...');
            const consentResult = await ConsentService.grantCreditReportConsent({
              consentMethod: 'application_submission'
            });
            
            if (consentResult.success) {
              console.log('✅ Credit report consent granted successfully');
            } else {
              console.warn('⚠️ Failed to record consent, but continuing with submission');
            }
          } catch (consentError) {
            console.error('Error granting consent:', consentError);
            // Continue with submission - consent can be recorded separately if needed
          }
        }
      }
      
      const primaryBorrower = formData.borrowers?.[0] || {};
      const borrowerData = {
        ...primaryBorrower,
        dependents: Array.isArray(primaryBorrower.dependents) ? primaryBorrower.dependents : [],
        employers: Array.isArray(primaryBorrower.employers) ? primaryBorrower.employers : [],
        previousAddresses: Array.isArray(primaryBorrower.previousAddresses) ? primaryBorrower.previousAddresses : []
      };
      
      const transformedPropertiesOwned = [];
      if (formData.propertiesOwned && formData.propertiesOwned.ownsProperty === true && 
          Array.isArray(formData.propertiesOwned.properties) && formData.propertiesOwned.properties.length > 0) {
        
        formData.propertiesOwned.properties.forEach(property => {
          transformedPropertiesOwned.push({
            propertyAddress: {
              streetAddress: property.propertyAddress?.streetAddress || '',
              apt: property.propertyAddress?.apt || '',
              city: property.propertyAddress?.city || '',
              state: property.propertyAddress?.state || '',
              zipCode: property.propertyAddress?.zipCode || ''
            },
            propertyType: property.propertyType || '',
            presentMarketValue: parseFloat(property.presentMarketValue) || 0,
            unpaidBalance: parseFloat(property.unpaidBalance) || 0,
            mortgageBalance: parseFloat(property.mortgageBalance) || 0,
            monthlyPayment: parseFloat(property.monthlyPayment) || 0,
            monthlyCosts: parseFloat(property.monthlyCosts) || 0,
            grossRentalIncome: parseFloat(property.grossRentalIncome) || 0,
            netRentalIncome: parseFloat(property.netRentalIncome) || 0,
            statusOfProperty: property.statusOfProperty || '',
            intendedOccupancy: property.intendedOccupancy || '',
            hasLoan: property.hasLoan === true,
            currentHousingExpenses: {
              rent: parseFloat(formData.propertiesOwned.rent) || 0,
              firstMortgage: parseFloat(formData.propertiesOwned.firstMortgage) || 0,
              otherFinancing: parseFloat(formData.propertiesOwned.otherFinancing) || 0,
              hazardInsurance: parseFloat(formData.propertiesOwned.hazardInsurance) || 0,
              realEstateTaxes: parseFloat(formData.propertiesOwned.realEstateTaxes) || 0,
              mortgageInsurance: parseFloat(formData.propertiesOwned.mortgageInsurance) || 0,
              hoaDues: parseFloat(formData.propertiesOwned.hoaDues) || 0,
              otherHousingExpenses: parseFloat(formData.propertiesOwned.otherHousingExpenses) || 0
            }
          });
        });
      }

      const formattedPropertiesOwned = {
        ownsProperty: formData.propertiesOwned?.ownsProperty || false,
        properties: transformedPropertiesOwned,
        rent: parseFloat(formData.propertiesOwned?.rent) || 0,
        firstMortgage: parseFloat(formData.propertiesOwned?.firstMortgage) || 0,
        otherFinancing: parseFloat(formData.propertiesOwned?.otherFinancing) || 0,
        hazardInsurance: parseFloat(formData.propertiesOwned?.hazardInsurance) || 0,
        realEstateTaxes: parseFloat(formData.propertiesOwned?.realEstateTaxes) || 0,
        mortgageInsurance: parseFloat(formData.propertiesOwned?.mortgageInsurance) || 0,
        hoaDues: parseFloat(formData.propertiesOwned?.hoaDues) || 0,
        otherHousingExpenses: parseFloat(formData.propertiesOwned?.otherHousingExpenses) || 0
      };
      
      const submissionData = {
        primaryBorrower: formData.primaryBorrowerId || '67fa2aa7f5010213147f8529',
        borrowerDetails: borrowerData,
        
        ...(isLenderContext && userRole === 'lender' && {
          submittedByLender: true,
          lenderId: user._id,
          submissionSource: 'manual'
        }),
        
        property: {
          addressLine1: formData.propertyInfo?.address?.streetAddress || 'To be updated',
          addressLine2: formData.propertyInfo?.address?.aptSteNum || '',
          city: formData.propertyInfo?.address?.city || 'To be updated',
          state: formData.propertyInfo?.address?.state || 'To be updated',
          zipCode: formData.propertyInfo?.zipCode || formData.propertyInfo?.address?.zipCode || '00000',
          county: formData.propertyInfo?.address?.county || '',
          propertyType: formData.propertyInfo?.propertyType || 'Single Family Home',
          occupancyType: formData.propertyInfo?.occupancyType || 'Primary Residence',
          numberOfUnits: formData.propertyInfo?.numberOfUnits || 1,
          yearBuilt: formData.propertyInfo?.yearBuilt || new Date().getFullYear(),
          propertyValue: parseFloat(formData.propertyInfo?.propertyValue) || 100000,
          isNewConstruction: formData.propertyInfo?.isNewConstruction || false,
          hasAcceptedOffer: formData.propertyInfo?.hasAcceptedOffer === 'Yes' || formData.propertyInfo?.hasAcceptedOffer === true,
          contractPurchasePrice: parseFloat(formData.propertyInfo?.contractPurchasePrice) || 0,
          isMixedUse: formData.propertyInfo?.isMixedUse || 'No',
          isManufactured: formData.propertyInfo?.isManufactured || 'No',
          proposedRentalIncome: parseFloat(formData.propertyInfo?.proposedRentalIncome) || 0
        },
        
        loanDetails: {
          loanType: formData.loanInfo?.loanType || 'Purchase',
          loanAmount: parseFloat(formData.loanInfo?.loanAmount) || 0,
          purchasePrice: parseFloat(formData.loanInfo?.purchasePrice) || 0,
          downPayment: parseFloat(formData.loanInfo?.downPayment) || 0,
          downPaymentSource: formData.loanInfo?.downPaymentSource || 'Savings',
          yearAcquired: parseInt(formData.loanInfo?.yearAcquired) || 0,
          currentLoanBalance: parseFloat(formData.loanInfo?.currentLoanBalance) || 0,
          requestedLoanAmount: parseFloat(formData.loanInfo?.requestedLoanAmount) || 0,
          refinanceType: formData.loanInfo?.refinanceType || '',
          yearLotAcquired: parseInt(formData.loanInfo?.yearLotAcquired) || 0, 
          originalCost: parseFloat(formData.loanInfo?.originalCost) || 0,
          existingLoans: parseFloat(formData.loanInfo?.existingLoans) || 0,
          presentValueOfLot: parseFloat(formData.loanInfo?.presentValueOfLot) || 0,
          costOfImprovements: parseFloat(formData.loanInfo?.costOfImprovements) || 0,
          constructionType: formData.loanInfo?.constructionType || '',
          downPaymentPercentage: parseFloat(formData.loanInfo?.downPaymentPercentage) || 20,
          isFixedRate: formData.loanInfo?.isFixedRate !== false,
          includeEscrow: formData.loanInfo?.includeEscrow !== false,
          includeMortgageInsurance: formData.loanInfo?.includeMortgageInsurance !== false
        },
        
        assets: formData.assets || { 
          checkingAndSavings: [], 
          stocksAndBonds: [], 
          giftsAndGrants: [],
          miscellaneous: {
            earnestMoney: 0,
            lifeInsurance: 0,
            vestedInterestInRetirement: 0,
            otherAssets: 0
          }
        },
        income: formData.income || { 
          baseIncome: 0, 
          overtime: 0, 
          commissions: 0, 
          bonuses: 0, 
          militaryEntitlements: 0, 
          otherIncome: [] 
        },
        debts: Array.isArray(formData.debts) ? formData.debts : [],
        expenses: Array.isArray(formData.expenses) ? formData.expenses : [],
        propertiesOwned: formattedPropertiesOwned,
        militaryService: formData.militaryService || { isMilitary: false },
        declarations: formData.declarations || {},
        demographics: formData.demographics || {}
      };
      
      console.log('FORM SUBMISSION - Submitting data:', submissionData);
      
      let response;
      const isLoanNumber = draftId && (/^\d{11}$/.test(draftId) || draftId.startsWith('DRAFT-') || draftId.startsWith('LN'));
      if (formData.isExistingLoan && isLoanNumber) {
        console.log('Updating existing loan application:', draftId);
        response = await LoanService.updateLoan(draftId, submissionData);
      } else {
        console.log('Creating new loan application using standard borrower method');
        response = await LoanService.submitLoan(submissionData);
      }
      
      console.log('FORM SUBMISSION - API Response:', response);
      
      if (response.success) {
        clearFormFromStorage();
        toast.success('Loan application submitted successfully!');
        
        if (draftId && !draftId.startsWith('LN')) {
          try {
            await LoanService.deleteDraft(draftId);
            console.log('Draft deleted successfully');
          } catch (deleteError) {
            console.error('Failed to delete draft after submission:', deleteError);
          }
        } else if (draftId && draftId.startsWith('LN')) {
          console.log('Draft deleted successfully, please fix the issues and shouldn\'t create a new application instead edit the existing one');
        }
        
        if (isLenderContext && userRole === 'lender') {
          const loanId = response.data._id;
          if (loanId) {
            router.push(`/lender/loans/${loanId}`);
          } else {
            router.push('/lender/loans');
          }
        } else {
          router.push('/borrower/loans');
        }
      } else {
        toast.error(response.message || 'Failed to submit loan application');
      }
    } catch (error) {
      console.error('Error submitting loan application:', error);
      toast.error('An error occurred while submitting your application');
    } finally {
      setLoading(false);
    }
  };

  // Fill form with test data
  const fillWithTestData = () => {
    console.log('FILL TEST DATA - Starting to fill form with comprehensive test data');

    const testData = {
      purpose: 'Purchase',
      completionPercentage: 100,
      primaryBorrowerId: '67fa2aa7f5010213147f8529',
      
      borrowers: [
        {
          firstName: 'John',
          middleName: 'Michael',
          lastName: 'Doe',
          suffix: 'Jr.',
          maritalStatus: 'Married',
          dateOfBirth: '1985-06-15',
          ssn: '123-45-6789',
          citizenship: 'US Citizen',
          phone: '555-123-4567',
          email: 'john.doe@example.com',
          dependents: [
            {
              id: 'dep1',
              name: 'Jane Doe',
              age: 8,
              relationship: 'Child'
            },
            {
              id: 'dep2',
              name: 'Jimmy Doe',
              age: 5,
              relationship: 'Child'
            }
          ],
          currentAddress: {
            streetAddress: '123 Main Street',
            aptSteNum: 'Apt 2B',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62701',
            ownershipStatus: 'Own',
            yearsAtAddress: 5,
            monthsAtAddress: 3
          },
          mailingAddress: {
            sameAsCurrentAddress: false,
            streetAddress: 'PO Box 456',
            aptSteNum: '',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62702'
          },
          previousAddresses: [
            {
              streetAddress: '456 Oak Street',
              aptSteNum: '',
              city: 'Chicago',
              state: 'IL',
              zipCode: '60601',
              yearsAtAddress: 3,
              monthsAtAddress: 0,
              ownershipStatus: 'Rent'
            }
          ],
          employers: [
            {
              companyName: 'Tech Solutions Inc',
              companyPhone: '(555) 987-6543',
              employmentStatus: 'Full-Time',
              jobTitle: 'Senior Software Engineer',
              startDate: '2018-03-15',
              yearsInProfession: 6,
              monthsInProfession: 8,
              streetAddress: '789 Corporate Plaza',
              aptSteNum: 'Suite 1200',
              city: 'Springfield',
              state: 'IL',
              zipCode: '62701'
            }
          ]
        }
      ],
      
      propertyInfo: {
        address: {
          streetAddress: '789 Dream Avenue',
          aptSteNum: '',
          city: 'Paradise City',
          state: 'FL',
          zipCode: '33101',
          county: 'Dream County'
        },
        propertyValue: '450000',
        propertyType: 'Single Family Home',
        occupancyType: 'Primary Residence',
        numberOfUnits: 1,
        yearBuilt: 2010,
        isNewConstruction: false,
        hasAcceptedOffer: 'Yes',
        contractPurchasePrice: '450000',
        isMixedUse: 'No',
        isManufactured: 'No',
        proposedRentalIncome: '0'
      },

      loanInfo: {
        loanType: 'Purchase',
        loanAmount: '360000',
        purchasePrice: '450000',
        downPayment: '90000',
        loanPurpose: 'Purchase',
        loanTerm: '30',
        interestRate: '6.5'
      },
      
      assets: {
        checkingAndSavings: [
          {
            id: 'asset1',
            accountType: 'Checking',
            financialInstitution: 'First National Bank',
            accountNumber: 'XXXX1234',
            balance: '25000'
          }
        ],
        stocksAndBonds: [],
        lifeInsurance: [],
        retirementFunds: [],
        otherAssets: []
      },
      
      income: {
        baseIncome: '9500',
        overtime: '1200',
        commissions: '2000',
        bonuses: '5000',
        militaryEntitlements: '0',
        otherIncome: []
      },
      
      debts: [],
      expenses: [],
      
      propertiesOwned: {
        ownsProperty: true,
        properties: [{
          id: `property-${Date.now()}`,
          address: {
            streetAddress: '123 Rental St',
            apt: '',
            city: 'Investment City',
            state: 'TX',
            zipCode: '77777'
          },
          propertyType: 'Single Family',
          presentMarketValue: '300000',
          statusOfProperty: 'retained',
          intendedOccupancy: 'investment',
          monthlyCosts: '450',
          grossRentalIncome: '1800',
          netRentalIncome: '1500',
          hasLoan: true,
          monthlyPayment: '1200',
          unpaidBalance: '200000'
        }],
        rent: '',
        firstMortgage: '1500',
        otherFinancing: '0',
        hazardInsurance: '120',
        realEstateTaxes: '350',
        mortgageInsurance: '75',
        hoaDues: '0',
        otherHousingExpenses: '0'
      },
      
      militaryService: {
        hasServed: false,
        currentlyServing: false,
        isRetired: false,
        isNonActivated: false,
        isSurvivingSpouse: false,
        serviceBranch: '',
        serviceType: '',
        yearsOfService: 0,
        dischargeType: '',
        dischargeDate: '',
        expirationDate: ''
      },
      
      declarations: {
        occupyAsPrimary: true,
        hadOwnershipInterest: true,
        ownedPropertyType: 'Primary Residence',
        titleHoldingType: 'Sole Ownership',
        isBorrowing: true,
        hasDownPaymentBorrowed: false,
        cosignerOnLoan: false,
        outstandingJudgments: false,
        bankruptcyPast7Years: false,
        foreclosurePast7Years: false,
        partyToLawsuit: false,
        obligatedOnForeclosedLoan: false,
        presentlyDelinquent: false,
        childSupportObligations: false,
        isUSCitizen: true,
        permanentResidentAlien: false,
        intendToOccupyProperty: true,
        firstTimeBuyer: true
      },
      
      demographics: {
        ethnicity: 'Not Hispanic or Latino',
        race: 'White',
        sex: 'Male',
        gender: 'Male',
        sexByObservation: false
      }
    };
    
    setFormData(testData);
    toast.success('Form filled with comprehensive test data!');
  };

  // Clear form function
  const clearForm = () => {
    console.log('CLEAR FORM - Resetting form to initial state');

    setFormData({
      borrowers: [
        {
          firstName: '',
          middleName: '',
          lastName: '',
          suffix: '',
          maritalStatus: '',
          dateOfBirth: '',
          ssn: '',
          citizenship: '',
          phone: '',
          email: '',
          dependents: [],
          currentAddress: {},
          mailingAddress: {
            sameAsCurrentAddress: false,
            aptSteNum: '',
            city: '',
            state: '',
            zipCode: '',
          },
          previousAddresses: [],
          employers: [
            {
              companyName: '',
              companyPhone: '',
              employmentStatus: '',
              jobTitle: '',
              startDate: '',
              yearsInProfession: '',
              monthsInProfession: '',
              streetAddress: '',
              aptSteNum: '',
              city: '',
              state: '',
              zipCode: '',
            },
          ],
        },
      ],
      propertyInfo: {
        address: {
          streetAddress: '',
          aptSteNum: '',
          city: '',
          state: '',
          zipCode: '',
        },
        propertyValue: '',
        propertyType: '',
        occupancyType: '',
        hasAcceptedOffer: '',
        contractPurchasePrice: '',
        isMixedUse: '',
        isManufactured: '',
        numberOfUnits: '',
        yearBuilt: '',
        proposedRentalIncome: '',
      },
      loanInfo: {
        loanType: '',
        loanPurpose: '',
        loanAmount: '',
        loanTerm: '',
        interestRate: '',
        purchasePrice: '',
        downPayment: '',
      },
      assets: {
        checkingAndSavings: [],
        stocksAndBonds: [],
        lifeInsurance: [],
        retirementFunds: [],
        otherAssets: [],
      },
      income: {
        baseIncome: '',
        overtime: '',
        commissions: '',
        bonuses: '',
        militaryEntitlements: '',
        otherIncome: [],
      },
      debts: [],
      expenses: [],
      propertiesOwned: {
        ownsProperty: true,
        properties: [],
        rent: '',
        firstMortgage: '',
        otherFinancing: '',
        hazardInsurance: '',
        realEstateTaxes: '',
        mortgageInsurance: '',
        hoaDues: '',
        otherHousingExpenses: '',
      },
      militaryService: {
        hasServed: false,
        currentlyServing: false,
        isRetired: false,
        isNonActivated: false,
        isSurvivingSpouse: false,
        serviceBranch: '',
        serviceType: '',
        yearsOfService: 0,
        dischargeType: '',
        dischargeDate: '',
        expirationDate: '',
      },
      declarations: {},
      demographics: {},
      documents: [],
    });

    setErrors({});
    setCurrentStep(1);
    setCurrentSubStep('personalDetails');
    window._tempValidateOverride = false;
    clearFormFromStorage();
    toast.success('Form cleared and reset to step 1');
  };

  // Validate form data for each step
  const validateStep = (step, tabName = null) => {
    if (window._tempValidateOverride) {
      console.log('Validation bypassed due to test data override');
      return {};
    }

    const validationErrors = validateStepRules(step, formData, tabName);
    
    if (JSON.stringify(validationErrors) !== JSON.stringify(errors)) {
      setErrors(validationErrors);
    }
    
    return validationErrors;
  };

  // Direct form update handler for borrowers step
  const handleBorrowerChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newFormData = JSON.parse(JSON.stringify(formData));
    const val = type === 'checkbox' ? checked : value;
    const segments = name.split('.');

    if (!newFormData.borrowers || !Array.isArray(newFormData.borrowers) || newFormData.borrowers.length === 0) {
      newFormData.borrowers = [{}];
    }

    let targetObj = newFormData.borrowers[0];
    for (let i = 0; i < segments.length - 1; i++) {
      const key = segments[i];
      if (targetObj[key] == null) {
        const nextKey = segments[i + 1];
        targetObj[key] = isNaN(parseInt(nextKey, 10)) ? {} : [];
      }
      targetObj = targetObj[key];
    }
    const lastKey = segments[segments.length - 1];
    targetObj[lastKey] = val;
    setFormData(newFormData);
  };
  
  // Direct form update handler for property and loan step
  const handlePropertyChange = (e) => {
    const { name, value } = e.target;
    
    const newFormData = JSON.parse(JSON.stringify(formData));
    
    if (name.startsWith('propertyInfo.')) {
      const fieldPath = name.replace('propertyInfo.', '');
      
      if (fieldPath.includes('.')) {
        const pathParts = fieldPath.split('.');
        let current = newFormData.propertyInfo;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!current[pathParts[i]]) {
            current[pathParts[i]] = {};
          }
          current = current[pathParts[i]];
        }
        
        current[pathParts[pathParts.length - 1]] = value;
      } else {
        if (!newFormData.propertyInfo) {
          newFormData.propertyInfo = {};
        }
        newFormData.propertyInfo[fieldPath] = value;
      }
    } else if (name.startsWith('loanInfo.')) {
      const field = name.replace('loanInfo.', '');
      if (!newFormData.loanInfo) {
        newFormData.loanInfo = {};
      }
      newFormData.loanInfo[field] = value;
      
      console.log(`Updated loanInfo.${field} to ${value}`);
      console.log('Current loanInfo state:', newFormData.loanInfo);
    } else {
      newFormData[name] = value;
    }
    
    setFormData(newFormData);
  };

  return {
    // State
    currentStep,
    setCurrentStep,
    currentSubStep,
    setCurrentSubStep,
    loading,
    draftId,
    loanTypes,
    formData,
    setFormData,
    errors,
    setErrors,
    
    // Credit report consent state
    hasExistingConsent,
    creditReportConsent,
    setCreditReportConsent,
    loadingConsent,
    consentData,
    
    // Context
    isLenderContext,
    userRole,
    
    // Handlers
    handleChange,
    handleBorrowerChange,
    handlePropertyChange,
    nextStep,
    prevStep,
    handleSubmit,
    
    // Utility functions
    validateStep,
    fillWithTestData,
    clearForm,
    
    // Storage functions
    saveFormToStorage,
    loadFormFromStorage,
    clearFormFromStorage
  };
};
