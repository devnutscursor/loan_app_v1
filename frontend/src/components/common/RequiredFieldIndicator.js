import React from 'react';

/**
 * Required Field Indicator Component
 * Shows a red star (*) for required fields
 */
const RequiredFieldIndicator = ({ className = '' }) => {
  return (
    <span 
      className={`text-red-500 ml-1 ${className}`}
      title="Required field"
    >
      *
    </span>
  );
};

export default RequiredFieldIndicator; 