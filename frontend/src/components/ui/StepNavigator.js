import React from 'react';
import theme from '../../styles/theme';

/**
 * StepNavigator Component
 * 
 * Renders a step navigator with circular indicators and labels
 * Allows users to navigate between completed steps
 * 
 * @param {Object} props
 * @param {Number} props.currentStep - The current active step (1-based)
 * @param {Function} props.setCurrentStep - Function to change the current step
 * @param {Array} props.steps - Array of step objects with titles
 * @param {Object} props.formData - The form data to check completion status
 * @param {Function} props.validateStep - Function to validate a step before navigating
 * @returns {JSX.Element}
 */
const StepNavigator = ({ currentStep, setCurrentStep, steps, formData, validateStep }) => {
  // Handle clicking on a step
  const handleStepClick = (stepNumber) => {
    // Only allow navigation to the next step (currentStep + 1) if current step is valid
    if (stepNumber === currentStep + 1) {
      // Validate the current step before allowing navigation to the next step
      const validationResult = validateStep(currentStep);
      
      // Handle both boolean and object return types
      let isValid = false;
      let errorMessages = [];
      
      if (typeof validationResult === 'boolean') {
        // Lender form returns boolean
        isValid = validationResult;
      } else if (typeof validationResult === 'object') {
        // Borrower form returns error object
        isValid = Object.keys(validationResult).length === 0;
        errorMessages = Object.values(validationResult);
      }
      
      if (isValid) {
        setCurrentStep(stepNumber);
      } else {
        // Don't allow navigation if current step isn't valid
        const message = errorMessages.length > 0 
          ? `Please complete: ${errorMessages.slice(0, 2).join(', ')}${errorMessages.length > 2 ? ` and ${errorMessages.length - 2} more fields` : ''}`
          : 'Please complete all required fields in the current step before proceeding.';
        
        alert(message);
      }
    } else if (stepNumber < currentStep) {
      // Allow going back to previous steps
      setCurrentStep(stepNumber);
    } else if (stepNumber > currentStep + 1) {
      // Don't allow jumping to future steps - show alert
      alert('Please complete the current step before proceeding to future steps.');
    }
  };

  // Determine step status: completed, active, or upcoming
  const getStepStatus = (stepNumber) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'active';
    return 'upcoming';
  };

  return (
    // <div className="p-0 sm:px-2 lg:py-4 lg:px-4">
      <div className="w-full overflow-x-auto mt-5 sm:mt-0">
        <div className='flex justify-between px-0 sm:px-4 lg:px-8 pb-2 space-x-4'>
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const status = getStepStatus(stepNumber);
            
            // Set styles based on status
            const circleStyles = {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: '2px',
              borderRadius: '9999px',
              transition: 'all 0.2s ease-in-out',
              outline: 'none'
            };
            
            // Add status-specific styles
            if (status === 'completed') {
              circleStyles.background = theme.gradients.primary;
              circleStyles.borderColor = theme.colors.white;
              circleStyles.color = theme.colors.white;
              circleStyles.cursor = 'pointer';
            } else if (status === 'active') {
              circleStyles.backgroundColor = theme.colors.white;
              circleStyles.borderColor = theme.colors.primary;
              circleStyles.color = theme.colors.primary;
              circleStyles.cursor = 'default';
            } else if (status === 'upcoming' && stepNumber === currentStep + 1) {
              circleStyles.backgroundColor = theme.colors.white;
              circleStyles.borderColor = theme.colors.gray300;
              circleStyles.color = theme.colors.gray500;
              circleStyles.cursor = 'pointer';
            } else {
              circleStyles.backgroundColor = theme.colors.white;
              circleStyles.borderColor = theme.colors.gray300;
              circleStyles.color = theme.colors.gray400;
              circleStyles.cursor = 'not-allowed';
              circleStyles.opacity = 0.5;
            }
            
            // Title text styles
            const titleStyles = {
              fontWeight: 500
            };
            
            if (status === 'active') {
              titleStyles.color = theme.colors.primary;
            } else if (status === 'completed') {
              titleStyles.color = theme.colors.gray900;
            } else {
              titleStyles.color = theme.colors.gray500;
            }
            
            // Connector line styles
            const connectorStyles = {
              flex: 1,
              height: '2px',
              marginLeft: '0.5rem',
              marginRight: '0.5rem',
              backgroundColor: stepNumber < currentStep ? theme.colors.primary : theme.colors.gray300,
              maxWidth: '21px',
              minWidth: '21px',
            };
            
            return (
              <React.Fragment key={stepNumber}>
                <div className="flex flex-col items-center flex-shrink-0 min-w-[30px]">
                  <button
                    className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"
                    onClick={() => handleStepClick(stepNumber)}
                    disabled={stepNumber > currentStep + 1}
                    style={circleStyles}
                    aria-current={status === 'active' ? 'step' : undefined}
                  >
                    {status === 'completed' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-[10px] lg:text-sm">{stepNumber}</span>
                    )}
                  </button>
                  <div className="mt-1 lg:mt-2 text-center">
                    <span className="text-[10px] lg:text-sm" style={titleStyles}>
                      {step.title}
                    </span>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    // </div>
  );
};

export default StepNavigator;
