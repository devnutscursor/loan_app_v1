import React, { useState, useEffect } from 'react';
import theme from '../../../styles/theme';

/**
 * Assets Form Component
 * 
 * @param {Object} props - Component props
 * @param {Array} props.assets - Array of asset objects
 * @param {Function} props.onChange - Function to handle changes to assets
 * @param {Object} props.borrower - Borrower information
 * @param {Object} props.errors - Validation errors
 * @returns {JSX.Element} Assets form component
 */
const Assets = ({ assets = [], onChange, borrower = {}, errors = {} }) => {
  // Local state for immediate UI updates
  const [localAssets, setLocalAssets] = useState(Array.isArray(assets) ? assets : []);
  
  // Update local state when props change
  useEffect(() => {
    setLocalAssets(Array.isArray(assets) ? assets : []);
  }, [assets]);

  // Get borrower's full name for display
  const getBorrowerName = () => {
    if (borrower.firstName && borrower.lastName) {
      return `${borrower.firstName} ${borrower.lastName}`;
    }
    return 'the borrower';
  };

  // Add a new checking/savings account
  const addAccount = () => {
    const newAccount = {
      id: `account-${Date.now()}`,
      type: 'account',
      accountType: 'checking',
      institution: '',
      value: '',
    };
    // Update local state immediately
    setLocalAssets([...localAssets, newAccount]);
    // Ensure assets is treated as an array
    const currentAssets = Array.isArray(assets) ? assets : [];
    onChange([...currentAssets, newAccount]);
  };

  // Add a new stock or bond
  const addStockOrBond = () => {
    const newStock = {
      id: `stock-${Date.now()}`,
      type: 'investment',
      investmentType: 'stock',
      description: '',
      value: '',
    };
    // Update local state immediately
    setLocalAssets([...localAssets, newStock]);
    // Ensure assets is treated as an array
    const currentAssets = Array.isArray(assets) ? assets : [];
    onChange([...currentAssets, newStock]);
  };

  // Add a new gift or grant
  const addGiftOrGrant = () => {
    const newGift = {
      id: `gift-${Date.now()}`,
      type: 'gift',
      giftType: 'cash',
      source: '',
      value: '',
      deposited: false,
    };
    // Update local state immediately
    setLocalAssets([...localAssets, newGift]);
    // Ensure assets is treated as an array
    const currentAssets = Array.isArray(assets) ? assets : [];
    onChange([...currentAssets, newGift]);
  };

  // Add a new miscellaneous asset
  const addMiscAsset = () => {
    const newMisc = {
      id: `misc-${Date.now()}`,
      type: 'miscellaneous',
      description: '',
      value: '',
    };
    // Update local state immediately
    setLocalAssets([...localAssets, newMisc]);
    // Ensure assets is treated as an array
    const currentAssets = Array.isArray(assets) ? assets : [];
    onChange([...currentAssets, newMisc]);
  };

  // Handle change for a specific asset field
  const handleAssetChange = (id, field, value) => {
    // Update local state immediately for responsive UI
    const updatedLocalAssets = localAssets.map(asset => {
      if (asset.id === id) {
        return { ...asset, [field]: value };
      }
      return asset;
    });
    setLocalAssets(updatedLocalAssets);
    
    // Also update parent component state
    const updatedAssets = (Array.isArray(assets) ? assets : []).map(asset => {
      if (asset.id === id) {
        return { ...asset, [field]: value };
      }
      return asset;
    });
    onChange(updatedAssets);
  };

  // Remove an asset
  const removeAsset = (id) => {
    // Update local state immediately
    const updatedLocalAssets = localAssets.filter(asset => asset.id !== id);
    setLocalAssets(updatedLocalAssets);
    
    // Ensure assets is treated as an array
    const currentAssets = Array.isArray(assets) ? assets : [];
    const updatedAssets = currentAssets.filter(asset => asset.id !== id);
    onChange(updatedAssets);
  };

  // Filter local assets by type for responsive UI
  const accountAssets = localAssets.filter(asset => asset.type === 'account');
  const investmentAssets = localAssets.filter(asset => asset.type === 'investment');
  const giftAssets = localAssets.filter(asset => asset.type === 'gift');
  const miscAssets = localAssets.filter(asset => asset.type === 'miscellaneous');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Assets</h2>
        <p className="text-gray-600 mb-4">
          We need to better understand your financial situation. Please enter any assets belonging to you below.
        </p>
        <hr className="border-t border-gray-300 mb-6" />
      </div>

      {/* Checking and Savings Accounts */}
      <div>
        <h3 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-2 mb-4">
          Checking and Savings Accounts
        </h3>

        {accountAssets.map(account => (
          <div key={account.id} className="mb-6 border border-gray-200 rounded-md p-4 relative">
            <button
              type="button"
              onClick={() => removeAsset(account.id)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              aria-label="Remove this account"
            >
              <div className="flex items-center">
                <span className="text-xs mr-1">Remove</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </button>

            <div className="mb-4">
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Bank or Credit Union Name
              </label>
              <input
                type="text"
                value={account.institution || ''}
                onChange={(e) => handleAssetChange(account.id, 'institution', e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ focusRing: theme.colors.primary }}
                placeholder="Bank of America"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Account Value
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    value={account.value || ''}
                    onChange={(e) => handleAssetChange(account.id, 'value', e.target.value)}
                    className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRing: theme.colors.primary }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Account Type
                </label>
                <div className="relative">
                  <select
                    value={account.accountType || 'checking'}
                    onChange={(e) => handleAssetChange(account.id, 'accountType', e.target.value)}
                    className="appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="moneyMarket">Money Market</option>
                    <option value="cd">Certificate of Deposit</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addAccount}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.5rem 0.75rem',
            borderWidth: '1px',
            borderColor: theme.colors.primary,
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            fontWeight: '500',
            color: theme.colors.primary,
            backgroundColor: 'white',
            transition: 'all 150ms ease-in-out',
          }}
          className="focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-gray-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Checking or Savings Account
        </button>
      </div>

      {/* Stocks and Bonds */}
      <div>
        <h3 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-2 mb-4">
          Stocks and Bonds
        </h3>

        {investmentAssets.map(investment => (
          <div key={investment.id} className="mb-6 border border-gray-200 rounded-md p-4 relative">
            <button
              type="button"
              onClick={() => removeAsset(investment.id)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              aria-label="Remove this stock or bond"
            >
              <div className="flex items-center">
                <span className="text-xs mr-1">Remove</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={investment.description || ''}
                  onChange={(e) => handleAssetChange(investment.id, 'description', e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ focusRing: theme.colors.primary }}
                  placeholder="Tesla Stock"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Value
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    value={investment.value || ''}
                    onChange={(e) => handleAssetChange(investment.id, 'value', e.target.value)}
                    className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRing: theme.colors.primary }}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addStockOrBond}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.5rem 0.75rem',
            borderWidth: '1px',
            borderColor: theme.colors.primary,
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            fontWeight: '500',
            color: theme.colors.primary,
            backgroundColor: 'white',
            transition: 'all 150ms ease-in-out',
          }}
          className="focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-gray-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Stock or Bond
        </button>
      </div>

      {/* Gifts and Grants */}
      <div>
        <h3 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-2 mb-4">
          Gifts and Grants
        </h3>

        {giftAssets.map(gift => (
          <div key={gift.id} className="mb-6 border border-gray-200 rounded-md p-4 relative">
            <button
              type="button"
              onClick={() => removeAsset(gift.id)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              aria-label="Remove this gift or grant"
            >
              <div className="flex items-center">
                <span className="text-xs mr-1">Remove</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Asset Type
                </label>
                <div className="relative">
                  <select
                    value={gift.giftType || 'cash'}
                    onChange={(e) => handleAssetChange(gift.id, 'giftType', e.target.value)}
                    className="appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="cash">Cash Gift</option>
                    <option value="grant">Grant</option>
                    <option value="downPayment">Gift of Equity</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Source
                </label>
                <div className="relative">
                  <select
                    value={gift.source || ''}
                    onChange={(e) => handleAssetChange(gift.id, 'source', e.target.value)}
                    className="appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Source</option>
                    <option value="employer">Employer</option>
                    <option value="relative">Relative</option>
                    <option value="federalAgency">Federal Agency</option>
                    <option value="localAgency">Local Agency</option>
                    <option value="religiousNonprofit">Religious Nonprofit</option>
                    <option value="communityNonprofit">Community Nonprofit</option>
                    <option value="stateAgency">State Agency</option>
                    <option value="lender">Lender</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Value
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    value={gift.value || ''}
                    onChange={(e) => handleAssetChange(gift.id, 'value', e.target.value)}
                    className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRing: theme.colors.primary }}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={gift.deposited || false}
                  onChange={(e) => handleAssetChange(gift.id, 'deposited', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-gray-700">Deposited</span>
              </label>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addGiftOrGrant}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.5rem 0.75rem',
            borderWidth: '1px',
            borderColor: theme.colors.primary,
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            fontWeight: '500',
            color: theme.colors.primary,
            backgroundColor: 'white',
            transition: 'all 150ms ease-in-out',
          }}
          className="focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-gray-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Gift or Grant
        </button>
      </div>

      {/* Miscellaneous Assets */}
      <div>
        <h3 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-2 mb-4">
          Miscellaneous Assets
        </h3>

        {miscAssets.length > 0 && (
          <div className="mb-6 border border-gray-200 rounded-md p-4 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Earnest Money
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    value={miscAssets[0]?.earnestMoney || ''}
                    onChange={(e) => handleAssetChange(miscAssets[0]?.id, 'earnestMoney', e.target.value)}
                    className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRing: theme.colors.primary }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Life Insurance
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    value={miscAssets[0]?.lifeInsurance || ''}
                    onChange={(e) => handleAssetChange(miscAssets[0]?.id, 'lifeInsurance', e.target.value)}
                    className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRing: theme.colors.primary }}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Vested Interest in Retirement Fund
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    value={miscAssets[0]?.retirementFund || ''}
                    onChange={(e) => handleAssetChange(miscAssets[0]?.id, 'retirementFund', e.target.value)}
                    className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRing: theme.colors.primary }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Other Assets
                </label>
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeAsset(miscAssets[0]?.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  aria-label="Remove this asset"
                >
                  <div className="flex items-center">
                    <span className="text-xs mr-1">Remove</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    value={miscAssets[0]?.otherAssets || ''}
                    onChange={(e) => handleAssetChange(miscAssets[0]?.id, 'otherAssets', e.target.value)}
                    className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRing: theme.colors.primary }}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {miscAssets.length === 0 && (
          <button
            type="button"
            onClick={addMiscAsset}
            style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.5rem 0.75rem',
            borderWidth: '1px',
            borderColor: theme.colors.primary,
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            fontWeight: '500',
            color: theme.colors.primary,
            backgroundColor: 'white',
            transition: 'all 150ms ease-in-out',
          }}
          className="focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Miscellaneous Assets
          </button>
        )}
      </div>
    </div>
  );
};

export default Assets;
