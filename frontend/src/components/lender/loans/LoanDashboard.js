import React from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
    User as UserIcon,
    FileText as DocumentTextIcon,
    Table as TableIcon,
    Copy as DocumentDuplicateIcon,
} from 'lucide-react';
import LoanQualificationCard from '@/components/lender/loans/LoanQualificationCard';

const LoanDashboard = ({
    loan,
    setLoan,
    fetchLoanDetails,
    id,
    documents
}) => {
    // Helper for currency formatting
    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    });

    // Helper to get status badge color
    const getStatusBadgeColor = (status) => {
        if (!status) return 'bg-gray-100 text-gray-800';

        switch (status.toLowerCase()) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'under_review':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                    {/* Loan Summary Card */}
                    {/* <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900">Loan Summary</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Loan Amount</p>
                <p className="font-medium">
                  {loan?.loanDetails?.loanAmount 
                    ? currencyFormatter.format(loan.loanDetails.loanAmount) 
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Interest Rate</p>
                <p className="font-medium">
                  {loan?.loanDetails?.interestRate 
                    ? `${loan.loanDetails.interestRate}%` 
                    : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Term</p>
                <p className="font-medium">
                  {loan?.loanDetails?.term 
                    ? `${loan.loanDetails.term} months` 
                    : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Monthly Payment</p>
                <p className="font-medium">
                  {loan?.loanDetails?.estimatedMonthlyPayment 
                    ? currencyFormatter.format(loan.loanDetails.estimatedMonthlyPayment) 
                    : 'Not calculated'}
                </p>
              </div>
            </div>
          </div> */}

                    {/* Loan Status Card */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200">
                            <h3 className="text-base font-medium text-gray-900">Loan Status</h3>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(loan?.status)}`}>
                                        {loan?.status?.toUpperCase() || 'UNKNOWN'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Last updated: {loan?.updatedAt ? new Date(loan.updatedAt).toLocaleDateString() : 'Unknown'}
                                </p>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Loan ID</span>
                                    <span className="font-medium">{loan?._id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Application Date</span>
                                    <span className="font-medium">
                                        {loan?.createdAt ? new Date(loan.createdAt).toLocaleDateString() : 'Unknown'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Loan Type</span>
                                    <span className="font-medium">{loan?.loanDetails?.loanType || 'Not specified'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Borrower Information Card */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200">
                            <h3 className="text-base font-medium text-gray-900">Borrower Information</h3>
                        </div>
                        <div className="p-4 text-sm">
                            <div className="flex items-center mb-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mr-3">
                                    <UserIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium">
                                        {loan?.borrowerDetails?.firstName
                                            ? `${loan.borrowerDetails.firstName} ${loan.borrowerDetails.middleName || ''} ${loan.borrowerDetails.lastName || ''}`
                                            : 'Unknown'}
                                    </p>
                                    <p className="text-gray-500">{loan?.borrowerDetails?.email || 'No email'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-gray-500">Phone</p>
                                    <p className="font-medium">{loan?.borrowerDetails?.phoneNumber || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">SSN</p>
                                    <p className="font-medium">{loan?.borrowerDetails?.ssn || 'Not available'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Documents Status */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200">
                            <h3 className="text-base font-medium text-gray-900">Documents Status</h3>
                        </div>
                        <div className="p-4">
                            <div className="space-y-2 text-sm">
                                {/* Required Documents */}
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Required Documents</span>
                                    <span className="font-medium">
                                        {loan?.requiredDocuments?.length || 0} items
                                    </span>
                                </div>

                                {/* Submitted Documents */}
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Submitted Documents</span>
                                    <span className="font-medium">
                                        {documents?.length || 0} items
                                    </span>
                                </div>

                                {/* Completion Rate */}
                                <div className="mt-3">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-600">Completion Rate</span>
                                        <span className="font-medium">
                                            {loan?.documentCompletionRate || 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${loan?.documentCompletionRate || 0}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="mt-3 text-right">
                                    <Link
                                        href={`/lender/loans/${id}/documents`}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        View All Documents →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    {/* Loan Qualification Card */}
                    {loan && (
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-200">
                                <h3 className="text-base font-medium text-gray-900">Loan Qualification</h3>
                            </div>
                            <div className="p-4">
                                <LoanQualificationCard
                                    loan={loan}
                                    enablePolling={false}
                                    onUpdate={(updatedLoan) => {
                                        setLoan(updatedLoan);
                                    }}
                                />
                            </div>
                        </div>
                    )}



                    {/* Milestones Progress */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200">
                            <h3 className="text-base font-medium text-gray-900">Milestones Progress</h3>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-center">
                                <div className="text-xl font-bold text-primary">
                                    {loan?.milestonesCompleted || '0'}/{loan?.totalMilestones || '5'}
                                </div>
                                <p className="text-sm text-gray-500">Milestones Completed</p>
                            </div>
                            <div className="mt-3">
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-primary h-2 rounded-full"
                                        style={{ width: `${((loan?.milestonesCompleted || 0) / (loan?.totalMilestones || 5)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LoanDashboard;