import React, { useMemo, useState } from 'react';
import customAxios from '../../../utils/axios';

const DEFAULT_FORM = {
  zipCode: '75024',
  salesPrice: '225000',
  downPayment: '75000',
  downPaymentPercent: '33.33',
  creditScore: '800+',
  propertyType: 'SingleFamily',
  occupancy: 'PrimaryResidence',
  loanTerm: '30',
  eligibleForLowerRate: false,
  loanPurpose: 'Purchase',
  mortgageBalance: '360000',
  waiveEscrow: false,
  militaryVeteran: false,
  lockDays: '30',
  secondMortgageAmount: '0',
};

const formatCurrency = (value, digits = 0) =>
  value.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });

const formatRate = (value) =>
  Number.isFinite(value) ? `${Number(value).toFixed(3)}%` : 'N/A';

const formatMoney = (value, digits = 2) =>
  Number.isFinite(value) ? `$${formatCurrency(Number(value), digits)}` : 'N/A';

const parseNumber = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const calculateMonthlyPI = (loanAmount, rate, termYears) => {
  const monthlyRate = rate / 1200;
  const totalPayments = termYears * 12;
  if (!monthlyRate || !totalPayments) return 0;
  return loanAmount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalPayments)));
};

const normalizeLoanTerm = (term) => {
  if (!term) return '30 year fixed';
  if (term.includes('year fixed')) return term;
  return `${term} year fixed`;
};

const mapCreditScore = (creditScore) => {
  if (creditScore.includes('+')) {
    return parseInt(creditScore.replace('+', ''), 10) || 800;
  }
  if (creditScore.includes('-')) {
    const parts = creditScore.split('-');
    return parseInt(parts[0], 10) || 740;
  }
  return parseInt(creditScore, 10) || 740;
};

const mapPropertyTypeToMortech = (type) => {
  const mapping = {
    SingleFamily: 'Single Family',
    AttachedCondo: 'Condo',
    DetachedCondo: 'Condo',
    Townhouse: 'Townhouse',
    '2Unit': 'Multi-Family',
    '3Unit': 'Multi-Family',
    '4Unit': 'Multi-Family',
    '1Unit': 'Single Family',
    Manufactured: 'Single Family',
  };
  return mapping[type] || 'Single Family';
};

const mapOccupancyToMortech = (occ) => {
  const mapping = {
    PrimaryResidence: 'Primary',
    SecondHome: 'Secondary',
    Investment: 'Investment',
  };
  return mapping[occ] || 'Primary';
};

