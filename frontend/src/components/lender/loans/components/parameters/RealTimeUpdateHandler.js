import { useEffect, useRef } from 'react';

/**
 * RealTimeUpdateHandler Component
 * 
 * Watches for changes in loan parameters and calculations
 * and propagates them to the parent component via onParametersChange callback
 * This enables real-time updates to the DTI meter and other UI elements
 * without requiring the modal to be closed first
 */
const RealTimeUpdateHandler = ({
  localParams,
  calculations,
  onParametersChange
}) => {
  // Use refs to track the previous values for comparison
  const prevParams = useRef(null);
  const prevCalculations = useRef(null);
  const initialRender = useRef(true);
  
  // Send immediate update on mount to sync state
  useEffect(() => {
    if (initialRender.current && calculations && localParams) {
      console.log('[RealTimeUpdateHandler] Initial sync with parent');
      // Send complete data on first render to ensure parent has current state
      onParametersChange(
        { income: localParams.income, debts: localParams.debts },
        calculations // Send the full calculations object
      );
      
      // Initialize previous values
      prevParams.current = { ...localParams };
      prevCalculations.current = { ...calculations };
      initialRender.current = false;
    }
  }, []);
  
  // Monitor for changes in parameters and calculations
  useEffect(() => {
    // Skip initial render as we handle it separately
    if (initialRender.current || !calculations || !localParams) return;
    
    // Check if there are significant changes in parameters or calculations
    const dtiChanged = prevCalculations.current && 
      prevCalculations.current.dti !== calculations.dti;
    
    const incomeChanged = prevParams.current && 
      JSON.stringify(prevParams.current.income) !== JSON.stringify(localParams.income);
    
    const debtsChanged = prevParams.current && 
      JSON.stringify(prevParams.current.debts) !== JSON.stringify(localParams.debts);
    
    // If something important changed
    if (dtiChanged || incomeChanged || debtsChanged) {
      console.log('[RealTimeUpdateHandler] Changes detected, updating parent');
      console.log('New DTI:', calculations.dti);
      
      // Send updates to parent
      onParametersChange(
        { income: localParams.income, debts: localParams.debts },
        calculations // Send the full calculations object
      );
    }
    
    // Always update our refs with current values
    prevParams.current = { ...localParams };
    prevCalculations.current = { ...calculations };
    
  }, [calculations, localParams, onParametersChange]);
  
  // This component doesn't render anything
  return null;
};

export default RealTimeUpdateHandler;
