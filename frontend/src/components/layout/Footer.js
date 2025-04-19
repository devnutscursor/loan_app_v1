import React from 'react';
import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center md:justify-start space-x-6 md:order-2">
          <Link href="/terms" className="text-gray-500 hover:text-gray-600">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-gray-500 hover:text-gray-600">
            Privacy Policy
          </Link>
          <Link href="/contact" className="text-gray-500 hover:text-gray-600">
            Contact Us
          </Link>
          <Link href="/faq" className="text-gray-500 hover:text-gray-600">
            FAQ
          </Link>
          <Link href="/about" className="text-gray-500 hover:text-gray-600">
            About
          </Link>
        </div>
        <div className="mt-8 md:mt-0 md:order-1">
          <p className="text-center text-base text-gray-500">
            &copy; {currentYear} Loan Application System. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
