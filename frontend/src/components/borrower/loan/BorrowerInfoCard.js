import React from 'react';

/**
 * BorrowerInfoCard component displays borrower personal information in a visually appealing card
 * @param {Object} borrowerDetails - The borrower data object
 */
const BorrowerInfoCard = ({ borrowerDetails }) => {
  if (!borrowerDetails) return null;
  
  // Format the address for display
  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.streetAddress || ''}, ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}`.trim();
  };
  
  // Get full name
  const fullName = `${borrowerDetails.firstName || ''} ${borrowerDetails.middleName || ''} ${borrowerDetails.lastName || ''}`.trim();
  
  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
      <div className="px-6 py-5 bg-gradient-to-r from-purple-50 to-fuchsia-50 border-b border-purple-100">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="ml-2 text-lg font-semibold text-gray-900">Borrower Information</h3>
        </div>
        <p className="mt-1 text-sm text-gray-600">Personal and contact details for the primary borrower</p>
      </div>
      
      <div className="px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <div className="flex items-start mb-3">
              <div className="bg-purple-100 p-2 rounded-md mr-3">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{fullName || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-purple-100 p-2 rounded-md mr-3">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{borrowerDetails.email || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <div className="flex items-start mb-3">
              <div className="bg-purple-100 p-2 rounded-md mr-3">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{borrowerDetails.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-purple-100 p-2 rounded-md mr-3">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Address</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatAddress(borrowerDetails.currentAddress)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BorrowerInfoCard;
