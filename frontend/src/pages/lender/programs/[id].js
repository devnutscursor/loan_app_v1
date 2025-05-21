import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Save } from "lucide-react";
import LenderLayout from "@/components/layout/LenderLayout";
import LoanProgramForm from "@/components/lender/programs/LoanProgramForm";
import Head from "next/head";
import Link from "next/link";
import { LoanProgramService } from "@/services";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

import MainLayout from "@/components/layout/MainLayout";
// Import component sections
import BasicProgramSection from "../../../components/lender/programs/BasicProgramSection";
import LoanRestrictionsSection from "../../../components/lender/programs/LoanRestrictionsSection";
import MortgageInsuranceSection from "../../../components/lender/programs/MortgageInsuranceSection";
import FinanceFeesSection from "../../../components/lender/programs/FinanceFeesSection";
import AdditionalSettingsSection from "../../../components/lender/programs/AdditionalSettingsSection";

export default function EditLoanProgram() {
  const router = useRouter();
  const { id } = router.query;
  const isNewProgram = id === "create";

  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(!isNewProgram);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    programName: "",
    displayName: "",
    programType: "conventional",
    isAvailableToBorrower: true,
    isDefaultForIntegrations: false,
    loanHelpText: "",
    preApprovalLetterTemplate: "standard",
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
    fundingFee: 0,
    // Updated fee structure with toggle support
    originationFees: {
      amount: 0,
      percentage: 0,
      isPercent: false,
      frequency: "once",
    },
    closingCosts: {
      amount: 0,
      percentage: 0,
      isPercent: false,
      frequency: "once",
    },
    otherFees: {
      amount: 0,
      percentage: 0,
      isPercent: false,
      frequency: "once",
    },
    isAdjustableRateMortgage: false,
    allowSubjectPropertyAddress: true,
    allowPreApprovalLetter: true,
    lockLoanData: false,
  });

  // Load program data if editing
  useEffect(() => {
    if (program && program._id) {
      console.log("Loading program data into form:", program);

      // Convert the old fee format to the new toggle-based structure
      const convertFeeFormat = (oldFee) => {
        if (!oldFee)
          return {
            amount: 0,
            percentage: 0,
            isPercent: false,
            frequency: "once",
          };

        // Determine if the fee is percentage-based
        const isPercent =
          oldFee.type === "percentage" || oldFee.type === "points";

        return {
          amount: !isPercent ? oldFee.value || 0 : 0,
          percentage: isPercent ? oldFee.value || 0 : 0,
          isPercent,
          frequency: oldFee.frequency || "once",
        };
      };

      // Create a new object with default values and program values
      const updatedFormData = {
        // Start with default values
        programName: program.programName || "",
        displayName: program.displayName || "",
        programType: program.programType || "conventional",
        isAvailableToBorrower:
          program.isAvailableToBorrower !== undefined
            ? program.isAvailableToBorrower
            : true,
        isDefaultForIntegrations:
          program.isDefaultForIntegrations !== undefined
            ? program.isDefaultForIntegrations
            : false,
        loanHelpText: program.loanHelpText || "",
        preApprovalLetterTemplate:
          program.preApprovalLetterTemplate || "standard",
        rateAdjustment:
          program.rateAdjustment !== undefined ? program.rateAdjustment : 0,
        loanTerm: program.loanTerm || 30,

        // Make sure all nested objects exist and use program values if available
        restrictions: {
          dtiRestriction: {
            max:
              program.restrictions?.dtiRestriction?.max !== undefined
                ? program.restrictions.dtiRestriction.max
                : 43,
          },
          downPaymentRestriction: {
            min:
              program.restrictions?.downPaymentRestriction?.min !== undefined
                ? program.restrictions.downPaymentRestriction.min
                : 3,
            max:
              program.restrictions?.downPaymentRestriction?.max !== undefined
                ? program.restrictions.downPaymentRestriction.max
                : null,
          },
          loanAmountRestriction: {
            min:
              program.restrictions?.loanAmountRestriction?.min !== undefined
                ? program.restrictions.loanAmountRestriction.min
                : null,
            max:
              program.restrictions?.loanAmountRestriction?.max !== undefined
                ? program.restrictions.loanAmountRestriction.max
                : null,
          },
        },

        // Use program values for mortgage insurance or defaults
        privateMortgageInsurance:
          program.privateMortgageInsurance || formData.privateMortgageInsurance,
        upfrontMortgageInsurance:
          program.upfrontMortgageInsurance !== undefined
            ? program.upfrontMortgageInsurance
            : 0,
        mortgageInsurance:
          program.mortgageInsurance !== undefined
            ? program.mortgageInsurance
            : 0,
        fmi: program.fmi !== undefined ? program.fmi : 0,
        fundingFee: program.fundingFee !== undefined ? program.fundingFee : 0,

        // Convert fee structures to new format
        originationFees: convertFeeFormat(program.originationFees),
        closingCosts: convertFeeFormat(program.closingCosts),
        otherFees: convertFeeFormat(program.otherFees),

        // Additional settings
        isAdjustableRateMortgage:
          program.isAdjustableRateMortgage !== undefined
            ? program.isAdjustableRateMortgage
            : false,
        allowSubjectPropertyAddress:
          program.allowSubjectPropertyAddress !== undefined
            ? program.allowSubjectPropertyAddress
            : true,
        allowPreApprovalLetter:
          program.allowPreApprovalLetter !== undefined
            ? program.allowPreApprovalLetter
            : true,
        lockLoanData:
          program.lockLoanData !== undefined ? program.lockLoanData : false,
      };

      console.log("Updated form data:", updatedFormData);
      setFormData(updatedFormData);
    }
  }, [program]);

  // Main handler for simple field changes
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle nested object changes for component sections
  const handleNestedChange = (section, updatedData) => {
    // If this is a fee section that's receiving a complete fee object
    if (["originationFees", "closingCosts", "otherFees"].includes(section)) {
      // Update the entire fee object
      setFormData((prev) => ({
        ...prev,
        [section]: updatedData,
      }));
    } else {
      // For other sections, update as before
      setFormData((prev) => ({
        ...prev,
        [section]: updatedData,
      }));
    }
  };

  // Convert the form data to the format expected by the backend before submission
  const prepareFormDataForSubmission = () => {
    // Create a deep copy of the form data
    const submissionData = { ...formData };

    // Process fee data to match backend expectations
    ["originationFees", "closingCosts", "otherFees"].forEach((feeType) => {
      const fee = submissionData[feeType];

      // Use the appropriate value based on the toggle state
      const value = fee.isPercent ? fee.percentage : fee.amount;

      // Convert to the structure expected by the backend model
      // The backend only expects { type, value } without frequency
      submissionData[feeType] = {
        type: value === 0 ? "none" : fee.isPercent ? "percentage" : "flat",
        value,
      };

      // Add frequency as an extension to the model for API transmission
      // The API can extract this data and store it appropriately
      if (fee.frequency && fee.frequency !== "once") {
        submissionData[feeType].frequency = fee.frequency;
      }
    });

    return submissionData;
  };

  useEffect(() => {
    console.log("Program data:", program);
  }, [program]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.programName || formData.programName.trim() === "") {
      setError("Program Name is required");
      return;
    }

    if (!formData.displayName || formData.displayName.trim() === "") {
      setError("Display Name is required");
      return;
    }

    if (!formData.programType || formData.programType.trim() === "") {
      setError("Program Type is required");
      return;
    }

    // Clear any previous errors
    setError("");

    // Prepare data for submission with the correct fee format
    const submissionData = prepareFormDataForSubmission();

    // Log the data being sent for debugging
    console.log("Submitting form data:", submissionData);

    // Submit the form data
    handleSaveProgram(submissionData);
  };

  // Fetch program data on component mount if editing
  useEffect(() => {
    if (!isNewProgram && id) {
      fetchProgramData();
    }
  }, [id, isNewProgram]);

  const fetchProgramData = async () => {
    try {
      setLoading(true);
      console.log("Fetching program data for ID:", id);
      const response = await LoanProgramService.getProgram(id);
      console.log("Program data response:", response);

      // Handle different response structures
      if (response) {
        // If response.data has status and data properties (nested API response)
        if (
          response.data &&
          response.data.status === "success" &&
          response.data.data
        ) {
          console.log("Setting program from nested data:", response.data.data);
          setProgram(response.data.data);
        }
        // If response.data is directly the program object (it has an _id)
        else if (response.data && response.data._id) {
          console.log("Setting program from direct data:", response.data);
          setProgram(response.data);
        }
        // If response itself has status and data properties
        else if (response.status === "success" && response.data) {
          console.log(
            "Setting program from direct API response:",
            response.data
          );
          setProgram(response.data);
        } else {
          console.error("Unexpected program data structure:", response);
          setError("Failed to load loan program: Unexpected data structure");
        }
      } else {
        console.error("Empty response received");
        setError("Failed to load loan program: Empty response");
      }
    } catch (err) {
      console.error("Error fetching program data:", err);
      setError(err.message || "Failed to load loan program");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgram = async (formData) => {
    try {
      setSaving(true);
      setError(null);

      console.log("Saving loan program with data:", formData);
      let response;

      if (isNewProgram) {
        response = await LoanProgramService.createProgram(formData);
      } else {
        response = await LoanProgramService.updateProgram(id, formData);
      }

      console.log("Save response:", response);

      // Handle different response structures
      if (response) {
        if (response.data) {
          // If response.data has status property (nested structure)
          if (response.data.status === "success") {
            console.log("Program saved successfully (nested):", response.data);
            setSuccess(true);
            // For new programs, redirect to the edit page after creation
            if (isNewProgram && response.data.data && response.data.data._id) {
              router.push(`/lender/programs/${response.data.data._id}`);
            }
          }
          // If response.data is the saved program object (it has an _id)
          else if (response.data._id) {
            console.log("Program saved successfully (direct):", response.data);
            setSuccess(true);
            // For new programs, redirect to the edit page after creation
            if (isNewProgram) {
              router.push(`/lender/programs/${response.data._id}`);
            }
          }
          // If response.data has some other structure
          else {
            console.error(
              "Unexpected data structure in response:",
              response.data
            );
            setError(
              "Failed to save loan program: Unexpected response structure"
            );
          }
        }
        // If response has status directly
        else if (response.status === "success") {
          console.log(
            "Program saved successfully (direct API response):",
            response
          );
          setSuccess(true);
          // For new programs, redirect to the edit page after creation
          if (isNewProgram && response.data && response.data._id) {
            router.push(`/lender/programs/${response.data._id}`);
          }
        }
        // If response is a 204 No Content or similar success status
        else if (response.status === 204 || response.status === 200) {
          console.log(
            "Program saved successfully (status code):",
            response.status
          );
          setSuccess(true);
        } else {
          console.error("Unrecognized response structure:", response);
          setError("Failed to save loan program: Unrecognized response");
        }
      } else {
        console.error("Empty response received");
        setError("Failed to save loan program: Empty response");
      }
    } catch (err) {
      console.error("Error saving program:", err);
      setError(err.message || "Failed to save loan program");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  const pageTitle = isNewProgram ? "Create Loan Program" : "Edit Loan Program";

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["lender"]}>
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-3 min-h-[2.5rem]">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
            <span className="block w-px h-5 bg-gray-200"></span>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Form sections skeletons */}
        <div className="space-y-6 mt-8">
          {/* Basic Program Section Skeleton */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Loan Restrictions Section Skeleton */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse mb-6"></div>
            <div className="space-y-4">
              <div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="flex space-x-4">
                  <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                  <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                </div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="flex space-x-4">
                  <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                  <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Mortgage Insurance Section Skeleton */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse mb-6"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Finance Fees Section Skeleton */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse mb-6"></div>
            <div className="space-y-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="border-b pb-4 border-gray-200">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                  <div className="flex space-x-3">
                    <div className="h-10 w-24 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["lender"]}>
      <MainLayout>
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3 min-h-[2.5rem]">
            {/* Left content area with back button and title */}
            <div className="flex items-center space-x-3">
              <Link
                href="/lender/programs"
                className="group flex items-center px-2.5 py-1.5 rounded hover:bg-gray-100 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400 group-hover:text-primary transition"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 group-hover:text-primary transition">
                  Go Back
                </span>
              </Link>

              <span className="block w-px h-5 bg-gray-200"></span>

              <div className="flex flex-col justify-center">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
                  {isNewProgram
                    ? "Create New Loan Program"
                    : "Edit Loan Program"}
                </h1>
              </div>
            </div>
            <button
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200`}
              onClick={handleSubmit}
              disabled={saving || loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Program"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            {/* Basic Program Information */}
            <BasicProgramSection
              formData={formData}
              onChange={handleFieldChange}
              isLoading={saving}
            />

            {/* Loan Restrictions Section */}
            <LoanRestrictionsSection
              formData={formData}
              onChange={handleNestedChange}
              isLoading={saving}
            />

            {/* Mortgage Insurance Section */}
            <MortgageInsuranceSection
              formData={formData}
              onChange={handleFieldChange}
              isLoading={saving}
            />

            {/* Finance Fees Section - with the new toggle UI */}
            <FinanceFeesSection
              formData={formData}
              onChange={handleNestedChange}
              isLoading={saving}
            />
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Success notification */}
        {success && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="rounded-md bg-green-50 p-4 border border-green-200 shadow-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Loan program saved successfully
                  </p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      onClick={handleCloseSnackbar}
                      className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    </ProtectedRoute>
  );
}
