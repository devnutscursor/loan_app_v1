import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import CompanyLayout from '../../components/layout/CompanyLayout';
import { companyService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeft,
  Users,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  Search,
  Filter,
  X,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

import dynamic from 'next/dynamic';

// Add this at the top after imports
const CompanyLenderBorrowers = dynamic(() => import('./lender-borrowers'), {
  ssr: false
});

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

// Main component for the lender borrowers page
const LenderBorrowers = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lenderData, setLenderData] = useState(null);
  const [borrowers, setBorrowers] = useState([]);
  // const [borrowerLoans, setBorrowerLoans] = useState({});

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const fetchBorrowers = useCallback(async () => {
    const { lenderId } = router.query;
    if (!lenderId || !user) return;

    try {
      setLoading(true);
      
      // Fetch lender data and borrowers
      const [lenderResponse, borrowersResponse] = await Promise.all([
        companyService.getLender(user.company, lenderId),
        companyService.getLenderBorrowers(user.company, lenderId)
      ]);

      setLenderData(lenderResponse.data.data);
      const borrowersData = borrowersResponse.data.data || [];
      setBorrowers(borrowersData);

      setError(null);
    } catch (err) {
      console.error('Error fetching borrowers:', err);
      setError('Failed to load borrowers. Please try again later.');
      toast.error('Failed to load borrowers');
    } finally {
      setLoading(false);
    }
  }, [user, router.query]);

  // Add this effect to fetch loans for each borrower (same as lender page)
  // COMMENTED OUT: This was causing memory issues on Vercel due to sequential API calls
  // The backend already provides loanCount for each borrower, so this is unnecessary
  // useEffect(() => {
  //   const fetchBorrowerLoans = async () => {
  //     const loansMap = {};
  //     for (const borrower of borrowers) {
  //       try {
  //         const response = await companyService.getLenderBorrowerLoans(user.company, router.query.lenderId, borrower._id);
  //         loansMap[borrower._id] = response.data?.length || 0;
  //       } catch (error) {
  //         console.error(`Error fetching loans for borrower ${borrower._id}:`, error);
  //         loansMap[borrower._id] = 0;
  //       }
  //     }
  //     setBorrowerLoans(loansMap);
  //   };
  //
  //   if (borrowers.length > 0) {
  //     fetchBorrowerLoans();
  //   }
  // }, [borrowers, user.company, router.query.lenderId]);

  useEffect(() => {
    if (!user || user.role !== 'company') {
      router.push('/login');
      return;
    }

    if (router.query.lenderId) {
      fetchBorrowers();
    }
  }, [user, router, fetchBorrowers]);

  const handleBack = () => {
    router.push('/company/lenders');
  };

  const handleViewLoans = (borrowerId) => {
    // Navigate to company-specific borrower loans page
    router.push(`/company/lender-borrowers/${borrowerId}/loans?lenderId=${router.query.lenderId}`);
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

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Filter borrowers based on search term and active filter
  const filteredBorrowers = useMemo(() => {
    if (!borrowers.length) return [];

    let results = [...borrowers];

    // Apply search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      results = results.filter(borrower =>
        borrower.user?.firstName?.toLowerCase().includes(search) ||
        borrower.user?.lastName?.toLowerCase().includes(search) ||
        borrower.user?.email?.toLowerCase().includes(search) ||
        borrower.user?.phone?.includes(search)
      );
    }

    // Apply filters
    if (activeFilter === 'recent') {
      // Filter borrowers created in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      results = results.filter(borrower => new Date(borrower.createdAt) >= thirtyDaysAgo);
    } else if (activeFilter === 'hasLoans') {
      // Filter borrowers who have at least one loan
      results = results.filter(borrower => (borrower.loanCount || 0) > 0);
    }

    // Apply sorting
    results.sort((a, b) => {
      let compareA, compareB;

      switch (sortBy) {
        case 'name':
          compareA = `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.toLowerCase();
          compareB = `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.toLowerCase();
          break;
        case 'email':
          compareA = (a.user?.email || '').toLowerCase();
          compareB = (b.user?.email || '').toLowerCase();
          break;
        case 'date':
          compareA = new Date(a.createdAt || 0).getTime();
          compareB = new Date(b.createdAt || 0).getTime();
          break;
        case 'loans':
          compareA = a.loanCount || 0;
          compareB = b.loanCount || 0;
          break;
        default:
          return 0;
      }

      const compareResult = compareA > compareB ? 1 : compareA < compareB ? -1 : 0;
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });

    return results;
  }, [borrowers, searchTerm, activeFilter, sortBy, sortDirection]);

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;

    return sortDirection === 'asc' ? (
      <ChevronDown className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1 transform rotate-180" />
    );
  };

  if (!user || user.role !== 'company') {
    return null;
  }

  return (
    <CompanyLayout title="Lender Borrowers">
      <div className="py-8 px-0 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Lenders</span>
            </button>
          </div>
        </div>

        {/* Lender Info Header */}
        {lenderData && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {lenderData.name}'s Borrowers
                </h1>
                <p className="text-gray-600">{lenderData.email}</p>
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
                  placeholder="Search by name, email or phone..."
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
                    onClick={() => handleFilterChange('hasLoans')}
                    className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium 
                    ${activeFilter === 'hasLoans'
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    With Loans
                  </button>
                </div>
              </div>
            </div>

            {borrowers.length === 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No borrowers yet</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                  This lender doesn't have any borrowers associated with them yet.
                </p>
              </div>
            ) : filteredBorrowers.length === 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-600">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  No borrowers match your search criteria. Try adjusting your search or filters.
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
                    <div className="col-span-3 flex items-center cursor-pointer" onClick={() => handleSortChange('name')}>
                      <div className="flex items-center">
                        <span>Borrower Name</span>
                        {getSortIcon('name')}
                      </div>
                    </div>
                    <div className="col-span-3 flex items-center cursor-pointer" onClick={() => handleSortChange('email')}>
                      <div className="flex items-center">
                        <span>Contact Info</span>
                        {getSortIcon('email')}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSortChange('date')}>
                      <div className="flex items-center">
                        <span>Joined Date</span>
                        {getSortIcon('date')}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSortChange('loans')}>
                      <div className="flex items-center">
                        <span>Loans</span>
                        {getSortIcon('loans')}
                      </div>
                    </div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>
                </div>

                {/* Table Content */}
                <div className="divide-y divide-gray-200 min-w-[940px]">
                  {filteredBorrowers.map((borrower) => (
                    <div
                      key={borrower._id}
                      className="grid grid-cols-12 px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="col-span-3 flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <span className="text-lg font-medium">
                            {borrower.user?.firstName?.charAt(0)}{borrower.user?.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {borrower.user?.firstName} {borrower.user?.lastName}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-3">
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <span>{borrower.user?.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <span>{borrower.user?.phone || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <span>{formatDate(borrower.user?.createdAt)}</span>
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center">
                        <div className="flex items-center">
                          <FileText className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {borrower.loanCount || 0} loans
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2 flex justify-end items-center space-x-3">
                        <button
                          onClick={() => handleViewLoans(borrower._id)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          <span>View Loans</span>
                        </button>
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

export default CompanyLenderBorrowers;