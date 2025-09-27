import React from 'react';
import { DollarSign } from 'lucide-react';

const PROGRAM_TYPES = [
  { id: "conventional", name: "Conventional" },
  { id: "fha", name: "FHA" },
  { id: "va", name: "VA" },
  { id: "usda", name: "USDA" },
  { id: "jumbo", name: "Jumbo" },
];

const RateCard = ({ rate, saving }) => {
  const programType = PROGRAM_TYPES.find(
    (t) => t.id === rate.programType
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
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
              {/* Decrement button - disabled for lenders */}
              <button
                type="button"
                disabled={true} // Always disabled for lenders
                className="h-12 px-3 flex items-center justify-center focus:outline-none text-gray-300 cursor-not-allowed"
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

              {/* Input field - read-only for lenders */}
              <input
                type="number"
                id={`rate-${rate.programType}`}
                className="block w-full py-3 text-center text-xl font-medium border-0 focus:ring-0 focus:outline-none bg-gray-50 text-gray-900 cursor-default"
                value={rate.rate}
                onChange={() => {}} // No-op for lenders
                disabled={true}
                readOnly={true}
                step="0.125"
                min="0"
                max="20"
              />

              {/* Increment button - disabled for lenders */}
              <button
                type="button"
                disabled={true} // Always disabled for lenders
                className="h-12 px-3 flex items-center justify-center focus:outline-none text-gray-300 cursor-not-allowed"
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
            Current interest rate (read-only)
          </p>
        </div>
      </div>
    </div>
  );
};

export default RateCard;
