import React from 'react';

/**
 * DemographicsCard component displays demographics information in a visually appealing card
 * @param {Object} loan - The loan data object with demographics information
 */
const DemographicsCard = ({ loan }) => {
  if (!loan || !loan.demographics) return null;
  
  const { demographics } = loan;
  
  // Helper function to format ethnicity
  const formatEthnicity = (ethnicity) => {
    switch(ethnicity) {
      case 'hispanic': return 'Hispanic or Latino';
      case 'not-hispanic': return 'Not Hispanic or Latino';
      default: return 'Not Specified';
    }
  };
  
  // Helper function to format gender
  const formatGender = (gender) => {
    switch(gender) {
      case 'male': return 'Male';
      case 'female': return 'Female';
      case 'not-provided': return 'Information Not Provided';
      default: return 'Not Specified';
    }
  };
  
  // Helper function to format race
  const formatRace = (race) => {
    switch(race) {
      case 'american-indian': return 'American Indian or Alaska Native';
      case 'asian': return 'Asian';
      case 'black': return 'Black or African American';
      case 'hawaiian': return 'Native Hawaiian or Other Pacific Islander';
      case 'white': return 'White';
      case 'not-provided': return 'Information Not Provided';
      default: return 'Not Specified';
    }
  };
  
  // Helper function to format origin
  const formatOrigin = (origin) => {
    switch(origin) {
      case 'mexican': return 'Mexican';
      case 'puerto-rican': return 'Puerto Rican';
      case 'cuban': return 'Cuban';
      case 'other-hispanic': return demographics.otherOrigin || 'Other Hispanic or Latino';
      default: return 'Not Specified';
    }
  };
  
  // Helper function to format Asian origin
  const formatAsianOrigin = (origin) => {
    switch(origin) {
      case 'asian-indian': return 'Asian Indian';
      case 'chinese': return 'Chinese';
      case 'filipino': return 'Filipino';
      case 'japanese': return 'Japanese';
      case 'korean': return 'Korean';
      case 'vietnamese': return 'Vietnamese';
      case 'other-asian': return 'Other Asian';
      default: return 'Not Specified';
    }
  };
  
  // Helper function to format Pacific Islander origin
  const formatPacificIslanderOrigin = (origin) => {
    switch(origin) {
      case 'native-hawaiian': return 'Native Hawaiian';
      case 'guamanian-chamorro': return 'Guamanian or Chamorro';
      case 'samoan': return 'Samoan';
      case 'other-pacific-islander': return 'Other Pacific Islander';
      default: return 'Not Specified';
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
      <div className="px-6 py-5 bg-gradient-to-r from-pink-50 to-fuchsia-50 border-b border-pink-100">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="ml-2 text-lg font-semibold text-gray-900">Demographics</h3>
        </div>
        <p className="mt-1 text-sm text-gray-600">Borrower demographic information as provided</p>
      </div>
      
      <div className="px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Ethnicity & Gender</h4>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500 block">Ethnicity</span>
                <span className="text-sm text-gray-900">{formatEthnicity(demographics.ethnicity)}</span>
                
                {demographics.ethnicity === 'hispanic' && demographics.origin && (
                  <div className="mt-2 ml-4">
                    <span className="text-sm font-medium text-gray-500 block">Origin</span>
                    <span className="text-sm text-gray-900">{formatOrigin(demographics.origin)}</span>
                  </div>
                )}
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500 block">Gender</span>
                <span className="text-sm text-gray-900">{formatGender(demographics.gender)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Race Information</h4>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500 block">Race</span>
                <span className="text-sm text-gray-900">{formatRace(demographics.race)}</span>
                
                {demographics.race === 'american-indian' && demographics.tribe && (
                  <div className="mt-2 ml-4">
                    <span className="text-sm font-medium text-gray-500 block">Tribe</span>
                    <span className="text-sm text-gray-900">{demographics.tribe}</span>
                  </div>
                )}
                
                {demographics.race === 'asian' && demographics.asianOrigin && (
                  <div className="mt-2 ml-4">
                    <span className="text-sm font-medium text-gray-500 block">Asian Origin</span>
                    <span className="text-sm text-gray-900">{formatAsianOrigin(demographics.asianOrigin)}</span>
                  </div>
                )}
                
                {demographics.race === 'hawaiian' && demographics.pacificIslanderOrigin && (
                  <div className="mt-2 ml-4">
                    <span className="text-sm font-medium text-gray-500 block">Pacific Islander Origin</span>
                    <span className="text-sm text-gray-900">{formatPacificIslanderOrigin(demographics.pacificIslanderOrigin)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Note:</span> The information above was voluntarily provided and is used by the federal government to monitor compliance with equal credit opportunity laws.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemographicsCard;
