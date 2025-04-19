import React from 'react';

const steps = [
  { id: 'personal', name: 'Personal Information', description: 'Your basic details' },
  { id: 'financial', name: 'Financial Information', description: 'Income and employment details' },
  { id: 'loan', name: 'Loan Details', description: 'Purpose and amount' },
  { id: 'documents', name: 'Upload Documents', description: 'Supporting documents' },
  { id: 'review', name: 'Review & Submit', description: 'Final review before submission' }
];

const LoanApplicationSteps = ({ currentStep }) => {
  return (
    <nav aria-label="Progress">
      <ol className="overflow-hidden">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pb-10' : ''}`}>
            {stepIdx !== steps.length - 1 ? (
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className={`h-full w-0.5 ${stepIdx < steps.indexOf(steps.find(s => s.id === currentStep)) ? 'bg-primary' : 'bg-gray-200'}`} />
              </div>
            ) : null}
            <div className="relative flex items-start group">
              {stepIdx < steps.indexOf(steps.find(s => s.id === currentStep)) ? (
                <span className="h-9 flex items-center">
                  <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-primary rounded-full">
                    <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                </span>
              ) : stepIdx === steps.indexOf(steps.find(s => s.id === currentStep)) ? (
                <span className="h-9 flex items-center" aria-hidden="true">
                  <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-white border-2 border-primary rounded-full">
                    <span className="h-2.5 w-2.5 bg-primary rounded-full" />
                  </span>
                </span>
              ) : (
                <span className="h-9 flex items-center" aria-hidden="true">
                  <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full group-hover:border-gray-400">
                    <span className="h-2.5 w-2.5 bg-transparent rounded-full group-hover:bg-gray-300" />
                  </span>
                </span>
              )}
              <span className="ml-4 min-w-0 flex flex-col">
                <span className={`text-sm font-medium ${
                  stepIdx < steps.indexOf(steps.find(s => s.id === currentStep))
                    ? 'text-primary'
                    : stepIdx === steps.indexOf(steps.find(s => s.id === currentStep))
                    ? 'text-primary'
                    : 'text-gray-500'
                }`}>
                  {step.name}
                </span>
                <span className="text-sm text-gray-500">{step.description}</span>
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default LoanApplicationSteps;
