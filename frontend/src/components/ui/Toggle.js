import React from 'react';

/**
 * Toggle component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.enabled - Whether the toggle is enabled
 * @param {Function} props.onChange - Function to handle toggle change
 * @param {string} props.label - Label for the toggle
 * @returns {JSX.Element} Toggle component
 */
const Toggle = ({ enabled, onChange, label }) => {
  return (
    <div className="flex items-center">
      {label && <span className="text-sm text-gray-500 mr-2">{label}</span>}
      <button 
        onClick={onChange}
        type="button"
        className={`relative inline-flex h-6 w-11 items-center rounded-full ${enabled ? 'bg-primary' : 'bg-gray-200'}`}
        aria-pressed={enabled}
        aria-labelledby={`toggle-${label}`}
      >
        <span 
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${enabled ? 'translate-x-6' : 'translate-x-1'}`} 
        />
      </button>
    </div>
  );
};

export default Toggle;
