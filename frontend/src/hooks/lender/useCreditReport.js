import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import customAxios from '../../utils/axios';
import CredentialService from '../../services/api/creditVendorCredential.service';
import { useLenderCredentials } from './useLenderCredentials';
import { useCompanyCredentials } from '../company/useCompanyCredentials';

const useCreditReport = () => {
  const router = useRouter();
  const { id: loanId, lenderId } = router.query;
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [creditReport, setCreditReport] = useState(null);
  const [reportStatus, setReportStatus] = useState(null);
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [currentOperation, setCurrentOperation] = useState(null); // 'create' | 'refresh' | 'upgrade'
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

  // Load credentials based on user role
  const userId = user?._id;
  const companyId = user?.company;

  console.log("USER COMPANY: ", companyId);
  
  // Call both hooks unconditionally (Rules of Hooks)
  const lenderCreds = useLenderCredentials({ userId, companyId, role: user?.role });
  const companyCreds = useCompanyCredentials({ companyId });

  // Get credentials based on user role
  const credentialsHook = useMemo(() => {
    if (user?.role === 'company') {
      return companyCreds;
    } else {
      return lenderCreds;
    }
  }, [user?.role, companyCreds, lenderCreds]);
  
  const personalCredentials = useMemo(() => credentialsHook.credentials || [], [credentialsHook.credentials]);
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
      let res = null;
      if (!userId) return;
      if (user.role === 'company') {
        res = await CredentialService.listForCompany(user.company);
        if (res.success) {
          const data = res.data;
          console.log("ORGANIZATION CREDENTIALS: ", res);
          setOrganizationCredentials(data.company);
        }
      }
      else if (user.role === 'lender') {
        res = await CredentialService.listForLender(userId, { scope: 'both' });
        if (res.success) {
          const data = res.data;
          console.log("ORGANIZATION CREDENTIALS: ", res);
          setOrganizationCredentials(data.company);
        }
      }
      if (res && res.success) {
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
      return response.data.data.lender._id || response.data.data.lender;
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

  // Unified handler for submitting the form based on operation type
  const handleSubmitReport = async () => {
    setLoading(true);
    try {
      const currentLenderId = await getLenderId();
      let response;
      let successMessage;
      
      const requestData = {
        providers: selectedProviders,
        credentialId: selectedCredentialId || undefined,
        liabilitiesImportMethod: importMethod || undefined
      };
      
      switch (currentOperation) {
        case 'create':
          response = await customAxios.post(`/api/v1/credit-report/${loanId}/${currentLenderId}`, requestData);
          successMessage = 'Credit report created successfully';
          break;
        case 'refresh':
          response = await customAxios.put(`/api/v1/credit-report/${loanId}/${currentLenderId}/refresh`, requestData);
          successMessage = 'Credit report refreshed successfully';
          break;
        case 'upgrade':
          response = await customAxios.put(`/api/v1/credit-report/${loanId}/${currentLenderId}/upgrade`, requestData);
          successMessage = 'Credit report upgraded successfully';
          break;
        default:
          throw new Error('Invalid operation type');
      }
      
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
      
      toast.success(successMessage);
      setShowProviderForm(false);
      setCurrentOperation(null);
      
    } catch (error) {
      console.error(`Error ${currentOperation}ing credit report:`, error);
      toast.error(`Failed to ${currentOperation} credit report: ` + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Click handlers - Toggle behavior for Create and Upgrade
  const handleCreateReportClick = () => {
    // Toggle: if form is already showing for 'create', close it
    if (showProviderForm && currentOperation === 'create') {
      setShowProviderForm(false);
      setCurrentOperation(null);
    } else {
      setCurrentOperation('create');
      setShowProviderForm(true);
    }
  };

  // Refresh handler - shows confirmation dialog before executing
  const handleRefreshReportClick = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to refresh this credit report? This will pull fresh data from the credit bureaus using the same bureau selection from the original report.'
    );
    
    if (!confirmed) {
      return; // User cancelled
    }

    setLoading(true);
    try {
      const currentLenderId = await getLenderId();
      
      // Refresh uses existing providers from the report, so we don't need to send them
      const requestData = {
        credentialId: selectedCredentialId || undefined,
        liabilitiesImportMethod: importMethod || undefined
      };
      
      const response = await customAxios.put(`/api/v1/credit-report/${loanId}/${currentLenderId}/refresh`, requestData);
      
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

  // Reissue handler - retrieves existing report without new credit pull
  const handleReissueReportClick = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to reissue this credit report? This will retrieve the existing report without pulling new credit data.'
    );
    
    if (!confirmed) {
      return; // User cancelled
    }

    setLoading(true);
    try {
      const currentLenderId = await getLenderId();
      
      // Reissue doesn't need any additional parameters
      const response = await customAxios.put(`/api/v1/credit-report/${loanId}/${currentLenderId}/reissue`);
      
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
      
      toast.success('Credit report reissued successfully');
      
    } catch (error) {
      console.error('Error reissuing credit report:', error);
      toast.error('Failed to reissue credit report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeReportClick = () => {
    // Toggle: if form is already showing for 'upgrade', close it
    if (showProviderForm && currentOperation === 'upgrade') {
      setShowProviderForm(false);
      setCurrentOperation(null);
    } else {
      setCurrentOperation('upgrade');
      setShowProviderForm(true);
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

  const handleCancelProviderForm = () => {
    setShowProviderForm(false);
    setCurrentOperation(null);
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
    currentOperation,
    
    // Loading states
    loading,
    fileLoading,
    showProviderForm,
    addOpen,
    editOpen,
    selectedCredential,
    
    // Event handlers
    handleSubmitReport,
    handleCreateReportClick,
    handleRefreshReportClick,
    handleReissueReportClick,
    handleUpgradeReportClick,
    handleViewReport,
    handleProviderChange,
    handleCancelProviderForm,
    handleBack,
    setImportMethod,
    handleChangeCredential,
    handleOpenAddAccount,
    handleCloseAddAccount,
    handleOpenEditAccount,
    handleCloseEditAccount,
    // Surface CRUD for modals
    credsHook: credentialsHook
  };
};

export default useCreditReport;
