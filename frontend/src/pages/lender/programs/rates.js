import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Save } from 'lucide-react';
import LenderLayout from '@/components/layout/LenderLayout';
import Head from 'next/head';
import { LoanRateService } from '@/services';

const PROGRAM_TYPES = [
  { id: 'conventional', name: 'Conventional' },
  { id: 'fha', name: 'FHA' },
  { id: 'va', name: 'VA' },
  { id: 'usda', name: 'USDA' },
  { id: 'jumbo', name: 'Jumbo' }
];

export default function ManageRates() {
  const router = useRouter();
  const [rates, setRates] = useState(
    PROGRAM_TYPES.map(type => ({ programType: type.id, rate: 7.000 }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch rates on component mount
  useEffect(() => {
    fetchRates();
    // Log the auth token to check if it's available
    console.log('Rates page - Auth token present:', !!localStorage.getItem('token'));
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      console.log('Fetching loan rates...');
      // This will automatically filter rates by the current lender
      const response = await LoanRateService.getAllRates();
      console.log('Loan rates API response:', response);
      
      // Process the data based on the response structure
      let ratesData = [];
      
      if (response) {
        if (response.data) {
          // If response.data has nested structure with status and data properties
          if (response.data.status === 'success' && Array.isArray(response.data.data)) {
            console.log('Setting rates from nested data:', response.data.data);
            ratesData = response.data.data;
          } 
          // If response.data is directly an array
          else if (Array.isArray(response.data)) {
            console.log('Setting rates from data array:', response.data);
            ratesData = response.data;
          }
          // If response.data has some other structure
          else {
            console.error('Unexpected data structure in response.data:', response.data);
            setError('Failed to load rates: Unexpected data structure');
            return;
          }
        } 
        // If response itself is an array
        else if (Array.isArray(response)) {
          console.log('Setting rates from direct array response:', response);
          ratesData = response;
        }
        // If response has status and data properties directly
        else if (response.status === 'success' && Array.isArray(response.data)) {
          console.log('Setting rates from direct API response:', response.data);
          ratesData = response.data;
        }
        else {
          console.error('Unrecognized response structure:', response);
          setError('Failed to load rates: Unrecognized response structure');
          return;
        }
        
        // Merge existing rates with fetched rates
        const updatedRates = [...rates];
        
        ratesData.forEach(fetchedRate => {
          const index = updatedRates.findIndex(r => r.programType === fetchedRate.programType);
          if (index !== -1) {
            updatedRates[index] = fetchedRate;
          }
        });
        
        console.log('Updated rates:', updatedRates);
        setRates(updatedRates);
        
        // Set last updated date from the most recent rate
        if (ratesData.length > 0) {
          const latestDate = ratesData.reduce((latest, rate) => {
            const rateDate = new Date(rate.updatedAt);
            return rateDate > latest ? rateDate : latest;
          }, new Date(0));
          
          setLastUpdated(latestDate);
        }
      } else {
        console.error('Empty response received');
        setError('Failed to load rates: Empty response');
      }
    } catch (err) {
      console.error('Error fetching loan rates:', err);
      setError(err.message || 'Failed to load rates');
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (programType, value) => {
    // Validate rate input
    let rate = value;
    if (rate === '') {
      rate = 0;
    } else {
      rate = parseFloat(rate);
      if (isNaN(rate) || rate < 0 || rate > 20) {
        return;
      }
    }

    const updatedRates = rates.map(item => 
      item.programType === programType ? { ...item, rate } : item
    );
    
    setRates(updatedRates);
  };

  const handleSaveRates = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Use the loan rate service to update rates
      // This will automatically associate with the current lender
      const response = await LoanRateService.updateRates(rates);
      
      console.log('response: ', response);
      if (response.data.status === 'success') {
        setSuccess(true);
        setLastUpdated(new Date());
      } else {
        setError('Failed to save rates');
      }
    } catch (err) {
      setError(err.message || 'Failed to save rates');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  return (
    <LenderLayout>
      <Head>
        <title>Manage Rates | Lender Dashboard</title>
      </Head>
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <button 
            className="flex items-center px-4 py-2 mr-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
            onClick={() => router.push('/lender/programs')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Programs
          </button>
          <h1 className="text-2xl font-bold flex-grow text-gray-900">
            Manage Loan Rates
          </h1>
          <button 
            className={`flex items-center px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${saving || loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`} 
            onClick={handleSaveRates}
            disabled={saving || loading}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Rates'}
          </button>
        </div>

        {lastUpdated && (
          <p className="text-sm text-gray-500 mb-6">
            Last Updated: {lastUpdated.toLocaleString()}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rates.map((rate) => {
              const programType = PROGRAM_TYPES.find(t => t.id === rate.programType);
              return (
                <div key={rate.programType} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      {programType?.name || rate.programType}
                    </h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="relative rounded-md shadow-sm">
                      <label htmlFor={`rate-${rate.programType}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Interest Rate
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="number"
                          id={`rate-${rate.programType}`}
                          className={`block w-full pr-10 text-xl focus:outline-none sm:text-xl rounded-md ${saving ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                          value={rate.rate}
                          onChange={(e) => handleRateChange(rate.programType, e.target.value)}
                          disabled={saving}
                          step="0.125"
                          min="0"
                          max="20"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500 sm:text-lg">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Success notification */}
      {success && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="rounded-md bg-green-50 p-4 border border-green-200 shadow-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Rates saved successfully</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={handleCloseSnackbar}
                    className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </LenderLayout>
  );
}
