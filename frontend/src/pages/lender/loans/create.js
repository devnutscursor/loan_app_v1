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

    fetchLoanTypes();
  }, []);

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
      return true;
    }

    const newErrors = {};

    // Validate based on current step
    switch (step) {
      case 1: // Borrower step
        const primaryBorrower = formData.borrowers[0];

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

        // Address validation
        if (!primaryBorrower.currentAddress.streetAddress)
          newErrors["borrowers[0].currentAddress.streetAddress"] =
            "Street address is required";
        if (!primaryBorrower.currentAddress.city)
          newErrors["borrowers[0].currentAddress.city"] = "City is required";
        if (!primaryBorrower.currentAddress.state)
          newErrors["borrowers[0].currentAddress.state"] = "State is required";
        if (!primaryBorrower.currentAddress.zipCode)
          newErrors["borrowers[0].currentAddress.zipCode"] =
            "ZIP code is required";

        // Employment validation
        if (primaryBorrower.employers.length > 0) {
          if (!primaryBorrower.employers[0].companyName)
            newErrors["borrowers[0].employers[0].companyName"] =
              "Company name is required";
          if (!primaryBorrower.employers[0].jobTitle)
            newErrors["borrowers[0].employers[0].jobTitle"] =
              "Job title is required";
        }
        break;

      case 2: // Property & Loan details step
        // Property validation - check both nested and direct property fields
        const addressData = formData.propertyInfo.address || {};
        const directData = formData.propertyInfo || {};

        // Check for street address in either location
        if (!addressData.streetAddress && !directData.streetAddress) {
          // Lender-specific message for property validation
          newErrors["propertyInfo.address.streetAddress"] =
            "Property address is required for loan processing";
        }
        break;

      case 3: // Financial step
        // Make sure tabName is defined or fallback to validating all
        if (tabName) {
          if (tabName === "assets") {
            // Asset validation - only check if we have at least one asset
            if (
              !formData.assets ||
              (Array.isArray(formData.assets) && formData.assets.length === 0)
            ) {
              newErrors["assets"] =
                "Please add at least one asset for loan qualification";
            }
          } else if (tabName === "income") {
            // Income validation - only check when leaving the income tab
            if (!formData.income || !formData.income.baseIncome) {
              newErrors["income.baseIncome"] =
                "Base income is required for loan qualification";
            }
          } else if (tabName === "debts") {
            // No specific requirements for debts at the moment
          }
        } else {
          // If no tab specified, validate the whole step
          // Check assets
          if (
            !formData.assets ||
            (Array.isArray(formData.assets) && formData.assets.length === 0)
          ) {
            newErrors["assets"] =
              "Please add at least one asset for loan qualification";
          }

          // Check income
          if (!formData.income || !formData.income.baseIncome) {
            newErrors["income.baseIncome"] =
              "Base income is required for loan qualification";
          }
        }
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
        if (tabName) {
          if (tabName === "declarations") {
            // Declarations validation - make sure they've answered the required questions
            if (formData.declarations?.occupyAsPrimary === undefined) {
              newErrors["declarations.occupyAsPrimary"] =
                "Please indicate if borrower will occupy the property as primary residence";
            }
            if (formData.declarations?.firstTimeBuyer === undefined) {
              newErrors["declarations.firstTimeBuyer"] =
                "Please indicate if borrower is a first time homebuyer";
            }
          } else if (tabName === "demographics") {
            // Demographics validation - verify required fields
            if (!formData.demographics?.ethnicity) {
              newErrors["demographics.ethnicity"] =
                "Please select borrower ethnicity";
            }
            if (!formData.demographics?.gender) {
              newErrors["demographics.gender"] =
                "Please select borrower gender";
            }
            if (!formData.demographics?.race) {
              newErrors["demographics.race"] = "Please select borrower race";
            }
          }
        } else {
          // If no tab specified, validate the whole step
          // Check declarations
          if (formData.declarations?.occupyAsPrimary === undefined) {
            newErrors["declarations.occupyAsPrimary"] =
              "Please indicate if borrower will occupy the property as primary residence";
          }
          if (formData.declarations?.firstTimeBuyer === undefined) {
            newErrors["declarations.firstTimeBuyer"] =
              "Please indicate if borrower is a first time homebuyer";
          }

          // Check demographics
          if (!formData.demographics?.ethnicity) {
            newErrors["demographics.ethnicity"] =
              "Please select borrower ethnicity";
          }
          if (!formData.demographics?.gender) {
            newErrors["demographics.gender"] = "Please select borrower gender";
          }
          if (!formData.demographics?.race) {
            newErrors["demographics.race"] = "Please select borrower race";
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

  // Fill form with test data (for development/testing only)
  const fillWithTestData = () => {
    console.log("FILL TEST DATA - Starting to fill form with test data");

    const testData = {
      // Purpose field is required for auto-save
      purpose: "Purchase",
      completionPercentage: 100,
      primaryBorrowerId: "67fa2aa7f5010213147f8529", // Default borrower ID

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
              companyName: "ACME Inc",
              companyPhone: "(987) 654-3210",
              employmentStatus: "Full-Time",
              jobTitle: "Software Engineer",
              startDate: "2015-01-01",
              yearsInProfession: 8,
              monthsInProfession: 2,
              streetAddress: "456 Corporate Blvd",
              aptSteNum: "Suite 300",
              city: "Business City",
              state: "CA",
              zipCode: "90210",
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

      // Financial Information
      assets: {
        checkingAndSavings: [
          {
            accountType: "Checking",
            financialInstitution: "Big Bank",
            accountNumber: "XXXX1234",
            balance: 25000,
          },
          {
            accountType: "Savings",
            financialInstitution: "Credit Union",
            accountNumber: "XXXX5678",
            balance: 50000,
          },
        ],
        stocksAndBonds: [
          {
            description: "Investment Portfolio",
            value: 75000,
          },
        ],
        giftsAndGrants: [],
        miscellaneous: {
          earnestMoney: 5000,
          lifeInsurance: 25000,
          vestedInterestInRetirement: 150000,
          otherAssets: 10000,
        },
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
            sourceType: "Rental Income",
            amount: 1800,
            description: "Rental property at 123 Rental St",
          },
          {
            sourceType: "Investment Income",
            amount: 500,
            description: "Dividend payments",
          },
        ],
      },

      // Debts
      debts: [
        {
          debtType: "Credit Card",
          creditorName: "Chase Bank",
          monthlyPayment: 250,
          unpaidBalance: 5000,
        },
        {
          debtType: "Auto Loan",
          creditorName: "Ford Credit",
          monthlyPayment: 450,
          unpaidBalance: 18000,
        },
      ],

      // Expenses
      expenses: [
        {
          expenseType: "Utilities",
          amount: 300,
          description: "Monthly utilities",
        },
        {
          expenseType: "Insurance",
          amount: 200,
          description: "Auto and home insurance",
        },
      ],

      // Additional Information
      propertiesOwned: {
        ownsProperty: true,
        properties: [
          {
            id: `property-${Date.now()}`,
            propertyAddress: {
              streetAddress: "123 Rental St",
              apt: "",
              city: "Investment City",
              state: "TX",
              zipCode: "77777",
            },
            propertyType: "Single Family",
            presentMarketValue: "300000",
            statusOfProperty: "retained",
            intendedOccupancy: "investment",
            monthlyCosts: "450",
            grossRentalIncome: "1800",
            netRentalIncome: "1500",
            hasLoan: true,
            monthlyPayment: "1200",
            unpaidBalance: "200000",
          },
        ],
        rent: "0",
        firstMortgage: "1500",
        otherFinancing: "0",
        hazardInsurance: "120",
        realEstateTaxes: "350",
        mortgageInsurance: "75",
        hoaDues: "0",
        otherHousingExpenses: "0",
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
      setCurrentStep(currentStep + 1);
    } else {
      // More detailed error message for lender context
      toast.error(
        "Please complete all required fields for the borrower application"
      );
      console.log("Validation errors:", errors);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
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
                        toast.success("Form cleared and reset to step 1");
                      }}
                      className="px-3 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center"
                      title="Clear form and reset to step 1"
                    >
                      🗑️ Clear Form
                    </button>
                  </>
                )}
                <button
                  onClick={() => router.push("/lender/loans")}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ← Back to Loans
                </button>
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
