import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Save } from 'lucide-react';
import { fetchAPI } from '@/utils/api';
import LenderLayout from '@/components/layout/LenderLayout';
import Head from 'next/head';
import LoanQualificationCard from '@/components/lender/loans/LoanQualificationCard';

export default function LoanParameters() {
  const router = useRouter();
  const { id } = router.query;
  
  const [loan, setLoan] = useState(null);
  const [parameters, setParameters] = useState({
    interestRate: 7.0,
    loanTerm: 30,
    downPaymentPercentage: 20,
    monthlyPayment: 0,
    loanAmount: 0,
    propertyValue: 0,
    closingCosts: 0,
    originationFees: 0,
    monthlyTaxes: 0,
    monthlyInsurance: 0,
    monthlyHOA: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLoanDetails();
    }
  }, [id]);

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      const response = await fetchAPI(`/loans/${id}`);
      console.log("response",response);
      if (response.status === 'success') {
        const loanData = response.data;
        console.log("loanData",loanData);
        setLoan(loanData);
        
        // Initialize parameters from loan data
        setParameters({
          interestRate: loanData.loanDetails?.interestRate || 7.0,
          loanTerm: loanData.loanDetails?.loanTerm || 30,
          downPaymentPercentage: loanData.loanDetails?.downPayment 
            ? (loanData.loanDetails.downPayment / loanData.loanDetails.purchasePrice * 100) 
            : 5,
          monthlyPayment: loanData.loanDetails?.monthlyPayment || 0,
          loanAmount: loanData.loanDetails?.loanAmount || 0,
          propertyValue: loanData.property?.propertyValue || 0,
          closingCosts: loanData.loanDetails?.closingCosts || 0,
          originationFees: loanData.loanDetails?.originationFees || 0,
          monthlyTaxes: loanData.loanDetails?.propertyTaxes || 0,
          monthlyInsurance: loanData.loanDetails?.homeownersInsurance || 0,
          monthlyHOA: loanData.loanDetails?.hoaFees || 0
        });
      } else {
        setError('Failed to load loan details');
      }
    } catch (err) {
      setError(err.message || 'Failed to load loan details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setParameters(prev => ({ ...prev, [name]: checked }));
    } else {
      const numericValue = parseFloat(value);
      setParameters(prev => ({ 
        ...prev, 
        [name]: isNaN(numericValue) ? '' : numericValue 
      }));
    }
  };

  const calculateMonthlyPayment = () => {
    const principal = parameters.loanAmount;
    const monthlyRate = parameters.interestRate / 100 / 12;
    const numberOfPayments = parameters.loanTerm * 12;
    
    if (principal <= 0 || monthlyRate <= 0 || numberOfPayments <= 0) {
      return 0;
    }
    
    // Monthly payment formula: P*(r*(1+r)^n)/((1+r)^n-1)
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    return payment;
  };

  const recalculatePayment = () => {
    const monthlyPayment = calculateMonthlyPayment();
    setParameters(prev => ({ ...prev, monthlyPayment }));
  };

  useEffect(() => {
    recalculatePayment();
  }, [parameters.loanAmount, parameters.interestRate, parameters.loanTerm]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const updatedLoanDetails = {
        ...loan.loanDetails,
        interestRate: parameters.interestRate,
        loanTerm: parameters.loanTerm,
        monthlyPayment: parameters.monthlyPayment,
        closingCosts: parameters.closingCosts,
        originationFees: parameters.originationFees,
        propertyTaxes: parameters.monthlyTaxes,
        homeownersInsurance: parameters.monthlyInsurance,
        hoaFees: parameters.monthlyHOA
      };
      
      const response = await fetchAPI(`/loans/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          loanDetails: updatedLoanDetails 
        })
      });
      
      if (response.status === 'success') {
        setSuccess(true);
        // Show success message without redirecting
        setTimeout(() => {
          setSuccess(false); // Just hide the success message after 2 seconds
        }, 2000);
      } else {
        setError('Failed to save loan parameters');
      }
    } catch (err) {
      setError(err.message || 'Failed to save loan parameters');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  const getTotalMonthlyPayment = () => {
    return parameters.monthlyPayment + 
      parameters.monthlyTaxes + 
      parameters.monthlyInsurance + 
      parameters.monthlyHOA;
  };

  if (loading) {
    return (
      <LenderLayout>
        <Head>
          <title>Loan Parameters | Lender Dashboard</title>
        </Head>
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </LenderLayout>
    );
  }

  return (
    <LenderLayout>
      <Head>
        <title>Loan Parameters | Lender Dashboard</title>
      </Head>
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <button 
            className="flex items-center px-4 py-2 mr-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
            onClick={() => router.push(`/lender/loans/${id}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Loan
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Loan Parameters
            </h1>
            <p className="text-gray-500">
              Edit loan parameters and view estimated payments
            </p>
          </div>
        </div>
        
        {/* Loan Qualification Card */}
        {loan && (
          <div className="mb-8">
            <LoanQualificationCard 
              loan={loan} 
              enablePolling={false} // Explicitly disable polling on parameters page
              onUpdate={(updatedLoan) => {
                // Just update the loan state locally without triggering handleSave
                setLoan(updatedLoan);
              }}
            />
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-6">
            Loan parameters saved successfully! Redirecting...
          </div>
        )}
        
        {/* Save button removed as it's now handled by the modal */}
        
        {/* Original loan parameters form is now hidden as the LoanQualificationCard handles everything */}
        <div className="hidden bg-white shadow-sm rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Loan Parameters</h2>
          {/* Original form content hidden - replaced by LoanQualificationCard */}
        </div>
      </div>
    </LenderLayout>
  );
}
