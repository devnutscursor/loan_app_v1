import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import MainLayout from '../../../components/layout/MainLayout';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import { lenderService } from '../../../services/api';
import { toast } from 'react-hot-toast';
import XMLLoanUpload from '../../../components/lender/loans/XMLLoanUpload_new';
import {
  FileText,
  User,
  Calendar,
  DollarSign,
  Search,
  ChevronDown,
  Filter,
  Plus,
  X,
  Clock,
  CreditCard,
  ExternalLink,
  HomeIcon
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

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const LenderLoans = () => {
  const router = useRouter();
  const { borrowerId } = router.query;
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isXMLUploadOpen, setIsXMLUploadOpen] = useState(false);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        let response;
        if (borrowerId) {
          response = await lenderService.getBorrowerLoans(borrowerId);
          const data = response.data || [];
          setLoans(data);
        } else {
          response = await lenderService.getLoans();
          const data = response.data.data.loans || [];
          setLoans(data);
        }
        console.log("response", response.data);

      } catch (e) {
        console.error('Error fetching lender loans:', e);
        toast.error('Failed to load loans');
        setError('Failed to load loans');
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady) {
      fetchLoans();
    }
  }, [borrowerId, router.isReady]);

  // Check for newLoan query parameter to automatically open the XML upload modal
  useEffect(() => {
    if (router.isReady && router.query.newLoan === 'true') {
      setIsXMLUploadOpen(true);
      // Clean up the URL by removing the query parameter
      router.replace('/lender/loans', undefined, { shallow: true });
    }
  }, [router.isReady, router.query]);

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

  const filteredLoans = useMemo(() => {
    if (!loans.length) return [];

    let results = [...loans];

    // Apply search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      results = results.filter(loan =>
        (loan.borrowerDetails?.firstName + ' ' + loan.borrowerDetails?.lastName).toLowerCase().includes(search) ||
        (loan.loanNumber || '').toLowerCase().includes(search) ||
        (loan.loanDetails?.propertyAddress || '').toLowerCase().includes(search)
      );
    }
    
    // Create local variables for sorting based on the active filter
    let localSortBy = sortBy;
    let localSortDirection = sortDirection;
    
    // Set appropriate sort parameters based on the active filter
    if (activeFilter === 'recent') {
      // For 'Recent' filter: Sort by date (newest first)
      localSortBy = 'date';
      localSortDirection = 'desc';
    } else if (activeFilter === 'highValue') {
      // For 'High Value' filter: Sort by loan amount (highest first)
      localSortBy = 'amount';
      localSortDirection = 'desc';
    }

    // Apply sorting
    results.sort((a, b) => {
      let compareA, compareB;

      switch (localSortBy) {
        case 'borrower':
          compareA = `${a.borrowerDetails?.firstName || ''} ${a.borrowerDetails?.lastName || ''}`.toLowerCase();
          compareB = `${b.borrowerDetails?.firstName || ''} ${b.borrowerDetails?.lastName || ''}`.toLowerCase();
          break;
        case 'amount':
          compareA = a.loanDetails?.loanAmount || 0;
          compareB = b.loanDetails?.loanAmount || 0;
          break;
        case 'date':
          compareA = new Date(a.createdAt || 0).getTime();
          compareB = new Date(b.createdAt || 0).getTime();
          break;
        case 'loanNumber':
          compareA = a.loanNumber || '';
          compareB = b.loanNumber || '';
          break;
        default:
          return 0;
      }

      const compareResult = compareA > compareB ? 1 : compareA < compareB ? -1 : 0;
      return localSortDirection === 'asc' ? compareResult : -compareResult;
    });

    return results;
  }, [loans, searchTerm, activeFilter, sortBy, sortDirection]);

  const handleXMLUploadSuccess = (newLoan) => {
    // Add the new loan to the list and navigate to it
    setLoans(prevLoans => [newLoan, ...prevLoans]);
    toast.success('Loan created successfully from XML!');
    
    // Navigate to the new loan details page
    if (newLoan._id) {
      router.push(`/lender/loans/${newLoan._id}`);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['lender']}>
      <MainLayout>
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            
            <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {borrowerId ? 'Borrower Loans' : 'Active Loans'}
            </h1>
            <p className="mt-2 text-gray-600">
              {borrowerId
                ? "Manage this borrower's loan applications"
                : 'List of active loan applications from all your borrowers'}
            </p>            </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsXMLUploadOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Loan
                </button>
              </div>
            
          </div>

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
                    placeholder="Search by borrower name or loan number..."
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
                      onClick={() => handleFilterChange('recent')}
                      className={`relative inline-flex items-center px-4 py-2 border-t border-b border-gray-300 text-sm font-medium 
                      ${activeFilter === 'recent'
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      Recent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFilterChange('highValue')}
                      className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium 
                      ${activeFilter === 'highValue'
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      High Value
                    </button>
                  </div>


                </div>
              </div>

              {loans.length === 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600">
                    <CreditCard className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No active loans</h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                    {borrowerId
                      ? "This borrower doesn't have any active loans. You can create a new loan application for them."
                      : 'Get started by creating a new loan application for your borrowers.'}
                  </p>                  <div className="mt-6">
                    <button
                      onClick={() => setIsXMLUploadOpen(true)}
                      className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
                      Create Loan Application
                    </button>
                  </div>
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
                <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
                  {/* Table Header */}
                  <div className="bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="col-span-3 flex items-center cursor-pointer" onClick={() => handleSortChange('borrower')}>
                        <div className="flex items-center">
                          <span>Borrower</span>
                          {getSortIcon('borrower')}
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSortChange('loanNumber')}>
                        <div className="flex items-center">
                          <span>Loan #</span>
                          {getSortIcon('loanNumber')}
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
                          <span>Created</span>
                          {getSortIcon('date')}
                        </div>
                      </div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>
                  </div>

                  {/* Table Content */}
                  <div className="divide-y divide-gray-200">
                    {filteredLoans.map((loan) => (
                      <div
                        key={loan._id}
                        className="grid grid-cols-12 px-6 py-4 hover:bg-gray-50 transition-colors duration-150 items-center"
                      >
                        <div className="col-span-3 flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <span className="text-lg font-medium">
                              {loan.borrowerDetails?.firstName?.charAt(0)}{loan.borrowerDetails?.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">
                              {loan.borrowerDetails?.firstName} {loan.borrowerDetails?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {loan.borrowerDetails?.email}
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <FileText className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span>{loan.loanNumber || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="col-span-3">
                          <div className="flex items-center text-sm text-gray-500">
                            <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span>${loan.loanDetails?.loanAmount?.toLocaleString() || '0'}</span>
                          </div>
                        </div>

                        <div className="col-span-2 flex items-center">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span>{formatDate(loan.createdAt)}</span>
                          </div>
                        </div>
                        <div className="col-span-2 flex justify-end items-center space-x-3">
                          <Link href={`/lender/loans/${loan._id}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            <span>View Details</span>
                          </Link>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}            </div>
          )}
        </div>

        {/* XML Upload Modal */}
        <XMLLoanUpload
          isOpen={isXMLUploadOpen}
          onClose={() => setIsXMLUploadOpen(false)}
          onSuccess={handleXMLUploadSuccess}
        />
      </MainLayout>
    </ProtectedRoute>
  );
};

export default LenderLoans;