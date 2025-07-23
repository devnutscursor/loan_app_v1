import React, { useState, useEffect, useRef } from "react";
import { Edit } from "lucide-react";
import { fetchAPI } from "@/utils/api";
import { formatCurrency } from "./LoanQualificationUtils";
import DTICircleIndicator from "./DTICircleIndicator";
import PaymentInfoSection from "./PaymentInfoSection";
import LoanInfoSection from "./LoanInfoSection";
import LoadingSkeleton from "./LoadingSkeleton";
import { calculateDefaultLoanValues } from "./LoanQualificationUtils";
import LoanParametersModal from "../../LoanParametersModal";

// Import calculation utilities from the modal's dependencies
import {
  getTotalIncome as calculateTotalIncome,
  getTotalDebts as calculateTotalDebts,
  getTotalAssets as calculateTotalAssets,
} from "../../utils/LoanCalculationUtils";

const LoanQualificationCard = ({ loan, onUpdate, enablePolling = false }) => {
  const [hasFetchedLoan, setHasFetchedLoan] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loanPrograms, setLoanPrograms] = useState([]);
  const [loanRates, setLoanRates] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // Track if we're silently processing data
  const [calculations, setCalculations] = useState({
    loanAmount: 0,
    downPayment: 0,
    downPaymentPercent: 0,
    monthlyPayment: 0,
    dti: 0,
    principalAndInterest: 0,
    taxes: 0,
    insurance: 0,
    mortgageInsurance: 0,
    hoa: 0,
    isQualified: false,
    programName: "Conventional",
    interestRate: 0,
    loanTerm: 30,
  });

  useEffect(() => {
    const fetchProgramsAndRates = async () => {
      try {
        console.log("@@@@@1111111111");
        setIsLoading(true);
        const programsResponse = await fetchAPI("/loan-programs");
        const ratesResponse = await fetchAPI("/loan-rates");

        if (programsResponse.status === "success" && ratesResponse.status === "success") {
          setLoanPrograms(programsResponse.data);
          setLoanRates(ratesResponse.data);

          const defaultProgram = programsResponse.data.find(
            (p) => p.programType === "conventional" || p.isDefaultForIntegrations
          );

          if (defaultProgram) setSelectedProgram(defaultProgram);
        }
      } catch (error) {
        console.error("Error fetching loan programs and rates:", error);
      }
    };

    fetchProgramsAndRates();
  }, []);

  useEffect(() => {
    if (loan && selectedProgram && hasFetchedLoan) {
      console.log("@@@@@2222222");
      setIsLoading(true);
      console.log("111111111111111111111111111111");
      calculateLoanValues();
    }
  }, [loan?._id, selectedProgram, hasFetchedLoan]);

  useEffect(() => {
    if (!isLoading && loan?._id && selectedProgram) {
      const fetchFreshData = async () => {
        try {
          const response = await fetchAPI(`/loans/${loan._id}`);
          if (response.status === "success" && response.data) {
            const updatedLoan = {
              ...loan,
              loanParameters: response.data.loanParameters || {},
              loanCalculations: response.data.loanCalculations || {},
            };
            console.log("2222222222222222222222222222222222");
            calculateLoanValues(updatedLoan);
          setHasFetchedLoan(true);
          if (onUpdate) onUpdate(updatedLoan);
          }
        } catch (error) {
          console.error("Error fetching fresh loan data:", error);
        }
      };

      fetchFreshData();
    }
  }, [isLoading]);

  // ✅ Initial fetch after all dependencies are ready
  useEffect(() => {
    const fetchInitialLoanData = async () => {
      if (!loan?._id || loanPrograms.length === 0 || loanRates.length === 0) return;

      try {
        const response = await fetchAPI(`/loans/${loan._id}`);
        if (response.status === "success" && response.data) {
          const updatedLoan = {
            ...loan,
            loanParameters: response.data.loanParameters || {},
            loanCalculations: response.data.loanCalculations || {},
          };

          const programId = updatedLoan.loanParameters?.selectedProgramId;
          if (programId) {
            const matchedProgram = loanPrograms.find(p => p._id === programId);
            if (matchedProgram) setSelectedProgram(matchedProgram);
          }
          console.log("333333333333333333333333333333333");

          calculateLoanValues(updatedLoan);
          if (onUpdate) onUpdate(updatedLoan);
        }
      } catch (e) {
        console.error("Initial loan fetch failed", e);
      }
    };

    fetchInitialLoanData();
  }, [loan?._id, loanPrograms, loanRates]);

  // useEffect(() => {
  //   if (!enablePolling) return;

  //   const pollInterval = setInterval(async () => {
  //     if (!loan?._id || isModalOpen) return;
  //     try {
  //       const response = await fetchAPI(`/loans/${loan._id}`);
  //       if (response.status === "success" && response.data) {
  //         const currentParamsStr = JSON.stringify(loan.loanParameters || {});
  //         const newParamsStr = JSON.stringify(response.data.loanParameters || {});
  //         const currentCalcsStr = JSON.stringify(loan.loanCalculations || {});
  //         const newCalcsStr = JSON.stringify(response.data.loanCalculations || {});

  //         if (currentParamsStr !== newParamsStr || currentCalcsStr !== newCalcsStr) {
  //           const updatedLoan = {
  //             ...loan,
  //             loanParameters: response.data.loanParameters || {},
  //             loanCalculations: response.data.loanCalculations || {},
  //           };
  //           console.log("4444444444444444444444444444444444444444444444");
  //           calculateLoanValues(updatedLoan);
  //           if (onUpdate) onUpdate(updatedLoan);
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Error polling for loan updates:", error);
  //     }
  //   }, 1000);

  //   return () => clearInterval(pollInterval);
  // }, [loan?._id, enablePolling, isModalOpen]);

  // Effect to silently process loan data when component mounts
  // useEffect(() => {
  //   const processFreshData = async () => {
  //     // Only proceed if we have necessary data and haven't processed already
  //     if (!loan?._id || hasFetchedLoan || loanPrograms.length === 0 || loanRates.length === 0 || isProcessing) {
  //       return;
  //     }
      
  //     // First check if we already have the loan calculations
  //     try {
  //       const response = await fetchAPI(`/loans/${loan._id}`);
  //       if (response.status === "success" && response.data) {
  //         const fetchedLoan = response.data;
          
  //         // Check if we have the minimum required data already
  //         const hasMinimumData = fetchedLoan.loanCalculations && 
  //                                Object.keys(fetchedLoan.loanCalculations).length > 0 &&
  //                                fetchedLoan.loanCalculations.monthlyPayment > 0;
          
  //         if (hasMinimumData) {
  //           // If we already have data, use it directly
  //           console.log('[LoanQualificationCard] Loan already has calculation data, using directly');
  //           const updatedLoan = {
  //             ...loan,
  //             loanParameters: fetchedLoan.loanParameters || {},
  //             loanCalculations: fetchedLoan.loanCalculations || {},
  //           };
            
  //           const programId = updatedLoan.loanParameters?.selectedProgramId;
  //           if (programId) {
  //             const matchedProgram = loanPrograms.find(p => p._id === programId);
  //             if (matchedProgram) setSelectedProgram(matchedProgram);
  //           }
  //           console.log("55555555555555555555555555555555555555555555");
  //           calculateLoanValues(updatedLoan);
  //           setHasFetchedLoan(true);
  //           if (onUpdate) onUpdate(updatedLoan);
  //           setIsLoading(false);
  //           return;
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Error checking existing loan data:", error);
  //     }
      
  //     // If we don't have data, process it silently
  //     console.log('[LoanQualificationCard] Processing loan data silently');
  //     setIsProcessing(true);
      
  //     // Call our silent processing function
  //     const success = await processLoanDataSilently(loan, loanPrograms, loanRates, (updatedLoanData) => {
  //       // This callback runs when processing is complete
  //       console.log('[LoanQualificationCard] Silent processing complete');
        
  //       const updatedLoan = {
  //         ...loan,
  //         loanParameters: updatedLoanData.loanParameters || {},
  //         loanCalculations: updatedLoanData.loanCalculations || {},
  //       };
        
  //       // Update selected program if needed
  //       const programId = updatedLoan.loanParameters?.selectedProgramId;
  //       if (programId) {
  //         const matchedProgram = loanPrograms.find(p => p._id === programId);
  //         if (matchedProgram) setSelectedProgram(matchedProgram);
  //       }
        
  //       // Calculate values and update state
  //       console.log("666666666666666666666666666666666666666666666666666");
  //       calculateLoanValues(updatedLoan);
  //       setHasFetchedLoan(true);
  //       if (onUpdate) onUpdate(updatedLoan);
  //       //pause here for 1 minute
     
  //     });
      
  //     setIsProcessing(false);
  //     setIsLoading(false);
      
  //     if (!success) {
  //       console.error('[LoanQualificationCard] Failed to process loan data silently');
  //     }
  //   };
    
  //   processFreshData();
  // }, []);

  // Check if the loan data is complete and trigger silent processing if needed
  
  useEffect(() => {
    // Only run this check if we've already fetched loan data but something is missing
    if (hasFetchedLoan && !isLoading && !isModalOpen && !isProcessing && loan?._id) {
      // Check if we have all the required data
      const hasRequiredData = 
        loan.loanParameters && 
        loan.loanCalculations && 
        loan.loanCalculations.monthlyPayment > 0 &&
        loan.loanCalculations.dti > 0;
      
      if (!hasRequiredData) {
        console.log('[LoanQualificationCard] Missing required loan data, triggering silent processing');
        
        // Silently process the data
        setIsProcessing(true);
        console.log("@@@@3333333333");
        setIsLoading(true);
        
        processLoanDataSilently(loan, loanPrograms, loanRates, (updatedLoanData) => {
          const updatedLoan = {
            ...loan,
            loanParameters: updatedLoanData.loanParameters || {},
            loanCalculations: updatedLoanData.loanCalculations || {},
          };
          console.log("777777777777777777777777777777777777777777777");
          calculateLoanValues(updatedLoan);
          setHasFetchedLoan(true);
          if (onUpdate) onUpdate(updatedLoan);
          setIsProcessing(false);
          setIsLoading(false);
        }).catch(error => {
          console.error("Error in silent processing:", error);
          setIsProcessing(false);
          setIsLoading(false);
        });
      }
    }
  }, [hasFetchedLoan, isLoading, isModalOpen, isProcessing, loan?._id]);

  const calculateLoanValues = (updatedLoan = null) => {
    const currentLoan = updatedLoan || loan;
    const hasStoredParams = !!currentLoan?.loanParameters;
    const hasStoredCalcs = !!currentLoan?.loanCalculations;

    if (hasStoredCalcs && Object.keys(currentLoan.loanCalculations).length > 0) {
      const calcs = currentLoan.loanCalculations;
      const loanAmount = hasStoredParams ? parseFloat(currentLoan.loanParameters.loanAmount) : 0;
      const downPayment = hasStoredParams ? parseFloat(currentLoan.loanParameters.downPayment) : 0;
      const downPaymentPercent = hasStoredParams ? parseFloat(currentLoan.loanParameters.downPaymentPercent) : 0;

      let interestRate = hasStoredParams ? parseFloat(currentLoan.loanParameters.interestRate || 0) : 0;
      if (!interestRate || interestRate === 0) {
        const selectedProg = loanPrograms.find(
          (program) => program._id === currentLoan?.loanParameters?.selectedProgramId
        );
        if (selectedProg) {
          const programRate = loanRates.find(
            (rate) => rate.programType === selectedProg.programType
          );
          if (programRate && programRate.rate) {
            interestRate = programRate.rate;
            if (typeof selectedProg.rateAdjustment === 'number') {
              interestRate += selectedProg.rateAdjustment;
            }
          }
          else {
            switch (selectedProg.programType) {
              case 'conventional': interestRate = 6.75; break;
              case 'fha': interestRate = 6.5; ;break;
              case 'va': interestRate = 6.25; break;
              case 'usda': interestRate = 6.25; break;
              case 'jumbo': interestRate = 7.25; break;
              default: interestRate = 6.75;
            }
          }
        } else {
          interestRate = 6.75;
        }
      }

      // Recalculate DTI using the freshest income and debt figures so the UI never shows stale data
      const monthlyIncome = calculateTotalIncome(currentLoan?.income || currentLoan?.loanParameters?.income);
      const monthlyDebts = calculateTotalDebts(currentLoan?.debts || currentLoan?.loanParameters?.debts);
      const monthlyPayment = parseFloat(calcs.monthlyPayment || 0);
      const computedDti = monthlyIncome > 0 ? ((monthlyPayment + monthlyDebts) / monthlyIncome) * 100 : 0;

      // Determine qualification against the program DTI cap (fallback to 43%)
      const selectedProgForQual = loanPrograms.find(
        (program) => program._id === currentLoan?.loanParameters?.selectedProgramId
      ) || loanPrograms.find(
        (program) => program.programType === "conventional" || program.isDefaultForIntegrations
      ) || loanPrograms[0];

      const dtiLimit = selectedProgForQual?.restrictions?.dtiRestriction?.max ?? 43;
      const isQualifiedComputed = computedDti <= dtiLimit;

      setCalculations({
        loanAmount,
        downPayment,
        downPaymentPercent,
        monthlyPayment,
        dti: computedDti,
        principalAndInterest: parseFloat(calcs.principalAndInterest || 0),
        taxes: parseFloat(calcs.taxes || 0),
        insurance: parseFloat(calcs.insurance || 0),
        mortgageInsurance: parseFloat(calcs.mortgageInsurance || 0),
        hoa: parseFloat(calcs.hoa || 0),
        isQualified: isQualifiedComputed,
        programName: selectedProgForQual?.displayName || "Conventional",
        interestRate,
        loanTerm: selectedProgForQual?.loanTerm || 30,
      });
      console.log("Calculations (recomputed):", {
        monthlyIncome,
        monthlyDebts,
        monthlyPayment,
        computedDti,
      });
    } else 
    {
      //calculate interestrate here if not already defined adn then pass it in parameters,
      const selectedProgram = loanPrograms.find(
        (program) => program._id === currentLoan?.loanParameters?.selectedProgramId
      ) || loanPrograms.find(
        (program) => program.programType === "conventional" || program.isDefaultForIntegrations
      ) || loanPrograms[0];
      if (!selectedProgram) {
        console.error("[LoanQualificationCard] No loan program available to calculate values");
        return;
      }
      
      const defaultCalculations = calculateDefaultLoanValues(currentLoan, loanPrograms, selectedProgram);
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
      setCalculations(defaultCalculations);
    }

    setTimeout(() => {
      setIsLoading(false);
    },0);
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = async () => {
    setIsModalOpen(false);
    if (loan?._id) {
      try {
        console.log('[LoanQualificationCard] Modal closed, fetching fresh loan data');
        // Set loading to true while we fetch the data
        setIsLoading(true);
        
        const response = await fetchAPI(`/loans/${loan._id}`);
        if (response.status === "success" && response.data) {
          const updatedLoan = {
            ...loan,
            loanParameters: response.data.loanParameters || {},
            loanCalculations: response.data.loanCalculations || {},
          };

          console.log("Response data:", response.data);
          
          // Update the program if needed
          const programId = updatedLoan.loanParameters?.selectedProgramId;
          if (programId) {
            const matchedProgram = loanPrograms.find(p => p._id === programId);
            if (matchedProgram) setSelectedProgram(matchedProgram);
          }
          
          console.log("Before update:");
          // Calculate and update values
          calculateLoanValues(updatedLoan);
          console.log("After update:");
          setHasFetchedLoan(true);
          if (onUpdate) onUpdate(updatedLoan);
        }
      } catch (error) {
        console.error("Error fetching loan data after modal close:", error);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };
  
  // Handler for real-time parameter updates from the modal
  const handleParametersChange = (updatedParams, updatedCalculations) => {
    console.log("[LoanQualificationCard] Real-time parameter update received:", { updatedParams, updatedCalculations });

    if (updatedCalculations) {
      // Force immediate UI update by creating a new object reference
      const newCalcs = {
        ...calculations,
        dti: updatedCalculations.dti !== undefined ? updatedCalculations.dti : calculations.dti,
        monthlyPayment: updatedCalculations.monthlyPayment !== undefined ? updatedCalculations.monthlyPayment : calculations.monthlyPayment,
        isQualified: updatedCalculations.isQualified !== undefined ? updatedCalculations.isQualified : calculations.isQualified,
        principalAndInterest: updatedCalculations.principalAndInterest !== undefined ? updatedCalculations.principalAndInterest : calculations.principalAndInterest,
        insurance: updatedCalculations.insurance !== undefined ? updatedCalculations.insurance : calculations.insurance,
        taxes: updatedCalculations.taxes !== undefined ? updatedCalculations.taxes : calculations.taxes,
        mortgageInsurance: updatedCalculations.mortgageInsurance !== undefined ? updatedCalculations.mortgageInsurance : calculations.mortgageInsurance,
        hoa: updatedCalculations.hoa !== undefined ? updatedCalculations.hoa : calculations.hoa
      };
      
      // Set the new calculations state directly instead of using a callback
      console.log("[LoanQualificationCard] Updating calculations with:", newCalcs);
      setCalculations(newCalcs);
    }
    
    // Update loan parameters in local state
    if (updatedParams && loan) {
      // Create an updated loan object with new parameters
      const updatedLoanParams = {
        ...loan.loanParameters,
        income: updatedParams.income !== undefined ? updatedParams.income : loan.loanParameters?.income,
        debts: updatedParams.debts !== undefined ? updatedParams.debts : loan.loanParameters?.debts
      };
      
      // Create updated loan object to pass to the parent via onUpdate
      const updatedLoan = {
        ...loan,
        loanParameters: updatedLoanParams
      };
      
      // Notify parent component of changes if needed
      if (onUpdate) {
        console.log('[LoanQualificationCard] Notifying parent with updated loan:', updatedLoan);
        onUpdate(updatedLoan);
      }
    }
  };

  const handleProgramChange = (programId) => {
    const program = loanPrograms.find((p) => p._id === programId);
    if (program) setSelectedProgram(program);
  };

  // This component will be rendered inside the modal to monitor saving state
  const LoadingStateMonitor = ({ onSaveComplete }) => {
    useEffect(() => {
      // Function to check for loading state indicators in the DOM
      const checkForLoadingState = () => {
        // Look for elements that might indicate saving state
        const savingIndicators = document.querySelectorAll('.saving-indicator');
        if (savingIndicators.length > 0) {
          console.log('[LoadingStateMonitor] Found saving indicator');
          
          // Set up an observer to watch when it disappears
          const observer = new MutationObserver((mutations) => {
            // If saving indicator is removed, trigger save complete
            if (document.querySelectorAll('.saving-indicator').length === 0) {
              console.log('[LoadingStateMonitor] Saving complete detected');
              onSaveComplete();
              observer.disconnect();
            }
          });
          
          // Start observing
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
          
          // Cleanup function
          return () => observer.disconnect();
        }
        
        // If no saving indicator found, check again soon
        return setTimeout(checkForLoadingState, 500);
      };
      
      // Start checking
      const timerId = checkForLoadingState();
      
      // Clean up
      return () => clearTimeout(timerId);
    }, [onSaveComplete]);
    
    return null; // This component doesn't render anything
  };

  // Remove the monitoring code since we're now processing silently
  // useEffect(() => {
  //   // Monitor for saving indicators in the DOM to detect when saving is complete
  //   // Implementation removed
  // }, [isModalOpen, autoModalOpened]);

  // Function to process loan data without showing the modal
  const processLoanDataSilently = async (loan, loanPrograms, loanRates, onComplete) => {
    if (!loan?._id || !loanPrograms.length || !loanRates.length) {
      console.error("[LoanQualificationCard] Missing required data for processing");
      return false;
    }
    
    console.log("[LoanQualificationCard] Processing loan data silently...");
    
    try {
      // First, get the current loan data
      const response = await fetchAPI(`/loans/${loan._id}`);
      if (response.status !== "success" || !response.data) {
        console.error("[LoanQualificationCard] Failed to fetch loan data");
        return false;
      }
      
      const loanData = response.data;
      
      // Check if we already have the necessary calculation data
      if (loanData.loanCalculations && 
          Object.keys(loanData.loanCalculations).length > 0 && 
          loanData.loanCalculations.monthlyPayment > 0) {
        console.log("[LoanQualificationCard] Loan already has valid calculations");
        onComplete && onComplete(loanData);
        return true;
      }
      
      // Select a program (same logic as in LoanParametersModal)
      const selectedProgram = loanPrograms.find(
        (p) => p._id === loanData.loanParameters?.selectedProgramId
      ) || loanPrograms.find(
        (p) => p.programType === "conventional" || p.isDefaultForIntegrations
      ) || loanPrograms[0];
      
      if (!selectedProgram) {
        console.error("[LoanQualificationCard] No loan program available");
        return false;
      }
      
      // Calculate financial values
      const totalIncome = calculateTotalIncome(loanData.income); // Already returns monthly income
      const totalDebts = calculateTotalDebts(loanData.debts); // Already returns monthly debts
      const totalAssets = calculateTotalAssets(loanData.assets);
      
      // Add logging to verify income values from utility functions
      console.log("[LoanQualificationCard] Income/Debt Values:", {
        totalIncomeMonthly: totalIncome,
        totalDebtsMonthly: totalDebts,
        rawIncome: loanData.income,
        rawDebts: loanData.debts
      });

      // Create toggle states similar to what DataLoader does
      const toggleStates = {
        propertyTaxes: {
          isPercent: loanData.loanParameters?.propertyTaxesUnit === "percent" || false,
          isYearly: loanData.loanParameters?.propertyTaxesFrequency === "yearly" || true,
        },
        homeownersInsurance: {
          isPercent: loanData.loanParameters?.homeownersInsuranceUnit === "percent" || false,
          isYearly: loanData.loanParameters?.homeownersInsuranceFrequency === "yearly" || true,
        },
        hoaFees: {
          isPercent: loanData.loanParameters?.hoaFeesUnit === "percent" || false,
          isYearly: loanData.loanParameters?.hoaFeesFrequency === "yearly" || false,
        },
        originationFees: {
          isPercent: loanData.loanParameters?.originationFeesUnit === "percent" || false,
          frequency: loanData.loanParameters?.originationFeesFrequency || "once",
        },
        closingCosts: {
          isPercent: loanData.loanParameters?.closingCostsUnit === "percent" || false,
          frequency: loanData.loanParameters?.closingCostsFrequency || "once",
        },
        otherFees: {
          isPercent: loanData.loanParameters?.otherFeesUnit === "percent" || false,
          frequency: loanData.loanParameters?.otherFeesFrequency || "once",
        },
      };
      
      // Get or calculate important values
      let loanAmount = loanData.loanParameters?.loanAmount;
      if (!loanAmount) {
        if (loanData.loanDetails?.loanType === "Purchase") {
          loanAmount = loanData.loanDetails?.purchasePrice || 0;
        } else if (loanData.loanDetails?.loanType === "Refinance") {
          loanAmount = loanData.loanDetails?.requestedLoanAmount || 0;
        } else {
          loanAmount = loanData.loanDetails?.loanAmount || 0;
        }
      }
      
      // Get or calculate down payment
      let downPayment = loanData.loanParameters?.downPayment;
      let downPaymentPercent = loanData.loanParameters?.downPaymentPercent;
      
      if (!downPayment) {
        if (loanData.loanDetails?.loanType === "Purchase") {
          downPayment = loanData.loanDetails?.downPayment || 0;
        } else {
          // For non-purchase loans, get the minimum down payment percentage
          const minDownPaymentPercent = 3; // Default minimum
          downPaymentPercent = minDownPaymentPercent;
          downPayment = loanAmount * (minDownPaymentPercent / 100);
        }
      }
      
      if (!downPaymentPercent && loanAmount > 0 && downPayment > 0) {
        downPaymentPercent = (downPayment / loanAmount) * 100;
      }
      
      // Get interest rate based on program
      let interestRate = loanData.loanParameters?.interestRate;
      if (!interestRate) {
        // Try to find rate for this program type
        if (loanRates && loanRates.length > 0) {
          const programRate = loanRates.find(
            (rate) => rate.programType === selectedProgram.programType
          );
          interestRate = programRate?.rate || 0;
        }
        // If still no interest rate, use defaults
        if (!interestRate) {
          switch (selectedProgram.programType) {
            case 'conventional': interestRate = 6.75; break;
            case 'fha': interestRate = 6.5; break;
            case 'va': interestRate = 6.25; break;
            case 'usda': interestRate = 6.25; break;
            case 'jumbo': interestRate = 7.25; break;
            default: interestRate = 6.75;
          }
        }
      }
      
      // Create parameters object
      const localParams = {
        loanAmount,
        downPayment,
        downPaymentPercent,
        propertyTaxes: loanData.loanParameters?.propertyTaxes || loanData.propertiesOwned?.realEstateTaxes || 0,
        homeownersInsurance: loanData.loanParameters?.homeownersInsurance || loanData.propertiesOwned?.hazardInsurance || 0,
        hoaFees: loanData.loanParameters?.hoaFees || loanData.propertiesOwned?.hoaDues || 0,
        selectedProgramId: selectedProgram._id,
        interestRate,
        loanTerm: selectedProgram.loanTerm || 30,
        income: totalIncome,
        debts: totalDebts,
        assets: totalAssets,
      };
      
      // Calculate loan values
      // This is a simplified version of the calculations that happen in the modal
      const principal = loanAmount - downPayment;
      const monthlyInterestRate = interestRate / 100 / 12;
      const numberOfPayments = localParams.loanTerm * 12;
      
      // Calculate principal and interest
      let principalAndInterest = 0;
      if (monthlyInterestRate > 0) {
        principalAndInterest = principal * (
          monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)
        ) / (
          Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1
        );
      } else {
        principalAndInterest = principal / numberOfPayments;
      }
      
      // Calculate other monthly costs
      const taxes = localParams.propertyTaxes / (toggleStates.propertyTaxes.isYearly ? 12 : 1);
      const insurance = localParams.homeownersInsurance / (toggleStates.homeownersInsurance.isYearly ? 12 : 1);
      const hoa = localParams.hoaFees / (toggleStates.hoaFees.isYearly ? 12 : 1);
      
      // Calculate mortgage insurance
      let mortgageInsurance = 0;
      if (selectedProgram.programType === 'fha') {
        // FHA MIP calculation
        mortgageInsurance = (principal * 0.0055) / 12; // Annual MIP rate of 0.55%
      } else if (selectedProgram.programType === 'conventional' && downPaymentPercent < 20) {
        // Conventional PMI calculation (simplified)
        mortgageInsurance = (principal * 0.005) / 12; // Rough estimate of 0.5% annually
      }
      
      // Total monthly payment
      const monthlyPayment = principalAndInterest + taxes + insurance + mortgageInsurance + hoa;
      
      // Calculate DTI ratio
      // Note: totalIncome and totalDebts are already monthly values from the calculation functions
      const monthlyIncome = totalIncome;
      const monthlyDebt = totalDebts;
      const dti = monthlyIncome > 0 ? ((monthlyDebt + monthlyPayment) / monthlyIncome) * 100 : 0;
      
      // Debug logging for DTI calculation
      console.log("[LoanQualificationCard] DTI Calculation:", {
        monthlyIncome,
        monthlyDebt,
        monthlyPayment,
        totalDTIExpenses: monthlyDebt + monthlyPayment,
        calculatedDTI: dti
      });

      // Determine qualification
      const dtiMax = 43; // Default maximum DTI
      const isQualified = dti <= dtiMax;
      
      // Create calculations object
      const calculations = {
        loanAmount,
        downPayment,
        downPaymentPercent,
        monthlyPayment,
        dti,
        principalAndInterest,
        taxes,
        insurance,
        mortgageInsurance,
        hoa,
        isQualified,
        monthlyIncome,
        monthlyDebt,
      };
      
      // Save the data back to the loan
      console.log("[LoanQualificationCard] Saving calculated loan data");
      
      const loanParameters = {
        loanAmount: localParams.loanAmount,
        downPayment: localParams.downPayment,
        downPaymentPercent: localParams.downPaymentPercent,
        propertyTaxes: localParams.propertyTaxes,
        propertyTaxesUnit: toggleStates.propertyTaxes.isPercent ? 'percent' : 'dollar',
        propertyTaxesFrequency: toggleStates.propertyTaxes.isYearly ? 'yearly' : 'monthly',
        homeownersInsurance: localParams.homeownersInsurance,
        homeownersInsuranceUnit: toggleStates.homeownersInsurance.isPercent ? 'percent' : 'dollar',
        homeownersInsuranceFrequency: toggleStates.homeownersInsurance.isYearly ? 'yearly' : 'monthly',
        hoaFees: localParams.hoaFees,
        hoaFeesUnit: toggleStates.hoaFees.isPercent ? 'percent' : 'dollar',
        hoaFeesFrequency: toggleStates.hoaFees.isYearly ? 'yearly' : 'monthly',
        interestRate: localParams.interestRate,
        loanTerm: localParams.loanTerm,
        selectedProgramId: localParams.selectedProgramId,
      };
      
      // Make the API call to update the loan
      const updateResponse = await fetchAPI(`/loans/${loan._id}`, {
        method: 'PUT',
        body: {
          loanParameters,
          loanCalculations: calculations
        }
      });
      
      if (updateResponse.status !== "success") {
        console.error("[LoanQualificationCard] Failed to save calculated loan data", updateResponse);
        return false;
      }
      
      console.log("[LoanQualificationCard] Successfully processed and saved loan data");
      
      // Get fresh data after saving
      const freshResponse = await fetchAPI(`/loans/${loan._id}`);
      if (freshResponse.status === "success" && freshResponse.data) {
        onComplete && onComplete(freshResponse.data);
      }
      
      return true;
    } catch (error) {
      console.error("[LoanQualificationCard] Error processing loan data:", error);
      return false;
    }
  };


    if (
  isLoading ||
  isProcessing ||
  !hasFetchedLoan ) {
  return <LoadingSkeleton />;
}
  return (
    <div className="bg-white rounded-lg hover:shadow-md transition-shadow duration-300">
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center justify-center w-2.5 h-2.5 rounded-full ${
              calculations.isQualified ? "bg-green-500" : "bg-red-500"
            }`}></span>
            <span className="text-sm font-medium text-gray-700">
              {calculations.isQualified ? "Qualified" : "Not Qualified"}
            </span>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center text-sm px-3 py-1.5 rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <Edit className="w-3 h-3 mr-1.5" />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          <div className="col-span-2 md:col-span-1 flex justify-center">
            <DTICircleIndicator
              dti={calculations.dti}
              downPaymentPercent={calculations.downPaymentPercent}
              isQualified={calculations.isQualified}
            />
          </div>

          <div>
            <div className="space-y-3">
              <div className="group">
                <div className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Monthly Payment</div>
                <div className="font-medium text-gray-900">{formatCurrency(calculations.monthlyPayment)}</div>
              </div>
              <div className="group">
                <div className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Interest Rate</div>
                <div className="font-medium text-gray-900">{calculations.interestRate}%</div>
              </div>
              <div className="group">
                <div className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Loan Term</div>
                <div className="font-medium text-gray-900">{calculations.loanTerm} years</div>
              </div>
            </div>
          </div>

          <div>
            <div className="space-y-3">
              <div className="group">
                <div className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Loan Amount</div>
                <div className="font-medium text-gray-900">{formatCurrency(calculations.loanAmount)}</div>
              </div>
              <div className="group">
                <div className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Down Payment</div>
                <div className="font-medium text-gray-900">
                  {formatCurrency(calculations.downPayment)} <span className="text-xs text-gray-400">({calculations.downPaymentPercent}%)</span>
                </div>
              </div>
              <div className="group">
                <div className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Program</div>
                <div className="font-medium text-gray-900">{calculations.programName || "Conventional"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 px-5 py-3 rounded-b-lg border-t border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-gray-500">P&I:</span> <span className="font-medium">{formatCurrency(calculations.principalAndInterest)}</span>
            </div>
            <div>
              <span className="text-gray-500">Taxes:</span> <span className="font-medium">{formatCurrency(calculations.taxes)}</span>
            </div>
            <div>
              <span className="text-gray-500">Insurance:</span> <span className="font-medium">{formatCurrency(calculations.insurance)}</span>
            </div>
          </div>
          <div className="text-blue-600 cursor-pointer hover:underline" onClick={handleOpenModal}>
            Details
          </div>
        </div>
      </div>
      {isModalOpen && (
        <LoanParametersModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          loan={loan}
          loanPrograms={loanPrograms}
          loanRates={loanRates}
          selectedProgram={selectedProgram}
          calculations={calculations}
          onProgramChange={handleProgramChange}
          onUpdate={onUpdate}
          onParametersChange={handleParametersChange}
        />
      )}
    </div>
  );
};

export default LoanQualificationCard;