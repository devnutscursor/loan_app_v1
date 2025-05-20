import React, { useState, useEffect } from 'react';

/**
 * Demographics Component
 * 
 * Manages the demographics section in the Declarations & Demographics step
 * 
 * @param {Object} props - Component props
 * @param {Object} props.demographics - Demographics data
 * @param {Function} props.onChange - Function to handle changes
 * @param {Object} props.borrower - Borrower information
 * @param {Object} props.errors - Validation errors
 * @returns {JSX.Element} Demographics form component
 */
const Demographics = ({ demographics = {}, onChange, borrower = {}, errors = {} }) => {
  // Local state for immediate UI updates
  const [localDemographics, setLocalDemographics] = useState({
    ethnicity: demographics.ethnicity || '',
    origin: demographics.origin || '',
    otherOrigin: demographics.otherOrigin || '', // Added for other hispanic origin
    gender: demographics.gender || '',
    race: demographics.race || '',
    tribe: demographics.tribe || '',
    asianOrigin: demographics.asianOrigin || '', // Added for Asian origin
    pacificIslanderOrigin: demographics.pacificIslanderOrigin || '' // Added for Pacific Islander origin
  });
  
  // Update local state when props change
  useEffect(() => {
    setLocalDemographics({
      ethnicity: demographics.ethnicity || '',
      origin: demographics.origin || '',
      otherOrigin: demographics.otherOrigin || '', // Sync state
      gender: demographics.gender || '',
      race: demographics.race || '',
      tribe: demographics.tribe || '',
      asianOrigin: demographics.asianOrigin || '', // Sync state
      pacificIslanderOrigin: demographics.pacificIslanderOrigin || '' // Sync state
    });
  }, [demographics]);

  // Handle change for a specific field
  const handleChange = (field, value) => {
    const updatedDemographics = {
      ...localDemographics,
      [field]: value
    };
    
    // Reset conditional fields if their parent selection changes
    if (field === 'ethnicity' && value !== 'hispanic') {
        updatedDemographics.origin = '';
        updatedDemographics.otherOrigin = '';
    }
    if (field === 'origin' && value !== 'other-hispanic') {
        updatedDemographics.otherOrigin = '';
    }
    if (field === 'race') {
        if (value !== 'american-indian') updatedDemographics.tribe = '';
        if (value !== 'asian') updatedDemographics.asianOrigin = '';
        if (value !== 'hawaiian') updatedDemographics.pacificIslanderOrigin = '';
    }

    setLocalDemographics(updatedDemographics);
    onChange(updatedDemographics); // Propagate changes up
  };

  // Get borrower's name for display
  const getBorrowerName = () => {
    if (borrower.firstName && borrower.lastName) {
      return `${borrower.firstName} ${borrower.lastName}`;
    }
    return 'the borrower';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Demographics</h2>
        <p className="text-gray-600 mb-4">
          This section asks about your ethnicity, sex, and race.
        </p>
        <p className="text-gray-600 mb-4">
          This information is used by the federal government to make sure that everyone, regardless of background, has equal credit opportunity.
        </p>
        <hr className="border-t border-gray-300 mb-6" />
      </div>

      <div className="space-y-6">
        {/* Ethnicity */}
        <div>
          <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
            ETHNICITY
          </label>
          <div className="relative">
            <select
              value={localDemographics.ethnicity}
              onChange={(e) => handleChange('ethnicity', e.target.value)}
              className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Ethnicity</option>
              <option value="hispanic">Hispanic or Latino</option>
              <option value="not-hispanic">Not Hispanic or Latino</option>
              <option value="not-provide">I do not wish to provide this information</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          {errors.ethnicity && <p className="mt-1 text-sm text-red-600">{errors.ethnicity}</p>}
        </div>

        {/* Origin - Show if Hispanic/Latino is selected */}
        {localDemographics.ethnicity === 'hispanic' && (
          <>
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                ORIGIN
              </label>
              <div className="relative">
                <select
                  value={localDemographics.origin}
                  onChange={(e) => handleChange('origin', e.target.value)}
                  className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Origin</option>
                  <option value="mexican">Mexican</option>
                  <option value="puerto-rican">Puerto Rican</option>
                  <option value="cuban">Cuban</option>
                  <option value="other-hispanic">Other Hispanic or Latino</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              {errors.origin && <p className="mt-1 text-sm text-red-600">{errors.origin}</p>}
            </div>

            {/* Other Origin Input - Show if 'Other Hispanic or Latino' is selected */}
            {localDemographics.origin === 'other-hispanic' && (
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  PRINT OTHER ORIGIN
                </label>
                <input
                  type="text"
                  value={localDemographics.otherOrigin || ''}
                  onChange={(e) => handleChange('otherOrigin', e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter other origin"
                />
                {errors.otherOrigin && <p className="mt-1 text-sm text-red-600">{errors.otherOrigin}</p>}
              </div>
            )}
          </>
        )}

        {/* Gender */}
        <div>
          <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
            GENDER
          </label>
          <div className="relative">
            <select
              value={localDemographics.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="not-provide">I do not wish to provide this information</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
        </div>

        {/* Race */}
        <div>
          <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
            RACE
          </label>
          <div className="relative">
            <select
              value={localDemographics.race}
              onChange={(e) => handleChange('race', e.target.value)}
              className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Race</option>
              <option value="american-indian">American Indian or Alaska Native</option>
              <option value="asian">Asian</option>
              <option value="black">Black or African American</option>
              <option value="hawaiian">Native Hawaiian or Other Pacific Islander</option>
              <option value="white">White</option>
              <option value="not-provide">I do not wish to provide this information</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          {errors.race && <p className="mt-1 text-sm text-red-600">{errors.race}</p>}
        </div>

        {/* Tribe - Show if American Indian/Alaska Native is selected */}
        {localDemographics.race === 'american-indian' && (
          <div>
            <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
              PLEASE PRINT NAME OF ENROLLED OR PRINCIPAL TRIBE
            </label>
            <input
              type="text"
              value={localDemographics.tribe || ''}
              onChange={(e) => handleChange('tribe', e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter tribe name"
            />
            {errors.tribe && <p className="mt-1 text-sm text-red-600">{errors.tribe}</p>}
          </div>
        )}

        {/* Asian Origin - Show if Asian is selected */}
        {localDemographics.race === 'asian' && (
          <div>
            <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
              ORIGIN
            </label>
            <div className="relative">
              <select
                value={localDemographics.asianOrigin}
                onChange={(e) => handleChange('asianOrigin', e.target.value)}
                className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Origin</option>
                <option value="asian-indian">Asian Indian</option>
                <option value="chinese">Chinese</option>
                <option value="filipino">Filipino</option>
                <option value="japanese">Japanese</option>
                <option value="korean">Korean</option>
                <option value="vietnamese">Vietnamese</option>
                <option value="other-asian">Other Asian</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            {errors.asianOrigin && <p className="mt-1 text-sm text-red-600">{errors.asianOrigin}</p>}
          </div>
        )}

        {/* Pacific Islander Origin - Show if Native Hawaiian/Other Pacific Islander is selected */}
        {localDemographics.race === 'hawaiian' && (
          <div>
            <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
              ORIGIN
            </label>
            <div className="relative">
              <select
                value={localDemographics.pacificIslanderOrigin}
                onChange={(e) => handleChange('pacificIslanderOrigin', e.target.value)}
                className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Origin</option>
                <option value="native-hawaiian">Native Hawaiian</option>
                <option value="guamanian-chamorro">Guamanian or Chamorro</option>
                <option value="samoan">Samoan</option>
                <option value="other-pacific-islander">Other Pacific Islander</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            {errors.pacificIslanderOrigin && <p className="mt-1 text-sm text-red-600">{errors.pacificIslanderOrigin}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Demographics;
