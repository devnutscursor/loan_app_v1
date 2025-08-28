import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import BorrowerStep from '../../components/forms/borrower/BorrowerStep';
import PropertyStep from '../../components/forms/property/PropertyStep';
import FinancialStep from '../../components/forms/financial/FinancialStep';
import AdditionalStep from '../../components/forms/additional/AdditionalStep';
import DeclarationsStep from '../../components/forms/declarations/DeclarationsStep';
import ReviewStep from '../../components/forms/review/ReviewStep';
import { LoanService } from '../../services';
import { validateStep as validateStepRules } from '../../utils/validationRules';
import Toggle from '../../components/ui/Toggle';
import StepNavigator from '../../components/ui/StepNavigator';

const LoanApplication = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { draft } = router.query;
  
  // User context detection for lender vs borrower usage
  const isLenderContext = router.pathname.includes('/lender/');
  const userRole = user?.role;
  const [currentStep, setCurrentStep] = useState(1);
  const [currentSubStep, setCurrentSubStep] = useState('personalDetails'); // For Step 1 navigation
  const [loading, setLoading] = useState(false);
  const [draftId, setDraftId] = useState(draft || null);
  const [loanTypes, setLoanTypes] = useState([]);
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

        // Employment History
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
    // Property & Loan Details
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
      // Properties with accepted offer
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
      // Purchase fields
      purchasePrice: '',
      downPayment: '',
      // Refinance fields
      yearAcquired: '',
      currentLoanBalance: '',
      requestedLoanAmount: '',
      refinanceType: '',
      // Construction fields
      yearLotAcquired: '',
      originalCost: '',
      existingLoans: '',
      presentValueOfLot: '',
      costOfImprovements: '',
      constructionType: ''
    },
    // Assets & Debts
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
    // Additional Information
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
    // Declarations & Demographics
    declarations: {},
    demographics: {},
    // Documents
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
      // Only save if there's meaningful data (not just default empty values)
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
        // Check if data is not too old (24 hours)
        const isRecent = Date.now() - parsedData.timestamp < 24 * 60 * 60 * 1000;
        if (isRecent) {
          return parsedData;
        } else {
          // Clear old data
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

  useEffect(() => {
    console.log('Form data:', formData);
  }, [formData]);

  // Auto-save form data whenever it changes (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveFormToStorage(formData, currentStep, currentSubStep);
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [formData, currentStep, currentSubStep]);

  // Ensure form data structure is properly initialized
  useEffect(() => {
    setFormData(prevData => {
      // Ensure borrowers array exists and has at least one borrower
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
        // If there's a draft ID in the URL and router is ready, try to load it
        if (draft && router.isReady) {
          console.log('Loading draft with ID:', draft);
          const result = await LoanService.getDraft(draft);
          if (result.success && result.data) {
            console.log('Draft data loaded:', result.data);
            setFormData(prev => ({ ...prev, ...result.data }));
            
            // If it's a loan number (numeric format or DRAFT/LN prefix), store both the MongoDB ID and the loan number
            const isLoanNumber = /^\d{11}$/.test(draft) || draft.startsWith('DRAFT-') || draft.startsWith('LN');
            if (isLoanNumber) {
              setDraftId(draft); // Keep the loan number as the draftId
              // Store original MongoDB ID if available
              if (result.data._id) {
                setFormData(prev => ({ 
                  ...prev, 
                  originalLoanId: result.data._id,
                  isExistingLoan: true
                }));
              }
            } else {
              // Regular draft - just use the MongoDB ID
              setDraftId(result.data._id);
            }
            
            // Check if this is an existing loan being edited
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

    // Load saved form data from localStorage (only if no draft is being loaded)
    const loadSavedFormData = () => {
      if (!draft) { // Only load saved data if we're not loading a specific draft
        const savedData = loadFormFromStorage();
        if (savedData) {
          setFormData(savedData.formData);
          setCurrentStep(savedData.currentStep);
          setCurrentSubStep(savedData.currentSubStep);
          
          // Form data restored silently (no toast notification)
        }
      }
    };

    // Only run when router is ready
    if (router.isReady) {
      loadDraft();
      fetchLoanTypes();
      loadSavedFormData();
    }
  }, [router.isReady, draft]); // Re-run when router becomes ready or draft ID changes

  // Handle form input changes
  const handleChange = (nameOrEvent, valueOrNull = null) => {
    // Check if this is an event or direct name/value pair
    if (nameOrEvent && nameOrEvent.target) {
      // This is an event object
      const { name, value, type, files, checked } = nameOrEvent.target;
      const actualValue = type === 'checkbox' ? checked : value;
      console.log(`Updating field (from event): ${name} with value:`, actualValue);
      
      // Handle file inputs separately
      if (type === 'file') {
        setFormData({
          ...formData,
          documents: [...formData.documents, ...files]
        });
        return;
      }
      
      // Handle array notation in field names (e.g., 'borrowers[0].firstName')
      if (name.includes('[') && name.includes(']')) {
        const newFormData = JSON.parse(JSON.stringify(formData)); // Deep copy
        
        // Parse the path segments (support for nested arrays like borrowers[0].employers[0].companyName)
        const pathSegments = [];
        const parts = name.split('.');
        
        parts.forEach(part => {
          if (part.includes('[')) {
            const arrayMatch = part.match(/([^\[]+)\[(\d+)\]/);
            if (arrayMatch) {
              pathSegments.push(arrayMatch[1]); // The array name (e.g., 'borrowers')
              pathSegments.push(parseInt(arrayMatch[2], 10)); // The index as a number
            }
          } else {
            pathSegments.push(part); // Regular property name
          }
        });
        
        console.log('Path segments:', pathSegments);
        
        // Use a reference to navigate the object tree
        let current = newFormData;
        
        // Create all necessary objects/arrays in the path
        for (let i = 0; i < pathSegments.length - 1; i++) {
          const segment = pathSegments[i];
          const nextSegment = pathSegments[i + 1];
          
          // If segment is a string (property name)
          if (typeof segment === 'string') {
            // If property doesn't exist or is null, create it
            if (!current[segment]) {
              // If next segment is a number, create an array, otherwise an object
              current[segment] = typeof nextSegment === 'number' ? [] : {};
            }
            // Move reference deeper
            current = current[segment];
          }
          // If segment is a number (array index)
          else if (typeof segment === 'number') {
            // If array element doesn't exist, create it
            if (!current[segment]) {
              // If next segment is a number, create an array, otherwise an object
              current[segment] = typeof nextSegment === 'number' ? [] : {};
            }
            // Move reference deeper
            current = current[segment];
          }
        }
        
        // Set the final value
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (current) { // Safety check
          current[lastSegment] = actualValue;
        }
        
        console.log('Updated form data:', newFormData);
        setFormData(newFormData);
      }
      // Handle regular dot notation (e.g., 'property.address.city')
      else if (name.includes('.')) {
        const props = name.split('.');
        const newFormData = JSON.parse(JSON.stringify(formData)); // Deep copy
        let current = newFormData;
        
        // Create all objects in the path
        for (let i = 0; i < props.length - 1; i++) {
          if (!current[props[i]]) {
            current[props[i]] = {};
          }
          current = current[props[i]];
        }
        
        // Safety check before setting value
        if (current) {
          current[props[props.length - 1]] = actualValue;
          console.log('Updated form data:', newFormData);
          setFormData(newFormData);
        } else {
          console.error('Cannot set property, path does not exist:', name);
        }
      } 
      // Handle direct properties
      else {
        setFormData({
          ...formData,
          [name]: actualValue
        });
      }
      
      // Clear error when user types
      if (errors[name]) {
        setErrors({ ...errors, [name]: '' });
      }
    } else {
      // This is a direct name/value call from a component
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
    // Debug: log the current form data structure to help identify issues
    console.log('Current form data:', formData);
  
    // If validation bypass is enabled, proceed
    if (window._tempValidateOverride) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      // Save the step change
      saveFormToStorage(formData, newStep, currentSubStep);
      return;
    }
    
    // Validate the current step
    const validationErrors = validateStep(currentStep);
    
    // Check if validation passed (no errors)
    if (Object.keys(validationErrors).length === 0) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      // Save the step change
      saveFormToStorage(formData, newStep, currentSubStep);
    } else {
      // Get specific error messages for missing fields
      const errorMessages = Object.values(validationErrors);
      
      if (errorMessages.length > 0) {
        // Show the first few error messages
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
    // Save the step change
    saveFormToStorage(formData, newStep, currentSubStep);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    console.log('Form submission started - draftId:', draftId);
    console.log('Is existing loan?', formData.isExistingLoan);
    console.log('Lender context detection - isLenderContext:', isLenderContext, 'userRole:', userRole);
    
    try {
      // Validate all steps before submission
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
      
      // Process the borrowers data for submission - safely access borrower data
      const primaryBorrower = formData.borrowers?.[0] || {};
      const borrowerData = {
        ...primaryBorrower,
        dependents: Array.isArray(primaryBorrower.dependents) ? primaryBorrower.dependents : [],
        employers: Array.isArray(primaryBorrower.employers) ? primaryBorrower.employers : [],
        previousAddresses: Array.isArray(primaryBorrower.previousAddresses) ? primaryBorrower.previousAddresses : []
      };
      
      // Transform propertyOwned data to propertiesOwned array
      const transformedPropertiesOwned = [];
      if (formData.propertiesOwned && formData.propertiesOwned.ownsProperty === true && 
          Array.isArray(formData.propertiesOwned.properties) && formData.propertiesOwned.properties.length > 0) {
        
        // Debug: Log the properties before transformation
        console.log('FORM SUBMISSION - Properties before transformation:', formData.propertiesOwned.properties);
        
        // Map each property to the format expected by the backend
        formData.propertiesOwned.properties.forEach(property => {
          console.log('FORM SUBMISSION - Processing property:', property);
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

      // Prepare the proper propertiesOwned structure
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
      
      // Transform form data to match backend model structure
      const submissionData = {
        // For the MongoDB reference to the Borrower model
        primaryBorrower: formData.primaryBorrowerId || '67fa2aa7f5010213147f8529', // Using a default ID if none is set
        
        // For the embedded borrowerDetails field - direct copy of the borrowers[0] data
        borrowerDetails: borrowerData,
        
        // Add lender-specific fields when used by lender
        ...(isLenderContext && userRole === 'lender' && {
          submittedByLender: true,
          lenderId: user._id,
          submissionSource: 'manual'
        }),
        
        // Property information (from Step 2)
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
          // Fields for property with accepted offer - convert hasAcceptedOffer to boolean, keep others as strings
          hasAcceptedOffer: formData.propertyInfo?.hasAcceptedOffer === 'Yes' || formData.propertyInfo?.hasAcceptedOffer === true,
          contractPurchasePrice: parseFloat(formData.propertyInfo?.contractPurchasePrice) || 0,
          isMixedUse: formData.propertyInfo?.isMixedUse || 'No',
          isManufactured: formData.propertyInfo?.isManufactured || 'No',
          proposedRentalIncome: parseFloat(formData.propertyInfo?.proposedRentalIncome) || 0
        },
        
        // Loan details (from Step 2)
        loanDetails: {
          loanType: formData.loanInfo?.loanType || 'Purchase',
          loanAmount: parseFloat(formData.loanInfo?.loanAmount) || 0,
          purchasePrice: parseFloat(formData.loanInfo?.purchasePrice) || 0,
          downPayment: parseFloat(formData.loanInfo?.downPayment) || 0,
          downPaymentSource: formData.loanInfo?.downPaymentSource || 'Savings',
          
          // Refinance-specific fields
          yearAcquired: parseInt(formData.loanInfo?.yearAcquired) || 0,
          currentLoanBalance: parseFloat(formData.loanInfo?.currentLoanBalance) || 0,
          requestedLoanAmount: parseFloat(formData.loanInfo?.requestedLoanAmount) || 0,
          refinanceType: formData.loanInfo?.refinanceType || '',
          
          // Construction-specific fields
          yearLotAcquired: parseInt(formData.loanInfo?.yearLotAcquired) || 0, 
          originalCost: parseFloat(formData.loanInfo?.originalCost) || 0,
          existingLoans: parseFloat(formData.loanInfo?.existingLoans) || 0,
          presentValueOfLot: parseFloat(formData.loanInfo?.presentValueOfLot) || 0,
          costOfImprovements: parseFloat(formData.loanInfo?.costOfImprovements) || 0,
          constructionType: formData.loanInfo?.constructionType || '',
          
          // Other fields
          downPaymentPercentage: parseFloat(formData.loanInfo?.downPaymentPercentage) || 20,
          isFixedRate: formData.loanInfo?.isFixedRate !== false,
          includeEscrow: formData.loanInfo?.includeEscrow !== false,
          includeMortgageInsurance: formData.loanInfo?.includeMortgageInsurance !== false
        },
        
        // Financial information (from Step 3)
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
        
        // Additional information (from Step 4)
        propertiesOwned: formattedPropertiesOwned, // Use the properly formatted object
        militaryService: formData.militaryService || { isMilitary: false },
        
        // Declarations & Demographics (from Step 5)
        declarations: formData.declarations || {},
        demographics: formData.demographics || {}
      };
      
      console.log('FORM SUBMISSION - Submitting data:', submissionData);
      
      // Make API call to submit the loan application
      let response;

      // If we're editing an existing loan (with loan number), use updateLoan instead
      const isLoanNumber = draftId && (/^\d{11}$/.test(draftId) || draftId.startsWith('DRAFT-') || draftId.startsWith('LN'));
      if (formData.isExistingLoan && isLoanNumber) {
        console.log('Updating existing loan application:', draftId);
        // For loan numbers, we need to use the loan number, not the MongoDB ID
        response = await LoanService.updateLoan(draftId, submissionData);
      } else {
        // Create a new loan using standard borrower submission method
        // Note: borrowers cannot use submitLoanForLender as it requires lender permissions
        console.log('Creating new loan application using standard borrower method');
        response = await LoanService.submitLoan(submissionData);
      }
      
      console.log('FORM SUBMISSION - API Response:', response);
      
      if (response.success) {
        // Clear saved form data since submission was successful
        clearFormFromStorage();
        
        toast.success('Loan application submitted successfully!');
        
        // Delete the draft after successful submission if there was one and it's not an LN number
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
        
        // Conditional redirect based on user context
        if (isLenderContext && userRole === 'lender') {
          // Lenders go to loan details page
          const loanId = response.data._id;
          if (loanId) {
            router.push(`/lender/loans/${loanId}`);
          } else {
            // Fallback to lender loans list if no loan ID
            router.push('/lender/loans');
          }
        } else {
          // Borrowers go to confirmation page (existing behavior)
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

  // Fill form with test data (for development/testing only) - Enhanced version matching lender page
  const fillWithTestData = () => {
    console.log('FILL TEST DATA - Starting to fill form with comprehensive test data');

    const testData = {
      // Purpose field is required for auto-save
      purpose: 'Purchase',
      completionPercentage: 100,
      primaryBorrowerId: '67fa2aa7f5010213147f8529', // Default borrower ID
      
      borrowers: [
        {
          // Personal details
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

          // Dependents - ensure we have proper array data
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
          
          // Address information
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
          // Previous addresses - ensure proper array data
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

          // Employment history - ensure proper array data
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
            },
            {
              companyName: 'Previous Corp',
              companyPhone: '(555) 123-9876',
              employmentStatus: 'Full-Time',
              jobTitle: 'Software Developer',
              startDate: '2015-01-01',
              endDate: '2018-03-14',
              yearsInProfession: 3,
              monthsInProfession: 2,
              streetAddress: '321 Business Ave',
              aptSteNum: '',
              city: 'Chicago',
              state: 'IL',
              zipCode: '60601'
            }
          ]
        }
      ],
      
      // Property & Loan Info
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
      
      // Financial Information - Enhanced assets structure
      assets: {
        checkingAndSavings: [
          {
            id: 'asset1',
            accountType: 'Checking',
            financialInstitution: 'First National Bank',
            accountNumber: 'XXXX1234',
            balance: '25000'
          },
          {
            id: 'asset2',
            accountType: 'Savings',
            financialInstitution: 'Community Credit Union',
            accountNumber: 'XXXX5678',
            balance: '75000'
          }
        ],
        stocksAndBonds: [
          {
            id: 'stock1',
            companyName: 'Tech Corp',
            numberOfShares: '100',
            sharePrice: '150',
            totalValue: '15000'
          }
        ],
        lifeInsurance: [
          {
            id: 'insurance1',
            faceAmount: '500000',
            cashValue: '25000'
          }
        ],
        retirementFunds: [
          {
            id: 'retirement1',
            accountType: '401(k)',
            currentValue: '150000',
            vestingPercentage: '100'
          }
        ],
        otherAssets: [
          {
            id: 'other1',
            assetType: 'Vehicle',
            description: '2022 Tesla Model 3',
            value: '45000'
          }
        ]
      },
      
      // Income details - Enhanced structure
      income: {
        baseIncome: '9500',
        overtime: '1200',
        commissions: '2000',
        bonuses: '5000',
        militaryEntitlements: '0',
        otherIncome: [
          {
            id: 'income1',
            sourceType: 'Rental Income',
            amount: '1800',
            description: 'Rental property income'
          },
          {
            id: 'income2',
            sourceType: 'Investment Income',
            amount: '500',
            description: 'Dividend and interest income'
          }
        ]
      },
      
      // Debts - Enhanced structure
      debts: [
        {
          id: 'debt1',
          creditorName: 'Credit Card Company',
          accountNumber: 'XXXX9876',
          monthlyPayment: '250',
          unpaidBalance: '5000',
          debtType: 'Credit Card'
        },
        {
          id: 'debt2',
          creditorName: 'Auto Finance Corp',
          accountNumber: 'XXXX5432',
          monthlyPayment: '450',
          unpaidBalance: '18000',
          debtType: 'Auto Loan'
        }
      ],

      // Expenses - Enhanced structure
      expenses: [
        {
          id: 'expense1',
          expenseType: 'Utilities',
          amount: '300',
          description: 'Monthly utilities'
        },
        {
          id: 'expense2',
          expenseType: 'Insurance',
          amount: '200',
          description: 'Auto and home insurance'
        }
      ],
      
      // Additional Information
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
      
      // Military Service
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
      
      // Declarations
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
      
      // Demographics
      demographics: {
        ethnicity: 'Not Hispanic or Latino',
        race: 'White',
        sex: 'Male',
        gender: 'Male',
        sexByObservation: false
      }
    };
    
    console.log('FILL TEST DATA - Test data populated:', testData);
    
    // Set form data
    setFormData(testData);
    
    // Reset to first step to ensure form is properly displayed
    // setCurrentStep(1);
    // setCurrentSubStep('personalDetails');
    
    // Temporarily disable validation to allow navigation through the form
    // window._tempValidateOverride = true;
    
    // Add function to jump to review step
    // window.goToReviewStep = () => {
    //   setCurrentStep(6); // Review step
    //   toast.success('Jumped to review step');
    // };
    
    // Log message and set toast
    console.log('FILL TEST DATA - Form data set successfully. Navigation buttons should now work.');
    console.log('FILL TEST DATA - You can run window.goToReviewStep() in console to jump to final step');

    toast.success('Form filled with comprehensive test data!');
  };

  // Clear form function - Enhanced version matching lender page
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
    // Clear localStorage as well
    clearFormFromStorage();
    toast.success('Form cleared and reset to step 1');
  };

  // Validate form data for each step
  const validateStep = (step, tabName = null) => {
    // If we're using test data and the override flag is set, bypass validation
    if (window._tempValidateOverride) {
      console.log('Validation bypassed due to test data override');
      return {};
    }

    // Use the new validation rules
    const validationErrors = validateStepRules(step, formData, tabName);
    
    // Only set errors if they're different from current errors to prevent unnecessary re-renders
    if (JSON.stringify(validationErrors) !== JSON.stringify(errors)) {
      setErrors(validationErrors);
    }
    
    return validationErrors;
  };

  // Direct form update handler for borrowers step (supports nested paths)
  const handleBorrowerChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newFormData = JSON.parse(JSON.stringify(formData));
    const val = type === 'checkbox' ? checked : value;
    const segments = name.split('.');

    // Ensure borrowers array exists and has at least one borrower
    if (!newFormData.borrowers || !Array.isArray(newFormData.borrowers) || newFormData.borrowers.length === 0) {
      newFormData.borrowers = [{}];
    }

    let targetObj = newFormData.borrowers[0];
    // Traverse through nested keys except last
    for (let i = 0; i < segments.length - 1; i++) {
      const key = segments[i];
      if (targetObj[key] == null) {
        const nextKey = segments[i + 1];
        // create array or object based on next segment
        targetObj[key] = isNaN(parseInt(nextKey, 10)) ? {} : [];
      }
      targetObj = targetObj[key];
    }
    // Set the final property
    const lastKey = segments[segments.length - 1];
    targetObj[lastKey] = val;
    setFormData(newFormData);
  };
  
  // Direct form update handler for property and loan step
  const handlePropertyChange = (e) => {
    const { name, value } = e.target;
    
    // Create a deep copy of form data
    const newFormData = JSON.parse(JSON.stringify(formData));
    
    // Check if it's a propertyInfo or loanInfo field
    if (name.startsWith('propertyInfo.')) {
      const fieldPath = name.replace('propertyInfo.', '');
      
      // Handle nested propertyInfo fields (e.g., propertyInfo.address.streetAddress)
      if (fieldPath.includes('.')) {
        const pathParts = fieldPath.split('.');
        let current = newFormData.propertyInfo;
        
        // Create nested structure if it doesn't exist
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!current[pathParts[i]]) {
            current[pathParts[i]] = {};
          }
          current = current[pathParts[i]];
        }
        
        // Set the final value
        current[pathParts[pathParts.length - 1]] = value;
      } else {
        // Handle direct propertyInfo fields
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
      
      // Log the updated loanInfo for debugging
      console.log(`Updated loanInfo.${field} to ${value}`);
      console.log('Current loanInfo state:', newFormData.loanInfo);
    } else {
      // Direct field in the form data
      newFormData[name] = value;
    }
    
    // Update the form data
    setFormData(newFormData);
  };
  
  // Render the current step component
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BorrowerStep
            formData={formData}
            handleChange={handleBorrowerChange}
            validateStep={validateStep}
            nextStep={nextStep}
            errors={errors}
            currentSubStep={currentSubStep}
            setCurrentSubStep={setCurrentSubStep}
            userType="borrower"
            toast={toast}
          />
        );
      
      case 2:
        return (
          <PropertyStep
            formData={formData}
            handleChange={handlePropertyChange}
            loanTypes={loanTypes}
            validateStep={validateStep}
            nextStep={nextStep}
            prevStep={prevStep}
            errors={errors}
            userType="borrower"
          />
        );
      
      case 3:
        return (
          <FinancialStep
            formData={formData}
            handleChange={handleChange}
            validateStep={validateStep}
            nextStep={nextStep}
            prevStep={prevStep}
            errors={errors}
            userType="borrower"
          />
        );
      
      case 4:
        return (
          <AdditionalStep
            formData={formData}
            handleChange={handleChange}
            validateStep={validateStep}
            nextStep={nextStep}
            prevStep={prevStep}
            errors={errors}
            userType="borrower"
          />
        );
      
      case 5:
        return (
          <DeclarationsStep
            formData={formData}
            handleChange={handleChange}
            validateStep={validateStep}
            nextStep={nextStep}
            prevStep={prevStep}
            errors={errors}
            userType="borrower"
          />
        );
      
      case 6:
        return (
          <ReviewStep
            formData={formData}
            setCurrentStep={setCurrentStep}
            handleSubmit={handleSubmit}
            loading={loading}
            userType="borrower"
          />
        );
      
      default:
        return (
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Unknown Step</h3>
            <p className="mt-1 text-sm text-gray-600">
              There was an error with the application process.
            </p>
          </div>
        );
    }
  };

  // Define the steps for the application
  const applicationSteps = [
    { title: 'Borrowers' },
    { title: 'Property & Loan' },
    { title: 'Assets & Debts' },
    { title: 'Additional Info' },
    { title: 'Declarations' },
    { title: 'Review & Submit' }
  ];
  
  // Calculate progress percentage
  const progress = (currentStep / 6) * 100;

  return (
    <ProtectedRoute allowedRoles={['borrower']}>
      <MainLayout title="Apply for Loan">
        <div className="py-6">
          <div className="mx-auto sm:px-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">Apply for a Loan</h1>
              
              {/* Development Tools - Enhanced to match lender page */}
              <div className="flex items-center space-x-2">
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <button
                      type="button"
                      onClick={fillWithTestData}
                      className="px-3 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center"
                      title="Fill form with comprehensive test data (uses standard borrower submission)"
                    >
                      🧪 Fill Test Data
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Enable validation override and jump to review step
                        window._tempValidateOverride = true;
                        setCurrentStep(6); // Review step
                        toast.success('Jumped to review step with validation bypass');
                      }}
                      className="px-3 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                      title="Jump to review step (bypasses validation, uses standard borrower submission)"
                    >
                      ⚡ Jump to Review
                    </button>
                    <button
                      type="button"
                      onClick={clearForm}
                      className="px-3 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center"
                      title="Clear form and reset to step 1"
                    >
                      🗑️ Clear Form
                    </button>
                  </>
                )}
                <Link href="/borrower/loans">
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    ← Back to My Loans
                  </button>
                </Link>
              </div>
            </div>
          
            {/* Step Navigator */}
            <div className="mt-4">
              <StepNavigator 
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                steps={applicationSteps}
                formData={formData}
                validateStep={validateStep}
              />
            </div>

            {/* Form Auto-Save Info Banner */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Auto-Save Enabled:</strong> Your form data is automatically saved as you type. If you refresh the page or return later, your progress will be restored.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Form */}
            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <form onSubmit={currentStep === 6 ? handleSubmit : (e) => e.preventDefault()}>
                {renderStep()}
                
                {/* Only show these navigation buttons for steps that don't have their own navigation */}
                {/* Remove the default navigation buttons for all steps with custom navigation */}
                {false && (
                  <div className="mt-8 flex justify-between">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Previous
                      </button>
                    )}
                    
                    {currentStep < 4 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="ml-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting...
                          </>
                        ) : (
                          'Submit Application'
                        )}
                      </button>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default LoanApplication;
