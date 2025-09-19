import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { adminService } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  FileText,
  Calendar,
  DollarSign,
  Search,
  ChevronDown,
  X,
  CreditCard,
  ExternalLink
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

const AdminLoansPage = () => {
  const router = useRouter();
  const [loans, setLoans] = useState([]);
  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedBorrower, setSelectedBorrower] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  // Removed borrowerIdMapping since we're filtering by name now

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch loans and borrowers in parallel
        const [loansResponse, borrowersResponse] = await Promise.all([
          adminService.getLoans(),
          adminService.getUsers({ role: 'borrower' })
        ]);
        
        console.log('Admin loans response:', loansResponse.data);
        console.log('Admin borrowers response:', borrowersResponse.data);
        
        const loansData = loansResponse.data.data || loansResponse.data.loans || [];
        const borrowersData = borrowersResponse.data.data || borrowersResponse.data.users || [];
        
        // Debug: Check if Asad Ali is in the borrowers list
        const asadAli = borrowersData.find(borrower => 
          borrower.firstName?.toLowerCase() === 'asad' && 
          borrower.lastName?.toLowerCase() === 'ali'
        );
        console.log('Asad Ali found in borrowers:', asadAli);
        console.log('All borrower IDs:', borrowersData.map(b => ({ id: b._id, name: `${b.firstName} ${b.lastName}` })));
        
        setLoans(loansData);
        setBorrowers(borrowersData);
      } catch (e) {
        console.error('Error fetching admin data:', e);
        toast.error('Failed to load data');
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  // Removed getBorrowerIdForUser function since we're filtering by name now

  const handleBorrowerChange = (e) => {
    const selectedBorrowerName = e.target.value;
    setSelectedBorrower(selectedBorrowerName);
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

  const [filteredLoans, setFilteredLoans] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);

  // Effect to handle filtering with async borrower ID lookup
  useEffect(() => {
    const applyFilters = async () => {
      if (!loans.length) {
        setFilteredLoans([]);
        return;
      }

      setFilterLoading(true);
      let results = [...loans];

      // Apply borrower filter by name instead of ID
      if (selectedBorrower !== 'all') {
        results = results.filter(loan => {
          const borrowerName = `${loan.borrowerDetails?.firstName || ''} ${loan.borrowerDetails?.lastName || ''}`.trim();
          return borrowerName.toLowerCase() === selectedBorrower.toLowerCase();
        });
      }

          // Apply search
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase().trim();
        results = results.filter(loan =>
          (loan.borrowerDetails?.firstName + ' ' + loan.borrowerDetails?.lastName).toLowerCase().includes(search) ||
          (loan.loanNumber || '').toLowerCase().includes(search) ||
          (loan._id || '').toLowerCase().includes(search) ||
          (loan.loanDetails?.loanAmount || 0).toString().includes(search)
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

      setFilteredLoans(results);
      setFilterLoading(false);
    };

    applyFilters();
  }, [loans, searchTerm, activeFilter, selectedBorrower, sortBy, sortDirection]);

  return (
    <ProtectedRoute roles={['admin']}>
      <MainLayout>
        <div className="py-8 px-0 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Active Loans</h1>
              <p className="mt-2 text-gray-600">
                List of active loan applications from all borrowers across all lenders
              </p>
            </div>
          </div>

          {loading || filterLoading ? (
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
              <div className="flex flex-col sm:flex-row justify-between gap-4 items-center sm:items-end">
                {/* Search Bar */}
                <div className="relative flex-grow max-w-md w-full">
                  <label htmlFor="search-input" className="block text-sm font-medium text-gray-700">
                    Search
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Search by borrower name or loan number..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>
                </div>

                {/* Filter Dropdowns */}
                <div className="flex gap-4">
                  {/* Borrower Filter */}
                  <div>
                    <label htmlFor="borrower-filter" className="block text-sm font-medium text-gray-700">
                      Borrower
                    </label>
                    <select
                      id="borrower-filter"
                      value={selectedBorrower}
                      onChange={handleBorrowerChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                    >
                      <option value="all">All Borrowers</option>
                      {borrowers.map((borrower) => (
                        <option key={borrower._id} value={`${borrower.firstName} ${borrower.lastName}`}>
                          {borrower.firstName} {borrower.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Dropdown */}
                  <div>
                    <label htmlFor="filter-dropdown" className="block text-sm font-medium text-gray-700">
                      Filter
                    </label>
                    <select
                      id="filter-dropdown"
                      value={activeFilter}
                      onChange={(e) => handleFilterChange(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                    >
                      <option value="all">All Loans</option>
                      <option value="recent">Recent</option>
                      <option value="highValue">High Value</option>
                    </select>
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
                    There are no active loan applications in the system yet.
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
                        setSelectedBorrower('all');
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
                  <div className="divide-y divide-gray-200 min-w-[940px]">
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
                            <div className="text-sm text-gray-500 max-w-[160px] truncate">
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
              )}
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default AdminLoansPage;