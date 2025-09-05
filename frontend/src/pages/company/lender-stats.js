import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import CompanyLayout from '../../components/layout/CompanyLayout';
import { companyService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft,
  Users, 
  DollarSign, 
  FileText, 
  TrendingUp,
  User,
  Mail,
  Phone
} from 'lucide-react';

// Component for stat cards
const StatCard = ({ title, value, icon: Icon, bgClass }) => (
  <div className={`${bgClass} rounded-xl p-6 shadow-lg`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-white opacity-90">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
      <Icon className="h-8 w-8 text-white opacity-80" />
    </div>
  </div>
);

const LenderStats = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lenderData, setLenderData] = useState(null);

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

  if (loading) {
    return (
      <CompanyLayout title="Lender Stats">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CompanyLayout>
    );
  }

  if (!lenderData) {
    return (
      <CompanyLayout title="Lender Stats">
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
    <CompanyLayout title="Lender Stats">
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
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{lenderData.name}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{lenderData.email}</span>
                </div>
                {lenderData.phone && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{lenderData.phone}</span>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  lenderData.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {lenderData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Borrowers"
            value={lenderData.metrics?.borrowerCount || 0}
            icon={Users}
            bgClass="bg-gradient-to-r from-blue-500 to-blue-600"
          />
          <StatCard
            title="Total Loans"
            value={lenderData.metrics?.totalLoans || 0}
            icon={FileText}
            bgClass="bg-gradient-to-r from-green-500 to-green-600"
          />
          <StatCard
            title="Active Loans"
            value={lenderData.metrics?.activeLoans || 0}
            icon={TrendingUp}
            bgClass="bg-gradient-to-r from-purple-500 to-purple-600"
          />
          <StatCard
            title="Total Loan Volume"
            value={`$${lenderData.metrics?.totalLoanAmount?.toLocaleString() || '0'}`}
            icon={DollarSign}
            bgClass="bg-gradient-to-r from-orange-500 to-orange-600"
          />
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push(`/lender/borrowers?lenderId=${lenderData._id}`)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Users className="h-4 w-4" />
              <span>View Borrowers</span>
            </button>
            <button
              onClick={() => router.push(`/lender/loans?lenderId=${lenderData._id}`)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>View Loans</span>
            </button>
          </div>
        </div>
      </div>
    </CompanyLayout>
  );
};

export default LenderStats;