const LoanRates = () => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [rateGroups, setRateGroups] = useState([]);
  const [selectedLenders, setSelectedLenders] = useState([]);
  const [expandedCards, setExpandedCards] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [showLenderModal, setShowLenderModal] = useState(false);
  const [lenderSearch, setLenderSearch] = useState('');
  const [detailsModalData, setDetailsModalData] = useState(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [activeTab, setActiveTab] = useState('purchase');
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rateTimestamp, setRateTimestamp] = useState('Today, 9:30 AM');
  const [totalRatesCount, setTotalRatesCount] = useState(0);

  const loanAmount = useMemo(() => {
    if (form.loanPurpose === 'Refinance') {
      return parseNumber(form.mortgageBalance);
    }
    const price = parseNumber(form.salesPrice);
    const down = parseNumber(form.downPayment);
    return price - down;
  }, [form.loanPurpose, form.mortgageBalance, form.salesPrice, form.downPayment]);

  const creditScoreOptions = useMemo(() => ([
    { value: '800+', label: '800 or greater' },
    { value: '780-799', label: '780 - 799' },
    { value: '760-779', label: '760 - 779' },
    { value: '740-759', label: '740 - 759' },
    { value: '720-739', label: '720 - 739' },
    { value: '700-719', label: '700 - 719' },
    { value: '680-699', label: '680 - 699' },
    { value: '660-679', label: '660 - 679' },
    { value: '640-659', label: '640 - 659' },
    { value: '620-639', label: '620 - 639' },
    { value: '580-619', label: '580 - 619' },
    { value: 'Below 580', label: 'Below 580' }
  ]), []);

  const propertyTypeOptions = useMemo(() => ([
    { value: 'SingleFamily', label: 'Single Family' },
    { value: 'AttachedCondo', label: 'Attached Condo' },
    { value: 'DetachedCondo', label: 'Detached Condo' },
    { value: 'Townhouse', label: 'Townhome' },
    { value: '2Unit', label: '2 Unit' },
    { value: '3Unit', label: '3 Unit' },
    { value: '4Unit', label: '4 Unit' },
    { value: '1Unit', label: '1 Unit' },
    { value: 'Manufactured', label: 'Manufactured Home' }
  ]), []);

  const occupancyOptions = useMemo(() => ([
    { value: 'PrimaryResidence', label: 'Primary' },
    { value: 'SecondHome', label: 'Secondary Home' },
    { value: 'Investment', label: 'Investment' }
  ]), []);

  const loanTermOptions = useMemo(() => ([
    { value: '30', label: '30 Year Fixed' },
    { value: '25', label: '25 Year Fixed' },
    { value: '20', label: '20 Year Fixed' },
    { value: '15', label: '15 Year Fixed' },
    { value: '10', label: '10 Year Fixed' }
  ]), []);

  const availableLenders = useMemo(
    () => rateGroups.map((group) => group.lenderName),
    [rateGroups]
  );

  const filteredLenders = useMemo(() => {
    if (!lenderSearch) return availableLenders;
    return availableLenders.filter((lender) =>
      lender.toLowerCase().includes(lenderSearch.toLowerCase())
    );
  }, [availableLenders, lenderSearch]);

  const activeLenderGroups = useMemo(() => {
    if (selectedLenders.length === 0) return rateGroups;
    return rateGroups.filter((group) => selectedLenders.includes(group.lenderName));
  }, [rateGroups, selectedLenders]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'salesPrice' || field === 'downPayment') {
        const price = parseNumber(field === 'salesPrice' ? value : next.salesPrice);
        const down = parseNumber(field === 'downPayment' ? value : next.downPayment);
        if (price > 0) {
          next.downPaymentPercent = ((down / price) * 100).toFixed(2);
        }
      }
      return next;
    });
  };

  const buildRateGroups = (rates) => {
    const termYears = parseInt(form.loanTerm, 10) || 30;
    const grouped = rates.reduce((acc, rate) => {
      const lenderName = rate.lenderName || 'Unknown Lender';
      acc[lenderName] = acc[lenderName] || [];
      acc[lenderName].push(rate);
      return acc;
    }, {});

    return Object.entries(grouped).map(([lenderName, lenderRates]) => {
      const rateStack = lenderRates.map((rate) => {
        const basePrice = Number.isFinite(rate.points) ? rate.points : 100;
        const netPrice = basePrice;
        const costVal = ((100 - netPrice) / 100) * loanAmount;
        const pi = calculateMonthlyPI(loanAmount, rate.interestRate, termYears);
        return {
          source: rate,
          rate: rate.interestRate,
          apr: rate.apr || rate.interestRate,
          pi,
          basePrice,
          netPrice,
          cost: costVal,
          totalLLPA: 0,
          adjArr: [
            { n: 'Mortech Price', v: basePrice }
          ],
          comp: 0,
        };
      });

      const hero = [...rateStack].sort((a, b) => Math.abs(a.cost) - Math.abs(b.cost))[0];
      const sortedStack = [...rateStack].sort((a, b) => a.rate - b.rate);
      return { lenderName, hero, rateStack: sortedStack };
    });
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError('');
    try {
      let propertyValue = 0;
      if (form.loanPurpose === 'Refinance') {
        propertyValue = loanAmount;
        if (loanAmount <= 0) {
          setError('Please enter a valid loan amount.');
          setLoading(false);
          return;
        }
      } else {
        propertyValue = parseNumber(form.salesPrice);
        if (propertyValue <= 0) {
          setError('Please enter a valid purchase price.');
          setLoading(false);
          return;
        }
        if (loanAmount <= 0 || loanAmount > propertyValue) {
          setError('Loan amount must be less than or equal to purchase price.');
          setLoading(false);
          return;
        }
      }

      if (!form.zipCode || form.zipCode.trim() === '') {
        setError('Please enter a valid ZIP code.');
        setLoading(false);
        return;
      }

      const payload = {
        propertyZip: form.zipCode,
        appraisedvalue: propertyValue,
        loan_amount: loanAmount,
        fico: mapCreditScore(form.creditScore),
        loanpurpose: form.loanPurpose,
        proptype: mapPropertyTypeToMortech(form.propertyType),
        occupancy: mapOccupancyToMortech(form.occupancy),
        loanProduct1: normalizeLoanTerm(form.loanTerm),
      };

      if (form.waiveEscrow === true) {
        payload.waiveEscrow = true;
      }
      if (form.militaryVeteran === true) {
        payload.militaryVeteran = true;
      }
      if (form.lockDays && form.lockDays !== '30') {
        payload.lockDays = form.lockDays;
      }
      if (form.secondMortgageAmount && form.secondMortgageAmount !== '0') {
        const amount = parseInt(form.secondMortgageAmount, 10);
        if (!Number.isNaN(amount) && amount > 0) {
          payload.secondMortgageAmount = amount;
        }
      }

      const response = await customAxios.post('/api/v1/mortech/search', payload);
      const rates = response.data?.rates || [];
      const ratesCount = response.data?.ratesCount ?? rates.length;
      const groups = buildRateGroups(rates);
      setRateGroups(groups);
      setSelectedLenders(groups.map((group) => group.lenderName));
      setRateTimestamp(new Date().toLocaleString());
      setTotalRatesCount(ratesCount);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load rates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (lenderName) => {
    setExpandedCards((prev) => ({ ...prev, [lenderName]: !prev[lenderName] }));
  };

  const toggleRow = (rowKey) => {
    setExpandedRows((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }));
  };

  const openDetails = (rateSource) => {
    setDetailsModalData(rateSource);
  };

  const closeDetails = () => setDetailsModalData(null);

  const downloadMainPage = () => {
    if (!window.html2pdf) return;
    const target = document.getElementById('tpo_container');
    if (!target) return;
    window.html2pdf()
      .set({
        margin: 0.2,
        filename: 'Loan_Rates_Quote.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      })
      .from(target)
      .save();
  };

  const detailFees = useMemo(() => {
    if (!detailsModalData?.fees) return [];
    return detailsModalData.fees.filter((fee) => fee && fee.description);
  }, [detailsModalData]);

  return (
    <>
      <style jsx global>{`
        :root {
          --primary: #2563eb;
          --primary-hover: #1d4ed8;
          --bg-color: #f8fafc;
          --text-main: #0f172a;
          --text-muted: #64748b;
          --border: #e2e8f0;
          --gold: #d97706;
          --green: #16a34a;
          --red: #dc2626;
        }
        * { box-sizing: border-box; }
        .tpo-calculator-box {
          padding: 25px; border: 1px solid var(--border); background: var(--bg-color);
          border-radius: 12px; font-family: 'Inter', system-ui, -apple-system, sans-serif;
          box-shadow: 0 10px 40px rgba(0,0,0,0.08); max-width: 950px;
          margin: 0 auto; color: var(--text-main);
        }
        .tpo-header {
          font-size: 24px; font-weight: 800; margin-bottom: 20px; color: #1e293b;
          border-bottom: 2px solid var(--border); padding-bottom: 15px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .tpo-badge { background: var(--primary); color: #fff; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 1px; }
        .tpo-action-bar { margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid var(--border); display: flex;
          justify-content: space-between; align-items: center; }
        .update-timestamp { font-size: 14px; color: var(--text-muted); font-weight: 500; display: flex; align-items: center; gap: 6px; }
        .action-circles { display: flex; gap: 10px; }
        .circle-btn {
          width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid var(--primary);
          background: #fff; color: var(--primary); display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s ease; position: relative;
        }
        .circle-btn:hover { background: #eff6ff; transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
        .circle-btn svg { width: 18px; height: 18px; stroke-width: 2; }
        .circle-btn::after {
          content: attr(data-label); position: absolute; bottom: 125%; left: 50%; transform: translateX(-50%);
          background: #1e293b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; opacity: 0; pointer-events: none;
          transition: opacity 0.2s; white-space: nowrap;
        }
        .circle-btn:hover::after { opacity: 1; }
        .tpo-input-container { background: #fff; padding: 20px; border-radius: 10px; border: 1px solid var(--border); margin-bottom: 25px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .tpo-row { display: flex; gap: 15px; margin-bottom: 15px; }
        .tpo-col { flex: 1; position: relative; min-width: 0; }
        @media (max-width: 768px) { .tpo-row { flex-direction: column; gap: 12px; } }
        .label-row { display: flex; align-items: center; margin-bottom: 5px; }
        .tpo-input-group label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
        .info-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 14px; height: 14px; border-radius: 50%;
          background: #e2e8f0; color: #64748b; font-size: 10px; font-weight: bold; font-family: sans-serif;
          margin-left: 6px; cursor: help; position: relative; transition: all 0.2s; z-index: 5;
        }
        .info-icon:hover { background: var(--primary); color: white; z-index: 50; }
        .info-icon::after {
          content: attr(data-tooltip);
          position: absolute; bottom: 135%; left: 50%; transform: translateX(-50%);
          background: #1e293b; color: #fff; padding: 8px 12px; border-radius: 6px;
          font-size: 11px; white-space: normal; width: 220px; text-align: center;
          opacity: 0; pointer-events: none; transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); font-weight: 500; line-height: 1.4;
        }
        .info-icon:hover::after { opacity: 1; transform: translateX(-50%) translateY(-2px); pointer-events: auto; }
        .info-icon::before {
          content: ''; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
          border: 5px solid transparent; border-top-color: #1e293b; opacity: 0; transition: opacity 0.2s; pointer-events: none;
        }
        .info-icon:hover::before { opacity: 1; }
        .tpo-input-group input, .tpo-input-group select {
          width: 100%; padding: 10px; border: 1px solid var(--border);
          border-radius: 6px; font-size: 14px; color: var(--text-main);
          background: #fff; transition: all 0.2s;
        }
        .tpo-input-group input:focus, .tpo-input-group select:focus {
          border-color: var(--primary); outline: none; ring: 2px solid rgba(37, 99, 235, 0.1);
        }
        .tpo-input-group input[readonly] { background-color: #f1f5f9; color: var(--text-muted); pointer-events: none; }
        .tpo-btn-container { text-align: center; margin-top: 20px; }
        .tpo-btn-submit { background: var(--primary); color: white; border: none; padding: 12px 35px; font-size: 15px; font-weight: 700;
          border-radius: 6px; cursor: pointer; transition: background 0.2s, transform 0.1s; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.25);
          text-transform: uppercase; letter-spacing: 0.5px; }
        .tpo-btn-submit:hover { background: var(--primary-hover); transform: translateY(-1px); box-shadow: 0 6px 8px rgba(37, 99, 235, 0.3); }
        #rate_stack_container { display: none; margin-top: 25px; animation: fadeIn 0.5s ease; }
        #rate_stack_container.active { display: block; }
        .rate-card { background: #fff; border: 1px solid var(--border); border-radius: 10px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease; overflow: hidden; position: relative; }
        .rate-card:hover { border-color: #93c5fd; box-shadow: 0 8px 12px -3px rgba(0, 0, 0, 0.1); }
        .rate-card.active { border: 1px solid var(--primary); box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1); overflow: visible; }
        .card-main { padding: 20px; padding-right: 50px; position: relative; }
        .card-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .lender-badge { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 4px; }
        .product-name { font-size: 12px; color: var(--text-muted); font-weight: 500; }
        .card-data-grid { display: grid; grid-template-columns: 1fr 1.5fr 1fr; gap: 15px; align-items: center; padding-bottom: 15px;
          border-bottom: 1px solid #f1f5f9; }
        .val-rate { font-size: 24px; font-weight: 800; color: var(--gold); line-height: 1; }
        .val-apr { font-size: 12px; color: var(--text-muted); margin-top: 4px; font-weight: 500; }
        .val-fees { font-size: 16px; font-weight: 700; color: var(--text-main); }
        .lbl-fees { font-size: 11px; text-transform: uppercase; color: var(--text-muted); margin-top: 4px; font-weight: 600; }
        .txt-green { color: var(--green); } .txt-red { color: var(--red); }
        .col-pay { text-align: right; }
        .val-pay { font-size: 20px; font-weight: 700; color: var(--primary); }
        .lbl-pay { font-size: 11px; text-transform: uppercase; color: var(--text-muted); margin-top: 4px; font-weight: 600; }
        .col-arrow { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); color: #cbd5e1; display: flex; align-items: center;
          justify-content: center; pointer-events: none; }
        .chevron { width: 24px; height: 24px; stroke-width: 2.5; transition: transform 0.2s; }
        .rate-card.active .chevron { transform: rotate(90deg); color: var(--primary); }
        .card-actions { display: flex; gap: 10px; margin-top: 15px; }
        .btn-action { flex: 1; padding: 10px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; text-align: center; border: 1px solid transparent;
          transition: all 0.2s; }
        .btn-more { background: #f1f5f9; color: var(--text-main); border-color: var(--border); }
        .btn-more:hover { background: #e2e8f0; }
        .btn-fees { background: transparent; color: var(--text-muted); border: 1px dashed var(--border); }
        .btn-fees:hover { border-color: var(--text-muted); color: var(--text-main); }
        .btn-apply { background: var(--primary); color: white; }
        .btn-apply:hover { background: var(--primary-hover); transform: translateY(-1px); }
        .card-accordion { display: none; background: #fff; border-top: 1px solid var(--border); padding: 0; }
        .rate-card.active .card-accordion { display: block; animation: slideDown 0.3s ease; }
        .stack-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .stack-table th { text-align: left; padding: 10px 20px; background: #f8fafc; color: var(--text-muted); font-weight: 600; font-size: 11px;
          text-transform: uppercase; border-bottom: 1px solid var(--border); }
        .stack-table th .info-icon { vertical-align: text-bottom; margin-bottom: 1px; }
        .stack-table td { padding: 12px 20px; border-bottom: 1px solid var(--border); color: var(--text-main); vertical-align: middle; }
        .rate-row { cursor: pointer; transition: background 0.1s; }
        .rate-row:hover { background: #f1f5f9; }
        .rate-row.expanded { background: #eff6ff; border-left: 3px solid var(--primary); }
        .detail-row { display: none; background: #fff; }
        .detail-row.visible { display: table-row; }
        .breakdown-card { padding: 20px; border: 1px solid #bfdbfe; border-radius: 8px; background: #f8fafc; margin: 15px 20px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .breakdown-card .info-icon { background: #cbd5e1; color: #fff; width: 12px; height: 12px; font-size: 9px; }
        .breakdown-card .info-icon:hover { background: var(--primary); }
        .bd-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0; margin-bottom: 15px; }
        .bd-rate-group { display: flex; flex-direction: column; }
        .bd-rate { font-size: 28px; font-weight: 800; color: var(--gold); line-height: 1; }
        .bd-apr { font-size: 13px; color: var(--text-muted); font-weight: 500; margin-top: 5px; }
        .bd-cost-group { text-align: right; }
        .bd-cost { font-size: 18px; font-weight: 700; line-height: 1.2; }
        .bd-cost-lbl { font-size: 10px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px; }
        .bd-mid { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
        .bd-pi { font-size: 22px; font-weight: 700; color: var(--primary); }
        .bd-pi-lbl { font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600; }
        .bd-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 30px; }
        @media (max-width: 600px) { .bd-grid { grid-template-columns: 1fr; gap: 20px; } }
        .bd-col { display: flex; flex-direction: column; gap: 8px; }
        .bd-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; align-items: center; }
        .bd-row.dashed { border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px; margin-bottom: 4px; }
        .bd-row.bold { font-weight: 700; color: #1e293b; }
        .bd-label { color: #475569; display: flex; align-items: center; }
        .bd-val { font-feature-settings: "tnum"; font-variant-numeric: tabular-nums; color: #334155; font-weight: 600; }
        .bd-val.red { color: var(--red); }
        .bd-val.green { color: var(--green); }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6);
          z-index: 9999; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .modal-overlay.active { display: flex; }
        .modal-box { background: #fff; width: 95%; max-width: 850px; padding: 0; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          position: relative; animation: popIn 0.3s; display: flex; flex-direction: column; max-height: 90dvh; overflow: hidden; }
        #feeContent { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .modal-close { position: absolute; top: 15px; right: 15px; cursor: pointer; color: #64748b; font-size: 24px; z-index: 100; transition: color 0.2s; }
        .modal-close:hover { color: #1e293b; }
        .fee-sheet-container { background: #fff; color: #0f172a; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; flex: 1; overflow: hidden; }
        .fee-header-section { background: #f8fafc; padding: 30px; border-bottom: 1px solid #e2e8f0; }
        .fee-title { font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 5px; }
        .fee-subtitle { font-size: 13px; color: #64748b; margin-bottom: 20px; }
        .fee-meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; font-size: 12px; padding-top: 15px; border-top: 1px solid #e2e8f0; }
        .meta-item { display: flex; flex-direction: column; }
        .meta-label { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 10px; margin-bottom: 4px; letter-spacing: 0.5px; }
        .meta-value { font-weight: 700; color: #334155; font-size: 13px; }
        .meta-value.highlight { color: #2563eb; }
        .fee-body { padding: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; padding-bottom: 40px; }
        .fee-column { display: flex; flex-direction: column; gap: 25px; }
        .fee-group { margin-bottom: 5px; }
        .fee-group-header { background: #0f172a; color: #fff; padding: 8px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 4px 4px 0 0; }
        .fee-item { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; }
        .fee-item:last-child { border-bottom: none; }
        .fee-item.sub-total { background: #f1f5f9; font-weight: 700; border-top: 1px solid #cbd5e1; color: #0f172a; }
        .fee-val { font-feature-settings: "tnum"; font-variant-numeric: tabular-nums; }
        .cash-close-wrapper { grid-column: 1 / -1; margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .calc-box { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
        .calc-header { background: #f8fafc; padding: 10px 15px; font-weight: 700; font-size: 13px; border-bottom: 1px solid #e2e8f0; color: #475569; }
        .calc-row { display: flex; justify-content: space-between; padding: 10px 15px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
        .calc-row.final { background: #eff6ff; color: #1e40af; font-weight: 800; font-size: 16px; border-top: 2px solid #bfdbfe; border-bottom: none; padding: 15px; }
        .fee-actions-bar { padding: 15px 30px; background: #fff; border-top: 1px solid #e2e8f0; display: flex; gap: 15px; justify-content: flex-end; flex-shrink: 0; z-index: 10; }
        .fee-action-btn { padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569;
          display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .fee-action-btn:hover { background: #eff6ff; border-color: var(--primary); color: var(--primary); transform: translateY(-1px); }
        @media (max-width: 768px) { .fee-body { grid-template-columns: 1fr; } .fee-meta-grid { grid-template-columns: repeat(2, 1fr); } }
        @media print {
          @page { size: portrait; margin: 0.25in; }
          body * { visibility: hidden; }
          #detailsModal, #detailsModal * { visibility: visible; }
          #detailsModal { position: absolute; left: 0; top: 0; width: 100%; height: auto; background: white; z-index: 99999; display: block !important; }
          .modal-box { box-shadow: none; width: 100%; max-width: 100%; padding: 0; margin: 0; border: none; max-height: none; overflow: visible; display: block; }
          #feeContent { overflow: visible; }
          .modal-close, .fee-actions-bar { display: none !important; }
          .fee-sheet-container { width: 100%; }
          .fee-body { gap: 30px; padding: 20px; display: grid; }
          .fee-group-header { background: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .fee-item.sub-total { background: #e2e8f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .calc-row.final { background: #eff6ff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .modal-input { width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid var(--border); border-radius: 6px; font-size: 14px; }
        .modal-btn { width: 100%; padding: 12px; background: var(--green); color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 15px; }
        .lender-header { padding: 20px; border-bottom: 1px solid #e2e8f0; }
        .lender-search-bar { width: 100%; padding: 10px; border: 1px solid #2563eb; border-radius: 4px; font-size: 14px; margin-bottom: 10px; }
        .lender-controls { display: flex; gap: 15px; font-size: 12px; font-weight: 600; color: #2563eb; cursor: pointer; }
        .lender-controls span:hover { text-decoration: underline; }
        .lender-grid { padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; overflow-y: auto; max-height: 400px; }
        .lender-checkbox-item { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #334155; cursor: pointer; }
        .lender-checkbox-item input { width: 16px; height: 16px; cursor: pointer; accent-color: #2563eb; }
        .lender-cat-title { grid-column: 1 / -1; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-top: 10px; margin-bottom: 5px; }
        .rate-error { color: var(--red); font-size: 13px; margin-top: 12px; text-align: center; }
      `}</style>

      <div className="tpo-calculator-box" id="tpo_container">
        <div className="tpo-header">
          <span>Loan Rates</span>
          <span className="tpo-badge">Multi-Lender</span>
        </div>

        <div className="tpo-input-container">
          <div className="tpo-action-bar">
            <div className="update-timestamp">Rates Updated: <strong id="rate_timestamp">{rateTimestamp}</strong></div>
            <div className="action-circles">
              <button className="circle-btn" data-label="Filter Lenders" type="button" onClick={() => setShowLenderModal(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </button>
              <button className="circle-btn" data-label="Download PDF" type="button" onClick={downloadMainPage}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </button>
              <button className="circle-btn" data-label="Print" type="button" onClick={() => window.print()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
              </button>
            </div>
          </div>

          <div className="tpo-row">
            <div className="tpo-col">
              <div className="tpo-input-group">
                <div className="label-row">
                  <label>Loan Purpose</label>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-action btn-more"
                    style={{
                      flex: 1,
                      background: activeTab === 'purchase' ? '#2563eb' : '#f1f5f9',
                      color: activeTab === 'purchase' ? '#fff' : '#0f172a'
                    }}
                    onClick={() => {
                      setActiveTab('purchase');
                      setForm((prev) => ({ ...prev, loanPurpose: 'Purchase' }));
                    }}
                  >
                    Purchase
                  </button>
                  <button
                    type="button"
                    className="btn-action btn-more"
                    style={{
                      flex: 1,
                      background: activeTab === 'refinance' ? '#2563eb' : '#f1f5f9',
                      color: activeTab === 'refinance' ? '#fff' : '#0f172a'
                    }}
                    onClick={() => {
                      setActiveTab('refinance');
                      setForm((prev) => ({ ...prev, loanPurpose: 'Refinance' }));
                    }}
                  >
                    Refinance
                  </button>
                </div>
              </div>
            </div>
            <div className="tpo-col">
              <div className="tpo-input-group">
                <div className="label-row"><label>ZIP Code</label></div>
                <input type="text" value={form.zipCode} onChange={handleInputChange('zipCode')} maxLength={5} />
              </div>
            </div>
          </div>

          <div className="tpo-row">
            {form.loanPurpose === 'Purchase' && (
              <div className="tpo-col">
                <div className="tpo-input-group">
                  <div className="label-row"><label>Purchase Price</label></div>
                  <input type="number" value={form.salesPrice} onChange={handleInputChange('salesPrice')} />
                </div>
              </div>
            )}
            {form.loanPurpose === 'Purchase' && (
              <div className="tpo-col">
                <div className="tpo-input-group">
                  <div className="label-row"><label>Down Payment</label></div>
                  <div style={{ display: 'flex', height: '42px' }}>
                    <input
                      type="number"
                      value={form.downPayment}
                      onChange={handleInputChange('downPayment')}
                      style={{ flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                    />
                    <div style={{
                      minWidth: '70px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f1f5f9',
                      border: '1px solid var(--border)',
                      borderLeft: 'none',
                      borderTopRightRadius: '6px',
                      borderBottomRightRadius: '6px',
                      fontSize: '12px',
                      color: 'var(--text-muted)'
                    }}>
                      {form.downPaymentPercent}%
                    </div>
                  </div>
                </div>
              </div>
            )}
            {form.loanPurpose === 'Refinance' && (
              <div className="tpo-col">
                <div className="tpo-input-group">
                  <div className="label-row"><label>Loan Amount</label></div>
                  <input type="number" value={form.mortgageBalance} onChange={handleInputChange('mortgageBalance')} />
                </div>
              </div>
            )}
            <div className="tpo-col">
              <div className="tpo-input-group">
                <div className="label-row"><label>Credit Score</label></div>
                <select value={form.creditScore} onChange={handleInputChange('creditScore')}>
                  {creditScoreOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="tpo-row">
            <div className="tpo-col">
              <div className="tpo-input-group">
                <div className="label-row"><label>Property Type</label></div>
                <select value={form.propertyType} onChange={handleInputChange('propertyType')}>
                  {propertyTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="tpo-col">
              <div className="tpo-input-group">
                <div className="label-row"><label>Residency Usage</label></div>
                <select value={form.occupancy} onChange={handleInputChange('occupancy')}>
                  {occupancyOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="tpo-col">
              <div className="tpo-input-group">
                <div className="label-row"><label>Loan Term</label></div>
                <select value={form.loanTerm} onChange={handleInputChange('loanTerm')}>
                  {loanTermOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <button
              type="button"
              className="btn-action btn-more"
              onClick={() => setShowAdditionalOptions((prev) => !prev)}
            >
              {showAdditionalOptions ? 'Hide Additional Options' : 'Additional Options'}
            </button>
            {showAdditionalOptions && (
              <div className="tpo-row" style={{ marginTop: '12px' }}>
                <div className="tpo-col">
                  <div className="tpo-input-group">
                    <div className="label-row"><label>Waive Escrow</label></div>
                    <select
                      value={form.waiveEscrow ? 'Yes' : 'No'}
                      onChange={(e) => setForm((prev) => ({ ...prev, waiveEscrow: e.target.value === 'Yes' }))}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>
                <div className="tpo-col">
                  <div className="tpo-input-group">
                    <div className="label-row"><label>Military/Veteran</label></div>
                    <select
                      value={form.militaryVeteran ? 'Yes' : 'No'}
                      onChange={(e) => setForm((prev) => ({ ...prev, militaryVeteran: e.target.value === 'Yes' }))}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>
                <div className="tpo-col">
                  <div className="tpo-input-group">
                    <div className="label-row"><label>Lock Days</label></div>
                    <select value={form.lockDays} onChange={handleInputChange('lockDays')}>
                      <option value="30">30 days</option>
                      <option value="45">45 days</option>
                      <option value="60">60 days</option>
                    </select>
                  </div>
                </div>
                <div className="tpo-col">
                  <div className="tpo-input-group">
                    <div className="label-row"><label>2nd Mortgage Amount</label></div>
                    <input type="number" value={form.secondMortgageAmount} onChange={handleInputChange('secondMortgageAmount')} min="0" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {form.loanPurpose === 'Purchase' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
              <input
                type="checkbox"
                id="eligibleForLowerRate"
                checked={form.eligibleForLowerRate}
                onChange={handleInputChange('eligibleForLowerRate')}
                style={{ width: '16px', height: '16px' }}
              />
              <label htmlFor="eligibleForLowerRate" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Eligible for lower rate
              </label>
            </div>
          )}

          <div className="tpo-btn-container">
            <button id="btn_calculate" className="tpo-btn-submit" onClick={handleCalculate} disabled={loading}>
              {loading ? 'Searching...' : 'Update Rates'}
            </button>
            {error && <div className="rate-error">{error}</div>}
          </div>
        </div>

        <div id="rate_stack_container" className={rateGroups.length ? 'active' : ''}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px', color: '#64748b', alignItems: 'center' }}>
            <div style={{ fontWeight: '700', color: '#1e293b' }}>Eligible Lenders</div>
            <div>
              {totalRatesCount > 0 && (
                <span style={{ marginRight: '12px', fontWeight: 600, color: '#1e293b' }}>
                  {totalRatesCount} rate{totalRatesCount !== 1 ? 's' : ''} from {rateGroups.length} lender{rateGroups.length !== 1 ? 's' : ''}
                </span>
              )}
              Best Rates
            </div>
          </div>
          <div id="rate_list">
            {activeLenderGroups.map((group) => {
              const hero = group.hero;
              if (!hero) return null;
              const isCost = hero.cost > 0;
              const feeClass = isCost ? 'txt-red' : 'txt-green';
              const feeLabel = isCost ? 'Points/Cost' : 'Lender Credit';
              const feeText = isCost
                ? `($${formatCurrency(Math.abs(hero.cost), 0)})`
                : `+$${formatCurrency(Math.abs(hero.cost), 0)}`;
              const expanded = expandedCards[group.lenderName];
              return (
                <div className={`rate-card ${expanded ? 'active' : ''}`} key={group.lenderName}>
                  <div className="card-main">
                    <div className="card-header-row">
                      <div className="lender-info">
                        <div className="lender-badge" style={{ background: '#eff6ff', color: '#2563eb' }}>{group.lenderName}</div>
                        <div className="product-name">{form.loanTerm} Year Fixed</div>
                      </div>
                    </div>
                    <div className="card-data-grid">
                      <div className="col-rate">
                        <div className="val-rate">{hero.rate.toFixed(3)}%</div>
                        <div className="val-apr">{hero.apr}% APR</div>
                      </div>
                      <div className="col-fees">
                        <div className={`val-fees ${feeClass}`}>{feeText}</div>
                        <div className="lbl-fees">{feeLabel}</div>
                      </div>
                      <div className="col-pay">
                        <div className="val-pay">${formatCurrency(hero.pi, 0)}</div>
                        <div className="lbl-pay">Monthly P&I</div>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button className="btn-action btn-more" type="button" onClick={() => toggleCard(group.lenderName)}>
                        {expanded ? 'Hide Rates' : 'Show More Rates'}
                      </button>
                      <button className="btn-action btn-fees" type="button" onClick={() => openDetails(hero.source)}>Details</button>
                      <button className="btn-action btn-apply" type="button" onClick={() => setShowLeadModal(true)}>Apply</button>
                    </div>
                    <div className="col-arrow">
                      <svg className="chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="card-accordion">
                    <table className="stack-table">
                      <thead>
                        <tr>
                          <th>Rate <span className="info-icon" data-tooltip="The annual interest rate applied to the loan balance.">i</span></th>
                          <th>APR <span className="info-icon" data-tooltip="Annual Percentage Rate. Includes interest rate plus other costs like broker fees and discount points.">i</span></th>
                          <th>Cost / Credit <span className="info-icon" data-tooltip="Upfront cost (Discount Points) to get this rate, or Credit (Rebate) given by the lender.">i</span></th>
                          <th>Monthly P&I <span className="info-icon" data-tooltip="Principal and Interest payment only.">i</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.rateStack.map((rateItem) => {
                          const rowKey = `${group.lenderName}-${rateItem.source?.id ?? rateItem.rate}`;
                          const rowExpanded = !!expandedRows[rowKey];
                          const cStyle = rateItem.cost > 0 ? 'txt-red' : 'txt-green';
                          const cTxt = rateItem.cost > 0
                            ? `($${formatCurrency(Math.abs(rateItem.cost), 0)})`
                            : `+$${formatCurrency(Math.abs(rateItem.cost), 0)}`;
                          return (
                            <React.Fragment key={rowKey}>
                              <tr className={`rate-row ${rowExpanded ? 'expanded' : ''}`} onClick={() => toggleRow(rowKey)}>
                                <td><strong>{rateItem.rate.toFixed(3)}%</strong></td>
                                <td>{rateItem.apr}%</td>
                                <td className={cStyle}>{cTxt}</td>
                                <td>${formatCurrency(rateItem.pi, 0)}</td>
                              </tr>
                              <tr className={`detail-row ${rowExpanded ? 'visible' : ''}`}>
                                <td colSpan="4">
                                  <div className="breakdown-card">
                                    <div className="bd-header">
                                      <div className="bd-rate-group">
                                        <div className="bd-rate">{rateItem.rate.toFixed(3)}%</div>
                                        <div className="bd-apr">{rateItem.apr}% APR</div>
                                      </div>
                                      <div className="bd-cost-group">
                                        <div className={`bd-cost ${cStyle}`}>{cTxt.replace('(', '').replace(')', '')}</div>
                                        <div className="bd-cost-lbl">{rateItem.cost > 0 ? 'POINTS/COSTS' : 'CREDITS'}</div>
                                      </div>
                                    </div>
                                    <div className="bd-mid">
                                      <div className="bd-pi">${formatCurrency(rateItem.pi, 0)}</div>
                                      <div className="bd-pi-lbl">MONTHLY P&I</div>
                                    </div>
                                    <div className="bd-grid">
                                      <div className="bd-col">
                                        <div className="bd-row dashed">
                                          <span className="bd-label">Base Price: <span className="info-icon" data-tooltip="Investor price from the Mortech response.">i</span></span>
                                          <span className="bd-val">{rateItem.basePrice.toFixed(3)}</span>
                                        </div>
                                        <div className="bd-row dashed">
                                          <span className="bd-label" style={{ color: '#dc2626' }}>LLPAs: <span className="info-icon" data-tooltip="Loan Level Price Adjustments.">i</span></span>
                                          <span className="bd-val red">{rateItem.totalLLPA.toFixed(3)}</span>
                                        </div>
                                        <div className="bd-row dashed bold">
                                          <span className="bd-label" style={{ color: '#1e293b' }}>Net Price: <span className="info-icon" data-tooltip="Price after adjustments and compensation.">i</span></span>
                                          <span className="bd-val">{rateItem.netPrice.toFixed(3)}</span>
                                        </div>
                                        <div className="bd-row dashed">
                                          <span className="bd-label">Lender Comp: <span className="info-icon" data-tooltip="The margin built into the loan pricing to compensate the Mortgage Broker.">i</span></span>
                                          <span className="bd-val">{rateItem.comp.toFixed(3)}</span>
                                        </div>
                                        <div className="bd-row bold">
                                          <span className="bd-label" style={{ color: '#0f172a' }}>Final Price: <span className="info-icon" data-tooltip="Final price to the borrower.">i</span></span>
                                          <span className="bd-val">{(100 - (rateItem.cost / loanAmount) * 100).toFixed(3)}</span>
                                        </div>
                                      </div>
                                      <div className="bd-col">
                                        <div className="bd-row bold" style={{ marginBottom: '5px' }}>
                                          Adjustments Breakdown <span className="info-icon" data-tooltip="Detailed list of adjustments.">i</span>
                                        </div>
                                        {rateItem.adjArr.map((adj) => (
                                          <div className="bd-row" key={`${rowKey}-${adj.n}`}>
                                            <span>{adj.n}</span>
                                            <span className="bd-val">{adj.v.toFixed(3)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div style={{ marginTop: '12px', textAlign: 'right' }}>
                                      <button className="btn-action btn-fees" type="button" onClick={(e) => { e.stopPropagation(); openDetails(rateItem.source); }}>Details</button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${detailsModalData ? 'active' : ''}`} id="detailsModal">
        <div className="modal-box">
          <div className="modal-close" onClick={closeDetails}>×</div>
          {detailsModalData && (
            <div className="fee-sheet-container">
              <div id="feeContent">
                <div className="fee-header-section">
                  <div className="fee-title">LOAN PRODUCT DETAILS</div>
                  <div className="fee-subtitle">Mortech API rate details and pricing breakdown.</div>
                  <div className="fee-meta-grid">
                    <div className="meta-item">
                      <span className="meta-label">Lender</span>
                      <span className="meta-value">{detailsModalData.lenderName || 'N/A'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Last Update</span>
                      <span className="meta-value">{detailsModalData.lastUpdate || 'N/A'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Loan Amount</span>
                      <span className="meta-value">{formatMoney(detailsModalData.loanAmount, 0)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Rate / APR</span>
                      <span className="meta-value highlight">{formatRate(detailsModalData.interestRate)} / {formatRate(detailsModalData.apr)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Down Payment</span>
                      <span className="meta-value">{formatMoney(detailsModalData.downPayment, 0)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Term</span>
                      <span className="meta-value">{detailsModalData.loanTerm || 'N/A'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Lock Period</span>
                      <span className="meta-value">{detailsModalData.lockTerm ? `${detailsModalData.lockTerm} Days` : 'N/A'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Program</span>
                      <span className="meta-value">{detailsModalData.loanProgram || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="fee-body">
                  <div className="fee-column">
                    <div className="fee-group">
                      <div className="fee-group-header">A. Basic Information</div>
                      <div className="fee-item">
                        <span>Loan Type</span>
                        <span className="fee-val">{detailsModalData.loanType || 'N/A'}</span>
                      </div>
                      <div className="fee-item">
                        <span>Prepayment</span>
                        <span className="fee-val">{detailsModalData.prepayType || 'N/A'}</span>
                      </div>
                      <div className="fee-item">
                        <span>Pricing Status</span>
                        <span className="fee-val">{detailsModalData.pricingStatus || 'N/A'}</span>
                      </div>
                      <div className="fee-item">
                        <span>Points</span>
                        <span className="fee-val">{Number.isFinite(detailsModalData.points) ? detailsModalData.points.toFixed(3) : 'N/A'}</span>
                      </div>
                      {detailsModalData.ratesheetPrice != null && (
                        <div className="fee-item">
                          <span>Ratesheet Price</span>
                          <span className="fee-val">{Number(detailsModalData.ratesheetPrice).toFixed(3)}</span>
                        </div>
                      )}
                      {detailsModalData.srp != null && (
                        <div className="fee-item">
                          <span>SRP</span>
                          <span className="fee-val">{Number(detailsModalData.srp).toFixed(3)}</span>
                        </div>
                      )}
                    </div>

                    <div className="fee-group">
                      <div className="fee-group-header">B. Fees & Charges</div>
                      {detailFees.length === 0 ? (
                        <div className="fee-item">
                          <span>No fees available</span>
                          <span className="fee-val">—</span>
                        </div>
                      ) : (
                        detailFees.map((fee, index) => (
                          <div className="fee-item" key={`${fee.description}-${index}`}>
                            <span>{fee.description}</span>
                            <span className="fee-val">{formatMoney(fee.amount)}</span>
                          </div>
                        ))
                      )}
                      {detailFees.length > 0 && (
                        <div className="fee-item sub-total">
                          <span>Total Fees</span>
                          <span className="fee-val">{formatMoney(detailFees.reduce((sum, f) => sum + (f.amount || 0), 0))}</span>
                        </div>
                      )}
                    </div>

                    {(detailsModalData.adjustments?.length > 0) && (
                      <div className="fee-group">
                        <div className="fee-group-header">C. Price Adjustments (LLPAs)</div>
                        {detailsModalData.adjustments.map((adj, idx) => (
                          <div className="fee-item" key={idx} title={adj.desc}>
                            <span>{adj.desc?.slice(0, 40)}{adj.desc?.length > 40 ? '…' : ''}</span>
                            <span className="fee-val">{Number(adj.price_adj).toFixed(3)}</span>
                          </div>
                        ))}
                        <div className="fee-item sub-total">
                          <span>Total Adjustments</span>
                          <span className="fee-val">{detailsModalData.adjustments.reduce((sum, a) => sum + (a.price_adj || 0), 0).toFixed(3)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="fee-column">
                    <div className="fee-group">
                      <div className="fee-group-header">D. Financial Summary</div>
                      <div className="fee-item">
                        <span>Monthly Payment (P&I)</span>
                        <span className="fee-val">{formatMoney(detailsModalData.monthlyPayment)}</span>
                      </div>
                      <div className="fee-item">
                        <span>Origination Fee</span>
                        <span className="fee-val">{formatMoney(detailsModalData.originationFee)}</span>
                      </div>
                      <div className="fee-item">
                        <span>Upfront Fee</span>
                        <span className="fee-val">{formatMoney(detailsModalData.upfrontFee)}</span>
                      </div>
                      <div className="fee-item">
                        <span>Monthly Premium</span>
                        <span className="fee-val">{formatMoney(detailsModalData.monthlyPremium)}</span>
                      </div>
                      {detailsModalData.borrowerRebate != null && (
                        <div className="fee-item">
                          <span>Borrower Rebate</span>
                          <span className="fee-val" style={{ color: detailsModalData.borrowerRebate < 0 ? '#16a34a' : '#dc2626' }}>{formatMoney(detailsModalData.borrowerRebate)}</span>
                        </div>
                      )}
                    </div>

                    <div className="fee-group">
                      <div className="fee-group-header">E. Eligibility</div>
                      <div className="fee-item">
                        <span>Status</span>
                        <span className="fee-val" style={{ color: detailsModalData.eligibility?.eligibilityCheck === 'Pass' ? '#16a34a' : '#dc2626' }}>{detailsModalData.eligibility?.eligibilityCheck || 'N/A'}</span>
                      </div>
                      {detailsModalData.eligibility?.comments && (
                        <div className="fee-item">
                          <span>Comments</span>
                          <span className="fee-val">{detailsModalData.eligibility.comments}</span>
                        </div>
                      )}
                      {detailsModalData.eligibility?.productSummaryLink && (
                        <div className="fee-item">
                          <span>Product Summary</span>
                          <span className="fee-val"><a href={detailsModalData.eligibility.productSummaryLink} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>View Link</a></span>
                        </div>
                      )}
                      {detailsModalData.eligibility?.productGuidelineLink && (
                        <div className="fee-item">
                          <span>Guidelines</span>
                          <span className="fee-val"><a href={detailsModalData.eligibility.productGuidelineLink} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>View Link</a></span>
                        </div>
                      )}
                    </div>

                    {(detailsModalData.specialBonusAdj != null || detailsModalData.costsAndProfit) && (
                      <div className="fee-group">
                        <div className="fee-group-header">F. Costs & Profit</div>
                        {detailsModalData.specialBonusAdj != null && (
                          <div className="fee-item">
                            <span>Special Bonus Adj</span>
                            <span className="fee-val">{Number(detailsModalData.specialBonusAdj).toFixed(3)}</span>
                          </div>
                        )}
                        {detailsModalData.costsAndProfit && (
                          <>
                            <div className="fee-item">
                              <span>Profit Table</span>
                              <span className="fee-val">{detailsModalData.costsAndProfit.profitTable || 'N/A'}</span>
                            </div>
                            <div className="fee-item">
                              <span>Total Cost/Profit</span>
                              <span className="fee-val">{formatMoney(detailsModalData.costsAndProfit.totalCostProfitDollar)} ({Number(detailsModalData.costsAndProfit.totalCostProfitPercent).toFixed(2)}%)</span>
                            </div>
                            {(detailsModalData.costsAndProfit.amtFromBorrowerPercent != null || detailsModalData.costsAndProfit.amtFromBorrowerDollar != null) && (
                              <div className="fee-item sub-total">
                                <span>Amt From Borrower</span>
                                <span className="fee-val">
                                  {detailsModalData.costsAndProfit.amtFromBorrowerPercent != null && `${Number(detailsModalData.costsAndProfit.amtFromBorrowerPercent).toFixed(2)}%`}
                                  {detailsModalData.costsAndProfit.amtFromBorrowerPercent != null && detailsModalData.costsAndProfit.amtFromBorrowerDollar != null && ' / '}
                                  {detailsModalData.costsAndProfit.amtFromBorrowerDollar != null && formatMoney(detailsModalData.costsAndProfit.amtFromBorrowerDollar)}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="fee-actions-bar">
                <button className="fee-action-btn" onClick={() => window.print()}>
                  <span>🖨️</span> Print
                </button>
                <button className="fee-action-btn" onClick={downloadMainPage}>
                  <span>⬇️</span> Download PDF
                </button>
                <button className="fee-action-btn" onClick={() => {
                  const rate = detailsModalData?.interestRate || 0;
                  const lender = detailsModalData?.lenderName || 'Unknown';
                  window.location.href = `mailto:?subject=${encodeURIComponent(`Loan Rate Details: ${rate}% from ${lender}`)}&body=${encodeURIComponent(`Rate: ${rate}%\nLender: ${lender}\nLoan Amount: ${detailsModalData?.loanAmount || 'N/A'}`)}`;
                }}>
                  <span>✉️</span> Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`modal-overlay ${showLenderModal ? 'active' : ''}`} id="lenderModal">
        <div className="modal-box">
          <div className="modal-close" onClick={() => setShowLenderModal(false)}>x</div>
          <div className="lender-header">
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '15px' }}>Lenders</div>
            <input
              type="text"
              id="lenderSearch"
              className="lender-search-bar"
              placeholder="Search Lenders..."
              value={lenderSearch}
              onChange={(event) => setLenderSearch(event.target.value)}
            />
            <div className="lender-controls">
              <span onClick={() => setSelectedLenders(availableLenders)}>Select All</span>
              <span onClick={() => setSelectedLenders([])}>Clear</span>
            </div>
          </div>
          <div id="lenderListContainer" className="lender-grid">
            <div className="lender-cat-title">Approved Lenders</div>
            {filteredLenders.map((lender) => (
              <label className="lender-checkbox-item" key={lender}>
                <input
                  type="checkbox"
                  value={lender}
                  checked={selectedLenders.includes(lender)}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setSelectedLenders((prev) =>
                      checked ? [...prev, lender] : prev.filter((item) => item !== lender)
                    );
                  }}
                />
                {lender}
              </label>
            ))}
          </div>
          <div className="fee-actions-bar">
            <button className="tpo-btn-submit" style={{ width: '100%', padding: '12px' }} onClick={() => setShowLenderModal(false)} type="button">Apply</button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${showLeadModal ? 'active' : ''}`} id="leadGenModal">
        <div className="modal-box">
          <div className="modal-close" onClick={() => setShowLeadModal(false)}>x</div>
          <div className="modal-title" style={{ padding: '20px', fontWeight: '700', fontSize: '18px' }}>Start Your Application</div>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Complete this form to lock in your rate.</p>
          <form
            id="leadForm"
            onSubmit={(event) => {
              event.preventDefault();
              window.location.href = 'https://theLoanstar.com';
            }}
            style={{ padding: '20px' }}
          >
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" className="modal-input" placeholder="First Name" required />
              <input type="text" className="modal-input" placeholder="Last Name" required />
            </div>
            <input type="tel" className="modal-input" placeholder="Phone Number" required />
            <input type="email" className="modal-input" placeholder="Email Address" required />
            <button type="submit" className="modal-btn">Continue</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default LoanRates;
