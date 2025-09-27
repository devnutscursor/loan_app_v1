import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api.service';

const useReferrals = () => {
  const [lender, setLender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  const fetchLenderProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/lenders/profile');
      setLender(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching lender profile:', err);
      setError('Failed to load your profile. Please try again later.');
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLenderProfile();
  }, [fetchLenderProfile]);

  const generateGeneralLink = useCallback(() => {
    if (!lender) return '';
    return `${window.location.origin}/register/borrower?lenderId=${lender._id}`;
  }, [lender]);

  const copyToClipboard = useCallback((text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(type);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopySuccess(''), 3000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy. Please try again.');
    });
  }, []);

  const shareViaEmail = useCallback((linkType) => {
    const link = linkType === 'general' ? generateGeneralLink() : '';
    const subject = encodeURIComponent('Register for your loan application');
    const body = encodeURIComponent(`Hello,\n\nPlease use this link to register for your loan application:\n\n${link}\n\nThank you!`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }, [generateGeneralLink]);

  return {
    // Data
    lender,
    activeTab,
    copySuccess,
    
    // Loading states
    loading,
    error,
    
    // Event handlers
    setActiveTab,
    generateGeneralLink,
    copyToClipboard,
    shareViaEmail
  };
};

export default useReferrals;
