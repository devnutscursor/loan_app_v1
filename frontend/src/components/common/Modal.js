import React from 'react';
import { X } from 'lucide-react';

/**
 * Simple Modal component without dependencies on headlessui
 * 
 * @param {boolean} isOpen - Whether the modal is open or not
 * @param {function} onClose - Function to call when the modal is closed
 * @param {string} title - The title of the modal
 * @param {React.ReactNode} children - The content of the modal
 * @param {string} size - The size of the modal (sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl)
 * @returns {React.ReactElement}
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  // Map size to Tailwind classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  };
  
  const maxWidthClass = sizeClasses[size] || sizeClasses.md;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" 
        onClick={onClose}
      />

      {/* Modal container for centering */}
      <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center">
        {/* Modal panel */}
        <div
          className={`w-full ${maxWidthClass} p-0 text-left bg-white rounded-lg shadow-xl overflow-hidden transform transition-all`}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {title}
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          
          {/* Content */}
          <div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
