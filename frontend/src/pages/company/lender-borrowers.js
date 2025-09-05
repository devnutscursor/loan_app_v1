import React, { useState, useEffect } from 'react';
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
  Filter
} from 'lucide-react';

// Component for borrower card
const BorrowerCard = ({ borrower, onViewLoans }) => (
  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{borrower.name}</h3>
          <div className="flex items-center space-x-4 mt-1">
            <div className="flex items-center space-x-1 text-gray-600">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{borrower.email}</span>
            </div>
            {borrower.phone && (
              <div className="flex items-center space-x-1 text-gray-600">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{borrower.phone}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-sm text-gray-600">
              {borrower.loanCount || 0} loans
            </span>
            <span className="text-sm text-gray-600">
              ${borrower.totalLoanAmount?.toLocaleString() || '0'} total
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          borrower.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {borrower.isActive ? 'Active' : 'Inactive'}
        </span>
        <button
          onClick={() => onViewLoans(borrower._id)}
          className="flex items-center space-x-1 px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          <FileText className="h-4 w-4" />
          <span>View Loans</span>
        </button>
      </div>
    </div>
  </div>
);

const LenderBorrowers = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lenderData, setLenderData] = useState(null);
  const [borrowers, setBorrowers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'company') {
      router.push('/login');
      return;
    }

    const { lenderId } = router.query;
    if (lenderId) {
      fetchLenderData(lenderId);
    }
  }, [user, router]);

  const fetchLenderData = async (lenderId) => {
    try {
      setLoading(true);
      const response = await companyService.getLender(user.company, lenderId);
      setLenderData(response.data.data);
      
      // For now, we'll use mock data for borrowers since we don't have a specific API endpoint
      // In a real implementation, you would call an API like:
      // const borrowersResponse = await companyService.getLenderBorrowers(user.company, lenderId);
      setBorrowers(response.data.data.borrowers || []);
    } catch (error) {
      console.error('Error fetching lender data:', error);
      toast.error('Failed to load lender data');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/company/lenders');
  };

  const handleViewLoans = (borrowerId) => {
    // Navigate to lender loans page with borrower filter
    router.push(`/lender/loans?borrowerId=${borrowerId}`);
  };

  const filteredBorrowers = borrowers.filter(borrower =>
    borrower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    borrower.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <CompanyLayout title="Lender Borrowers">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CompanyLayout>
    );
  }

  if (!lenderData) {
    return (
      <CompanyLayout title="Lender Borrowers">
        <div className="text-center py-12">
          <p className="text-gray-600">Lender not found</p>
          <button
            onClick={handleBack}
            className="mt-4 text-primary hover:text-primary-dark"
          >
            Back to Lenders
          </button>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout title="Lender Borrowers">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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

        {/* Lender Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{lenderData.name}</h1>
              <p className="text-gray-600">{lenderData.email}</p>
            </div>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Borrowers</h2>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">{borrowers.length} total</span>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search borrowers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Borrowers List */}
        <div className="space-y-4">
          {filteredBorrowers.length > 0 ? (
            filteredBorrowers.map((borrower) => (
              <BorrowerCard
                key={borrower._id}
                borrower={borrower}
                onViewLoans={handleViewLoans}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'No borrowers found matching your search' : 'No borrowers found'}
              </p>
            </div>
          )}
        </div>
      </div>
    </CompanyLayout>
  );
};

export default LenderBorrowers;
