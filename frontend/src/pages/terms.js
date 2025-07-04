import React from 'react';
import MainLayout from '../components/layout/MainLayout';

const TermsOfService = () => {
  return (
    <MainLayout title="Terms of Service - Loan Application System">
      <div className="bg-white py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Terms of Service
            </h1>
            <p className="mt-4 text-lg text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
          <div className="mt-12 prose prose-lg mx-auto">
            <h2>1. Introduction</h2>
            <p>
              Welcome to our Loan Application System. These terms and conditions outline the rules and regulations for the use of our website and services. By accessing this website, we assume you accept these terms and conditions. Do not continue to use our platform if you do not agree to all of the terms and conditions stated on this page.
            </p>

            <h2>2. Intellectual Property Rights</h2>
            <p>
              Other than the content you own, under these Terms, our company and/or its licensors own all the intellectual property rights and materials contained in this Website. You are granted a limited license only for purposes of viewing the material contained on this Website.
            </p>

            <h2>3. Restrictions</h2>
            <p>You are specifically restricted from all of the following:</p>
            <ul>
              <li>publishing any Website material in any other media;</li>
              <li>selling, sublicensing and/or otherwise commercializing any Website material;</li>
              <li>publicly performing and/or showing any Website material;</li>
              <li>using this Website in any way that is or may be damaging to this Website;</li>
              <li>using this Website in any way that impacts user access to this Website;</li>
              <li>using this Website contrary to applicable laws and regulations, or in any way may cause harm to the Website, or to any person or business entity;</li>
              <li>engaging in any data mining, data harvesting, data extracting or any other similar activity in relation to this Website;</li>
              <li>using this Website to engage in any advertising or marketing.</li>
            </ul>

            <h2>4. Your Content</h2>
            <p>
              In these Website Standard Terms and Conditions, "Your Content" shall mean any audio, video text, images or other material you choose to display on this Website. By displaying Your Content, you grant our company a non-exclusive, worldwide irrevocable, sub-licensable license to use, reproduce, adapt, publish, translate and distribute it in any and all media.
            </p>

            <h2>5. No warranties</h2>
            <p>
              This Website is provided "as is," with all faults, and our company expresses no representations or warranties, of any kind related to this Website or the materials contained on this Website. Also, nothing contained on this Website shall be interpreted as advising you.
            </p>

            <h2>6. Limitation of liability</h2>
            <p>
              In no event shall our company, nor any of its officers, directors and employees, be held liable for anything arising out of or in any way connected with your use of this Website whether such liability is under contract. Our company, including its officers, directors and employees shall not be held liable for any indirect, consequential or special liability arising out of or in any way related to your use of this Website.
            </p>

            <h2>7. Governing Law & Jurisdiction</h2>
            <p>
              These Terms will be governed by and interpreted in accordance with the laws of the State, and you submit to the non-exclusive jurisdiction of the state and federal courts located in for the resolution of any disputes.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TermsOfService; 