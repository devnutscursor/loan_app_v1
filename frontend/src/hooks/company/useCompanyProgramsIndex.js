import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { LoanProgramService } from '@/services';

export const useCompanyProgramsIndex = () => {
  const router = useRouter();

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);

  useEffect(() => {
    fetchLoanPrograms();
    // eslint-disable-next-line no-console
    console.log('Auth token present:', !!localStorage.getItem('token'));
  }, []);

  const fetchLoanPrograms = async () => {
    try {
      setLoading(true);
      const response = await LoanProgramService.getAllPrograms();

      if (response) {
        if (response.data) {
          if (response.data.status === 'success' && Array.isArray(response.data.data)) {
            setPrograms(response.data.data);
          } else if (Array.isArray(response.data)) {
            setPrograms(response.data);
          } else {
            setError('Failed to load loan programs: Unexpected data structure');
          }
        } else if (Array.isArray(response)) {
          setPrograms(response);
        } else if (response.status === 'success' && response.data) {
          setPrograms(response.data);
        } else {
          setError('Failed to load loan programs: Unrecognized response structure');
        }
      } else {
        setError('Failed to load loan programs: Empty response');
      }
    } catch (err) {
      setError(err.message || 'Failed to load loan programs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = () => router.push('/company/programs/create');
  const handleEditProgram = (id) => router.push(`/company/programs/${id}`);
  const navigateToRates = () => router.push('/company/programs/rates');

  const handleDeleteClick = (program) => {
    setProgramToDelete(program);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!programToDelete) return;
    try {
      const response = await LoanProgramService.deleteProgram(programToDelete._id);
      if (response.status === 'success' || response.status === 204) {
        setSuccessMessage('Loan program deleted successfully');
        setSuccess(true);
        fetchLoanPrograms();
      } else {
        setError('Failed to delete loan program');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete loan program');
    } finally {
      setDeleteDialog(false);
      setProgramToDelete(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  return {
    router,
    programs,
    loading,
    error,
    success,
    successMessage,
    deleteDialog,
    programToDelete,
    fetchLoanPrograms,
    handleCreateProgram,
    handleEditProgram,
    handleDeleteClick,
    handleDeleteConfirm,
    handleCloseSnackbar,
    navigateToRates,
    setDeleteDialog,
  };
};


