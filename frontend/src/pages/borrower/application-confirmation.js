import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MilestoneTimeline } from '../../components/common/milestones/MilestoneTimeline';

/**
 * Application Confirmation Page
 * 
 * Displayed after a borrower successfully submits a loan application.
 * Shows confirmation details and next steps in the process.
 */
const ApplicationConfirmationPage = () => {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        // In a real app, this would be an API call
        // const response = await api.get(`/applications/${id}`);
        // setApplication(response.data);
        
        // For demo, we'll use mock data
        const mockApplication = {
          id: id || 'app-' + Date.now(),
          applicationNumber: 'LN' + Math.floor(100000 + Math.random() * 900000),
          submittedAt: new Date().toISOString(),
          status: 'submitted',
          loanOfficer: {
            id: 'lo-1',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@loancompany.com',
            phone: '(555) 123-4567'
          },
          milestones: [
            { id: 'application', name: 'Application Submitted', status: 'completed', date: new Date() },
            { id: 'review', name: 'Initial Review', status: 'current', date: null },
            { id: 'verification', name: 'Document Verification', status: 'pending', date: null },
            { id: 'processing', name: 'Processing', status: 'pending', date: null },
            { id: 'underwriting', name: 'Underwriting', status: 'pending', date: null },
            { id: 'approval', name: 'Final Approval', status: 'pending', date: null },
            { id: 'closing', name: 'Closing', status: 'pending', date: null }
          ]
        };
        
        setApplication(mockApplication);
        setLoading(false);
      } catch (error) {
        console.error('Error loading application data:', error);
        setLoading(false);
      }
    };

    fetchApplicationData();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-sm text-gray-500">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No application found</h3>
          <p className="mt-1 text-sm text-gray-500">
            We couldn't find the application you're looking for.
          </p>
          <div className="mt-6">
            <Link to="/borrower/apply" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              Start New Application
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Success Message */}
      <div className="rounded-md bg-green-50 p-4 mb-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Application Submitted Successfully</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                Thank you for submitting your loan application. Your application is now under review.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Application Details */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Application Details</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Summary and status of your loan application.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Application number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{application.applicationNumber}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Submission date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(application.submittedAt)}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Submitted
                </span>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Loan officer</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {application.loanOfficer.name}<br />
                <span className="text-gray-500">
                  {application.loanOfficer.email} | {application.loanOfficer.phone}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-white shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Application Timeline</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Track the progress of your application through these key milestones.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <MilestoneTimeline milestones={application.milestones} />
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Next Steps</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            What to expect during the loan processing.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <ol className="space-y-4 list-decimal list-inside text-sm text-gray-700">
            <li>
              <strong>Initial Review</strong> (1-2 business days)<br />
              Our team will review your application and may contact you for additional information or clarification.
            </li>
            <li>
              <strong>Document Verification</strong> (3-5 business days)<br />
              We'll verify all the documents you've submitted, including employment, income, and credit history.
            </li>
            <li>
              <strong>Processing</strong> (3-7 business days)<br />
              Your application will be processed by our loan processing team, who will prepare your file for underwriting.
            </li>
            <li>
              <strong>Underwriting</strong> (5-10 business days)<br />
              Our underwriting team will assess your application against our lending criteria and make a decision.
            </li>
            <li>
              <strong>Final Approval</strong> (1-2 business days)<br />
              Upon approval, you'll receive final terms and conditions for your loan.
            </li>
            <li>
              <strong>Closing</strong> (Scheduled with you)<br />
              We'll schedule a closing date where you'll sign the final paperwork and complete the loan process.
            </li>
          </ol>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
        <Link
          to="/borrower/dashboard"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Go to Dashboard
        </Link>
        
        <Link
          to="/borrower/milestones"
          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          View Milestones
        </Link>
        
        <Link
          to="/borrower/documents"
          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Upload Additional Documents
        </Link>
        
        <Link
          to="/borrower/messages"
          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Contact Loan Officer
        </Link>
      </div>
    </div>
  );
};

export default ApplicationConfirmationPage;
