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
    // Don't allow clicking on future steps that are more than 1 step ahead
    if (stepNumber > currentStep + 1) return;
    
    // If navigating backward or to the current step, no validation needed
    if (stepNumber <= currentStep) {
      setCurrentStep(stepNumber);
      return;
    }
    
    // Validate the current step before allowing navigation to the next step
    if (validateStep(currentStep)) {
      setCurrentStep(stepNumber);
    } else {
      // Don't allow navigation if current step isn't valid
      alert('Please complete all required fields in the current step before proceeding.');
    }
  };

  // Determine step status: completed, active, or upcoming
  const getStepStatus = (stepNumber) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'active';
    return 'upcoming';
  };

  return (
    <div className="py-4" style={{ padding: theme.stepNavigator.padding }}>
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const status = getStepStatus(stepNumber);
          
          // Set styles based on status
          const circleStyles = {
            width: theme.stepNavigator.circleSize,
            height: theme.stepNavigator.circleSize,
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
            fontSize: '0.875rem',
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
            backgroundColor: stepNumber < currentStep ? theme.colors.primary : theme.colors.gray300
          };
          
          return (
            <React.Fragment key={stepNumber}>
              {/* Step circle with connector line */}
              <div className="flex flex-col items-center">
                {/* Circle */}
                <button
                  onClick={() => handleStepClick(stepNumber)}
                  disabled={stepNumber > currentStep + 1}
                  style={circleStyles}
                  aria-current={status === 'active' ? 'step' : undefined}
                >
                  {status === 'completed' ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span style={{ fontSize: '0.75rem' }}>{stepNumber}</span>
                  )}
                </button>
                
                {/* Step title */}
                <div className="mt-2 text-center">
                  <span style={titleStyles}>
                    {step.title}
                  </span>
                </div>
              </div>
              
              {/* Connector line between steps (except after last step) */}
              {stepNumber < steps.length && (
                <div style={connectorStyles} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepNavigator;
