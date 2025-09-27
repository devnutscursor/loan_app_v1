import React from 'react';
import { Copy, Link } from 'lucide-react';

const QRCodeTab = ({ generateGeneralLink, copySuccess, onCopyToClipboard }) => {
  return (
    <>
      <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <Link className="h-5 w-5" />
          </div>
          <h2 className="ml-3 text-lg font-medium text-gray-900">QR Code</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">Use this QR code for printed materials or quick sharing</p>
      </div>
      
      <div className="p-6">
        <div className="flex flex-col items-center space-y-6">
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateGeneralLink())}`} 
              alt="QR Code for borrower registration" 
              className="h-52 w-52"
            />
          </div>
          <button
            type="button"
            onClick={() => onCopyToClipboard(generateGeneralLink(), 'qr')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Copy className="h-4 w-4 mr-2" />
            {copySuccess === 'qr' ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </>
  );
};

export default QRCodeTab;
