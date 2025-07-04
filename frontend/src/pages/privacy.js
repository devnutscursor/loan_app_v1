import React from 'react';
import MainLayout from '../components/layout/MainLayout';

const PrivacyPolicy = () => {
  return (
    <MainLayout title="Privacy Policy - Loan Application System">
      <div className="bg-white py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Privacy Policy
            </h1>
            <p className="mt-4 text-lg text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
          <div className="mt-12 prose prose-lg mx-auto">
            <h2>1. Information We Collect</h2>
            <p>
              We collect information that you provide to us directly, such as when you create an account, fill out a form, or communicate with us. This may include your name, email address, phone number, financial information, and other personal details necessary for the loan application process.
            </p>

            <h2>2. How We Use Your Information</h2>
            <p>
              We use the information we collect to operate, maintain, and provide the features and functionality of our service, as well as to communicate with you, process your applications, and comply with legal obligations.
            </p>

            <h2>3. How We Share Your Information</h2>
            <p>
              We do not sell or rent your personal information to third parties. We may share your information with our partners, such as lenders and service providers, only as necessary to provide our services to you. We may also disclose your information if required by law.
            </p>

            <h2>4. Security of Your Information</h2>
            <p>
              We use a variety of security measures to protect your personal information, including encryption and access controls. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee its absolute security.
            </p>
            
            <h2>5. Your Choices About Your Information</h2>
            <p>
              You may, of course, decline to submit personal information through the service, in which case we may not be able to provide certain services to you. You may update or correct your account information at any time by logging in to your account.
            </p>

            <h2>6. Changes to Our Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email or by posting a notice on our website prior to the change becoming effective.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PrivacyPolicy; 