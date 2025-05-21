import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  Save,
  DollarSign,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import { LoanRateService } from "@/services";
import toast from "react-hot-toast";

import Link from "next/link";
const PROGRAM_TYPES = [
  { id: "conventional", name: "Conventional" },
  { id: "fha", name: "FHA" },
  { id: "va", name: "VA" },
  { id: "usda", name: "USDA" },
  { id: "jumbo", name: "Jumbo" },
];

export default function ManageRates() {
  const router = useRouter();
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

  return (
    <ProtectedRoute allowedRoles={["lender"]}>
      <MainLayout>
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-3 min-h-[2.5rem]">
            {/* Left content area with back button and title */}
            <div className="flex items-center space-x-3">
              <Link
                href="/lender/programs"
                className="group flex items-center px-2.5 py-1.5 rounded hover:bg-gray-100 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400 group-hover:text-primary transition"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 group-hover:text-primary transition">
                  Go Back
                </span>
              </Link>

              <span className="block w-px h-5 bg-gray-200"></span>

              <div className="flex flex-row justify-center">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
                  Program Loan Rates
                </h1>
                {/* <p className="mt-1 text-sm text-gray-600">
                  Manage your loan program interest rates
                  {lastUpdated && (
                    <span className="ml-2 text-xs text-gray-500">
                      · Last Updated: {lastUpdated.toLocaleString()}
                    </span>
                  )}
                </p> */}
              </div>
            </div>

            {/* Save button aligned to the right */}
            <button
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200`}
              onClick={handleSaveRates}
              disabled={saving || loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save All Rates"}
            </button>
          </div>

          {/* Content Section */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 mt-8">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow overflow-hidden border border-gray-100"
                >
                  <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                    <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-3 animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 mt-8">
              {rates.map((rate) => {
                const programType = PROGRAM_TYPES.find(
                  (t) => t.id === rate.programType
                );
                return (
                  <div
                    key={rate.programType}
                    className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-4 py-4">
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                          {programType?.name || rate.programType}
                        </h3>
                      </div>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                      <div className="relative">
                        <label
                          htmlFor={`rate-${rate.programType}`}
                          className="block text-sm font-medium text-gray-700 mb-1.5"
                        >
                          Interest Rate
                        </label>
                        <div className="mt-1 relative rounded-lg shadow-sm overflow-hidden group">
                          {/* Background accent for the input */}
                          <div className="absolute top-0 left-0 h-full w-1.5 bg-blue-500"></div>

                          <div className="flex items-center">
                            {/* Decrement button */}
                            <button
                              type="button"
                              disabled={saving || rate.rate <= 0}
                              onClick={() =>
                                handleRateChange(
                                  rate.programType,
                                  Math.max(0, (rate.rate - 0.125).toFixed(3))
                                )
                              }
                              className={`h-12 px-3 flex items-center justify-center focus:outline-none ${
                                saving || rate.rate <= 0
                                  ? "text-gray-300 cursor-not-allowed"
                                  : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                              }`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>

                            {/* Input field */}
                            <input
                              type="number"
                              id={`rate-${rate.programType}`}
                              className={`block w-full py-3 text-center text-xl font-medium border-0 focus:ring-0 focus:outline-none ${
                                saving
                                  ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                                  : "text-gray-900"
                              }`}
                              value={rate.rate}
                              onChange={(e) =>
                                handleRateChange(
                                  rate.programType,
                                  e.target.value
                                )
                              }
                              disabled={saving}
                              step="0.125"
                              min="0"
                              max="20"
                            />

                            {/* Increment button */}
                            <button
                              type="button"
                              disabled={saving || rate.rate >= 20}
                              onClick={() =>
                                handleRateChange(
                                  rate.programType,
                                  Math.min(20, (rate.rate + 0.125).toFixed(3))
                                )
                              }
                              className={`h-12 px-3 flex items-center justify-center focus:outline-none ${
                                saving || rate.rate >= 20
                                  ? "text-gray-300 cursor-not-allowed"
                                  : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                              }`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4"
                              >
                                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                              </svg>
                            </button>

                            {/* Percentage sign */}
                            <div className="bg-gray-100 h-12 px-3 flex items-center justify-center border-l">
                              <span className="text-gray-500 font-medium">
                                %
                              </span>
                            </div>
                          </div>

                          {/* Display current change from default if applicable */}
                          {rate.defaultRate &&
                            rate.defaultRate !== rate.rate &&
                            !saving && (
                              <div className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                {rate.rate > rate.defaultRate ? "↑" : "↓"} from{" "}
                                {rate.defaultRate}%
                              </div>
                            )}
                        </div>

                        {/* Helper text for rate ranges */}
                        <p className="mt-2 text-xs text-gray-500">
                          Rate adjusts in 0.125% increments (1/8%). Range: 0-20%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
