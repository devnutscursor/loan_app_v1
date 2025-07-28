import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import theme from '../../../styles/theme';
import PersonalDetails from './PersonalDetails';
import ResidenceHistory from './ResidenceHistory';
import EmploymentHistory from './EmploymentHistory';
import RequiredFieldIndicator from '../../common/RequiredFieldIndicator';

/**
 * BorrowerStep Component
 * Manages the three sub-sections of the Borrower step with tab navigation
 *
 * @param {Object} props - Component props
 * @param {Object} props.formData - The entire form data object
 * @param {Function} props.handleChange - Function to handle form field changes
 * @param {Function} props.validateStep - Function to validate the form step
 * @param {Function} props.nextStep - Function to advance to the next step
 * @param {Function} props.prevStep - Function to go back to the previous step
 * @param {Object} props.errors - Form validation errors
 * @param {string} props.userType - Type of user viewing the form ('borrower' or 'lender')
 * @returns {JSX.Element} BorrowerStep component with tabs for navigation
 */
const BorrowerStep = ({
  formData,
  handleChange,
  validateStep,
  nextStep,
  prevStep,
  errors = {},
  userType = 'borrower',
  toast,
}) => {
  const [activeTab, setActiveTab] = useState("personalDetails");
  const borrower = formData.borrowers?.[0] || {}; // Safely access first borrower

  // Forward field changes directly to parent
  const handleFieldChange = (e) => {
    // For lender context, we need to prefix with borrowers[0]
    // For borrower context, the parent handles the prefix
    if (userType === 'lender') {
      const modifiedEvent = {
        target: {
          ...e.target,
          name: `borrowers[0].${e.target.name}`
        }
      };
      handleChange(modifiedEvent);
    } else {
      // For borrower context, pass the event as-is
    handleChange(e);
    }
  };

  // Tab styling
  const getTabClass = (tabName) => {
    return `px-4 py-2 font-medium text-sm rounded-md ${
      activeTab === tabName ? "text-white" : "text-gray-700 hover:bg-gray-100"
    }`;
  };

  // Tab check icon - simplified to prevent performance issues
  const getTabIcon = (tabName) => {
    // Simple validation without calling validateStep to prevent performance issues
    let isComplete = false;

    if (tabName === "personalDetails") {
      isComplete = 
        formData.borrowers?.[0]?.firstName && 
        formData.borrowers?.[0]?.lastName && 
        formData.borrowers?.[0]?.dateOfBirth && 
        formData.borrowers?.[0]?.ssn && 
        formData.borrowers?.[0]?.email && 
        formData.borrowers?.[0]?.phone && 
        formData.borrowers?.[0]?.maritalStatus && 
        formData.borrowers?.[0]?.citizenship;
    } else if (tabName === "residenceHistory") {
      isComplete =
        formData.borrowers?.[0]?.currentAddress?.streetAddress && 
        formData.borrowers?.[0]?.currentAddress?.city && 
        formData.borrowers?.[0]?.currentAddress?.state && 
        formData.borrowers?.[0]?.currentAddress?.zipCode && 
        formData.borrowers?.[0]?.currentAddress?.housingStatus && 
        formData.borrowers?.[0]?.currentAddress?.yearsAtAddress && 
        formData.borrowers?.[0]?.currentAddress?.monthsAtAddress;
    } else if (tabName === "employmentHistory") {
      isComplete =
        formData.borrowers?.[0]?.employers?.[0]?.companyName && 
        formData.borrowers?.[0]?.employers?.[0]?.jobTitle && 
        formData.borrowers?.[0]?.employers?.[0]?.employmentStatus && 
        formData.borrowers?.[0]?.employers?.[0]?.startDate && 
        formData.borrowers?.[0]?.employers?.[0]?.yearsInProfession && 
        formData.borrowers?.[0]?.employers?.[0]?.monthsInProfession && 
        formData.borrowers?.[0]?.employers?.[0]?.streetAddress && 
        formData.borrowers?.[0]?.employers?.[0]?.city && 
        formData.borrowers?.[0]?.employers?.[0]?.state && 
        formData.borrowers?.[0]?.employers?.[0]?.zipCode;
    }

    if (isComplete) {
      // Use white color for check icon if tab is active, otherwise primary color
      if (activeTab === tabName) {
        // Keep white for active tab
        return (
          <svg
            className="h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      } else {
        // Use primary color for completed but inactive tabs
        return (
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            {/* Define the gradient */}
            <defs>
              <linearGradient
                id="checkIconGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor={theme.colors.blue600} />
                <stop offset="100%" stopColor={theme.colors.blue800} />
              </linearGradient>
            </defs>

            {/* Use the gradient in the path */}
            <path
              fillRule="evenodd"
              fill="url(#checkIconGradient)"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      }
    }

    return null;
  };

  // We don't need these complex handlers anymore since our child components
  // handle their own state and call the parent onChange with the correct format
  // These functions are left as placeholders in case they're needed later
  const handleDependentChange = (index, field, value) => {
    if (userType === 'lender') {
      handleChange({
        target: {
          name: `borrowers[0].dependents.${index}.${field}`,
          value,
        },
      });
    } else {
    handleChange({
      target: {
        name: `dependents.${index}.${field}`,
        value,
      },
    });
    }
  };

  const handleEmployerChange = (index, field, value) => {
    if (userType === 'lender') {
      handleChange({
        target: {
          name: `borrowers[0].employers.${index}.${field}`,
          value,
        },
      });
    } else {
    handleChange({
      target: {
        name: `employers.${index}.${field}`,
        value,
      },
    });
    }
  };

  const addDependent = () => {
    // Get current dependents safely
    const dependents = formData.borrowers?.[0]?.dependents || [];
    const newDependents = [
      ...dependents,
      { name: "", age: "", relationship: "" },
    ];

    // Properly prefix nested name based on user type
    if (userType === 'lender') {
      handleChange({
        target: {
          name: "borrowers[0].dependents",
          value: newDependents,
        },
      });
    } else {
      handleChange({
      target: {
        name: "dependents",
        value: newDependents,
      },
    });
    }
  };

  const removeDependent = (index) => {
    // Get current dependents safely
    const dependents = [...(formData.borrowers?.[0]?.dependents || [])];
    dependents.splice(index, 1);

    // Properly prefix nested name based on user type
    if (userType === 'lender') {
      handleChange({
        target: {
          name: "borrowers[0].dependents",
          value: dependents,
        },
      });
    } else {
      handleChange({
      target: {
        name: "dependents",
        value: dependents,
      },
    });
    }
  };

  const addEmployer = () => {
    // Get current employers safely
    const employers = formData.borrowers?.[0]?.employers || [];

    const newEmployers = [
      ...employers,
      {
        companyName: "",
        companyPhone: "",
        employmentStatus: "",
        jobTitle: "",
        startDate: "",
        yearsInProfession: "",
        monthsInProfession: "",
        address: {
          streetAddress: "",
          aptSteNum: "",
          city: "",
          state: "",
          zipCode: "",
        },
      },
    ];

    if (userType === 'lender') {
      handleChange({
        target: {
          name: "borrowers[0].employers",
          value: newEmployers,
        },
      });
    } else {
    handleChange({
      target: {
        name: "employers",
        value: newEmployers,
      },
    });
    }
  };

  const removeEmployer = (index) => {
    // Get current employers safely
    const employers = [...(formData.borrowers?.[0]?.employers || [])];
    employers.splice(index, 1);

    if (userType === 'lender') {
      handleChange({
        target: {
          name: "borrowers[0].employers",
          value: employers,
        },
      });
    } else {
    handleChange({
      target: {
        name: "employers",
        value: employers,
      },
    });
    }
  };

  // Render the active tab content - keep all components mounted but only show the active one
  const renderTabContent = () => {
    return (
      <div>
        <div style={{ display: activeTab === "personalDetails" ? "block" : "none" }}>
          <PersonalDetails
            borrower={borrower}
            onChange={handleFieldChange}
            addDependent={addDependent}
            removeDependent={removeDependent}
            handleDependentChange={handleDependentChange}
            errors={errors}
            userType={userType}
          />
        </div>
        <div style={{ display: activeTab === "residenceHistory" ? "block" : "none" }}>
          <ResidenceHistory
            borrower={borrower}
            onChange={handleFieldChange}
            errors={errors}
            userType={userType}
          />
        </div>
        <div style={{ display: activeTab === "employmentHistory" ? "block" : "none" }}>
          <EmploymentHistory
            borrower={borrower}
            onChange={handleFieldChange}
            addEmployer={addEmployer}
            removeEmployer={removeEmployer}
            handleEmployerChange={handleEmployerChange}
            errors={errors}
            userType={userType}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          className={getTabClass("personalDetails")}
          style={
            activeTab === "personalDetails"
              ? { background: theme.gradients.primary }
              : {}
          }
          onClick={() => setActiveTab("personalDetails")}
        >
          <div className="flex items-center">
            <span>Personal Details</span>
            {getTabIcon("personalDetails") && (
              <span className="ml-2">{getTabIcon("personalDetails")}</span>
            )}
          </div>
        </button>

        <button
          type="button"
          className={getTabClass("residenceHistory")}
          style={
            activeTab === "residenceHistory"
              ? { background: theme.gradients.primary }
              : {}
          }
          onClick={() => setActiveTab("residenceHistory")}
        >
          <div className="flex items-center">
            <span>Residence History</span>
            {getTabIcon("residenceHistory") && (
              <span className="ml-2">{getTabIcon("residenceHistory")}</span>
            )}
          </div>
        </button>

        <button
          type="button"
          className={getTabClass("employmentHistory")}
          style={
            activeTab === "employmentHistory"
              ? { background: theme.gradients.primary }
              : {}
          }
          onClick={() => setActiveTab("employmentHistory")}
        >
          <div className="flex items-center">
            <span>Employment History</span>
            {getTabIcon("employmentHistory") && (
              <span className="ml-2">{getTabIcon("employmentHistory")}</span>
            )}
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div>{renderTabContent()}</div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        {activeTab !== "personalDetails" && (
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ "--focus-ring-color": theme.colors.primary }}
            onClick={() => {
              if (activeTab === "residenceHistory") {
                setActiveTab("personalDetails");
              } else if (activeTab === "employmentHistory") {
                setActiveTab("residenceHistory");
              }
            }}
          >
            Previous Section
          </button>
        )}

        {activeTab !== "employmentHistory" ? (
          <button
            type="button"
            className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              background: theme.gradients.primary,
              "--focus-ring-color": theme.colors.primary,
            }}
            onClick={() => {
              if (activeTab === "personalDetails") {
                setActiveTab("residenceHistory");
              } else if (activeTab === "residenceHistory") {
                setActiveTab("employmentHistory");
              }
            }}
          >
            Next Section
          </button>
        ) : (
          <button
            type="button"
            className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              background: theme.gradients.primary,
              "--focus-ring-color": theme.colors.primary,
            }}
            onClick={() => {
              // Validate the current step before proceeding
              const validationErrors = validateStep(1, activeTab);
              
              if (Object.keys(validationErrors).length === 0) {
                nextStep();
              } else {
                // Get specific error messages for missing fields
                const errorMessages = Object.values(validationErrors);
                
                if (errorMessages.length > 0) {
                  // Show the first few error messages
                  const displayMessages = errorMessages.slice(0, 3);
                  const message = displayMessages.length === 1 
                    ? displayMessages[0]
                    : `Please complete the following required fields: ${displayMessages.join(', ')}${errorMessages.length > 3 ? ` and ${errorMessages.length - 3} more` : ''}`;
                  
                  // Use toast instead of alert
                  if (toast) {
                    toast.error(message);
                  } else {
                    // Fallback to alert if toast is not available
                    alert(message);
                  }
                }
              }
            }}
          >
            Next Step
          </button>
        )}
      </div>
    </div>
  );
};

BorrowerStep.propTypes = {
  formData: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  validateStep: PropTypes.func.isRequired,
  nextStep: PropTypes.func.isRequired,
  prevStep: PropTypes.func.isRequired,
  errors: PropTypes.object,
  userType: PropTypes.oneOf(['borrower', 'lender']),
  toast: PropTypes.object, // Added toast prop type
};

export default BorrowerStep;
