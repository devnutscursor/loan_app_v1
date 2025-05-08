import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context for program guidelines
const ProgramGuidelinesContext = createContext({});

/**
 * ProgramGuidelinesProvider
 * Provides a context for sharing program guidelines data across components
 */
export const ProgramGuidelinesProvider = ({ children, loanPrograms, initialGuidelines = {} }) => {
  // Track all program guidelines in a central location
  const [allProgramGuidelines, setAllProgramGuidelines] = useState(initialGuidelines);

  // Load default guidelines for all programs if not already provided
  useEffect(() => {
    if (!loanPrograms || loanPrograms.length === 0 || Object.keys(allProgramGuidelines).length > 0) {
      return;
    }

    const defaultGuidelines = {};
    
    loanPrograms.forEach(program => {
      if (!program._id) return;
      
      defaultGuidelines[program._id] = {
        dtiMax: program?.restrictions?.dtiRestriction?.max || 43,
        downPaymentMin: program?.restrictions?.downPaymentRestriction?.min || 3,
        downPaymentMax: program?.restrictions?.downPaymentRestriction?.max || 100,
        loanAmountMin: program?.restrictions?.loanAmountRestriction?.min || 0,
        loanAmountMax: program?.restrictions?.loanAmountRestriction?.max || 0,
        upfrontMIP: program?.fhaMortgageInsurance?.upfrontMIP || 1.75,
        annualMIP: program?.fhaMortgageInsurance?.annualMIP || 0.85,
        originationFees: program?.originationFees?.value || 0,
        closingCosts: program?.closingCosts?.value || 0,
        otherFees: program?.otherFees?.value || 0
      };
    });
    
    setAllProgramGuidelines(defaultGuidelines);
  }, [loanPrograms]);

  // Update guidelines for a specific program
  const updateProgramGuidelines = (programId, guidelines) => {
    setAllProgramGuidelines(prev => ({
      ...prev,
      [programId]: guidelines
    }));
  };

  return (
    <ProgramGuidelinesContext.Provider 
      value={{ 
        allProgramGuidelines, 
        setAllProgramGuidelines, 
        updateProgramGuidelines 
      }}
    >
      {children}
    </ProgramGuidelinesContext.Provider>
  );
};

// Custom hook to access the program guidelines context
export const useAllProgramGuidelines = () => {
  const context = useContext(ProgramGuidelinesContext);
  
  if (!context) {
    throw new Error('useAllProgramGuidelines must be used within a ProgramGuidelinesProvider');
  }
  
  return context;
};

export default ProgramGuidelinesProvider;
