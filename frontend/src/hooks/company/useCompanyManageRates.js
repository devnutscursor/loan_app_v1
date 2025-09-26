import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { LoanRateService } from '@/services';
import toast from 'react-hot-toast';

const PROGRAM_TYPES = [
  { id: 'conventional', name: 'Conventional' },
  { id: 'fha', name: 'FHA' },
  { id: 'va', name: 'VA' },
  { id: 'usda', name: 'USDA' },
  { id: 'jumbo', name: 'Jumbo' },
];

export const useCompanyManageRates = () => {
  const router = useRouter();
  const [rates, setRates] = useState(
    PROGRAM_TYPES.map(type => ({ programType: type.id, rate: 7.0 }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchRates();
    // eslint-disable-next-line no-console
    console.log('Rates page - Auth token present:', !!localStorage.getItem('token'));
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const response = await LoanRateService.getAllRates();

      let ratesData = [];
      if (response) {
        if (response.data) {
          if (response.data.status === 'success' && Array.isArray(response.data.data)) {
            ratesData = response.data.data;
          } else if (Array.isArray(response.data)) {
            ratesData = response.data;
          } else {
            setError('Failed to load rates: Unexpected data structure');
            return;
          }
        } else if (Array.isArray(response)) {
          ratesData = response;
        } else if (response.status === 'success' && Array.isArray(response.data)) {
          ratesData = response.data;
        } else {
          setError('Failed to load rates: Unrecognized response structure');
          return;
        }

        const updatedRates = [...rates];
        ratesData.forEach(fetchedRate => {
          const index = updatedRates.findIndex(r => r.programType === fetchedRate.programType);
          if (index !== -1) {
            updatedRates[index] = fetchedRate;
          }
        });

        setRates(updatedRates);

        if (ratesData.length > 0) {
          const latestDate = ratesData.reduce((latest, rate) => {
            const rateDate = new Date(rate.updatedAt);
            return rateDate > latest ? rateDate : latest;
          }, new Date(0));
          setLastUpdated(latestDate);
        }
      } else {
        setError('Failed to load rates: Empty response');
      }
    } catch (err) {
      setError(err.message || 'Failed to load loan rates');
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (programType, value) => {
    let numericValue = parseFloat(value);
    if (isNaN(numericValue)) numericValue = 0;
    numericValue = Math.round(numericValue * 1000) / 1000;

    const updatedRates = rates.map(rate =>
      rate.programType === programType ? { ...rate, rate: numericValue } : rate
    );
    setRates(updatedRates);
  };

  const handleSaveRates = async () => {
    try {
      setSaving(true);
      const response = await LoanRateService.updateRates(rates);
      // eslint-disable-next-line no-console
      console.log('response:', response);
      toast.success('Rates updated successfully');
      setLastUpdated(new Date());
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error saving rates:', err);
      toast.error(err.message || 'Failed to save rates');
      setError(err.message || 'Failed to save rates');
    } finally {
      setSaving(false);
    }
  };

  return {
    router,
    rates,
    setRates,
    loading,
    saving,
    error,
    lastUpdated,
    fetchRates,
    handleRateChange,
    handleSaveRates,
  };
};


