import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import { LoanService } from '../../services';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import Link from 'next/link';
import BorrowerStep from '../../components/forms/borrower/BorrowerStep';
import PropertyStep from '../../components/forms/property/PropertyStep';
import FinancialStep from '../../components/forms/financial/FinancialStep';
import AdditionalStep from '../../components/forms/additional/AdditionalStep';
import DeclarationsStep from '../../components/forms/declarations/DeclarationsStep';
import ReviewStep from '../../components/forms/review/ReviewStep';
import Toggle from '../../components/ui/Toggle';
import StepNavigator from '../../components/ui/StepNavigator';

const LoanApplication = () => {
  const router = useRouter();
  const { draft } = router.query;
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
      occupancyType: ''
    },
    loanInfo: {
      loanType: '',
      loanPurpose: '',
      loanAmount: '',
      loanTerm: '',
      interestRate: ''
    },
    // Assets & Debts
    assets: {
      bankAccounts: [],
      otherAssets: []
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
    propertiesOwned: [],
    militaryService: {
      isMilitary: false,
      serviceStatus: '',
      dateOfService: ''
    },
    // Declarations & Demographics
    declarations: {},
    demographics: {},
    // Documents
    documents: []
  });
  const [errors, setErrors] = useState({});

  // Load draft on component mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        // If there's a draft ID in the URL, try to load it
        if (draft) {
          console.log('Loading draft with ID:', draft);
          const result = await LoanService.getDraft(draft);
          if (result.success && result.data) {
            console.log('Draft data loaded:', result.data);
            setFormData(prev => ({ ...prev, ...result.data }));
            setDraftId(result.data._id);
            
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

    loadDraft();
    fetchLoanTypes();
  }, []);

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
  
    // If validation bypass is enabled or the step validates successfully
    if (window._tempValidateOverride || validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      // More detailed error message
      toast.error('Please complete all required fields');
      console.log('Validation errors:', errors);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Detailed console logging to track form data
    console.log('FORM SUBMISSION - Starting validation');
    console.log('FORM DATA - Complete data structure:', formData);
    console.log('FORM DATA - Borrower info:', formData.borrowers[0]);
    
    // Validate all steps before submission
    const stepValidations = [
      validateStep(1),
      validateStep(2),
      validateStep(3),
      validateStep(4),
      validateStep(5)
    ];
    
    // Check if all steps are valid
    const allStepsValid = stepValidations.every(valid => valid);
    console.log('FORM VALIDATION - All steps valid:', allStepsValid);
    
    if (!allStepsValid) {
      setLoading(false);
      toast.error('Please complete all required information before submitting.');
      return;
    }
    
    try {
      console.log('FORM TRANSFORMATION - Starting data transformation');
      
      // Deep copy the borrower data for better debugging
      const borrowerData = JSON.parse(JSON.stringify(formData.borrowers[0] || {}));
      console.log('FORM DATA DETAILS - Borrower data copy:', borrowerData);

      // Debug log for form structure
      console.log('FORM DEBUG - borrowers array:', formData.borrowers);
      console.log('FORM DEBUG - borrower first name:', formData.borrowers?.[0]?.firstName);
      console.log('FORM DEBUG - borrower employers:', formData.borrowers?.[0]?.employers);
      
      // Fill in test data for demonstration if fields are empty
      if (!borrowerData.firstName && !borrowerData.lastName) {
        console.log('FORM DEBUG - Adding sample data for testing');
        borrowerData.firstName = 'John';
        borrowerData.lastName = 'Smith';
        borrowerData.email = 'john.smith@example.com';
        borrowerData.phone = '(123) 456-7890';
      }

      // Ensure arrays are properly initialized
      borrowerData.dependents = Array.isArray(borrowerData.dependents) ? borrowerData.dependents : [];
      borrowerData.previousAddresses = Array.isArray(borrowerData.previousAddresses) ? borrowerData.previousAddresses : [];
      borrowerData.employers = Array.isArray(borrowerData.employers) ? borrowerData.employers : [
        {
          companyName: borrowerData.employers?.[0]?.companyName || '',
          companyPhone: borrowerData.employers?.[0]?.companyPhone || '',
          employmentStatus: borrowerData.employers?.[0]?.employmentStatus || '',
          jobTitle: borrowerData.employers?.[0]?.jobTitle || '',
          startDate: borrowerData.employers?.[0]?.startDate || '',
          yearsInProfession: borrowerData.employers?.[0]?.yearsInProfession || '',
          monthsInProfession: borrowerData.employers?.[0]?.monthsInProfession || '',
          streetAddress: borrowerData.employers?.[0]?.streetAddress || '',
          aptSteNum: borrowerData.employers?.[0]?.aptSteNum || '',
          city: borrowerData.employers?.[0]?.city || '',
          state: borrowerData.employers?.[0]?.state || '',
          zipCode: borrowerData.employers?.[0]?.zipCode || ''
        }
      ];
      
      console.log('FORM DATA DETAILS - Enhanced borrower data:', borrowerData);

      // Transform form data to match backend model structure
      const submissionData = {
        // For the MongoDB reference to the Borrower model
        primaryBorrower: formData.primaryBorrowerId || '67fa2aa7f5010213147f8529', // Using a default ID if none is set
        
        // For the embedded borrowerDetails field - direct copy of the borrowers[0] data
        borrowerDetails: borrowerData,
        
        // Property information (from Step 2)
        property: {
          addressLine1: formData.propertyInfo?.address?.streetAddress || 'To be updated',
          addressLine2: formData.propertyInfo?.address?.aptSteNum || '',
          city: formData.propertyInfo?.address?.city || 'To be updated',
          state: formData.propertyInfo?.address?.state || 'To be updated',
          zipCode: formData.propertyInfo?.address?.zipCode || '00000',
          county: formData.propertyInfo?.address?.county || '',
          propertyType: formData.propertyInfo?.propertyType || 'Single Family Residence',
          occupancyType: formData.propertyInfo?.occupancyType || 'Primary Residence',
          numberOfUnits: formData.propertyInfo?.numberOfUnits || 1,
          yearBuilt: formData.propertyInfo?.yearBuilt || new Date().getFullYear(),
          propertyValue: parseFloat(formData.propertyInfo?.propertyValue) || 100000,
          isNewConstruction: formData.propertyInfo?.isNewConstruction || false
        },
        
        // Loan details (from Step 2)
        loanDetails: {
          loanPurpose: formData.loanInfo?.loanPurpose || 'Purchase',
          loanType: formData.loanInfo?.loanType || 'Conventional',
          loanAmount: parseFloat(formData.loanInfo?.loanAmount) || 50000,
          loanTerm: parseInt(formData.loanInfo?.loanTerm) || 30,
          interestRate: parseFloat(formData.loanInfo?.interestRate) || 4.5,
          downPayment: parseFloat(formData.loanInfo?.downPayment) || 0,
          downPaymentPercentage: parseFloat(formData.loanInfo?.downPaymentPercentage) || 20,
          isFixedRate: formData.loanInfo?.isFixedRate !== false,
          includeEscrow: formData.loanInfo?.includeEscrow !== false,
          includeMortgageInsurance: formData.loanInfo?.includeMortgageInsurance !== false
        },
        
        // Financial information (from Step 3)
        assets: formData.assets || { bankAccounts: [], otherAssets: [] },
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
        propertiesOwned: Array.isArray(formData.propertiesOwned) ? formData.propertiesOwned : [],
        militaryService: formData.militaryService || { isMilitary: false },
        
        // Declarations & Demographics (from Step 5)
        declarations: formData.declarations || {},
        demographics: formData.demographics || {}
      };
      
      console.log('FORM SUBMISSION - Submitting data:', submissionData);
      
      // Make API call to submit the loan application
      const response = await LoanService.submitLoan(submissionData);
      console.log('FORM SUBMISSION - API Response:', response);
      
      if (response.success) {
        toast.success('Loan application submitted successfully!');
        
        // Delete the draft after successful submission if there was one
        if (draftId) {
          try {
            await LoanService.deleteDraft(draftId);
            console.log('Draft deleted successfully');
          } catch (deleteError) {
            console.error('Failed to delete draft after submission:', deleteError);
          }
        }
        
        // Redirect to loans page
        router.push('/borrower/loans');
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

  // Fill form with test data (for development/testing only)
  const fillWithTestData = () => {
    console.log('FILL TEST DATA - Starting to fill form with test data');
    
    const testData = {
      // Purpose field is required for auto-save
      purpose: 'Purchase',
      completionPercentage: 100,
      primaryBorrowerId: '67fa2aa7f5010213147f8529', // Default borrower ID
      
      borrowers: [
        {
          // Personal details
          firstName: 'John',
          middleName: 'A',
          lastName: 'Smith',
          suffix: 'Jr',
          maritalStatus: 'Married',
          dateOfBirth: '1980-01-01',
          ssn: '123-45-6789',
          citizenship: 'USCitizen',
          phone: '(123) 456-7890',
          email: 'test@example.com',
          
          // Dependents - ensure we have proper array data
          dependents: [
            { age: 10, relationship: 'Child' },
            { age: 8, relationship: 'Child' }
          ],
          
          // Address information
          currentAddress: {
            streetAddress: '123 Main St',
            aptSteNum: 'Apt 4B',
            city: 'Anytown',
            state: 'CA',
            zipCode: '90210',
            ownershipStatus: 'Own',
            yearsAtAddress: 3,
            monthsAtAddress: 6
          },
          mailingAddress: {
            sameAsCurrentAddress: true,
            streetAddress: '123 Main St',
            aptSteNum: 'Apt 4B',
            city: 'Anytown',
            state: 'CA',
            zipCode: '90210'
          },
          // Previous addresses - ensure proper array data
          previousAddresses: [
            {
              streetAddress: '456 Old Rd',
              aptSteNum: '',
              city: 'Previous City',
              state: 'NY',
              zipCode: '10001',
              yearsAtAddress: 2,
              monthsAtAddress: 4,
              ownershipStatus: 'Rent'
            }
          ],
          
          // Employment history - ensure proper array data
          employers: [
            {
              companyName: 'ACME Inc',
              companyPhone: '(987) 654-3210',
              employmentStatus: 'Full-Time',
              jobTitle: 'Software Engineer',
              startDate: '2015-01-01',
              yearsInProfession: 8,
              monthsInProfession: 2,
              streetAddress: '456 Corporate Blvd',
              aptSteNum: 'Suite 300',
              city: 'Business City',
              state: 'CA',
              zipCode: '90210'
            }
          ]
        }
      ],
      
      // Property & Loan Info
      propertyInfo: {
        address: {
          streetAddress: '789 Dream Ave',
          aptSteNum: '', 
          city: 'Paradise City',
          state: 'FL',
          zipCode: '33101',
          county: 'Dream County'
        },
        propertyValue: '450000',
        propertyType: 'Single Family Residence',
        occupancyType: 'Primary Residence',
        numberOfUnits: 1,
        yearBuilt: 2010,
        isNewConstruction: false
      },
      
      loanInfo: {
        loanType: 'Conventional',
        loanPurpose: 'Purchase',
        loanAmount: '360000',
        downPayment: '90000',
        downPaymentPercentage: 20,
        loanTerm: '30',
        interestRate: 4.5,
        isFixedRate: true,
        includeEscrow: true,
        includeMortgageInsurance: true
      },
      
      // Financial Information
      assets: {
        bankAccounts: [
          {
            accountType: 'Checking',
            financialInstitution: 'Big Bank',
            accountNumber: 'XXXX1234',
            balance: 25000
          },
          {
            accountType: 'Savings',
            financialInstitution: 'Credit Union',
            accountNumber: 'XXXX5678',
            balance: 50000
          }
        ],
        otherAssets: [
          {
            assetType: 'Investment',
            description: '401(k)',
            value: 150000
          },
          {
            assetType: 'Vehicle',
            description: '2022 Tesla Model 3',
            value: 40000
          }
        ]
      },
      
      // Income details
      income: {
        baseIncome: 9500,
        overtime: 1200,
        commissions: 2000,
        bonuses: 5000,
        militaryEntitlements: 0,
        otherIncome: [
          {
            sourceType: 'Rental Income',
            amount: 1800,
            description: 'Rental property at 123 Rental St'
          },
          {
            sourceType: 'Investment Income',
            amount: 500,
            description: 'Dividend payments'
          }
        ]
      },
      
      // Debts
      debts: [
        {
          debtType: 'Credit Card',
          creditor: 'Chase Bank',
          accountNumber: 'XXXX9876',
          balance: 5000,
          monthlyPayment: 150,
          isPaidBeforeClosing: false
        },
        {
          debtType: 'Auto Loan',
          creditor: 'Auto Finance',
          accountNumber: 'XXXX5432',
          balance: 15000,
          monthlyPayment: 350,
          isPaidBeforeClosing: false
        },
        {
          debtType: 'Student Loan',
          creditor: 'Student Loan Servicer',
          accountNumber: 'XXXX1111',
          balance: 30000,
          monthlyPayment: 400,
          isPaidBeforeClosing: false
        }
      ],
      
      // Expenses
      expenses: [
        {
          expenseType: 'Utilities',
          amount: 300,
          description: 'Monthly utilities'
        },
        {
          expenseType: 'Insurance',
          amount: 200,
          description: 'Auto and home insurance'
        }
      ],
      
      // Additional Information
      propertiesOwned: [
        {
          propertyAddress: {
            streetAddress: '123 Rental St',
            city: 'Investment City',
            state: 'TX',
            zipCode: '77777'
          },
          propertyType: 'Single Family Residence',
          propertyValue: 300000,
          mortgageBalance: 200000,
          monthlyRentalIncome: 1800,
          monthlyMortgagePayment: 1200
        }
      ],
      
      // For Additional Step validations
      propertyOwned: {
        ownsProperty: true
      },
      
      // Military Service
      militaryService: {
        isMilitary: false,
        hasServed: false,
        serviceStatus: '',
        serviceStartDate: '',
        serviceEndDate: '',
        isDeployed: false
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
    setCurrentStep(1);
    setCurrentSubStep('personalDetails');
    
    // Temporarily disable validation to allow navigation through the form
    window._tempValidateOverride = true;
    
    // Add function to jump to review step
    window.goToReviewStep = () => {
      setCurrentStep(6); // Review step
      toast.success('Jumped to review step');
    };
    
    // Log message and set toast
    console.log('FILL TEST DATA - Form data set successfully. Navigation buttons should now work.');
    console.log('FILL TEST DATA - You can run window.goToReviewStep() in console to jump to final step');
    toast.success('Form filled with test data. You can now navigate using the step buttons.');
    
    // Attempt to automatically navigate to review step (last step)
    setTimeout(() => {
      try {
        console.log('Current formData after fill:', formData);
      } catch (err) {
        console.error('Error logging form data:', err);
      }
    }, 500);
  };

  // Validate form data for each step
  const validateStep = (step, tabName = null) => {
    // If we're using test data and the override flag is set, bypass validation
    if (window._tempValidateOverride) {
      console.log('Validation bypassed due to test data override');
      return true;
    }

    const newErrors = {};
    
    // Validate based on current step
    switch (step) {
      case 1: // Borrower step
        const primaryBorrower = formData.borrowers[0];
        
        // Personal details validation
        if (!primaryBorrower.firstName) newErrors['borrowers[0].firstName'] = 'First name is required';
        if (!primaryBorrower.lastName) newErrors['borrowers[0].lastName'] = 'Last name is required';
        if (!primaryBorrower.dateOfBirth) newErrors['borrowers[0].dateOfBirth'] = 'Date of birth is required';
        if (!primaryBorrower.ssn) newErrors['borrowers[0].ssn'] = 'SSN is required';
        if (!primaryBorrower.email) newErrors['borrowers[0].email'] = 'Email is required';
        if (!primaryBorrower.phone) newErrors['borrowers[0].phone'] = 'Phone number is required';
        
        // Address validation
        if (!primaryBorrower.currentAddress.streetAddress) newErrors['borrowers[0].currentAddress.streetAddress'] = 'Street address is required';
        if (!primaryBorrower.currentAddress.city) newErrors['borrowers[0].currentAddress.city'] = 'City is required';
        if (!primaryBorrower.currentAddress.state) newErrors['borrowers[0].currentAddress.state'] = 'State is required';
        if (!primaryBorrower.currentAddress.zipCode) newErrors['borrowers[0].currentAddress.zipCode'] = 'ZIP code is required';
        
        // Employment validation
        if (primaryBorrower.employers.length > 0) {
          if (!primaryBorrower.employers[0].companyName) newErrors['borrowers[0].employers[0].companyName'] = 'Company name is required';
          if (!primaryBorrower.employers[0].jobTitle) newErrors['borrowers[0].employers[0].jobTitle'] = 'Job title is required';
        }
        break;
        
      case 2: // Property & Loan details step
        // Property validation - check both nested and direct property fields
        const addressData = formData.propertyInfo.address || {};
        const directData = formData.propertyInfo || {};
        
        // Check for street address in either location
        if (!addressData.streetAddress && !directData.streetAddress) {
        }
        break;
        
      case 3: // Financial step
        // Make sure tabName is defined or fallback to validating all
        if (tabName) {
          if (tabName === 'assets') {
            // Asset validation - only check if we have at least one asset
            if (!formData.assets || (Array.isArray(formData.assets) && formData.assets.length === 0)) {
              newErrors['assets'] = 'Please add at least one asset';
            }
          } else if (tabName === 'income') {
            // Income validation - only check when leaving the income tab
            if (!formData.income || !formData.income.baseIncome) {
              newErrors['income.baseIncome'] = 'Base income is required';
            }
          } else if (tabName === 'debts') {
            // No specific requirements for debts at the moment
          }
        } else {
          // If no tab specified, validate the whole step
          // Check assets
          if (!formData.assets || (Array.isArray(formData.assets) && formData.assets.length === 0)) {
            newErrors['assets'] = 'Please add at least one asset';
          }
          
          // Check income
          if (!formData.income || !formData.income.baseIncome) {
            newErrors['income.baseIncome'] = 'Base income is required';
          }
        }
        break;
        
      case 4: // Additional Information step
        if (tabName) {
          if (tabName === 'propertyOwned') {
            // PropertyOwned validation - make sure they've answered the question
            if (formData.propertyOwned?.ownsProperty === undefined) {
              newErrors['propertyOwned.ownsProperty'] = 'Please indicate if you own additional property';
            }
          } else if (tabName === 'militaryService') {
            // MilitaryService validation - make sure they've answered the question
            if (formData.militaryService?.hasServed === undefined) {
              newErrors['militaryService.hasServed'] = 'Please indicate if you have served in the military';
            }
          }
        } else {
          // If no tab specified, validate the whole step
          // Check propertyOwned
          if (formData.propertyOwned?.ownsProperty === undefined) {
            newErrors['propertyOwned.ownsProperty'] = 'Please indicate if you own additional property';
          }
          
          // Check militaryService
          if (formData.militaryService?.hasServed === undefined) {
            newErrors['militaryService.hasServed'] = 'Please indicate if you have served in the military';
          }
        }
        break;
        
      case 5: // Declarations & Demographics step
        if (tabName) {
          if (tabName === 'declarations') {
            // Declarations validation - make sure they've answered the required questions
            if (formData.declarations?.occupyAsPrimary === undefined) {
              newErrors['declarations.occupyAsPrimary'] = 'Please indicate if you will occupy the property as your primary residence';
            }
            if (formData.declarations?.firstTimeBuyer === undefined) {
              newErrors['declarations.firstTimeBuyer'] = 'Please indicate if you are a first time homebuyer';
            }
          } else if (tabName === 'demographics') {
            // Demographics validation - verify required fields
            if (!formData.demographics?.ethnicity) {
              newErrors['demographics.ethnicity'] = 'Please select your ethnicity';
            }
            if (!formData.demographics?.gender) {
              newErrors['demographics.gender'] = 'Please select your gender';
            }
            if (!formData.demographics?.race) {
              newErrors['demographics.race'] = 'Please select your race';
            }
          }
        } else {
          // If no tab specified, validate the whole step
          // Check declarations
          if (formData.declarations?.occupyAsPrimary === undefined) {
            newErrors['declarations.occupyAsPrimary'] = 'Please indicate if you will occupy the property as your primary residence';
          }
          if (formData.declarations?.firstTimeBuyer === undefined) {
            newErrors['declarations.firstTimeBuyer'] = 'Please indicate if you are a first time homebuyer';
          }
          
          // Check demographics
          if (!formData.demographics?.ethnicity) {
            newErrors['demographics.ethnicity'] = 'Please select your ethnicity';
          }
          if (!formData.demographics?.gender) {
            newErrors['demographics.gender'] = 'Please select your gender';
          }
          if (!formData.demographics?.race) {
            newErrors['demographics.race'] = 'Please select your race';
          }
        }
        break;
        
      case 6: // Review & Submit
        // For the final step, there's no specific validation as we're just reviewing
        // We'll validate all steps before submission
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  // Direct form update handler for borrowers step
  const handleBorrowerChange = (e) => {
    const { name, value } = e.target;
    
    // Create a deep copy of form data
    const newFormData = JSON.parse(JSON.stringify(formData));
    
    // Update the specific path
    if (name.includes('.')) {
      // Handle nested paths like 'currentAddress.city'
      const [field, subField] = name.split('.');
      if (!newFormData.borrowers[0][field]) {
        newFormData.borrowers[0][field] = {};
      }
      newFormData.borrowers[0][field][subField] = value;
    } else {
      // Handle direct fields like 'firstName'
      newFormData.borrowers[0][name] = value;
    }
    
    // Update the form data
    setFormData(newFormData);
  };
  
  // Direct form update handler for property and loan step
  const handlePropertyChange = (e) => {
    const { name, value } = e.target;
    
    // Create a deep copy of form data
    const newFormData = JSON.parse(JSON.stringify(formData));
    
    // Check if it's a propertyInfo or loanInfo field
    if (name.startsWith('propertyInfo.')) {
      const field = name.replace('propertyInfo.', '');
      if (!newFormData.propertyInfo) {
        newFormData.propertyInfo = {};
      }
      newFormData.propertyInfo[field] = value;
    } else if (name.startsWith('loanInfo.')) {
      const field = name.replace('loanInfo.', '');
      if (!newFormData.loanInfo) {
        newFormData.loanInfo = {};
      }
      newFormData.loanInfo[field] = value;
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
            handleChange={handleChange}
            validateStep={validateStep}
            nextStep={nextStep}
            errors={errors}
            currentSubStep={currentSubStep}
            setCurrentSubStep={setCurrentSubStep}
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
          />
        );
      
      case 6:
        return (
          <ReviewStep
            formData={formData}
            setCurrentStep={setCurrentStep}
            handleSubmit={handleSubmit}
            loading={loading}
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
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">Apply for a Loan</h1>
              
              {/* Development Tools */}
              <div className="flex items-center">
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <button
                      type="button"
                      onClick={fillWithTestData}
                      className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center"
                    >
                      Fill Test Data
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        console.log('FORM DEBUG - Current data:', formData);
                        setCurrentStep(currentStep + 1);
                        toast.success('Forced navigation to next step');
                      }}
                      className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
                    >
                      Debug Form
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Enable validation override and jump to review step
                        window._tempValidateOverride = true;
                        setCurrentStep(6); // Review step
                        toast.success('Jumped to review step');
                      }}
                      className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                    >
                      Jump to Review
                    </button>
                  </>
                )}
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
