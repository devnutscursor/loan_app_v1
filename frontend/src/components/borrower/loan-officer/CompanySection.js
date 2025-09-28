import React from 'react';

/**
 * Component for displaying lender company information
 * Shows company logo, name, NMLS, contact details, and address
 */
const CompanySection = ({ company }) => {
  if (!company) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 sm:p-8 ring-1 ring-blue-50">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Lender Company</h3>
      <hr className="border-t border-gray-300 mb-4" />
      <div className="flex items-center gap-6 flex-col sm:flex-row mt-10">
        <div className="w-24 h-24 xl:w-28 xl:h-28 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {company.logoUrl ? (
            <img src={company.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
          ) : (
            <span className="text-gray-400 text-xs">No Logo</span>
          )}
        </div>
        <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-bold text-lg">Name: </span> 
            {company.name}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-bold text-lg">NMLS: </span> 
            {company.nmls || '—'}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-bold text-lg">Phone: </span> 
            {company.phone || '—'}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-bold text-lg">Email: </span> 
            {company.email || '—'}
          </div>
          {company.address && (
            <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
              <span className="text-gray-900 font-bold text-lg">Address: </span>
              {[company.address.addressLine1, company.address.city, company.address.state, company.address.zipCode]
                .filter(Boolean)
                .join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanySection;
