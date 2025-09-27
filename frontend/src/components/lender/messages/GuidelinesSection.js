import React from 'react';

const GuidelinesSection = () => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Communication Guidelines</h3>
      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
        <li>Respond to all borrower messages within 24 business hours</li>
        <li>Use templates for common responses to maintain consistency</li>
        <li>Inform borrowers about document requirements with detailed instructions</li>
        <li>Update borrowers on status changes promptly</li>
        <li>Maintain professional tone in all communications</li>
      </ul>
    </div>
  );
};

export default GuidelinesSection;
