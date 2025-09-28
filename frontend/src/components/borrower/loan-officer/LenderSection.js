import React from 'react';

/**
 * Component for displaying loan officer information
 * Shows profile image, name, position, NMLS, and contact details
 */
const LenderSection = ({ lenderData }) => {
  if (!lenderData) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Loan Officer</h3>
      <hr className="border-t border-gray-300 mb-4" />
      <div className="flex items-center gap-6 flex-col sm:flex-row">
        <div className="w-24 h-24 xl:w-28 xl:h-28 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden min-w-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {lenderData.user?.profileImageUrl ? (
            <img src={lenderData.user.profileImageUrl} alt="Lender" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-sm">{lenderData.user?.firstName?.[0] || 'U'}</span>
          )}
        </div>
        <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
          <div className="text-gray-900 font-bold text-lg">
            Name: {lenderData.user?.firstName} {lenderData.user?.lastName}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-bold text-lg">Position: </span> 
            {lenderData.clientFacingTitle || lenderData.title || 'Loan Officer'}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-bold text-lg">NMLS: </span> 
            {lenderData.nmls || '—'}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-bold text-lg">Phone: </span> 
            {lenderData.phone || lenderData.mobilePhone || '—'}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-bold text-lg">Email: </span> 
            {lenderData.email || lenderData.user?.email || '—'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LenderSection;
