import React, { useEffect, useRef } from 'react';
import { X, Upload, Edit3 } from 'lucide-react';

/**
 * NewLoanModal Component
 * 
 * Modal for selecting loan creation method - XML upload or manual creation
 */
const NewLoanModal = ({ 
  isOpen, 
  onClose, 
  onXMLUpload, 
  onManualCreate 
}) => {
  const modalRef = useRef(null);
  const firstButtonRef = useRef(null);

  // Handle keyboard navigation and focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the first button when modal opens
      if (firstButtonRef.current) {
        firstButtonRef.current.focus();
      }

      // Handle escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      // Handle tab navigation to trap focus within modal
      const handleTab = (e) => {
        if (e.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          if (focusableElements && focusableElements.length > 0) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
              // Shift + Tab
              if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
              }
            } else {
              // Tab
              if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
              }
            }
          }
        }
      };

      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTab);

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('keydown', handleTab);
      };
    }
  }, [isOpen, onClose]);

  // Handle click outside to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 
            id="modal-title" 
            className="text-xl font-semibold text-gray-900"
          >
            Create New Loan
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md p-1"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Choose how you'd like to create a new loan application:
          </p>
          
          <div className="space-y-4">
            {/* XML Upload Option */}
            <button
              ref={firstButtonRef}
              onClick={onXMLUpload}
              className="w-full flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 group"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <Upload size={24} />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary transition-colors">
                  Upload XML File
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Import loan data from an existing XML file
                </p>
              </div>
            </button>

            {/* Manual Creation Option */}
            <button
              onClick={onManualCreate}
              className="w-full flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 group"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <Edit3 size={24} />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary transition-colors">
                  Create Manually
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Fill out the loan application form step by step
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewLoanModal;