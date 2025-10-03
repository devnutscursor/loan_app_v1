import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import customAxios from '../../utils/axios';
import CredentialService from '../../services/api/creditVendorCredential.service';
import { useLenderCredentials } from './useLenderCredentials';

const useCreditReport = () => {
  const router = useRouter();
  const { id: loanId, lenderId } = router.query;
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

  // Credential selection & liabilities import
  const [selectedCredentialId, setSelectedCredentialId] = useState('');
  const [importMethod, setImportMethod] = useState('merge'); // merge | dont_merge | override
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState(null);

  // Load lender credentials (personal + organization)
  const userId = user?._id;
  const companyId = user?.company;
  const lenderCreds = useLenderCredentials({ userId, companyId });
  const personalCredentials = useMemo(() => lenderCreds.credentials || [], [lenderCreds.credentials]);
  // Organization credentials fetched on-demand when needed via scope=both; we can lazy load below
  const [organizationCredentials, setOrganizationCredentials] = useState([]);

  // Check if user is lender or company
  useEffect(() => {
    if (user && user.role !== 'lender' && user.role !== 'company') {
      toast.error('Access denied. Only lenders and companies can view credit reports.');
      router.push('/dashboard');
    }
  }, [user, router]);

  // Fetch credit report status on component mount
  useEffect(() => {
    if (loanId && (user?.role === 'lender' || user?.role === 'company')) {
      fetchCreditReportStatus();
    }
  }, [loanId, user]);

  // Load organization credentials when provider form is shown (for lender)
  useEffect(() => {
    const loadOrg = async () => {
      if (!userId) return;
      const res = await CredentialService.listForLender(userId, { scope: 'both' });
      if (res.success) {
        const data = res.data;
        console.log("ORGANIZATION CREDENTIALS: ", res);
        // When scope=both, backend returns { user: [...], company: [...] }
        if (data && Array.isArray(data.user) && Array.isArray(data.company)) {
          setOrganizationCredentials(data.company);
        } else if (Array.isArray(res.data)) {
          // Fallback if API returns only user creds
          setOrganizationCredentials([]);
        }
      }
    };
    if (showProviderForm && (user?.role === 'lender' || user?.role === 'company')) {
      loadOrg();
    }
  }, [showProviderForm, userId, user]);

  // Helper function to get lenderId - use from router query or fallback to API
  const getLenderId = async () => {
    // If lenderId is passed via router query, use it
    if (lenderId) {
      return lenderId;
    }
    
    // Fallback: fetch from API (this should rarely happen)
    try {
      const response = await customAxios.get(`/api/v1/loans/${loanId}`);
      return response.data.data.lender;
    } catch (error) {
      console.error('Error fetching loan details:', error);
      throw new Error('Failed to fetch loan details');
    }
  };

  const fetchCreditReportStatus = async () => {
    try {
      setLoading(true);
      const currentLenderId = await getLenderId();
      const response = await customAxios.get(`/api/v1/credit-report/${loanId}/${currentLenderId}/status`);
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
      const currentLenderId = await getLenderId();
      const response = await customAxios.get(`/api/v1/credit-report/${loanId}/${currentLenderId}`);
      setCreditReport(response.data.data);
    } catch (error) {
      console.error('Error fetching credit report:', error);
      toast.error('Failed to fetch credit report details');
    }
  };

  const handleCreateReport = async () => {
    setLoading(true);
    try {
      const currentLenderId = await getLenderId();
      const response = await customAxios.post(`/api/v1/credit-report/${loanId}/${currentLenderId}`, {
        providers: selectedProviders,
        credentialId: selectedCredentialId || undefined,
        liabilitiesImportMethod: importMethod || undefined
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
      const currentLenderId = await getLenderId();
      const response = await customAxios.put(`/api/v1/credit-report/${loanId}/${currentLenderId}/refresh`);
      
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
      const currentLenderId = await getLenderId();
      const response = await customAxios.get(`/api/v1/credit-report/${loanId}/${currentLenderId}/file`);
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

  const handleChangeCredential = (id) => {
    setSelectedCredentialId(id);
    const inPersonal = personalCredentials.find(c => c._id === id);
    const inOrg = organizationCredentials.find(c => c._id === id);
    setSelectedCredential(inPersonal || inOrg || null);
  };

  const handleOpenAddAccount = () => setAddOpen(true);
  const handleCloseAddAccount = () => setAddOpen(false);
  const handleOpenEditAccount = () => {
    if (selectedCredentialId) setEditOpen(true);
  };
  const handleCloseEditAccount = () => setEditOpen(false);

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
    personalCredentials,
    organizationCredentials,
    selectedCredentialId,
    importMethod,
    
    // Loading states
    loading,
    fileLoading,
    showProviderForm,
    addOpen,
    editOpen,
    selectedCredential,
    
    // Event handlers
    handleCreateReport,
    handleRefreshReport,
    handleViewReport,
    handleProviderChange,
    handleCreateReportClick,
    handleCancelProviderForm,
    handleBack,
    setImportMethod,
    handleChangeCredential,
    handleOpenAddAccount,
    handleCloseAddAccount,
    handleOpenEditAccount,
    handleCloseEditAccount,
    // Surface CRUD for modals
    credsHook: lenderCreds
  };
};

export default useCreditReport;
