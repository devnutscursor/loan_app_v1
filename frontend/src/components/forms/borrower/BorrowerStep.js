import React, { useState } from "react";
import PersonalDetails from "./PersonalDetails";
import ResidenceHistory from "./ResidenceHistory";
import EmploymentHistory from "./EmploymentHistory";
import theme from "../../../styles/theme";

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
 * @returns {JSX.Element} BorrowerStep component with tabs for navigation
 */
const BorrowerStep = ({
  formData,
  handleChange,
  validateStep,
  nextStep,
  prevStep,
  errors = {},
}) => {
  const [activeTab, setActiveTab] = useState("personalDetails");
  const borrower = formData.borrowers[0]; // Using first borrower for now

  // Forward field changes directly to parent
  const handleFieldChange = (e) => {
    handleChange(e);
  };

  // Tab styling
  const getTabClass = (tabName) => {
    return `px-4 py-2 font-medium text-sm rounded-md ${
      activeTab === tabName ? "text-white" : "text-gray-700 hover:bg-gray-100"
    }`;
  };

  // Tab check icon
  const getTabIcon = (tabName) => {
    // Determine if tab is complete based on required fields
    let isComplete = false;

    if (tabName === "personalDetails") {
      isComplete = borrower.firstName && borrower.lastName;
    } else if (tabName === "residenceHistory") {
      isComplete =
        borrower.currentAddress &&
        borrower.currentAddress.streetAddress &&
        borrower.currentAddress.city &&
        borrower.currentAddress.state &&
        borrower.currentAddress.zipCode;
    } else if (tabName === "employmentHistory") {
      isComplete =
        borrower.employers &&
        borrower.employers.length > 0 &&
        borrower.employers[0].companyName &&
        borrower.employers[0].jobTitle;
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
    handleChange({
      target: {
        name: `dependents.${index}.${field}`,
        value,
      },
    });
  };

  const handleEmployerChange = (index, field, value) => {
    handleChange({
      target: {
        name: `employers.${index}.${field}`,
        value,
      },
    });
  };

  const addDependent = () => {
    // Get current dependents
    const dependents = formData.borrowers[0].dependents || [];
    const newDependents = [
      ...dependents,
      { name: "", age: "", relationship: "" },
    ];

    // Properly prefix nested name
    handleFieldChange({
      target: {
        name: "dependents",
        value: newDependents,
      },
    });
  };

  const removeDependent = (index) => {
    // Get current dependents
    const dependents = [...(formData.borrowers[0].dependents || [])];
    dependents.splice(index, 1);

    // Properly prefix nested name
    handleFieldChange({
      target: {
        name: "dependents",
        value: dependents,
      },
    });
  };

  const addEmployer = () => {
    // Get current employers
    const employers = formData.borrowers[0].employers || [];

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

    handleChange({
      target: {
        name: "employers",
        value: newEmployers,
      },
    });
  };

  const removeEmployer = (index) => {
    // Get current employers
    const employers = [...(formData.borrowers[0].employers || [])];
    employers.splice(index, 1);

    handleChange({
      target: {
        name: "employers",
        value: employers,
      },
    });
  };

  // Render the active tab content - keep all components mounted but only show the active one
  const renderTabContent = () => {
    // Render all components but only show the active one
    return (
      <div>
        {/* Personal Details Tab */}
        <div
          style={{
            display: activeTab === "personalDetails" ? "block" : "none",
          }}
        >
          <PersonalDetails
            borrower={borrower}
            onChange={handleFieldChange}
            addDependent={addDependent}
            removeDependent={removeDependent}
            handleDependentChange={handleDependentChange}
            errors={errors}
          />
        </div>

        {/* Residence History Tab */}
        <div
          style={{
            display: activeTab === "residenceHistory" ? "block" : "none",
          }}
        >
          <ResidenceHistory
            borrower={borrower}
            onChange={handleFieldChange}
            errors={errors}
          />
        </div>

        {/* Employment History Tab */}
        <div
          style={{
            display: activeTab === "employmentHistory" ? "block" : "none",
          }}
        >
          <EmploymentHistory
            borrower={borrower}
            onChange={handleFieldChange}
            addEmployer={addEmployer}
            removeEmployer={removeEmployer}
            handleEmployerChange={handleEmployerChange}
            errors={errors}
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
              // Make sure we have the required information before proceeding
              if (
                borrower.employers &&
                borrower.employers.length > 0 &&
                borrower.employers[0].companyName &&
                borrower.employers[0].jobTitle
              ) {
                nextStep();
              } else {
                alert(
                  "Please complete all required employment information before proceeding"
                );
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

export default BorrowerStep;
