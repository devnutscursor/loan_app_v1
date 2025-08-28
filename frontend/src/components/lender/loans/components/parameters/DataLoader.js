import { useEffect, useState, useRef } from "react";
import { fetchAPI } from "@/utils/api";
import {
  getTotalIncome as calculateTotalIncome,
  getTotalDebts as calculateTotalDebts,
  getTotalAssets as calculateTotalAssets,
  getLoanAmount as getInitialLoanAmount,
  getInterestRate as getInitialInterestRate,
} from "../../utils/LoanCalculationUtils";
import { useAllProgramGuidelines } from "./ProgramGuidelinesProvider";

/**
 * DataLoader component
 * Handles loading loan parameters data and program-specific guidelines
 */
const DataLoader = ({
  loan,
  loanId,
  setLocalParams,
  setToggleStates,
  onProgramChange,
  selectedProgram,
  loanPrograms,
  loanRates = [],
  loadingStates,
  updateLoadingState, // Add a prop to control loading state
}) => {
  // Get access to the shared program guidelines context
  const { setAllProgramGuidelines } = useAllProgramGuidelines();
  // Track whether we've initialized the program selection
  const [hasInitializedProgram, setHasInitializedProgram] = useState(false);

  // Flag to track if program guidelines have been initialized
  const initializedAllGuidelinesRef = useRef(false);

  // Ref to prevent multiple simultaneous API calls
  const isFetchingRef = useRef(false);

  // Fetch saved parameters when modal opens
  useEffect(() => {
    const fetchSavedParameters = async () => {
      try {
        // Skip if no loanId or if we're already fetching
        if (!loanId || isFetchingRef.current) return;

        // Set fetching flag to prevent duplicate calls
        isFetchingRef.current = true;

        // Set loading states
        updateLoadingState("isLoadingDetails", true);
        updateLoadingState("isLoadingCalculations", true);

        // console.log('Selected program', selectedProgram);
        // console.log('[DEBUG] Fetching loan parameters for loan ID:', loanId);

        const response = await fetchAPI(`/loans/${loanId}`, {
          method: "GET",
        });

        if (response.status === "success" && response.data) {
          const loanData = response.data;

          console.log("[DEBUG] Loan data:", loanData);
          // Calculate financial values from the loan data
          const totalIncome = calculateTotalIncome(loanData.income);
          const totalDebts = calculateTotalDebts(loanData.debts);
          const totalAssets = calculateTotalAssets(loanData.assets);

          // Initialize toggles with defaults if no saved parameters
          const newToggleStates = {
            propertyTaxes: {
              isPercent:
                loanData.loanParameters?.propertyTaxesUnit === "percent" ||
                false,
              isYearly:
                loanData.loanParameters?.propertyTaxesFrequency === "yearly" ||
                true,
            },
            homeownersInsurance: {
              isPercent:
                loanData.loanParameters?.homeownersInsuranceUnit ===
                  "percent" || false,
              isYearly:
                loanData.loanParameters?.homeownersInsuranceFrequency ===
                  "yearly" || true,
            },
            hoaFees: {
              isPercent:
                loanData.loanParameters?.hoaFeesUnit === "percent" || false,
              isYearly:
                loanData.loanParameters?.hoaFeesFrequency === "yearly" || false,
            },
            // Add toggle states for fee fields in Program Guidelines section
            originationFees: {
              isPercent:
                loanData.loanParameters?.originationFeesUnit === "percent" ||
                false,
              frequency:
                loanData.loanParameters?.originationFeesFrequency || "once",
            },
            closingCosts: {
              isPercent:
                loanData.loanParameters?.closingCostsUnit === "percent" ||
                false,
              frequency:
                loanData.loanParameters?.closingCostsFrequency || "once",
            },
            otherFees: {
              isPercent:
                loanData.loanParameters?.otherFeesUnit === "percent" || false,
              frequency: loanData.loanParameters?.otherFeesFrequency || "once",
            },
          };
          setToggleStates(newToggleStates);

          // console.log('Selected program id', loanData.loanParameters?.selectedProgramId);
          // Get the selected program ID (if exists) or use the first available program
          const savedProgramId =
            loanData.loanParameters?.selectedProgramId ||
            (loanPrograms.length > 0 ? loanPrograms[0]._id : "");
          // console.log('[DEBUG] Saved program ID:', savedProgramId);
          // The selected program will be either the one saved in the loan or the first program
          const selectedProgramObj =
            loanPrograms.find((p) => p._id === savedProgramId) ||
            loanPrograms[0];

          // console.log('[DEBUG] Selected program:', selectedProgramObj);

          // Only set the program selection during the initial load
          if (
            !hasInitializedProgram &&
            savedProgramId &&
            loanPrograms.some((p) => p._id === savedProgramId)
          ) {
            // console.log('[DEBUG] Initial program selection:', savedProgramId);
            onProgramChange(savedProgramId);
            setHasInitializedProgram(true);
          }

          // Initialize program guidelines map if it doesn't exist
          let allGuidelines = {};

          // Check if program guidelines exist in the loan data
          if (
            loanData.loanParameters?.programGuidelines &&
            Object.keys(loanData.loanParameters.programGuidelines).length > 0
          ) {
            allGuidelines = { ...loanData.loanParameters.programGuidelines };

            // Update toggle states for fee fields if present in program guidelines
            const currentProgramGuidelines =
              loanData.loanParameters.programGuidelines[savedProgramId] || {};

            // First update the toggle states from program guidelines
            if (currentProgramGuidelines) {
              // Update the fee toggles based on the guidelines data
              newToggleStates.originationFees = {
                isPercent:
                  currentProgramGuidelines.originationFeesUnit === "percent",
                frequency:
                  currentProgramGuidelines.originationFeesFrequency || "once",
              };

              newToggleStates.closingCosts = {
                isPercent:
                  currentProgramGuidelines.closingCostsUnit === "percent",
                frequency:
                  currentProgramGuidelines.closingCostsFrequency || "once",
              };

              newToggleStates.otherFees = {
                isPercent: currentProgramGuidelines.otherFeesUnit === "percent",
                frequency:
                  currentProgramGuidelines.otherFeesFrequency || "once",
              };

              // console.log('[DEBUG] Loaded fee toggle states from program guidelines:', {
              //   origination: newToggleStates.originationFees,
              //   closing: newToggleStates.closingCosts,
              //   other: newToggleStates.otherFees
              // });
            }

            // Re-apply the updated toggle states
            setToggleStates(newToggleStates);
          } else {
            // Create default guidelines for each available program
            for (const program of loanPrograms) {
              allGuidelines[program._id] = {
                dtiMax: program.restrictions?.dtiRestriction?.max || 43,
                downPaymentMin:
                  program.restrictions?.downPaymentRestriction?.min || 3,
                downPaymentMax:
                  program.restrictions?.downPaymentRestriction?.max || 100,
                loanAmountMin:
                  program.restrictions?.loanAmountRestriction?.min || 0,
                loanAmountMax:
                  program.restrictions?.loanAmountRestriction?.max || 0,
                upfrontMIP: program.fhaMortgageInsurance?.upfrontMIP || 1.75,
                annualMIP: program.fhaMortgageInsurance?.annualMIP || 0.85,
                originationFees: program.originationFees?.value || 0,
                originationFeesUnit: "dollar",
                originationFeesFrequency: "once",
                closingCosts: program.closingCosts?.value || 0,
                closingCostsUnit: "dollar",
                closingCostsFrequency: "once",
                otherFees: program.otherFees?.value || 0,
                otherFeesUnit: "dollar",
                otherFeesFrequency: "once",
              };
            }
          }

          // Update shared context with all program guidelines
          setAllProgramGuidelines(allGuidelines);
          initializedAllGuidelinesRef.current = true;

          // Get the program-specific guidelines for the selected program if available
          const currentProgramId =
            loanData.loanParameters?.selectedProgramId ||
            selectedProgramObj?._id;
          const programGuidelines = allGuidelines[currentProgramId] || {};

          // console.log('[DEBUG] Loading parameters for loan ID:', loanId);

          // Get the loan amount based on loan type
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

          // Get the down payment - for non-purchase loans, calculate based on minimum percentage
          let downPayment = loanData.loanParameters?.downPayment;
          let downPaymentPercent = loanData.loanParameters?.downPaymentPercent;

          if (!downPayment) {
            if (loanData.loanDetails?.loanType === "Purchase") {
              downPayment = loanData.loanDetails?.downPayment || 0;
            } else {
              // For non-purchase loans, get the minimum down payment percentage from selected program
              const minDownPaymentPercent =
                programGuidelines?.downPaymentMin ||
                selectedProgramObj?.restrictions?.downPaymentRestriction?.min ||
                3;

              downPaymentPercent = minDownPaymentPercent;
              downPayment = loanAmount * (minDownPaymentPercent / 100);
            }
          }

          if (!downPaymentPercent && loanAmount > 0 && downPayment > 0) {
            downPaymentPercent = (downPayment / loanAmount) * 100;
          }

          // Get interest rate from loan rates based on selected program
          let interestRate = loanData.loanParameters?.interestRate;
          if (!interestRate) {
            // If no interest rate is saved, try to find one for this program type
            if (loanRates && loanRates.length > 0) {
              const programRate = loanRates.find(
                (rate) => rate.programType === selectedProgramObj?.programType
              );
              interestRate = programRate?.rate || 0;
            }
            
            // If still no interest rate (empty or 0), use current market rates (July 2025)
            if (!interestRate) {
              // Current market rates based on Freddie Mac PMMS and industry standards
              switch (selectedProgramObj?.programType) {
                case 'conventional':
                  interestRate = 6.75; // 30-year fixed conventional (Freddie Mac July 17, 2025)
                  break;
                case 'fha':
                  interestRate = 6.50; // FHA typically 0.25% lower than conventional
                  break;
                case 'va':
                  interestRate = 6.25; // VA typically 0.5% lower than conventional
                  break;
                case 'usda':
                  interestRate = 6.25; // USDA similar to VA rates
                  break;
                case 'jumbo':
                  interestRate = 7.00; // Jumbo typically 0.25% higher than conventional
                  break;
                default:
                  interestRate = 6.75; // Fallback to conventional rate
              }
              console.log(`[DEBUG] Using current market rate ${interestRate}% for ${selectedProgramObj?.programType} program`);
            }
          }

          // If we're changing the program, prioritize the program's loan term
          // Otherwise use the saved loan term if available
          let loanTerm = selectedProgram?.loanTerm || 30; // Default to 30 years

          // Set local parameters based on either loanParameters or other loan data
          setLocalParams((prev) => ({
            ...prev,
            // Basic loan parameters
            loanAmount,
            downPayment,
            downPaymentPercent,
            propertyTaxes:
              // ALWAYS show 0 if borrower doesn't own property
              loanData.propertiesOwned?.ownsProperty === false ? 0 :
              // Otherwise if they do own property, use stored value
              typeof loanData.loanParameters?.propertyTaxes === 'number' ? loanData.loanParameters.propertyTaxes :
              // Or try to use real estate taxes if available
              typeof loanData.propertiesOwned?.realEstateTaxes === 'number' ? loanData.propertiesOwned.realEstateTaxes :
              // Final fallback
              0,
            homeownersInsurance:
              typeof loanData.loanParameters?.homeownersInsurance === 'number' ? loanData.loanParameters.homeownersInsurance :
              typeof loanData.propertiesOwned?.hazardInsurance === 'number' ? loanData.propertiesOwned.hazardInsurance :
              0,
            hoaFees:
              typeof loanData.loanParameters?.hoaFees === 'number' ? loanData.loanParameters.hoaFees :
              typeof loanData.propertiesOwned?.hoaDues === 'number' ? loanData.propertiesOwned.hoaDues :
              0,
            selectedProgramId: savedProgramId || prev.selectedProgramId,
            interestRate,
            rateAdjustment: 
              typeof loanData.loanParameters?.rateAdjustment === 'number' ? loanData.loanParameters.rateAdjustment :
              typeof selectedProgramObj?.rateAdjustment === 'number' ? selectedProgramObj.rateAdjustment :
              0,
            loanTerm,

            // Financial values
            income: totalIncome,
            debts: totalDebts,
            assets: totalAssets,

            // Program-specific guidelines
            dtiMax:
              programGuidelines?.dtiMax ||
              selectedProgramObj?.restrictions?.dtiRestriction?.max ||
              43,
            downPaymentMin:
              programGuidelines?.downPaymentMin ||
              selectedProgramObj?.restrictions?.downPaymentRestriction?.min ||
              3,
            downPaymentMax:
              programGuidelines?.downPaymentMax ||
              selectedProgramObj?.restrictions?.downPaymentRestriction?.max ||
              100,
            loanAmountMin:
              programGuidelines?.loanAmountMin ||
              selectedProgramObj?.restrictions?.loanAmountRestriction?.min ||
              0,
            loanAmountMax:
              programGuidelines?.loanAmountMax ||
              selectedProgramObj?.restrictions?.loanAmountRestriction?.max ||
              0,

            // Mortgage Insurance fields
            upfrontMIP:
              programGuidelines?.upfrontMIP ||
              selectedProgramObj?.fhaMortgageInsurance?.upfrontMIP ||
              1.75,
            annualMIP:
              programGuidelines?.annualMIP ||
              selectedProgramObj?.fhaMortgageInsurance?.annualMIP ||
              0.85,
            fmiPercent: programGuidelines?.fmiPercent || 1,

            // Fee fields
            originationFees:
              programGuidelines?.originationFees ||
              selectedProgramObj?.originationFees?.value ||
              0,
            closingCosts:
              programGuidelines?.closingCosts ||
              selectedProgramObj?.closingCosts?.value ||
              0,
            otherFees:
              programGuidelines?.otherFees ||
              selectedProgramObj?.otherFees?.value ||
              0,
          }));
          // When done, set loading to false
          updateLoadingState("isLoadingDetails", false);
          updateLoadingState("isLoadingCalculations", false);
          // console.log('[DEBUG] Loan parameters loaded successfully');
        }
      } catch (error) {
        console.error("[DEBUG] Error fetching loan parameters:", error);
        // If there's an error, we need to reset loading state here
        updateLoadingState('isLoadingDetails', false);
        updateLoadingState('isLoadingCalculations', false);
      } finally {
        // Reset the fetching flag so future fetches can proceed
        isFetchingRef.current = false;

        // Note: We don't set loading to false here for successful requests
        // because we need to wait for the PUT request to complete too.
        // The AutoSaveHandler will handle turning off the loading state after its operations
      }
    };

    fetchSavedParameters();

    // Only re-run this effect when loanId changes or when the program selection changes
    // The other dependencies should be stable references and not trigger re-renders
  }, [loanId, selectedProgram?._id]);

  return null; // Logic-only component, no UI
};

export default DataLoader;