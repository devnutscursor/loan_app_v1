import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { LoanProgramService } from '@/services';

export const useLenderPrograms = () => {
  const router = useRouter();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);

  // Fetch programs on component mount
  useEffect(() => {
    fetchLoanPrograms();

    // Log the auth token to check if it's available
    console.log('Auth token present:', !!localStorage.getItem('token'));
  }, []);

  const fetchLoanPrograms = async () => {
    try {
      setLoading(true);
      console.log('Fetching loan programs...');
      const response = await LoanProgramService.getAllPrograms();
      console.log('API Response:', response);

      // Handle different response structures
      if (response) {
        // Check if response has data property (axios structure)
        if (response.data) {
          // If response.data has status and data properties (nested structure)
          if (response.data.status === 'success' && Array.isArray(response.data.data)) {
            console.log('Setting programs from nested data:', response.data.data);
            setPrograms(response.data.data);
          }
          // If response.data is directly an array
          else if (Array.isArray(response.data)) {
            console.log('Setting programs from data array:', response.data);
            setPrograms(response.data);
          }
          // If response.data has some other structure
          else {
            console.error('Unexpected data structure in response.data:', response.data);
            setError('Failed to load loan programs: Unexpected data structure');
          }
        }
        // If response itself is an array
        else if (Array.isArray(response)) {
          console.log('Setting programs from direct array response:', response);
          setPrograms(response);
        }
        // If response has status and data (direct API response)
        else if (response.status === 'success' && response.data) {
          console.log('Setting programs from direct API response:', response.data);
          setPrograms(response.data);
        }
        else {
          console.error('Unrecognized response structure:', response);
          setError('Failed to load loan programs: Unrecognized response structure');
        }
      } else {
        console.error('Empty response received');
        setError('Failed to load loan programs: Empty response');
      }
    } catch (err) {
      console.error('Error fetching loan programs:', err);
      setError(err.message || 'Failed to load loan programs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = () => {
    router.push('/lender/programs/create');
  };

  const handleViewProgram = (id) => {
    router.push(`/lender/programs/${id}`);
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  const navigateToRates = () => {
    router.push('/lender/programs/rates');
  };

  return {
    programs,
    loading,
    error,
    success,
    successMessage,
    deleteDialog,
    programToDelete,
    setDeleteDialog,
    setProgramToDelete,
    handleCreateProgram,
    handleViewProgram,
    handleCloseSnackbar,
    navigateToRates
  };
};
