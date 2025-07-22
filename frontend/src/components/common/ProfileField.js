import React from 'react';
import { FiEdit3, FiClock } from 'react-icons/fi';

const ProfileField = ({ 
  label, 
  name, 
  value, 
  onChange, 
  type = 'text', 
  disabled = false, 
  icon: Icon, 
  required = false, 
  showEditIcon = false, 
  onEditClick,
  isVerificationPending = false 
}) => {
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor={name}>
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <div className="relative">
        {/* Left icon */}
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className={`h-5 w-5 ${disabled ? 'text-gray-400' : 'text-primary/70'}`} aria-hidden="true" />
          </div>
        )}
        
        {/* Input field */}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            ${Icon ? 'pl-10' : 'pl-4'} 
            ${showEditIcon && !isVerificationPending ? 'pr-12' : isVerificationPending ? 'pr-20' : 'pr-4'}
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : 'bg-white border-gray-300 hover:border-primary/50'}
            block w-full py-2.5 border rounded-lg text-gray-900 placeholder-gray-400 
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary 
            transition-colors duration-200 shadow-sm
          `}
        />
        
        {/* Right edit icon - only pen icon, no text */}
        {showEditIcon && !isVerificationPending && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={onEditClick}
              className="p-1 text-gray-400 hover:text-primary transition-colors duration-200 rounded-md hover:bg-gray-50"
              title={`Change ${label.toLowerCase()}`}
            >
              <FiEdit3 className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {/* Verification pending indicator */}
        {isVerificationPending && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="flex items-center text-amber-600">
              <FiClock className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">Pending</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Status message */}
      {isVerificationPending && (
        <p className="mt-1 text-sm text-amber-600">
          Verification email sent. Please check your inbox.
        </p>
      )}
    </div>
  );
};

export default ProfileField;