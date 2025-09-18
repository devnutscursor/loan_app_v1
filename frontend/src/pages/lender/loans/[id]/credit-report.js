import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import Link from "next/link";
import MainLayout from "../../../../components/layout/MainLayout";
import ProtectedRoute from "../../../../components/auth/ProtectedRoute";
import { useAuth } from "../../../../contexts/AuthContext";
import { FileText, RefreshCw, Eye, ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import customAxios from '../../../../utils/axios';

const CreditReportPage = () => {
  const router = useRouter();
  const { id: loanId } = router.query;
  const { user } = useAuth();
  
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
      console.log("REPORT STATUS: ",response.data.data);
      
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'Processing':
      case 'Pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'text-green-600 bg-green-50';
      case 'Failed':
        return 'text-red-600 bg-red-50';
      case 'Processing':
      case 'Pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!user || user.role !== 'lender') {
    return null;
  }

  return (

    <ProtectedRoute>
        <MainLayout>
        {/* File Loading Overlay */}
        {fileLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-700 font-medium">Loading report...</span>
                </div>
            </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
                <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
                >
                <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                <h1 className="text-3xl font-bold text-gray-900">Credit Report</h1>
                <p className="text-gray-600">Loan ID: {loanId}</p>
                </div>
            </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
            {/* Status Card */}
            {loading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-6 bg-gray-200 rounded w-32"></div>
                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                                    <div className="h-5 bg-gray-200 rounded w-24"></div>
                                </div>
                                <div>
                                    <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                                    <div className="h-5 bg-gray-200 rounded w-20"></div>
                                </div>
                                <div>
                                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                                    <div className="h-5 bg-gray-200 rounded w-16"></div>
                                </div>
                            </div>
                            <div>
                                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                                <div className="flex gap-2">
                                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                                    <div className="h-6 bg-gray-200 rounded w-18"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : reportStatus ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Report Status</h2>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reportStatus.status || 'Unknown')}`}>
                    {getStatusIcon(reportStatus.status)}
                    {reportStatus.status || 'Unknown'}
                    </div>
                </div>
                
                {reportStatus.hasActiveReport ? (
                    <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                        <p className="text-sm text-gray-500">Created</p>
                        <p className="font-medium">{reportStatus.createdAt ? new Date(reportStatus.createdAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div>
                        <p className="text-sm text-gray-500">Expires</p>
                        <p className="font-medium">{reportStatus.expiresAt ? new Date(reportStatus.expiresAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div>
                        <p className="text-sm text-gray-500">Average Score</p>
                        <p className="font-medium">{reportStatus.avgCreditScore || 'N/A'}</p>
                        </div>
                    </div>
                    
                    {reportStatus.providers && (
                        <div>
                        <p className="text-sm text-gray-500 mb-2">Providers</p>
                        <div className="flex gap-2">
                            {Object.entries(reportStatus.providers).map(([provider, enabled]) => (
                            <span
                                key={provider}
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                    enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                }`}
                                >
                                {provider.charAt(0).toUpperCase() + provider.slice(1)}
                            </span>
                            ))}
                        </div>
                        </div>
                    )}
                    </div>
                ) : (
                    <p className="text-gray-500">No active credit report found for this loan.</p>
                    )
                    }
                </div>
            ):(
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <p className="text-gray-500">No active credit report found for this loan.</p>
                </div>
            )}

            {/* Actions */}
            {loading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-16 mb-4"></div>
                        <div className="flex gap-4">
                            <div className="h-10 bg-gray-200 rounded w-32"></div>
                            <div className="h-10 bg-gray-200 rounded w-36"></div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
                    
                    {reportStatus?.hasActiveReport ? (
                    <div className="flex gap-4">
                    <button
                    onClick={handleRefreshReport}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Report
                    </button>
                    
                    {reportStatus.status === 'Completed' && (
                        <button
                        onClick={handleViewReport}
                        disabled={fileLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                        <Eye className={`h-4 w-4 ${fileLoading ? 'animate-pulse' : ''}`} />
                        {fileLoading ? 'Loading...' : 'View Report'}
                    </button>
                    )}
                </div>
                ) : (
                    <button
                    onClick={() => setShowProviderForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                    <FileText className="h-4 w-4" />
                    Create Credit Report
                </button>
                )}
                </div>
            )}

            {/* Provider Selection Form */}
            {showProviderForm && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Credit Bureaus</h2>
                <p className="text-gray-600 mb-6">Choose which credit bureaus to include in the report.</p>
                
                <div className="space-y-4 mb-6">
                    {Object.entries(selectedProviders).map(([provider, enabled]) => (
                        <label key={provider} className="flex items-center gap-3">
                        <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setSelectedProviders(prev => ({
                            ...prev,
                            [provider]: e.target.checked
                            }))}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                        <span className="text-gray-900 font-medium">
                        {provider.charAt(0).toUpperCase() + provider.slice(1)}
                        </span>
                    </label>
                    ))}
                </div>
                
                <div className="flex gap-4">
                    <button
                    onClick={handleCreateReport}
                    disabled={loading || !Object.values(selectedProviders).some(Boolean)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    <FileText className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
                    {loading ? 'Creating...' : 'Create Report'}
                    </button>
                    
                    <button
                    onClick={() => setShowProviderForm(false)}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    Cancel
                    </button>
                </div>
                </div>
            )}

            {/* Credit Scores */}
            {loading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="h-4 bg-gray-200 rounded w-16 mb-2 mx-auto"></div>
                                <div className="h-8 bg-gray-200 rounded w-12 mb-2 mx-auto"></div>
                                <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="h-4 bg-gray-200 rounded w-16 mb-2 mx-auto"></div>
                                <div className="h-8 bg-gray-200 rounded w-12 mb-2 mx-auto"></div>
                                <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="h-4 bg-gray-200 rounded w-16 mb-2 mx-auto"></div>
                                <div className="h-8 bg-gray-200 rounded w-12 mb-2 mx-auto"></div>
                                <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : creditReport?.creditScores && creditReport.creditScores.length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Credit Scores</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {creditReport.creditScores.map((score, index) => (
                        <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">{score.bureau}</p>
                        <p className="text-2xl font-bold text-gray-900">{score.score}</p>
                        <p className="text-xs text-gray-400">{score.model}</p>
                    </div>
                    ))}
                </div>
                </div>
            ) : null}

            {/* Report Details */}
            {loading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                                <div className="h-5 bg-gray-200 rounded w-32"></div>
                            </div>
                            <div>
                                <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                                <div className="h-5 bg-gray-200 rounded w-20"></div>
                            </div>
                            <div>
                                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                                <div className="h-5 bg-gray-200 rounded w-28"></div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : creditReport ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                    <p className="text-sm text-gray-500">Report ID</p>
                    <p className="font-medium">{creditReport.id}</p>
                    </div>
                    <div>
                    <p className="text-sm text-gray-500">File Size</p>
                    <p className="font-medium">{creditReport.reportFile?.fileSize ? `${(creditReport.reportFile.fileSize / 1024).toFixed(1)} KB` : 'N/A'}</p>
                    </div>
                </div>
                </div>
            ) : null}
            </div>
        </div>
        </MainLayout>
    </ProtectedRoute>
  );
};

export default CreditReportPage;
