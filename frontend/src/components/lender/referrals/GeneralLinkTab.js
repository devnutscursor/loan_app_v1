import React from 'react';
import { Copy, Link, ArrowRight } from 'lucide-react';

const GeneralLinkTab = ({ generateGeneralLink, copySuccess, onCopyToClipboard }) => {
  return (
    <>
      <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <Link className="h-5 w-5" />
          </div>
          <h2 className="ml-3 text-lg font-medium text-gray-900">Borrower Registration Link</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">Share this link with potential borrowers to register them under your account</p>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="general-link" className="block text-sm font-medium text-gray-700 mb-1">
              Your registration link
            </label>
            <div className="flex rounded-md shadow-sm">
              <input
                type="text"
                id="general-link"
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={generateGeneralLink()}
                readOnly
              />
              <button
                type="button"
                onClick={() => onCopyToClipboard(generateGeneralLink(), 'general')}
                className={`inline-flex items-center px-4 py-2 border border-l-0 rounded-r-md text-sm font-medium ${copySuccess === 'general' 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'}`}
              >
                <Copy className={`h-4 w-4 mr-2 ${copySuccess === 'general' ? 'text-green-600' : 'text-gray-500'}`} />
                {copySuccess === 'general' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">How it works</h3>
            <ul className="space-y-3">
              {[
                'Be directed to a registration page with your lender ID',
                'Borrowers create accounts associated with you',
                'New borrowers appear in your dashboard',
                'All their loans will be under your management'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-blue-500">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                  <span className="ml-2 text-sm text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default GeneralLinkTab;
