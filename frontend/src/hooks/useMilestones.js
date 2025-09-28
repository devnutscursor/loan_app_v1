import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { LoanService } from '../services';

export const useMilestones = () => {
  const router = useRouter();
  const { loanId: urlLoanId } = router.query;
  
  // State for loans
  const [loans, setLoans] = useState([]);
  
  // State for selected loan
  const [selectedLoanId, setSelectedLoanId] = useState('');
  
  // State for loading status
  const [isLoading, setIsLoading] = useState(true);

  // Load borrower's loans when component mounts
  useEffect(() => {
    const fetchLoans = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching loans...');
        const response = await LoanService.getLoans();
        console.log('Loans response:', response);
        
        if (response.success) {
          // Extract loans from the nested structure in the API response
          const userLoans = response.data?.data?.loans || [];
          console.log(`Retrieved ${userLoans.length} loans`);
          
          setLoans(userLoans);
          
          // Check if we have a loanId from URL and if it exists in our loans
          if (urlLoanId && userLoans.some(loan => loan._id === urlLoanId)) {
            console.log(`Setting selected loan from URL: ${urlLoanId}`);
            setSelectedLoanId(urlLoanId);
          } 
          // If no valid loanId in URL or it doesn't match any loans, select the first loan
          else if (userLoans.length > 0) {
            console.log(`Setting first loan as default: ${userLoans[0]._id}`);
            setSelectedLoanId(userLoans[0]._id);
          }
        } else {
          console.error('Failed to fetch loans:', response?.message || 'Unknown error');
          toast.error(response?.message || 'Failed to load your loans');
        }
      } catch (error) {
        console.error('Error fetching loans:', error);
        toast.error('Failed to load your loans. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();
  }, [urlLoanId]);

  // Handle loan selection change
  const handleLoanChange = (e) => {
    setSelectedLoanId(e.target.value);
    router.push(`/borrower/milestones?loanId=${e.target.value}`, undefined, { shallow: true });
  };

  // Find the selected loan object
  const selectedLoan = loans.find(loan => loan._id === selectedLoanId);

  return {
    // State
    loans,
    selectedLoanId,
    selectedLoan,
    isLoading,
    
    // Handlers
    handleLoanChange,
    
    // Computed values
    hasLoans: loans.length > 0,
    hasMultipleLoans: loans.length > 1
  };
};
