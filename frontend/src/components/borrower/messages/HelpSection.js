import React from 'react';

/**
 * Component displaying help and support information for borrowers
 * Provides contact information and guidance for using the messaging system
 */
const HelpSection = () => {
  return (
    <div className="mt-6 bg-blue-50 rounded-lg p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">Help & Support</h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>
              If you have any questions about your loan application or need assistance, message your loan officer directly through this interface. They typically respond within 24 hours on business days.
            </p>
            <p className="mt-2">
              For urgent matters, please call our customer support at <a href="tel:+18005551234" className="font-medium">1-800-555-1234</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSection;
