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

  useEffect(() => {
    console.log('Form data:', formData);
  }, [formData]);

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
            
            // If it's a loan number (LN prefix), store both the MongoDB ID and the loan number
            if (draft.startsWith('LN')) {
              setDraftId(draft); // Keep the LN number as the draftId
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
    if (e) e.preventDefault();
    
    setLoading(true);
    console.log('Form submission started - draftId:', draftId);
    console.log('Is existing loan?', formData.isExistingLoan);
    
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
      
      // Process the borrowers data for submission
      const borrowerData = {
        ...(formData.borrowers[0] || {}),
        dependents: Array.isArray(formData.borrowers?.[0]?.dependents) ? formData.borrowers[0].dependents : [],
        employers: Array.isArray(formData.borrowers?.[0]?.employers) ? formData.borrowers[0].employers : [],
        previousAddresses: Array.isArray(formData.borrowers?.[0]?.previousAddresses) ? formData.borrowers[0].previousAddresses : []
      };
      
      // Transform propertyOwned data to propertiesOwned array
      const transformedPropertiesOwned = [];
      if (formData.propertiesOwned && formData.propertiesOwned.ownsProperty === true && 
          Array.isArray(formData.propertiesOwned.properties) && formData.propertiesOwned.properties.length > 0) {
        
        // Map each property to the format expected by the backend
        formData.propertiesOwned.properties.forEach(property => {
          transformedPropertiesOwned.push({
            propertyAddress: {
              streetAddress: property.address?.streetAddress || '',
              apt: property.address?.apt || '',
              city: property.address?.city || '',
              state: property.address?.state || '',
              zipCode: property.address?.zipCode || ''
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
          // Fields for property with accepted offer
          hasAcceptedOffer: formData.propertyInfo?.hasAcceptedOffer || false,
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
      
      // If we're editing an existing loan (with LN prefix), use updateLoan instead
      if (formData.isExistingLoan && draftId && draftId.startsWith('LN')) {
        console.log('Updating existing loan application:', draftId);
        // For loan numbers, we need to use the LN number, not the MongoDB ID
        response = await LoanService.updateLoan(draftId, submissionData);
      } else {
        // Otherwise create a new loan
        console.log('Creating new loan application');
        response = await LoanService.submitLoan(submissionData);
      }
      
      console.log('FORM SUBMISSION - API Response:', response);
      
      if (response.success) {
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
            { name: 'Child 1', age: 10, relationship: 'Child' },
            { name: 'Child 2', age: 8, relationship: 'Child' }
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
        propertyType: 'Single Family Home',
        occupancyType: 'Primary Residence',
        numberOfUnits: 1,
        yearBuilt: 2010,
        isNewConstruction: false
      },
      
      loanInfo: {
        loanType: 'Purchase',
        loanAmount: '360000',
        purchasePrice: '360000',
        downPayment: '90000',
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
    toast.success('Form filled with test data. You can now navigate using the step buttons.');
    
    // Attempt to automatically navigate to review step (last step)
    // setTimeout(() => {
    //   try {
    //     console.log('Current formData after fill:', formData);
    //   } catch (err) {
    //     console.error('Error logging form data:', err);
    //   }
    // }, 500);
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
          if (tabName === 'propertiesOwned') {
            // PropertyOwned validation - make sure they've answered the question
            if (formData.propertiesOwned?.ownsProperty === undefined) {
              newErrors['propertiesOwned.ownsProperty'] = 'Please indicate if you own additional property';
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
          if (formData.propertiesOwned?.ownsProperty === undefined) {
            newErrors['propertiesOwned.ownsProperty'] = 'Please indicate if you own additional property';
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

  // Direct form update handler for borrowers step (supports nested paths)
  const handleBorrowerChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newFormData = JSON.parse(JSON.stringify(formData));
    const val = type === 'checkbox' ? checked : value;
    const segments = name.split('.');
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
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
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
