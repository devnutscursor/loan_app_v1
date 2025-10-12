import { useState, useEffect } from 'react';
import ConsentService from '../services/consent.service';
import { toast } from 'react-hot-toast';

/**
 * Custom hook for managing credit consent operations
 */
export const useCreditConsent = () => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [consentData, setConsentData] = useState({
    hasConsent: false,
    consentDate: null,
    consentMethod: null,
    consentVersion: null,
    isRevoked: false,
    revokedDate: null
  });
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  /**
   * Load consent status from API
   */
  const loadConsentStatus = async () => {
    try {
      setLoading(true);
      const result = await ConsentService.checkCreditReportConsentStatus();
      
      if (result.success) {
        setConsentData(result.data);
      } else {
        console.error('Failed to load consent status:', result.error);
        toast.error('Failed to load consent status');
      }
    } catch (error) {
      console.error('Error loading consent status:', error);
      toast.error('Failed to load consent status');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Grant credit report consent
   */
  const handleGrantConsent = async () => {
    try {
      setUpdating(true);
      const result = await ConsentService.grantCreditReportConsent({
        consentMethod: 'profile_page'
      });

      if (result.success) {
        toast.success(result.message || 'Consent granted successfully');
        await loadConsentStatus(); // Refresh the data
        setShowGrantModal(false);
      } else {
        toast.error(result.error || 'Failed to grant consent');
      }
    } catch (error) {
      console.error('Error granting consent:', error);
      toast.error('Failed to grant consent');
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Revoke credit report consent
   */
  const handleRevokeConsent = async () => {
    try {
      setUpdating(true);
      const result = await ConsentService.revokeCreditReportConsent();

      if (result.success) {
        toast.success(result.message || 'Consent revoked successfully');
        await loadConsentStatus(); // Refresh the data
        setShowRevokeModal(false);
      } else {
        toast.error(result.error || 'Failed to revoke consent');
      }
    } catch (error) {
      console.error('Error revoking consent:', error);
      toast.error('Failed to revoke consent');
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  /**
   * Get consent status display text
   */
  const getConsentStatusText = () => {
    if (consentData.isRevoked) {
      return {
        text: 'Consent Revoked',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    } else if (consentData.hasConsent) {
      return {
        text: 'Consent Active',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else {
      return {
        text: 'No Consent',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      };
    }
  };

  // Load consent status on component mount
  useEffect(() => {
    loadConsentStatus();
  }, []);

  return {
    // State
    loading,
    updating,
    consentData,
    showGrantModal,
    showRevokeModal,
    
    // Actions
    handleGrantConsent,
    handleRevokeConsent,
    loadConsentStatus,
    setShowGrantModal,
    setShowRevokeModal,
    
    // Computed values
    formatDate,
    getConsentStatusText
  };
};
