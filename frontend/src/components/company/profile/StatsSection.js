import React from 'react';
import { Users } from 'lucide-react';

const StatsSection = ({ company }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-6">Company Statistics</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <div className="text-2xl font-bold text-primary mb-1">{company?.users?.length || 0}</div>
        <div className="text-sm text-gray-600">Total Users</div>
      </div>
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <div className="text-2xl font-bold text-primary mb-1">{company?.maxLenders || 0}</div>
        <div className="text-sm text-gray-600">Max Lenders</div>
      </div>
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <div className="text-2xl font-bold text-primary mb-1">{company?.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}</div>
        <div className="text-sm text-gray-600">Created Date</div>
      </div>
    </div>
  </div>
);

export default StatsSection;


