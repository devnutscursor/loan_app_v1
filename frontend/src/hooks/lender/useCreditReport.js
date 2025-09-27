import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import customAxios from '../../utils/axios';

const useCreditReport = () => {
  const router = useRouter();
  const { id: loanId } = router.query;
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [creditReport, setCreditReport] = useState(null);
  const [reportStatus, setReportStatus] = useState(null);
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState({
    equifax: true,
    experian: true,
    transunion: true
  });

  // Check if user is lender
  useEffect(() => {
    if (user && user.role !== 'lender') {
      toast.error('Access denied. Only lenders can view credit reports.');
      router.push('/dashboard');
    }
  }, [user, router]);

  // Fetch credit report status on component mount
  useEffect(() => {
    if (loanId && user?.role === 'lender') {
      fetchCreditReportStatus();
    }
  }, [loanId, user]);

  const fetchCreditReportStatus = async () => {
    try {
      setLoading(true);
      const response = await customAxios.get(`/api/v1/credit-report/${loanId}/status`);
      setReportStatus(response.data.data);
      console.log("REPORT STATUS: ", response.data.data);
      
      if (response.data.data.hasActiveReport) {
        fetchCreditReport();
      }
    } catch (error) {
      console.error('Error fetching credit report status:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch credit report status');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditReport = async () => {
    try {
      const response = await customAxios.get(`/api/v1/credit-report/${loanId}`);
      setCreditReport(response.data.data);
    } catch (error) {
      console.error('Error fetching credit report:', error);
      toast.error('Failed to fetch credit report details');
    }
  };

  const handleCreateReport = async () => {
    setLoading(true);
    try {
      const response = await customAxios.post(`/api/v1/credit-report/${loanId}`, {
        providers: selectedProviders
      });
      
      // Extract both status and report data from the response
      const responseData = response.data.data;
      
      // Update both states with the complete data
      setReportStatus({
        hasActiveReport: responseData.hasActiveReport,
        status: responseData.status,
        createdAt: responseData.createdAt,
        expiresAt: responseData.expiresAt,
        isExpired: responseData.isExpired,
        providers: responseData.providers,
        avgCreditScore: responseData.avgCreditScore
      });
      
      setCreditReport({
        id: responseData.id,
        loanId: responseData.loanId,
        borrowerData: responseData.borrowerData,
        creditScores: responseData.creditScores,
        reportFile: responseData.reportFile,
        accessCount: responseData.accessCount,
        lastAccessed: responseData.lastAccessed
      });
      
      toast.success('Credit report created successfully');
      setShowProviderForm(false);
      
    } catch (error) {
      console.error('Error creating credit report:', error);
      toast.error('Failed to create credit report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshReport = async () => {
    setLoading(true);
    try {
      const response = await customAxios.put(`/api/v1/credit-report/${loanId}/refresh`);
      
      // Extract both status and report data from the response
      const responseData = response.data.data;
      
      // Update both states with the complete data
      setReportStatus({
        hasActiveReport: responseData.hasActiveReport,
        status: responseData.status,
        createdAt: responseData.createdAt,
        expiresAt: responseData.expiresAt,
        isExpired: responseData.isExpired,
        providers: responseData.providers,
        avgCreditScore: responseData.avgCreditScore
      });
      
      setCreditReport({
        id: responseData.id,
        loanId: responseData.loanId,
        borrowerData: responseData.borrowerData,
        creditScores: responseData.creditScores,
        reportFile: responseData.reportFile,
        accessCount: responseData.accessCount,
        lastAccessed: responseData.lastAccessed
      });
      
      toast.success('Credit report refreshed successfully');
      
    } catch (error) {
      console.error('Error refreshing credit report:', error);
      toast.error('Failed to refresh credit report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async () => {
    try {
      setFileLoading(true);
      const response = await customAxios.get(`/api/v1/credit-report/${loanId}/file`);
      const { fileUrl } = response.data.data;
      
      // Open the report in a new tab
      window.open(fileUrl, '_blank');
      
    } catch (error) {
      console.error('Error downloading credit report:', error);
      toast.error('Failed to download credit report');
    } finally {
      setFileLoading(false);
    }
  };

  const handleProviderChange = (provider, enabled) => {
    setSelectedProviders(prev => ({
      ...prev,
      [provider]: enabled
    }));
  };

  const handleCreateReportClick = () => {
    setShowProviderForm(true);
  };

  const handleCancelProviderForm = () => {
    setShowProviderForm(false);
  };

  const handleBack = () => {
    router.back();
  };

  return {
    // Data
    loanId,
    user,
    creditReport,
    reportStatus,
    selectedProviders,
    
    // Loading states
    loading,
    fileLoading,
    showProviderForm,
    
    // Event handlers
    handleCreateReport,
    handleRefreshReport,
    handleViewReport,
    handleProviderChange,
    handleCreateReportClick,
    handleCancelProviderForm,
    handleBack
  };
};

export default useCreditReport;
