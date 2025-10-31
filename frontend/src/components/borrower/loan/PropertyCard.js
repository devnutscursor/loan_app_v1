import React from 'react';

/**
 * PropertyCard component displays property information in a visually appealing card
 * @param {Object} property - The property data object
 * @param {Function} formatCurrency - Function to format currency values
 */
const PropertyCard = ({ property, formatCurrency }) => {
  if (!property) return null;
  
  // Format the address for display
  const formatAddress = (address, zipCode) => {
    if (!address && !zipCode) return 'N/A';
    return `${address?.streetAddress || ''} ${address?.aptSteNum || ''}, ${address?.city || ''}, ${address?.state || ''} ${zipCode || ''}`.trim();
  };
  
  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
      <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <h3 className="ml-2 text-lg font-semibold text-gray-900">Property Details</h3>
        </div>
        <p className="mt-1 text-sm text-gray-600">Information about the property being financed</p>
      </div>
      
      <div className="px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Property Information</h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-md mr-3">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Zip Code</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {property.zipCode}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-md mr-3">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Property Type</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{property.propertyType || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-md mr-3">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Year Built</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{property.yearBuilt || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Financial Details</h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-md mr-3">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Property Value</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(property.propertyValue) || 'N/A'}</p>
                </div>
              </div>
              
              {property.hasAcceptedOffer && (
                <div className="flex items-start">
                  <div className="bg-green-100 p-2 rounded-md mr-3">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contract Price</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(property.contractPurchasePrice) || 'N/A'}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-md mr-3">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Occupancy</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{property.occupancyType === 'Vacation Home'? "2nd Home" : property.occupancyType || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
