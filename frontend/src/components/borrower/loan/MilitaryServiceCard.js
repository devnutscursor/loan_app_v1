import React from 'react';

/**
 * MilitaryServiceCard component displays information about the borrower's military service
 * @param {Object} loan - The loan data object containing military service information
 * @param {Function} formatDate - Function to format date values
 */
const MilitaryServiceCard = ({ loan, formatDate }) => {
  if (!loan || !loan.militaryService) return null;
  
  const { militaryService } = loan;
  
  // Function to render the service status
  const getServiceStatus = () => {
    if (militaryService.currentlyServing) return 'Currently Serving';
    if (militaryService.isRetired) return 'Retired';
    if (militaryService.isNonActivated) return 'Non-Activated Member of Reserve or National Guard';
    if (militaryService.isSurvivingSpouse) return 'Surviving Spouse';
    if (militaryService.hasServed) return 'Veteran';
    return 'Not Specified';
  };
  
  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
      <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
          <h3 className="ml-2 text-lg font-semibold text-gray-900">Military Service</h3>
        </div>
        <p className="mt-1 text-sm text-gray-600">Information about the borrower's military service</p>
      </div>
      
      <div className="px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-lg p-4 col-span-full">
            <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Service Status</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">{getServiceStatus()}</div>
          </div>
          
          {militaryService.serviceBranch && (
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Service Branch</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">{militaryService.serviceBranch}</div>
          </div>
          )}
          
          {militaryService.serviceType && (
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Service Type</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">{militaryService.serviceType}</div>
          </div>
          )}
          
          {militaryService.yearsOfService > 0 && (
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Years of Service</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">{militaryService.yearsOfService}</div>
          </div>
          )}
          
          {militaryService.dischargeType && (
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Discharge Type</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">{militaryService.dischargeType}</div>
          </div>
          )}

          {militaryService.dischargeDate && (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Discharge Date</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">{formatDate(militaryService.dischargeDate)}</div>
            </div>
          )}

          {militaryService.expirationDate && (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Expiration Date</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">{militaryService.expirationDate}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MilitaryServiceCard;
