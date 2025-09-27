import { useState, useEffect } from "react";
import { LoanRateService } from "@/services";
import toast from "react-hot-toast";

const PROGRAM_TYPES = [
  { id: "conventional", name: "Conventional" },
  { id: "fha", name: "FHA" },
  { id: "va", name: "VA" },
  { id: "usda", name: "USDA" },
  { id: "jumbo", name: "Jumbo" },
];

export const useLenderRates = () => {
  const [rates, setRates] = useState(
    PROGRAM_TYPES.map((type) => ({ programType: type.id, rate: 7.0 }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch rates on component mount
  useEffect(() => {
    fetchRates();
    // Log the auth token to check if it's available
    console.log(
      "Rates page - Auth token present:",
      !!localStorage.getItem("token")
    );
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      console.log("Fetching loan rates...");
      // This will automatically filter rates by the current lender
      const response = await LoanRateService.getAllRates();
      console.log("Loan rates API response:", response);

      // Process the data based on the response structure
      let ratesData = [];

      if (response) {
        if (response.data) {
          // If response.data has nested structure with status and data properties
          if (
            response.data.status === "success" &&
            Array.isArray(response.data.data)
          ) {
            console.log("Setting rates from nested data:", response.data.data);
            ratesData = response.data.data;
          }
          // If response.data is directly an array
          else if (Array.isArray(response.data)) {
            console.log("Setting rates from data array:", response.data);
            ratesData = response.data;
          }
          // If response.data has some other structure
          else {
            console.error(
              "Unexpected data structure in response.data:",
              response.data
            );
            setError("Failed to load rates: Unexpected data structure");
            return;
          }
        }
        // If response itself is an array
        else if (Array.isArray(response)) {
          console.log("Setting rates from direct array response:", response);
          ratesData = response;
        }
        // If response has status and data properties directly
        else if (
          response.status === "success" &&
          Array.isArray(response.data)
        ) {
          console.log("Setting rates from direct API response:", response.data);
          ratesData = response.data;
        } else {
          console.error("Unrecognized response structure:", response);
          setError("Failed to load rates: Unrecognized response structure");
          return;
        }

        // Merge existing rates with fetched rates
        const updatedRates = [...rates];

        ratesData.forEach((fetchedRate) => {
          const index = updatedRates.findIndex(
            (r) => r.programType === fetchedRate.programType
          );
          if (index !== -1) {
            updatedRates[index] = fetchedRate;
          }
        });

        console.log("Updated rates:", updatedRates);
        setRates(updatedRates);

        // Set last updated date from the most recent rate
        if (ratesData.length > 0) {
          const latestDate = ratesData.reduce((latest, rate) => {
            const rateDate = new Date(rate.updatedAt);
            return rateDate > latest ? rateDate : latest;
          }, new Date(0));

          setLastUpdated(latestDate);
        }
      } else {
        console.error("Empty response received");
        setError("Failed to load rates: Empty response");
      }
    } catch (err) {
      console.error("Error fetching loan rates:", err);
      setError(err.message || "Failed to load loan rates");
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (programType, value) => {
    // Convert the input to a valid number
    let numericValue = parseFloat(value);

    // Handle invalid input
    if (isNaN(numericValue)) numericValue = 0;

    // Round to 3 decimal places for display purposes
    numericValue = Math.round(numericValue * 1000) / 1000;

    // Update the rates state
    const updatedRates = rates.map((rate) =>
      rate.programType === programType ? { ...rate, rate: numericValue } : rate
    );

    setRates(updatedRates);
  };

  const handleSaveRates = async () => {
    try {
      setSaving(true);

      // Use updateRates (plural) instead of updateRate (singular)
      const response = await LoanRateService.updateRates(rates);

      console.log("response:", response);
      toast.success("Rates updated successfully");
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error saving rates:", err);
      toast.error(err.message || "Failed to save rates");
      setError(err.message || "Failed to save rates");
    } finally {
      setSaving(false);
    }
  };

  return {
    rates,
    loading,
    saving,
    error,
    lastUpdated,
    handleRateChange,
    handleSaveRates
  };
};
