import React from 'react';
import Link from 'next/link';

/**
 * Component for displaying contact information and navigation guidance
 * Provides links to messages and dashboard
 */
const ContactInfo = () => {
  return (
    <div className="text-center text-sm text-gray-500">
      Need to contact your loan officer? Visit the Messages section or
      {' '}<Link href="/borrower/dashboard" className="text-blue-600 hover:text-blue-700">go back to dashboard</Link>.
    </div>
  );
};

export default ContactInfo;
