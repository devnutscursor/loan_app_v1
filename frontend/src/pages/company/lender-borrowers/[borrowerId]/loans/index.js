import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import CompanyLayout from '../../../../../components/layout/CompanyLayout';
import { companyService } from '../../../../../services/api';
import { useAuth } from '../../../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  FileText,
  Calendar,
  DollarSign,
  Search,
  ChevronDown,
  X,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="space-y-6">
    <div className="flex justify-between animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-1/4"></div>
      <div className="h-10 bg-gray-200 rounded w-1/6"></div>
    </div>

    <div className="flex justify-between space-x-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
      <div className="h-10 bg-gray-200 rounded-lg w-1/4"></div>
    </div>

    <div className="border rounded-lg overflow-hidden">
      <div className="h-12 bg-gray-100 animate-pulse"></div>
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="border-t border-gray-200 h-16 animate-pulse flex">
          <div className="w-1/4 p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="w-1/4 p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="w-1/4 p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="w-1/4 p-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const CompanyBorrowerLoans = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { borrowerId, lenderId } = router.query;
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [borrowerInfo, setBorrowerInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        
        if (!borrowerId || !lenderId || !user) {
          setError('Missing required parameters');
          return;
        }

        // Fetch borrower loans using company service
        const response = await companyService.getLenderBorrowerLoans(user.company, lenderId, borrowerId);
        console.log("ALL the loans", response.data);
        const data = response.data.data.loans || [];
        setLoans(data);

        // Fetch borrower info for header
        try {
          const borrowerResponse = await companyService.getLenderBorrowers(user.company, lenderId);
          const borrowers = borrowerResponse.data.data || [];
          const borrower = borrowers.find(b => b._id === borrowerId);
          if (borrower) {
            setBorrowerInfo(borrower);
          }
        } catch (err) {
          console.warn('Could not fetch borrower info:', err);
        }

        console.log("response", response.data);

      } catch (e) {
        console.error('Error fetching borrower loans:', e);
        toast.error('Failed to load loans');
        setError('Failed to load loans');
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady && user) {
      fetchLoans();
    }
  }, [borrowerId, lenderId, router.isReady, user]);

  const handleBack = () => {
    router.push(`/company/lender-borrowers?lenderId=${lenderId}`);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleSortChange = (column) => {
    if (sortBy === column) {
      toggleSortDirection();
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;

    return sortDirection === 'asc' ? (
      <ChevronDown className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1 transform rotate-180" />
    );
  };

  // Filter and sort loans
  const filteredLoans = useMemo(() => {
    if (!loans.length) return [];

    let results = [...loans];

    // Apply search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      results = results.filter(loan =>
        loan.loanDetails?.loanNumber?.toLowerCase().includes(search) ||
        loan.status?.toLowerCase().includes(search) ||
        loan.loanDetails?.loanAmount?.toString().includes(search)
      );
    }

    // Apply filters
    if (activeFilter === 'pending') {
      results = results.filter(loan => 
        ['Application Submitted', 'In Review', 'Pending Documents'].includes(loan.status)
      );
    } else if (activeFilter === 'approved') {
      results = results.filter(loan => 
        ['Conditional Approval', 'Clear to Close', 'Closed', 'Funded'].includes(loan.status)
      );
    } else if (activeFilter === 'rejected') {
      results = results.filter(loan => 
        ['Rejected', 'Withdrawn'].includes(loan.status)
      );
    }

    // Apply sorting
    results.sort((a, b) => {
      let compareA, compareB;

      switch (sortBy) {
        case 'date':
          compareA = new Date(a.createdAt || 0).getTime();
          compareB = new Date(b.createdAt || 0).getTime();
          break;
        case 'amount':
          compareA = a.loanDetails?.loanAmount || 0;
          compareB = b.loanDetails?.loanAmount || 0;
          break;
        case 'status':
          compareA = (a.status || '').toLowerCase();
          compareB = (b.status || '').toLowerCase();
          break;
        case 'number':
          compareA = (a.loanDetails?.loanNumber || '').toLowerCase();
          compareB = (b.loanDetails?.loanNumber || '').toLowerCase();
          break;
        default:
          return 0;
      }

      const compareResult = compareA > compareB ? 1 : compareA < compareB ? -1 : 0;
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });

    return results;
  }, [loans, searchTerm, activeFilter, sortBy, sortDirection]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Application Submitted':
      case 'In Review':
      case 'Pending Documents':
        return 'bg-yellow-100 text-yellow-800';
      case 'Conditional Approval':
      case 'Clear to Close':
        return 'bg-green-100 text-green-800';
      case 'Closed':
      case 'Funded':
        return 'bg-blue-100 text-blue-800';
      case 'Rejected':
      case 'Withdrawn':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || user.role !== 'company') {
    return null;
  }

  return (
    <CompanyLayout title="Borrower Loans">
      <div className="py-8 px-0 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Borrowers</span>
            </button>
          </div>
        </div>

        {/* Borrower Info Header */}
        {borrowerInfo && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium text-blue-600">
                  {borrowerInfo.user?.firstName?.charAt(0)}{borrowerInfo.user?.lastName?.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {borrowerInfo.user?.firstName} {borrowerInfo.user?.lastName}'s Loans
                </h1>
                <p className="text-gray-600">{borrowerInfo.user?.email}</p>
              </div>
            </div>
          </div>
        )}


        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by loan number, status or amount..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                <div className="inline-flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleFilterChange('all')}
                    className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium 
                    ${activeFilter === 'all'
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterChange('pending')}
                    className={`relative inline-flex items-center px-4 py-2 border-t border-b border-gray-300 text-sm font-medium 
                    ${activeFilter === 'pending'
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterChange('approved')}
                    className={`relative inline-flex items-center px-4 py-2 border-t border-b border-gray-300 text-sm font-medium 
                    ${activeFilter === 'approved'
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    Approved
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterChange('rejected')}
                    className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium 
                    ${activeFilter === 'rejected'
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    Rejected
                  </button>
                </div>
              </div>
            </div>

            {loans.length === 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No loans yet</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                  This borrower doesn't have any loan applications yet.
                </p>
              </div>
            ) : filteredLoans.length === 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-600">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  No loans match your search criteria. Try adjusting your search or filters.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setActiveFilter('all');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <X className="h-5 w-5 mr-2" aria-hidden="true" />
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-x-auto rounded-lg border border-gray-200">
                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200 min-w-[940px]">
                  <div className="grid grid-cols-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-3 flex items-center cursor-pointer" onClick={() => handleSortChange('number')}>
                      <div className="flex items-center">
                        <span>Loan Number</span>
                        {getSortIcon('number')}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSortChange('status')}>
                      <div className="flex items-center">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </div>
                    <div className="col-span-3 flex items-center cursor-pointer" onClick={() => handleSortChange('amount')}>
                      <div className="flex items-center">
                        <span>Loan Amount</span>
                        {getSortIcon('amount')}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSortChange('date')}>
                      <div className="flex items-center">
                        <span>Created Date</span>
                        {getSortIcon('date')}
                      </div>
                    </div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>
                </div>

                {/* Table Content */}
                <div className="divide-y divide-gray-200 min-w-[940px]">
                  {filteredLoans.map((loan) => (
                    <div
                      key={loan._id}
                      className="grid grid-cols-12 px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="col-span-3 flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {loan.loanNumber || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                          {loan.status || 'N/A'}
                        </span>
                      </div>

                      <div className="col-span-3 flex items-center">
                        <div className="flex items-center text-sm text-gray-500">
                          <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 items-center justify-center" />
                          <span>{loan.loanDetails?.loanAmount?.toLocaleString() || '0'}</span>
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <span>{formatDate(loan.createdAt)}</span>
                        </div>
                      </div>
                      <div className="col-span-2 flex justify-end items-center space-x-3">
                        <Link href={`/company/loan-details/${loan._id}?borrowerId=${borrowerId}&lenderId=${lenderId}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          <span>View Details</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </CompanyLayout>
  );
};

export default CompanyBorrowerLoans;

