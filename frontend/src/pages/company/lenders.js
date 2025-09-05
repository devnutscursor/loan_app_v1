import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import CompanyLayout from '../../components/layout/CompanyLayout';
import { companyService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  Search, 
  Filter,
  Eye,
  User,
  DollarSign,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Building2
} from 'lucide-react';

// Component for lender card
const LenderCard = ({ lender, onViewStats, onViewBorrowers }) => (
  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{lender.name}</h3>
          <p className="text-sm text-gray-600">{lender.email}</p>
          <p className="text-xs text-gray-500">
            {lender.isActive ? 'Active' : 'Inactive'}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">{lender.borrowerCount} borrowers</p>
        <p className="text-xs text-gray-600">${lender.totalLoanAmount?.toLocaleString() || '0'}</p>
      </div>
    </div>
    
    <div className="flex space-x-2">
      <button
        onClick={() => onViewStats(lender._id)}
        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
      >
        <Eye className="h-4 w-4" />
        <span>View Stats</span>
      </button>
      <button
        onClick={() => onViewBorrowers(lender._id)}
        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
      >
        <Users className="h-4 w-4" />
        <span>View Borrowers</span>
      </button>
    </div>
  </div>
);

const CompanyLenders = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lenders, setLenders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLenders, setTotalLenders] = useState(0);

  const itemsPerPage = 12;

  useEffect(() => {
    if (!user || user.role !== 'company') {
      router.push('/login');
      return;
    }

    fetchLenders();
  }, [user, router, currentPage, sortBy, sortOrder, searchTerm]);

  const fetchLenders = async () => {
    try {
      setLoading(true);
      // Currently not using these params
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        sortOrder,
        search: searchTerm
      };

      const response = await companyService.getLenders(user.company);
      const data = response.data.data;
      
      setLenders(data.lenders || []);
      setTotalPages(data.totalPages || 1);
      setTotalLenders(data.totalLenders || 0);

    } catch (error) {
      console.error('Error fetching lenders:', error);
      toast.error('Failed to load lenders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleViewStats = (lenderId) => {
    router.push(`/company/lender-stats?lenderId=${lenderId}`);
  };

  const handleViewBorrowers = (lenderId) => {
    router.push(`/company/lender-borrowers?lenderId=${lenderId}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    return sortOrder === 'asc' ? 
      <ArrowUpDown className="h-4 w-4 text-primary" /> : 
      <ArrowUpDown className="h-4 w-4 text-primary rotate-180" />;
  };

  if (loading && lenders.length === 0) {
    return (
      <CompanyLayout title="Company Lenders">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout title="Company Lenders">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Lenders</h1>
            <p className="text-gray-600 mt-1">
              Manage and view all lenders in your company ({totalLenders} total)
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Building2 className="h-4 w-4" />
            <span>{user?.company?.name || 'Company'}</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search lenders by name or email..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleSort('name')}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm">Name</span>
                {getSortIcon('name')}
              </button>
              <button
                onClick={() => handleSort('borrowerCount')}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm">Borrowers</span>
                {getSortIcon('borrowerCount')}
              </button>
              <button
                onClick={() => handleSort('totalLoanAmount')}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm">Loan Volume</span>
                {getSortIcon('totalLoanAmount')}
              </button>
            </div>
          </div>
        </div>

        {/* Lenders Grid */}
        {lenders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lenders.map((lender) => (
              <LenderCard
                key={lender._id}
                lender={lender}
                onViewStats={handleViewStats}
                onViewBorrowers={handleViewBorrowers}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No lenders found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No lenders match your search criteria.' : 'No lenders have been added to your company yet.'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-primary hover:text-primary-dark font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 border rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
};

export default CompanyLenders;
