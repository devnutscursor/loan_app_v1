import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import MainLayout from "../../../components/layout/MainLayout";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import { LoanService } from "../../../services";
import BorrowerStep from "../../../components/forms/borrower/BorrowerStep";
import PropertyStep from "../../../components/forms/property/PropertyStep";
import FinancialStep from "../../../components/forms/financial/FinancialStep";
import AdditionalStep from "../../../components/forms/additional/AdditionalStep";
import DeclarationsStep from "../../../components/forms/declarations/DeclarationsStep";
import ReviewStep from "../../../components/forms/review/ReviewStep";
import StepNavigator from "../../../components/ui/StepNavigator";

const LenderManualLoanCreation = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [currentSubStep, setCurrentSubStep] = useState("personalDetails");
  const [loading, setLoading] = useState(false);
  const [loanTypes, setLoanTypes] = useState([]);
  const [forceUpdateKey, setForceUpdateKey] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set([1])); // Track actually completed steps
  const [formData, setFormData] = useState({
    borrowers: [
      {
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
        maritalStatus: "",
        dateOfBirth: "",
        ssn: "",
        citizenship: "",
        phone: "",
        email: "",
        dependents: [],
        currentAddress: {},
        mailingAddress: {
          sameAsCurrentAddress: false,
          aptSteNum: "",
          city: "",
          state: "",
          zipCode: "",
        },
        previousAddresses: [],
        employers: [
          {
            companyName: "",
            companyPhone: "",
            employmentStatus: "",
            jobTitle: "",
            startDate: "",
            yearsInProfession: "",
            monthsInProfession: "",
            streetAddress: "",
            aptSteNum: "",
            city: "",
            state: "",
            zipCode: "",
          },
        ],
      },
    ],
    propertyInfo: {
      address: {
        streetAddress: "",
        aptSteNum: "",
        city: "",
        state: "",
        zipCode: "",
      },
      propertyValue: "",
      propertyType: "",
      occupancyType: "",
      hasAcceptedOffer: "",
      contractPurchasePrice: "",
      isMixedUse: "",
      isManufactured: "",
      numberOfUnits: "",
      yearBuilt: "",
      proposedRentalIncome: "",
    },
    loanInfo: {
      loanType: "",
      loanPurpose: "",
      loanAmount: "",
      loanTerm: "",
      interestRate: "",
      purchasePrice: "",
      downPayment: "",
      yearAcquired: "",
      currentLoanBalance: "",
      requestedLoanAmount: "",
      refinanceType: "",
      yearLotAcquired: "",
      originalCost: "",
      existingLoans: "",
      presentValueOfLot: "",
      costOfImprovements: "",
      constructionType: "",
    },
    assets: {
      checkingAndSavings: [],
      stocksAndBonds: [],
      giftsAndGrants: [],
      miscellaneous: {
        earnestMoney: 0,
        lifeInsurance: 0,
        vestedInterestInRetirement: 0,
        otherAssets: 0,
      },
    },
    income: {
      baseIncome: "",
      overtime: "",
      commissions: "",
      bonuses: "",
      militaryEntitlements: "",
      otherIncome: [],
    },
    debts: [],
    expenses: [],
    propertiesOwned: {
      ownsProperty: true,
      properties: [],
      rent: "",
      firstMortgage: "",
      otherFinancing: "",
      hazardInsurance: "",
      realEstateTaxes: "",
      mortgageInsurance: "",
      hoaDues: "",
      otherHousingExpenses: "",
    },
    militaryService: {
      hasServed: false,
      currentlyServing: false,
      isRetired: false,
      isNonActivated: false,
      isSurvivingSpouse: false,
      serviceBranch: "",
      serviceType: "",
      yearsOfService: 0,
      dischargeType: "",
      dischargeDate: "",
      expirationDate: "",
    },
    declarations: {},
    demographics: {},
    documents: [],
  });
  const [errors, setErrors] = useState({});

  // Local storage keys for form persistence
  const STORAGE_KEYS = {
    FORM_DATA: 'lender_loan_form_data',
    CURRENT_STEP: 'lender_loan_current_step',
    CURRENT_SUB_STEP: 'lender_loan_current_sub_step',
    TIMESTAMP: 'lender_loan_form_timestamp'
  };

  // Form persistence functions
  const saveFormToStorage = (formData, currentStep, currentSubStep) => {
    try {
      // Only save if there's meaningful data (not just default empty values)
      const hasData = formData.borrowers[0].firstName || 
                     formData.borrowers[0].email || 
                     formData.propertyInfo.address.streetAddress ||
                     formData.loanInfo.loanAmount;

      if (hasData) {
        localStorage.setItem(STORAGE_KEYS.FORM_DATA, JSON.stringify(formData));
        localStorage.setItem(STORAGE_KEYS.CURRENT_STEP, currentStep.toString());
        localStorage.setItem(STORAGE_KEYS.CURRENT_SUB_STEP, currentSubStep);
        localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
        console.log('Form data saved to localStorage');
      }
    } catch (error) {
      console.error('Error saving form data to localStorage:', error);
    }
  };

  const loadFormFromStorage = () => {
    try {
      const savedFormData = localStorage.getItem(STORAGE_KEYS.FORM_DATA);
      const savedCurrentStep = localStorage.getItem(STORAGE_KEYS.CURRENT_STEP);
      const savedCurrentSubStep = localStorage.getItem(STORAGE_KEYS.CURRENT_SUB_STEP);
      const savedTimestamp = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);

      if (savedFormData && savedCurrentStep && savedTimestamp) {
        // Check if saved data is not too old (24 hours)
        const timestamp = parseInt(savedTimestamp);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const isDataFresh = Date.now() - timestamp < twentyFourHours;

        if (isDataFresh) {
          const parsedFormData = JSON.parse(savedFormData);
          const parsedCurrentStep = parseInt(savedCurrentStep);
          const parsedCurrentSubStep = savedCurrentSubStep || 'personalDetails';

          console.log('Loading saved form data from localStorage');
          
          return {
            formData: parsedFormData,
            currentStep: parsedCurrentStep,
            currentSubStep: parsedCurrentSubStep,
            hasRestoredData: true
          };
        } else {
          // Clear old data
          clearFormFromStorage();
        }
      }
    } catch (error) {
      console.error('Error loading form data from localStorage:', error);
      // Clear corrupted data
      clearFormFromStorage();
    }
    
    return null;
  };

  const clearFormFromStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.FORM_DATA);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_STEP);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SUB_STEP);
      localStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
      console.log('Form data cleared from localStorage');
    } catch (error) {
      console.error('Error clearing form data from localStorage:', error);
    }
  };

  useEffect(() => {
    const fetchLoanTypes = async () => {
      try {
        const result = await LoanService.getLoanTypes();
        if (result.success) {
          setLoanTypes(result.data);
        }
      } catch (error) {
        console.error("Error fetching loan types:", error);
      }
    };

    // Load saved form data on component mount
    const savedData = loadFormFromStorage();
    if (savedData) {
      setFormData(savedData.formData);
      setCurrentStep(savedData.currentStep);
      setCurrentSubStep(savedData.currentSubStep);
      
      // Form data restored silently (no toast notification)
    }

    fetchLoanTypes();
  }, []);

  // Auto-save form data whenever it changes (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveFormToStorage(formData, currentStep, currentSubStep);
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [formData, currentStep, currentSubStep]);

  // Handle form input changes (simplified version from borrower/apply.js)
  const handleChange = (nameOrEvent, valueOrNull = null) => {
    if (nameOrEvent && nameOrEvent.target) {
      const { name, value, type, files, checked } = nameOrEvent.target;
      const actualValue = type === "checkbox" ? checked : value;

      if (type === "file") {
        setFormData({
          ...formData,
          documents: [...formData.documents, ...files],
        });
        return;
      }

      if (name.includes("[") && name.includes("]")) {
        const newFormData = JSON.parse(JSON.stringify(formData));
        const pathSegments = [];
        const parts = name.split(".");

        parts.forEach((part) => {
          if (part.includes("[")) {
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

          if (typeof segment === "string") {
            if (!current[segment]) {
              current[segment] = typeof nextSegment === "number" ? [] : {};
            }
            current = current[segment];
          } else if (typeof segment === "number") {
            if (!current[segment]) {
              current[segment] = typeof nextSegment === "number" ? [] : {};
            }
            current = current[segment];
          }
        }

        const lastSegment = pathSegments[pathSegments.length - 1];
        if (current) {
          current[lastSegment] = actualValue;
        }

        setFormData(newFormData);
        // Force update for review step
        setForceUpdateKey((prev) => prev + 1);
      } else if (name.includes(".")) {
        const props = name.split(".");
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
          // Force update for review step
          setForceUpdateKey((prev) => prev + 1);
        }
      } else {
        setFormData({
          ...formData,
          [name]: actualValue,
        });
        // Force update for review step
        setForceUpdateKey((prev) => prev + 1);
      }

      if (errors[name]) {
        setErrors({ ...errors, [name]: "" });
      }
    } else {
      const fieldName = nameOrEvent;
      const fieldValue = valueOrNull;
      setFormData((prev) => ({
        ...prev,
        [fieldName]: fieldValue,
      }));
      // Force update for review step
      setForceUpdateKey((prev) => prev + 1);
    }
  };

  // Validation function - reuses the same logic as borrower form with lender-specific enhancements
  const validateStep = (step, tabName = null) => {
    // If we're using test data and the override flag is set, bypass validation
    if (window._tempValidateOverride) {
      console.log("Validation bypassed due to test data override");
      return {};
    }

    console.log(`🔍 VALIDATING STEP ${step} (tabName: ${tabName})`);
    console.log('📊 Current form data:', formData);
    
    const newErrors = {};

    // Validate based on current step
    switch (step) {
      case 1: // Borrower step
        const primaryBorrower = formData.borrowers[0];

        if (!tabName || tabName === 'personalDetails') {
          // Personal details validation
          if (!primaryBorrower.firstName)
            newErrors["borrowers[0].firstName"] = "First name is required";
          if (!primaryBorrower.lastName)
            newErrors["borrowers[0].lastName"] = "Last name is required";
          if (!primaryBorrower.dateOfBirth)
            newErrors["borrowers[0].dateOfBirth"] = "Date of birth is required";
          if (!primaryBorrower.ssn)
            newErrors["borrowers[0].ssn"] = "SSN is required";
          if (!primaryBorrower.email)
            newErrors["borrowers[0].email"] = "Email is required";
          if (!primaryBorrower.phone)
            newErrors["borrowers[0].phone"] = "Phone number is required";
          if (!primaryBorrower.maritalStatus)
            newErrors["borrowers[0].maritalStatus"] = "Marital status is required";
          if (!primaryBorrower.citizenship)
            newErrors["borrowers[0].citizenship"] = "Citizenship is required";
        }
      
        if (!tabName || tabName === 'residenceHistory') {
          // Address validation
          if (!primaryBorrower.currentAddress?.streetAddress)
            newErrors["borrowers[0].currentAddress.streetAddress"] =
              "Street address is required";
          if (!primaryBorrower.currentAddress?.city)
            newErrors["borrowers[0].currentAddress.city"] = "City is required";
          if (!primaryBorrower.currentAddress?.state)
            newErrors["borrowers[0].currentAddress.state"] = "State is required";
          if (!primaryBorrower.currentAddress?.zipCode)
            newErrors["borrowers[0].currentAddress.zipCode"] =
              "ZIP code is required";
          if (!primaryBorrower.currentAddress?.housingStatus)
            newErrors["borrowers[0].currentAddress.housingStatus"] =
              "Housing status is required";
          if (primaryBorrower.currentAddress?.yearsAtAddress === undefined || primaryBorrower.currentAddress?.yearsAtAddress === '')
            newErrors["borrowers[0].currentAddress.yearsAtAddress"] =
              "Years at address is required";
          if (primaryBorrower.currentAddress?.monthsAtAddress === undefined || primaryBorrower.currentAddress?.monthsAtAddress === '')
            newErrors["borrowers[0].currentAddress.monthsAtAddress"] =
              "Months at address is required";
        }
      
        if (!tabName || tabName === 'employmentHistory') {
          // Employment validation
          if (primaryBorrower.employers?.length > 0) {
            if (!primaryBorrower.employers[0].companyName)
              newErrors["borrowers[0].employers[0].companyName"] =
                "Company name is required";
            if (!primaryBorrower.employers[0].jobTitle)
              newErrors["borrowers[0].employers[0].jobTitle"] =
                "Job title is required";
            if (!primaryBorrower.employers[0].employmentStatus)
              newErrors["borrowers[0].employers[0].employmentStatus"] =
                "Employment status is required";
            if (!primaryBorrower.employers[0].startDate)
              newErrors["borrowers[0].employers[0].startDate"] =
                "Start date is required";
            if (primaryBorrower.employers[0].yearsInProfession === undefined || primaryBorrower.employers[0].yearsInProfession === '')
              newErrors["borrowers[0].employers[0].yearsInProfession"] =
                "Years in profession is required";
            if (primaryBorrower.employers[0].monthsInProfession === undefined || primaryBorrower.employers[0].monthsInProfession === '')
              newErrors["borrowers[0].employers[0].monthsInProfession"] =
                "Months in profession is required";
            if (!primaryBorrower.employers[0].streetAddress)
              newErrors["borrowers[0].employers[0].streetAddress"] =
                "Company address is required";
            if (!primaryBorrower.employers[0].city)
              newErrors["borrowers[0].employers[0].city"] =
                "Company city is required";
            if (!primaryBorrower.employers[0].state)
              newErrors["borrowers[0].employers[0].state"] =
                "Company state is required";
            if (!primaryBorrower.employers[0].zipCode)
              newErrors["borrowers[0].employers[0].zipCode"] =
                "Company ZIP code is required";
          } else {
            newErrors["borrowers[0].employers[0].companyName"] =
              "At least one employer is required";
          }
        }
        break;

      case 2: // Property & Loan details step
        // Property validation - check the actual fields that exist in the form
        const propertyData = formData.propertyInfo || {};

        // Check for required property fields that actually exist in the form
        if (!propertyData.occupancyType) {
          newErrors["propertyInfo.occupancyType"] = "Occupancy type is required";
        }
        
        if (!propertyData.propertyType) {
          newErrors["propertyInfo.propertyType"] = "Property type is required";
        }

        // Loan information validation
        const loanData = formData.loanInfo || {};
        
        // Check loan type
        if (!loanData.loanType) {
          newErrors["loanInfo.loanType"] = "Loan type is required";
        }
        
        // For purchase loans, check purchase price and down payment
        if (loanData.loanType === "Purchase") {
          if (!loanData.purchasePrice) {
            newErrors["loanInfo.purchasePrice"] = "Purchase price is required for purchase loans";
          }
          if (!loanData.downPayment) {
            newErrors["loanInfo.downPayment"] = "Down payment is required for purchase loans";
          }
        }
        
        // For refinance loans, check current loan balance and requested amount
        if (loanData.loanType === "Refinance") {
          if (!loanData.currentLoanBalance) {
            newErrors["loanInfo.currentLoanBalance"] = "Current loan balance is required for refinance loans";
          }
          if (!loanData.requestedLoanAmount) {
            newErrors["loanInfo.requestedLoanAmount"] = "Requested loan amount is required for refinance loans";
          }
        }
        
        // For construction loans, check loan amount
        if (loanData.loanType === "Construction") {
          if (!loanData.loanAmount) {
            newErrors["loanInfo.loanAmount"] = "Loan amount is required for construction loans";
          }
        }
        
        break;

      case 3: // Financial step
        console.log('🔍 STEP 3 VALIDATION - Financial step');
        console.log('📊 Assets data:', formData.assets);
        console.log('💰 Income data:', formData.income);
        
        // Make sure tabName is defined or fallback to validating all
        if (tabName) {
          if (tabName === "assets") {
            // Asset validation - only check if we have at least one asset
            if (
              !formData.assets ||
              (Array.isArray(formData.assets) && formData.assets.length === 0)
            ) {
              console.log('❌ Missing assets');
              newErrors["assets"] =
                "Please add at least one asset for loan qualification";
            } else {
              console.log('✅ Assets found');
            }
          } else if (tabName === "income") {
            // Income validation - only check when leaving the income tab
            if (!formData.income || !formData.income.baseIncome) {
              console.log('❌ Missing base income');
              newErrors["income.baseIncome"] =
                "Base income is required for loan qualification";
            } else {
              console.log('✅ Base income found');
            }
          } else if (tabName === "debts") {
            // No specific requirements for debts at the moment
            console.log('✅ Debts tab - no validation required');
          }
        } else {
          // If no tab specified, validate the whole step
          console.log('🔍 Validating entire Step 3');
          
          // Check assets
          if (
            !formData.assets ||
            (Array.isArray(formData.assets) && formData.assets.length === 0)
          ) {
            console.log('❌ Missing assets');
            newErrors["assets"] =
              "Please add at least one asset for loan qualification";
          } else {
            console.log('✅ Assets found');
          }

          // Check income
          if (!formData.income || !formData.income.baseIncome) {
            console.log('❌ Missing base income');
            newErrors["income.baseIncome"] =
              "Base income is required for loan qualification";
          } else {
            console.log('✅ Base income found');
          }
        }
        
        console.log('🔍 Step 3 validation errors:', newErrors);
        break;

      case 4: // Additional Information step
        if (tabName) {
          if (tabName === "propertiesOwned") {
            // PropertyOwned validation - make sure they've answered the question
            if (formData.propertiesOwned?.ownsProperty === undefined) {
              newErrors["propertiesOwned.ownsProperty"] =
                "Please indicate if borrower owns additional property";
            }
          } else if (tabName === "militaryService") {
            // MilitaryService validation - make sure they've answered the question
            if (formData.militaryService?.hasServed === undefined) {
              newErrors["militaryService.hasServed"] =
                "Please indicate if borrower has served in the military";
            }
          }
        } else {
          // If no tab specified, validate the whole step
          // Check propertyOwned
          if (formData.propertiesOwned?.ownsProperty === undefined) {
            newErrors["propertiesOwned.ownsProperty"] =
              "Please indicate if borrower owns additional property";
          }

          // Check militaryService
          if (formData.militaryService?.hasServed === undefined) {
            newErrors["militaryService.hasServed"] =
              "Please indicate if borrower has served in the military";
          }
        }
        break;

      case 5: // Declarations & Demographics step
        console.log('🔍 STEP 5 VALIDATION - Declarations & Demographics (ALL Optional)');
        // console.log('📊 Declarations data:', formData.declarations);
        // console.log('📊 Demographics data:', formData.demographics);
        
        // if (tabName) {
        //   if (tabName === "declarations") {
        //     console.log('🔍 Validating declarations tab');
        //     // Declarations validation - make sure they've answered the required questions
        //     if (formData.declarations?.occupyAsPrimary === undefined) {
        //       console.log('❌ Missing occupyAsPrimary');
        //       newErrors["declarations.occupyAsPrimary"] =
        //         "Please indicate if borrower will occupy the property as primary residence";
        //     } else {
        //       console.log('✅ occupyAsPrimary found:', formData.declarations.occupyAsPrimary);
        //     }
        //     if (formData.declarations?.firstTimeBuyer === undefined) {
        //       console.log('❌ Missing firstTimeBuyer');
        //       newErrors["declarations.firstTimeBuyer"] =
        //         "Please indicate if borrower is a first time homebuyer";
        //     } else {
        //       console.log('✅ firstTimeBuyer found:', formData.declarations.firstTimeBuyer);
        //     }
        //   } else if (tabName === "demographics") {
        //     console.log('🔍 Validating demographics tab');
        //     // Demographics validation - verify required fields
        //     if (!formData.demographics?.ethnicity) {
        //       console.log('❌ Missing ethnicity');
        //       newErrors["demographics.ethnicity"] =
        //         "Please select borrower ethnicity";
        //     } else {
        //       console.log('✅ ethnicity found:', formData.demographics.ethnicity);
        //     }
        //     if (!formData.demographics?.gender) {
        //       console.log('❌ Missing gender');
        //       newErrors["demographics.gender"] =
        //         "Please select borrower gender";
        //     } else {
        //       console.log('✅ gender found:', formData.demographics.gender);
        //     }
        //     if (!formData.demographics?.race) {
        //       console.log('❌ Missing race');
        //       newErrors["demographics.race"] = "Please select borrower race";
        //     } else {
        //       console.log('✅ race found:', formData.demographics.race);
        //     }
        //   }
        // } else {
        //   console.log('🔍 Validating entire Step 5');
        //   // If no tab specified, validate the whole step
        //   // Check declarations
        //   if (formData.declarations?.occupyAsPrimary === undefined) {
        //     console.log('❌ Missing occupyAsPrimary');
        //     newErrors["declarations.occupyAsPrimary"] =
        //       "Please indicate if borrower will occupy the property as primary residence";
        //   } else {
        //     console.log('✅ occupyAsPrimary found:', formData.declarations.occupyAsPrimary);
        //   }
        //   if (formData.declarations?.firstTimeBuyer === undefined) {
        //     console.log('❌ Missing firstTimeBuyer');
        //     newErrors["declarations.firstTimeBuyer"] =
        //       "Please indicate if borrower is a first time homebuyer";
        //   } else {
        //     console.log('✅ firstTimeBuyer found:', formData.declarations.firstTimeBuyer);
        //   }

        //   // Check demographics
        //   if (!formData.demographics?.ethnicity) {
        //     console.log('❌ Missing ethnicity');
        //     newErrors["demographics.ethnicity"] =
        //       "Please select borrower ethnicity";
        //   } else {
        //     console.log('✅ ethnicity found:', formData.demographics.ethnicity);
        //   }
        //   if (!formData.demographics?.gender) {
        //     console.log('❌ Missing gender');
        //     newErrors["demographics.gender"] = "Please select borrower gender";
        //   } else {
        //     console.log('✅ gender found:', formData.demographics.gender);
        //   }
        //   if (!formData.demographics?.race) {
        //     console.log('❌ Missing race');
        //     newErrors["demographics.race"] = "Please select borrower race";
        //   } else {
        //     console.log('✅ race found:', formData.demographics.race);
        //   }
        // }
        
        // console.log('🔍 Step 5 validation errors:', newErrors);
        break;

      case 6: // Review & Submit
        // For the final step, there's no specific validation as we're just reviewing
        // We'll validate all steps before submission
        break;

      default:
        break;
    }

    console.log('🔍 FINAL VALIDATION RESULT:');
    console.log('❌ Errors found:', newErrors);
    console.log('✅ Validation passed:', Object.keys(newErrors).length === 0);
    
    setErrors(newErrors);
    return newErrors;
  };

  // Fill form with test data (for development/testing only)
  const fillWithTestData = () => {
    console.log("FILL TEST DATA - Starting to fill form with test data");

    const testData = {
      // Purpose field is required for auto-save
      purpose: "Purchase",
      completionPercentage: 100,
      primaryBorrowerId: "67fa2aa7f5010213147f8529", // Default borrower ID

      // Additional required fields
      loanDetails: {
        loanType: "Purchase",
        loanAmount: "360000",
        purchasePrice: "450000",
        downPayment: "90000",
        loanPurpose: "Purchase",
        loanTerm: "30",
        interestRate: "6.5",
      },

      borrowers: [
        {
          // Personal details
          firstName: "John",
          middleName: "A",
          lastName: "Smith",
          suffix: "Jr",
          maritalStatus: "Married",
          dateOfBirth: "1980-01-01",
          ssn: "123-45-6789",
          citizenship: "USCitizen",
          phone: "(123) 456-7890",
          email: `john.smith.${Date.now()}@example.com`, // Unique email to avoid conflicts
          
          // Additional personal information
          gender: "Male",
          ethnicity: "Not Hispanic or Latino",
          race: "White",
          veteranStatus: "No",

          // Dependents - ensure we have proper array data
          dependents: [
            { name: "Child 1", age: 10, relationship: "Child" },
            { name: "Child 2", age: 8, relationship: "Child" },
          ],

          // Address information
          currentAddress: {
            streetAddress: "123 Main St",
            aptSteNum: "Apt 4B",
            city: "Anytown",
            state: "CA",
            zipCode: "90210",
            ownershipStatus: "Own",
            yearsAtAddress: 3,
            monthsAtAddress: 6,
          },
          mailingAddress: {
            sameAsCurrentAddress: true,
            streetAddress: "123 Main St",
            aptSteNum: "Apt 4B",
            city: "Anytown",
            state: "CA",
            zipCode: "90210",
          },
          // Previous addresses - ensure proper array data
          previousAddresses: [
            {
              streetAddress: "456 Old Rd",
              aptSteNum: "",
              city: "Previous City",
              state: "NY",
              zipCode: "10001",
              yearsAtAddress: 2,
              monthsAtAddress: 4,
              ownershipStatus: "Rent",
            },
          ],

          // Employment history - ensure proper array data
          employers: [
            {
              companyName: "Tech Solutions Inc",
              companyPhone: "(987) 654-3210",
              employmentStatus: "Full-Time",
              jobTitle: "Senior Software Engineer",
              startDate: "2015-01-01",
              yearsInProfession: 8,
              monthsInProfession: 2,
              streetAddress: "456 Corporate Blvd",
              aptSteNum: "Suite 300",
              city: "Business City",
              state: "CA",
              zipCode: "90210",
              monthlyIncome: 12000,
              annualIncome: 144000,
            },
            {
              companyName: "Previous Company LLC",
              companyPhone: "(555) 123-4567",
              employmentStatus: "Previous",
              jobTitle: "Software Developer",
              startDate: "2010-06-01",
              endDate: "2014-12-31",
              yearsInProfession: 4,
              monthsInProfession: 6,
              streetAddress: "789 Old Office Dr",
              aptSteNum: "",
              city: "Previous City",
              state: "CA",
              zipCode: "90211",
              monthlyIncome: 8000,
              annualIncome: 96000,
            },
          ],
        },
      ],

      // Property & Loan Info
      propertyInfo: {
        address: {
          streetAddress: "789 Dream Ave",
          aptSteNum: "",
          city: "Paradise City",
          state: "FL",
          zipCode: "33101",
          county: "Dream County",
        },
        propertyValue: "450000",
        propertyType: "Single Family Home",
        occupancyType: "Primary Residence",
        numberOfUnits: 1,
        yearBuilt: 2010,
        isNewConstruction: false,
        hasAcceptedOffer: "Yes",
        contractPurchasePrice: "450000",
        isMixedUse: "No",
        isManufactured: "No",
        proposedRentalIncome: "0",
      },

      loanInfo: {
        loanType: "Purchase",
        loanAmount: "360000",
        purchasePrice: "450000",
        downPayment: "90000",
        loanPurpose: "Purchase",
        loanTerm: "30",
        interestRate: "6.5",
      },

      // Financial Information - Enhanced Assets
      assets: {
        checkingAndSavings: [
          {
            id: `account-${Date.now()}-1`,
            accountType: "Checking",
            institution: "Chase Bank",
            bankName: "Chase Bank",
            accountNumber: "1234",
            value: 25000,
            balance: 25000,
            isVerified: true,
            isLiquid: true,
          },
          {
            id: `account-${Date.now()}-2`,
            accountType: "Savings",
            institution: "Wells Fargo",
            bankName: "Wells Fargo",
            accountNumber: "5678",
            value: 50000,
            balance: 50000,
            isVerified: true,
            isLiquid: true,
          },
          {
            id: `account-${Date.now()}-3`,
            accountType: "Money Market",
            institution: "Bank of America",
            bankName: "Bank of America",
            accountNumber: "9012",
            value: 35000,
            balance: 35000,
            isVerified: true,
            isLiquid: true,
          },
        ],
        stocksAndBonds: [
          {
            id: `stock-${Date.now()}-1`,
            description: "Apple Inc. (AAPL)",
            value: 45000,
          },
          {
            id: `stock-${Date.now()}-2`,
            description: "Microsoft Corporation (MSFT)",
            value: 30000,
          },
          {
            id: `bond-${Date.now()}-1`,
            description: "US Treasury Bonds",
            value: 25000,
          },
        ],
        giftsAndGrants: [
          {
            id: `gift-${Date.now()}-1`,
            source: "Relative",
            value: 15000,
            deposited: true,
            assetType: "Cash Gift",
          },
          {
            id: `gift-${Date.now()}-2`,
            source: "Employer",
            value: 5000,
            deposited: true,
            assetType: "Down Payment Assistance",
          },
        ],
        miscellaneous: {
          earnestMoney: 10000,
          lifeInsurance: 50000,
          vestedInterestInRetirement: 200000,
          otherAssets: 15000,
        },
      },

      // Income details - Enhanced
      income: {
        baseIncome: 12000,
        overtime: 1500,
        commissions: 3000,
        bonuses: 8000,
        militaryEntitlements: 0,
        otherIncome: [
          {
            sourceType: "Rental Income",
            amount: 2200,
            description: "Rental property at 123 Rental St",
          },
          {
            sourceType: "Investment Income",
            amount: 800,
            description: "Dividend payments from stock portfolio",
          },
          {
            sourceType: "Freelance Income",
            amount: 1200,
            description: "Consulting work",
          },
        ],
      },

      // Debts - Enhanced
      debts: [
        {
          debtType: "Credit Card",
          creditorName: "Chase Bank",
          monthlyPayment: 350,
          unpaidBalance: 7500,
        },
        {
          debtType: "Credit Card",
          creditorName: "American Express",
          monthlyPayment: 200,
          unpaidBalance: 4000,
        },
        {
          debtType: "Auto Loan",
          creditorName: "Ford Credit",
          monthlyPayment: 450,
          unpaidBalance: 18000,
        },
        {
          debtType: "Student Loan",
          creditorName: "Federal Student Aid",
          monthlyPayment: 300,
          unpaidBalance: 25000,
        },
        {
          debtType: "Personal Loan",
          creditorName: "Wells Fargo",
          monthlyPayment: 150,
          unpaidBalance: 5000,
        },
      ],

      // Expenses - Enhanced
      expenses: [
        {
          expenseType: "Utilities",
          amount: 350,
          description: "Electric, gas, water, internet",
        },
        {
          expenseType: "Insurance",
          amount: 250,
          description: "Auto and home insurance",
        },
        {
          expenseType: "Childcare",
          amount: 800,
          description: "Daycare for 2 children",
        },
        {
          expenseType: "Healthcare",
          amount: 400,
          description: "Health insurance and medical expenses",
        },
        {
          expenseType: "Transportation",
          amount: 300,
          description: "Gas, maintenance, public transit",
        },
      ],

      // Additional Information - Enhanced Properties Owned
      propertiesOwned: {
        ownsProperty: true,
        properties: [
          {
            id: `property-${Date.now()}-1`,
            propertyAddress: {
              streetAddress: "123 Rental St",
              apt: "",
              city: "Investment City",
              state: "TX",
              zipCode: "77777",
            },
            propertyType: "Single Family",
            presentMarketValue: "350000",
            statusOfProperty: "retained",
            intendedOccupancy: "investment",
            monthlyCosts: "500",
            grossRentalIncome: "2200",
            netRentalIncome: "1800",
            hasLoan: true,
            monthlyPayment: "1400",
            unpaidBalance: "220000",
          },
          {
            id: `property-${Date.now()}-2`,
            propertyAddress: {
              streetAddress: "456 Condo Ave",
              apt: "Unit 2B",
              city: "Beach City",
              state: "FL",
              zipCode: "33101",
            },
            propertyType: "Condo",
            presentMarketValue: "180000",
            statusOfProperty: "retained",
            intendedOccupancy: "investment",
            monthlyCosts: "300",
            grossRentalIncome: "1200",
            netRentalIncome: "900",
            hasLoan: true,
            monthlyPayment: "800",
            unpaidBalance: "120000",
          },
        ],
        rent: "0",
        firstMortgage: "2200",
        otherFinancing: "0",
        hazardInsurance: "200",
        realEstateTaxes: "500",
        mortgageInsurance: "100",
        hoaDues: "150",
        otherHousingExpenses: "50",
      },

      militaryService: {
        hasServed: false,
        currentlyServing: false,
        isRetired: false,
        isNonActivated: false,
        isSurvivingSpouse: false,
        serviceBranch: "",
        serviceType: "",
        yearsOfService: 0,
        dischargeType: "",
        dischargeDate: "",
        expirationDate: "",
      },

      // Declarations & Demographics
      declarations: {
        outstandingJudgments: false,
        declaredBankruptcy: false,
        propertyForeclosed: false,
        partyToLawsuit: false,
        obligatedOnLoan: false,
        delinquentOnFederalDebt: false,
        alimonyChildSupport: false,
        downPaymentBorrowed: false,
        coMakerOnNote: false,
        typeOfProperty: "Primary Residence",
        titleHeld: "Solely",
      },
      demographics: {
        ethnicity: "Not Hispanic or Latino",
        race: "White",
        sex: "Male",
      },
    };

    console.log("FILL TEST DATA - Test data prepared:", testData);

    // Use functional update to ensure state change is detected
    setFormData(prevData => {
      // Create a completely new object to ensure reference change
      const newData = JSON.parse(JSON.stringify(testData));
      console.log("FILL TEST DATA - Setting new form data:", newData);
      return newData;
    });

    // Force update for review step and child components
    setForceUpdateKey((prev) => prev + 1);

    // Small delay to ensure state has updated before showing success
    setTimeout(() => {
      toast.success("Form filled with test data!");
    }, 100);
  };

  const nextStep = () => {
    // Debug: log the current form data structure to help identify issues
    console.log("Current form data:", formData);

    // If validation bypass is enabled or the step validates successfully
    if (window._tempValidateOverride || validateStep(currentStep)) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      // Immediately save the new step
      saveFormToStorage(formData, newStep, currentSubStep);
    } else {
      // More detailed error message for lender context
      toast.error(
        "Please complete all required fields for the borrower application"
      );
      console.log("Validation errors:", errors);
    }
  };

  const prevStep = () => {
    const newStep = currentStep - 1;
    setCurrentStep(newStep);
    // Immediately save the new step
    saveFormToStorage(formData, newStep, currentSubStep);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    setLoading(true);
    console.log("Lender loan creation submission started");

    try {
      // Validate all steps before submission
      const validationErrors = {};
      for (let i = 1; i <= 5; i++) {
        const stepErrors = validateStep(i);
        Object.assign(validationErrors, stepErrors);
      }

      if (Object.keys(validationErrors).length > 0) {
        console.log(
          "LENDER LOAN CREATION - Validation errors:",
          validationErrors
        );
        setErrors(validationErrors);
        toast.error(
          "Please fix all errors before submitting the borrower application"
        );
        setLoading(false);
        return;
      }

      // Enhanced submission data structure for lender context
      const submissionData = {
        // Basic form data
        ...formData,

        // Lender-specific fields
        submittedByLender: true,
        submissionSource: "manual",

        // Enhanced error context for lender submissions
        lenderSubmission: {
          createdAt: new Date().toISOString(),
          source: "lender_manual_creation",
          validationPassed: true,
        },
      };

      console.log("LENDER LOAN CREATION - Submitting data:", submissionData);

      // For lender manual creation, we need to create the borrower first
      // then submit the loan with the borrower ID
      const response = await LoanService.submitLoanForLender(submissionData);

      if (response.success) {
        // Clear saved form data since submission was successful
        clearFormFromStorage();
        
        toast.success("Borrower loan application created successfully!");

        // Redirect to loan details page if loan ID is available
        const loanId = response.data?._id || response.data?.id;
        if (loanId) {
          router.push(`/lender/loans/${loanId}`);
        } else {
          // Fallback to loans list
          router.push("/lender/loans");
        }
      } else {
        // Enhanced error handling for lender context
        const errorMessage =
          response.message || "Failed to create loan application";
        console.error("LENDER LOAN CREATION - Submission failed:", response);

        // Provide more specific error messages for lenders
        if (response.message?.includes("validation")) {
          toast.error(
            "Validation failed: Please check all required borrower information"
          );
        } else if (response.message?.includes("borrower with this email already exists")) {
          toast.error(
            "Email Already Exists: This email address is already registered with another lender. Please use a different email address for the borrower, or contact support if you believe this borrower should be transferred to your account.",
            { duration: 8000 } // Show longer for important message
          );
        } else if (response.message?.includes("duplicate")) {
          toast.error(
            "A loan application with this information already exists"
          );
        } else if (response.message?.includes("permission")) {
          toast.error("You do not have permission to create loan applications");
        } else {
          toast.error(`Failed to create loan application: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error(
        "LENDER LOAN CREATION - Error submitting loan application:",
        error
      );

      // Enhanced error handling with specific messages for lenders
      if (
        error.message?.includes("borrower with this email already exists") ||
        error.message?.includes("Failed to create borrower")
      ) {
        toast.error(
          "Email Already Exists: This email address is already registered with another lender. Please use a different email address for the borrower, or contact support if you believe this borrower should be transferred to your account.",
          { duration: 8000 } // Show longer for important message
        );
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        toast.error(
          "Network error: Please check your connection and try again"
        );
      } else if (error.message?.includes("timeout")) {
        toast.error("Request timeout: Please try again");
      } else if (error.message?.includes("unauthorized")) {
        toast.error("Session expired: Please log in again");
      } else {
        toast.error(
          "An unexpected error occurred while creating the loan application"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Render the appropriate step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BorrowerStep
            formData={formData}
            handleChange={handleChange}
            validateStep={validateStep}
            errors={errors}
            setErrors={setErrors}
            currentSubStep={currentSubStep}
            setCurrentSubStep={setCurrentSubStep}
            nextStep={nextStep}
            prevStep={prevStep}
            setCurrentStep={setCurrentStep}
            userType="lender"
          />
        );
      case 2:
        return (
          <PropertyStep
            formData={formData}
            handleChange={handleChange}
            errors={errors}
            setErrors={setErrors}
            nextStep={nextStep}
            prevStep={prevStep}
            loanTypes={loanTypes}
            userType="lender"
          />
        );
      case 3:
        return (
          <FinancialStep
            formData={formData}
            handleChange={handleChange}
            errors={errors}
            setErrors={setErrors}
            nextStep={nextStep}
            prevStep={prevStep}
            validateStep={validateStep}
            userType="lender"
          />
        );
      case 4:
        return (
          <AdditionalStep
            formData={formData}
            handleChange={handleChange}
            errors={errors}
            setErrors={setErrors}
            nextStep={nextStep}
            prevStep={prevStep}
            validateStep={validateStep}
            userType="lender"
          />
        );
      case 5:
        return (
          <DeclarationsStep
            formData={formData}
            handleChange={handleChange}
            errors={errors}
            setErrors={setErrors}
            nextStep={nextStep}
            prevStep={prevStep}
            validateStep={validateStep}
            userType="lender"
          />
        );
      case 6:
        return (
          <ReviewStep
            key={`review-${forceUpdateKey}-${Date.now()}`} // Force re-render with timestamp and update key
            formData={JSON.parse(JSON.stringify(formData))} // Pass a deep copy to ensure fresh data
            handleChange={handleChange}
            errors={errors}
            setErrors={setErrors}
            prevStep={prevStep}
            setCurrentStep={setCurrentStep}
            handleSubmit={handleSubmit}
            loading={loading}
            userType="lender"
          />
        );
      default:
        return (
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Unknown Step
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              There was an error with the application process.
            </p>
          </div>
        );
    }
  };

  // Define the steps for the application
  const applicationSteps = [
    { title: "Borrowers" },
    { title: "Property & Loan" },
    { title: "Assets & Debts" },
    { title: "Additional Info" },
    { title: "Declarations" },
    { title: "Review & Submit" },
  ];

  return (
    <ProtectedRoute roles={["lender"]}>
      <MainLayout title="Create Loan Application - Lender Portal">
        <div className="py-6">
          <div className="mx-auto sm:px-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Create Loan Application
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Create a new loan application manually for a borrower
                </p>
              </div>

              {/* Development Tools and Back Button */}
              <div className="flex items-center space-x-2">
                {process.env.NODE_ENV === "development" && (
                  <>
                    <button
                      type="button"
                      onClick={fillWithTestData}
                      className="px-3 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center"
                      title="Fill form with sample borrower data"
                    >
                      🔄 Fill Test Data
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Enable validation override and jump to review step
                        window._tempValidateOverride = true;

                        // Debug: Log current form data
                        console.log(
                          "JUMP TO REVIEW - Current form data:",
                          formData
                        );
                        console.log(
                          "JUMP TO REVIEW - Borrower name:",
                          formData.borrowers?.[0]?.firstName,
                          formData.borrowers?.[0]?.lastName
                        );
                        console.log(
                          "JUMP TO REVIEW - Loan amount:",
                          formData.loanInfo?.loanAmount
                        );

                        // Force update to ensure fresh data in review
                        setForceUpdateKey((prev) => prev + 1);

                        // Use setTimeout to ensure state updates
                        setTimeout(() => {
                          setCurrentStep(6); // Review step
                          toast.success(
                            "Jumped to review step (validation bypassed)"
                          );
                        }, 50);
                      }}
                      className="px-3 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                      title="Skip to final review step"
                    >
                      ⏭️ Jump to Review
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        console.log(
                          "LENDER FORM DEBUG - Current data:",
                          formData
                        );
                        console.log(
                          "LENDER FORM DEBUG - Current step:",
                          currentStep
                        );
                        console.log(
                          "LENDER FORM DEBUG - Current errors:",
                          errors
                        );
                        console.log("LENDER FORM DEBUG - Validation status:", {
                          step1: validateStep(1),
                          step2: validateStep(2),
                          step3: validateStep(3),
                          step4: validateStep(4),
                          step5: validateStep(5),
                        });

                        // Clear form after debugging
                        setCurrentStep(1);
                        setFormData({
                          borrowers: [
                            {
                              firstName: "",
                              middleName: "",
                              lastName: "",
                              suffix: "",
                              maritalStatus: "",
                              dateOfBirth: "",
                              ssn: "",
                              citizenship: "",
                              phone: "",
                              email: "",
                              dependents: [],
                              currentAddress: {},
                              mailingAddress: {
                                sameAsCurrentAddress: false,
                                aptSteNum: "",
                                city: "",
                                state: "",
                                zipCode: "",
                              },
                              previousAddresses: [],
                              employers: [
                                {
                                  companyName: "",
                                  companyPhone: "",
                                  employmentStatus: "",
                                  jobTitle: "",
                                  startDate: "",
                                  yearsInProfession: "",
                                  monthsInProfession: "",
                                  streetAddress: "",
                                  aptSteNum: "",
                                  city: "",
                                  state: "",
                                  zipCode: "",
                                },
                              ],
                            },
                          ],
                          propertyInfo: {
                            address: {
                              streetAddress: "",
                              aptSteNum: "",
                              city: "",
                              state: "",
                              zipCode: "",
                            },
                            propertyValue: "",
                            propertyType: "",
                            occupancyType: "",
                            hasAcceptedOffer: "",
                            contractPurchasePrice: "",
                            isMixedUse: "",
                            isManufactured: "",
                            numberOfUnits: "",
                            yearBuilt: "",
                            proposedRentalIncome: "",
                          },
                          loanInfo: {
                            loanType: "",
                            loanPurpose: "",
                            loanAmount: "",
                            loanTerm: "",
                            interestRate: "",
                            purchasePrice: "",
                            downPayment: "",
                            yearAcquired: "",
                            currentLoanBalance: "",
                            requestedLoanAmount: "",
                            refinanceType: "",
                            yearLotAcquired: "",
                            originalCost: "",
                            existingLoans: "",
                            presentValueOfLot: "",
                            costOfImprovements: "",
                            constructionType: "",
                          },
                          assets: {
                            checkingAndSavings: [],
                            stocksAndBonds: [],
                            giftsAndGrants: [],
                            miscellaneous: {
                              earnestMoney: 0,
                              lifeInsurance: 0,
                              vestedInterestInRetirement: 0,
                              otherAssets: 0,
                            },
                          },
                          income: {
                            baseIncome: "",
                            overtime: "",
                            commissions: "",
                            bonuses: "",
                            militaryEntitlements: "",
                            otherIncome: [],
                          },
                          debts: [],
                          expenses: [],
                          propertiesOwned: {
                            ownsProperty: true,
                            properties: [],
                            rent: "",
                            firstMortgage: "",
                            otherFinancing: "",
                            hazardInsurance: "",
                            realEstateTaxes: "",
                            mortgageInsurance: "",
                            hoaDues: "",
                            otherHousingExpenses: "",
                          },
                          militaryService: {
                            hasServed: false,
                            currentlyServing: false,
                            isRetired: false,
                            isNonActivated: false,
                            isSurvivingSpouse: false,
                            serviceBranch: "",
                            serviceType: "",
                            yearsOfService: 0,
                            dischargeType: "",
                            dischargeDate: "",
                            expirationDate: "",
                          },
                          declarations: {},
                          demographics: {},
                          documents: [],
                        });
                        setErrors({});
                        window._tempValidateOverride = false; // Reset validation override

                        toast.success("Form data logged to console");
                      }}
                      className="px-3 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
                      title="Log form data to console"
                    >
                      🐛 Debug Form
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(1);
                        setFormData({
                          borrowers: [
                            {
                              firstName: "",
                              middleName: "",
                              lastName: "",
                              suffix: "",
                              maritalStatus: "",
                              dateOfBirth: "",
                              ssn: "",
                              citizenship: "",
                              phone: "",
                              email: "",
                              dependents: [],
                              currentAddress: {},
                              mailingAddress: {
                                sameAsCurrentAddress: false,
                                aptSteNum: "",
                                city: "",
                                state: "",
                                zipCode: "",
                              },
                              previousAddresses: [],
                              employers: [
                                {
                                  companyName: "",
                                  companyPhone: "",
                                  employmentStatus: "",
                                  jobTitle: "",
                                  startDate: "",
                                  yearsInProfession: "",
                                  monthsInProfession: "",
                                  streetAddress: "",
                                  aptSteNum: "",
                                  city: "",
                                  state: "",
                                  zipCode: "",
                                },
                              ],
                            },
                          ],
                          propertyInfo: {
                            address: {
                              streetAddress: "",
                              aptSteNum: "",
                              city: "",
                              state: "",
                              zipCode: "",
                            },
                            propertyValue: "",
                            propertyType: "",
                            occupancyType: "",
                            hasAcceptedOffer: "",
                            contractPurchasePrice: "",
                            isMixedUse: "",
                            isManufactured: "",
                            numberOfUnits: "",
                            yearBuilt: "",
                            proposedRentalIncome: "",
                          },
                          loanInfo: {
                            loanType: "",
                            loanPurpose: "",
                            loanAmount: "",
                            loanTerm: "",
                            interestRate: "",
                            purchasePrice: "",
                            downPayment: "",
                            yearAcquired: "",
                            currentLoanBalance: "",
                            requestedLoanAmount: "",
                            refinanceType: "",
                            yearLotAcquired: "",
                            originalCost: "",
                            existingLoans: "",
                            presentValueOfLot: "",
                            costOfImprovements: "",
                            constructionType: "",
                          },
                          assets: {
                            checkingAndSavings: [],
                            stocksAndBonds: [],
                            giftsAndGrants: [],
                            miscellaneous: {
                              earnestMoney: 0,
                              lifeInsurance: 0,
                              vestedInterestInRetirement: 0,
                              otherAssets: 0,
                            },
                          },
                          income: {
                            baseIncome: "",
                            overtime: "",
                            commissions: "",
                            bonuses: "",
                            militaryEntitlements: "",
                            otherIncome: [],
                          },
                          debts: [],
                          expenses: [],
                          propertiesOwned: {
                            ownsProperty: true,
                            properties: [],
                            rent: "",
                            firstMortgage: "",
                            otherFinancing: "",
                            hazardInsurance: "",
                            realEstateTaxes: "",
                            mortgageInsurance: "",
                            hoaDues: "",
                            otherHousingExpenses: "",
                          },
                          militaryService: {
                            hasServed: false,
                            currentlyServing: false,
                            isRetired: false,
                            isNonActivated: false,
                            isSurvivingSpouse: false,
                            serviceBranch: "",
                            serviceType: "",
                            yearsOfService: 0,
                            dischargeType: "",
                            dischargeDate: "",
                            expirationDate: "",
                          },
                          declarations: {},
                          demographics: {},
                          documents: [],
                        });
                        setErrors({});
                        window._tempValidateOverride = false;
                        // Clear localStorage as well
                        clearFormFromStorage();
                        toast.success("Form cleared and reset to step 1");
                      }}
                      className="px-3 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center"
                      title="Clear form and reset to step 1"
                    >
                      🗑️ Clear Form
                    </button>
                  </>
                )}
                
                {/* Clear Form Button - Always Visible */}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all form data? This action cannot be undone.')) {
                      // Reset form to initial state
                      setCurrentStep(1);
                      setCurrentSubStep("personalDetails");
                      setFormData({
                        borrowers: [
                          {
                            firstName: "",
                            middleName: "",
                            lastName: "",
                            suffix: "",
                            maritalStatus: "",
                            dateOfBirth: "",
                            ssn: "",
                            citizenship: "",
                            phone: "",
                            email: "",
                            dependents: [],
                            currentAddress: {},
                            mailingAddress: {
                              sameAsCurrentAddress: false,
                              aptSteNum: "",
                              city: "",
                              state: "",
                              zipCode: "",
                            },
                            previousAddresses: [],
                            employers: [
                              {
                                companyName: "",
                                companyPhone: "",
                                employmentStatus: "",
                                jobTitle: "",
                                startDate: "",
                                yearsInProfession: "",
                                monthsInProfession: "",
                                streetAddress: "",
                                aptSteNum: "",
                                city: "",
                                state: "",
                                zipCode: "",
                              },
                            ],
                          },
                        ],
                        propertyInfo: {
                          address: {
                            streetAddress: "",
                            aptSteNum: "",
                            city: "",
                            state: "",
                            zipCode: "",
                          },
                          propertyValue: "",
                          propertyType: "",
                          occupancyType: "",
                          hasAcceptedOffer: "",
                          contractPurchasePrice: "",
                          isMixedUse: "",
                          isManufactured: "",
                          numberOfUnits: "",
                          yearBuilt: "",
                          proposedRentalIncome: "",
                        },
                        loanInfo: {
                          loanType: "",
                          loanPurpose: "",
                          loanAmount: "",
                          loanTerm: "",
                          interestRate: "",
                          purchasePrice: "",
                          downPayment: "",
                          yearAcquired: "",
                          currentLoanBalance: "",
                          requestedLoanAmount: "",
                          refinanceType: "",
                          yearLotAcquired: "",
                          originalCost: "",
                          existingLoans: "",
                          presentValueOfLot: "",
                          costOfImprovements: "",
                          constructionType: "",
                        },
                        assets: {
                          checkingAndSavings: [],
                          stocksAndBonds: [],
                          giftsAndGrants: [],
                          miscellaneous: {
                            earnestMoney: 0,
                            lifeInsurance: 0,
                            vestedInterestInRetirement: 0,
                            otherAssets: 0,
                          },
                        },
                        income: {
                          baseIncome: "",
                          overtime: "",
                          commissions: "",
                          bonuses: "",
                          militaryEntitlements: "",
                          otherIncome: [],
                        },
                        debts: [],
                        expenses: [],
                        propertiesOwned: {
                          ownsProperty: true,
                          properties: [],
                          rent: "",
                          firstMortgage: "",
                          otherFinancing: "",
                          hazardInsurance: "",
                          realEstateTaxes: "",
                          mortgageInsurance: "",
                          hoaDues: "",
                          otherHousingExpenses: "",
                        },
                        militaryService: {
                          hasServed: false,
                          currentlyServing: false,
                          isRetired: false,
                          isNonActivated: false,
                          isSurvivingSpouse: false,
                          serviceBranch: "",
                          serviceType: "",
                          yearsOfService: 0,
                          dischargeType: "",
                          dischargeDate: "",
                          expirationDate: "",
                        },
                        declarations: {},
                        demographics: {},
                        documents: [],
                      });
                      setErrors({});
                      // Clear localStorage
                      clearFormFromStorage();
                      toast.success("Form cleared successfully!");
                    }
                  }}
                  className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  title="Clear all form data"
                >
                  🗑️ Clear Form
                </button>
                
                <button
                  onClick={() => router.push("/lender/loans")}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ← Back to Loans
                </button>
              </div>
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
                    <strong>Auto-Save Enabled:</strong> Your form data is automatically saved as you type and will be restored if you refresh the page or return later. Data is kept for 24 hours.
                  </p>
                </div>
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
              <form
                onSubmit={
                  currentStep === 6 ? handleSubmit : (e) => e.preventDefault()
                }
              >
                {renderStep()}
              </form>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default LenderManualLoanCreation;
