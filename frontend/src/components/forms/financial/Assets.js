import React, { useState, useEffect } from 'react';
import theme from '../../../styles/theme';

/**
 * Assets Form Component
 * 
 * This component manages the asset section of the loan application form.
 * It handles different asset types: checking/savings accounts, stocks/bonds,
 * gifts/grants, and miscellaneous assets.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.assets - Assets object with categories
 * @param {Function} props.onChange - Function to handle changes to assets
 * @param {Object} props.borrower - Borrower information
 * @param {Object} props.errors - Validation errors
 * @returns {JSX.Element} Assets form component
 */
const Assets = ({ assets = {}, onChange, borrower = {}, errors = {} }) => {
  // Ensure each asset has a valid, unique ID
  const ensureUniqueIds = (items, prefix) => {
    return Array.isArray(items) ? items.map((item, index) => {
      if (!item.id) {
        const timestamp = new Date().getTime() + index;
        const randomString = Math.random().toString(36).substring(2, 10);
        return { ...item, id: `${prefix}-${timestamp}-${randomString}` };
      }
      return item;
    }) : [];
  };

  // Initialize local state with proper structure and guaranteed IDs
  const [localAssets, setLocalAssets] = useState({
    checkingAndSavings: ensureUniqueIds(assets.checkingAndSavings, 'account'),
    stocksAndBonds: ensureUniqueIds(assets.stocksAndBonds, 'stock'),
    giftsAndGrants: ensureUniqueIds(assets.giftsAndGrants, 'gift'),
    miscellaneous: assets.miscellaneous || {
      earnestMoney: 0,
      lifeInsurance: 0,
      vestedInterestInRetirement: 0,
      otherAssets: 0
    }
  });
  
  // Update local state when props change, ensuring IDs are preserved
  useEffect(() => {
    setLocalAssets({
      checkingAndSavings: ensureUniqueIds(assets.checkingAndSavings, 'account'),
      stocksAndBonds: ensureUniqueIds(assets.stocksAndBonds, 'stock'),
      giftsAndGrants: ensureUniqueIds(assets.giftsAndGrants, 'gift'),
      miscellaneous: assets.miscellaneous || {
        earnestMoney: 0,
        lifeInsurance: 0,
        vestedInterestInRetirement: 0,
        otherAssets: 0
      }
    });
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
    // Force delay to ensure unique timestamp
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 10);
    const uniqueId = `account-${timestamp}-${randomString}`;
    console.log('Generated new account with ID:', uniqueId);
    
    const newAccount = {
      id: uniqueId,
      bankName: '',
      accountType: 'Checking',
      value: '',
      isVerified: false,
      isLiquid: false
    };
    const updatedAccounts = [...localAssets.checkingAndSavings, newAccount];
    
    // Update local state
    setLocalAssets({
      ...localAssets,
      checkingAndSavings: updatedAccounts
    });
    
    // Update parent component - use original assets prop as base
    onChange({
      ...assets,
      checkingAndSavings: updatedAccounts
    });
  };

  // Add a new stock or bond
  const addStockOrBond = () => {
    // Force delay to ensure unique timestamp
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 10);
    const uniqueId = `stock-${timestamp}-${randomString}`;
    console.log('Generated new stock with ID:', uniqueId);
    
    const newStock = {
      id: uniqueId,
      description: '',
      value: '',
      isVerified: false,
      isLiquid: false
    };
    const updatedStocks = [...localAssets.stocksAndBonds, newStock];
    
    // Update local state
    setLocalAssets({
      ...localAssets,
      stocksAndBonds: updatedStocks
    });
    
    // Update parent component - use original assets prop as base
    onChange({
      ...assets,
      stocksAndBonds: updatedStocks
    });
  };

  // Add a new gift or grant
  const addGiftOrGrant = () => {
    // Force delay to ensure unique timestamp
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 10);
    const uniqueId = `gift-${timestamp}-${randomString}`;
    console.log('Generated new gift with ID:', uniqueId);
    
    const newGift = {
      id: uniqueId,
      assetType: 'Cash Gift',
      source: 'Relative',
      value: '',
      deposited: false,
      isVerified: false,
      isLiquid: false
    };
    const updatedGifts = [...localAssets.giftsAndGrants, newGift];
    
    // Update local state
    setLocalAssets({
      ...localAssets,
      giftsAndGrants: updatedGifts
    });
    
    // Update parent component - use original assets prop as base
    onChange({
      ...assets,
      giftsAndGrants: updatedGifts
    });
  };

  // Add miscellaneous assets if not present
  const addMiscAsset = () => {
    const miscAsset = {
      earnestMoney: 0,
      lifeInsurance: 0,
      vestedInterestInRetirement: 0,
      otherAssets: 0
    };
    
    // Update local state
    setLocalAssets({
      ...localAssets,
      miscellaneous: miscAsset
    });
    
    // Update parent component - use original assets prop as base
    onChange({
      ...assets,
      miscellaneous: miscAsset
    });
  };

  // Handle change for checking/savings accounts
  const handleAccountChange = (id, field, value) => {
    const updatedAccounts = localAssets.checkingAndSavings.map(account => {
      if (account.id === id) {
        return { ...account, [field]: value };
      }
      return account;
    });
    
    // Update local state
    setLocalAssets({
      ...localAssets,
      checkingAndSavings: updatedAccounts
    });
    
    // Update parent component - use original assets prop as base
    onChange({
      ...assets,
      checkingAndSavings: updatedAccounts
    });
  };

  // Handle change for stocks/bonds
  const handleStockChange = (id, field, value) => {
    const updatedStocks = localAssets.stocksAndBonds.map(stock => {
      if (stock.id === id) {
        return { ...stock, [field]: value };
      }
      return stock;
    });
    
    // Update local state
    setLocalAssets({
      ...localAssets,
      stocksAndBonds: updatedStocks
    });
    
    // Update parent component - use original assets prop as base
    onChange({
      ...assets,
      stocksAndBonds: updatedStocks
    });
  };

  // Handle change for gifts/grants
  const handleGiftChange = (id, field, value) => {
    const updatedGifts = localAssets.giftsAndGrants.map(gift => {
      if (gift.id === id) {
        return { ...gift, [field]: value };
      }
      return gift;
    });
    
    // Update local state
    setLocalAssets({
      ...localAssets,
      giftsAndGrants: updatedGifts
    });
    
    // Update parent component - use original assets prop as base
    onChange({
      ...assets,
      giftsAndGrants: updatedGifts
    });
  };

  // Handle change for miscellaneous assets
  const handleMiscChange = (field, value) => {
    const updatedMisc = {
      ...localAssets.miscellaneous,
      [field]: value
    };
    
    // Update local state
    setLocalAssets({
      ...localAssets,
      miscellaneous: updatedMisc
    });
    
    // Update parent component - use original assets prop as base
    onChange({
      ...assets,
      miscellaneous: updatedMisc
    });
  };

  // Remove an account
  const removeAccount = (id) => {
    const updatedAccounts = localAssets.checkingAndSavings.filter(account => account.id !== id);
    
    // Update local state
    setLocalAssets({
      ...localAssets,
      checkingAndSavings: updatedAccounts
    });
    
    // Update parent component - use original assets prop as base
    onChange({
      ...assets,
      checkingAndSavings: updatedAccounts
    });
  };

  // Remove a stock/bond
  const removeStock = (id) => {
    const updatedStocks = localAssets.stocksAndBonds.filter(stock => stock.id !== id);
    
    // Update local state
    setLocalAssets({
      ...localAssets,
      stocksAndBonds: updatedStocks
    });
    
    // Update parent component - use original assets prop as base
    onChange({
      ...assets,
      stocksAndBonds: updatedStocks
    });
  };

  // Remove a gift/grant
  const removeGift = (id) => {
    const updatedGifts = localAssets.giftsAndGrants.filter(gift => gift.id !== id);
    
    // Update local state
    setLocalAssets({
      ...localAssets,
      giftsAndGrants: updatedGifts
    });
    
    // Update parent component - use original assets prop as base
    onChange({
      ...assets,
      giftsAndGrants: updatedGifts
    });
  };

  // Remove miscellaneous assets
  const removeMiscAssets = () => {
    // Update local state
    setLocalAssets({
      ...localAssets,
      miscellaneous: null
    });
    
    // Update parent component - use original assets prop as base
    onChange({
      ...assets,
      miscellaneous: null
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Assets</h2>
        <p className="text-gray-600 mb-4">
          We need to better understand your financial situation. Please enter any assets belonging to you below.
        </p>
        <hr className="border-t border-gray-300 mb-6" />
      </div>

      {/* Checking and Savings Accounts */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2 mb-4">
          Checking and Savings Accounts
        </h3>

        {localAssets.checkingAndSavings.map((account, index) => (
          <div key={account.id} className="mb-6 border border-gray-200 rounded-md p-4 relative">
            {/* ID is now guaranteed to exist */}
            <button
              type="button"
              onClick={() => removeAccount(account.id)}
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
            
            <div className="mb-4 flex space-x-6 mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={account.isVerified || false}
                  onChange={(e) => handleAccountChange(account.id, 'isVerified', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-gray-700 text-xs">Verified</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={account.isLiquid || false}
                  onChange={(e) => handleAccountChange(account.id, 'isLiquid', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-gray-700 text-xs">Liquid</span>
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Bank or Credit Union Name
              </label>
              <input
                type="text"
                value={account.bankName || ''}
                onChange={(e) => handleAccountChange(account.id, 'bankName', e.target.value)}
                className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
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
                    onChange={(e) => handleAccountChange(account.id, 'value', e.target.value)}
                    className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
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
                    value={account.accountType || 'Checking'}
                    onChange={(e) => handleAccountChange(account.id, 'accountType', e.target.value)}
                    className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Checking">Checking</option>
                    <option value="Savings">Savings</option>
                    <option value="Money Market">Money Market</option>
                    <option value="Certificate of Deposit">Certificate of Deposit</option>
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
                      padding: '0.25rem 0.5rem',  // Reduced padding
                      borderWidth: '1px',
                      borderColor: theme.colors.primary,
                      borderRadius: '0.25rem',  // Slightly smaller border radius
                      fontSize: '0.75rem',  // Smaller font size
                      lineHeight: '1rem',  // Tighter line height
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
        <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2 mb-4">
          Stocks and Bonds
        </h3>

        {localAssets.stocksAndBonds.map((stock, index) => (
          <div key={stock.id} className="mb-6 border border-gray-200 rounded-md p-4 relative">
            {/* ID is now guaranteed to exist */}
            <button
              type="button"
              onClick={() => removeStock(stock.id)}
              className="text-xs absolute top-2 right-2 text-red-500 hover:text-red-700"
              aria-label="Remove this stock or bond"
            >
              <div className="flex items-center">
                <span className="text-xs mr-1">Remove</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </button>
            
            <div className="flex space-x-6 mt-2 absolute top-2 left-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={stock.isVerified || false}
                  onChange={(e) => handleStockChange(stock.id, 'isVerified', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-gray-700 text-xs">Verified</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={stock.isLiquid || false}
                  onChange={(e) => handleStockChange(stock.id, 'isLiquid', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-gray-700 text-xs">Liquid</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={stock.description || ''}
                  onChange={(e) => handleStockChange(stock.id, 'description', e.target.value)}
                  className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
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
                    <span className="text-gray-500 text-xs">$</span>
                  </div>
                  <input
                    type="text"
                    value={stock.value || ''}
                    onChange={(e) => handleStockChange(stock.id, 'value', e.target.value)}
                    className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
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
                      padding: '0.25rem 0.5rem',  // Reduced padding
                      borderWidth: '1px',
                      borderColor: theme.colors.primary,
                      borderRadius: '0.25rem',  // Slightly smaller border radius
                      fontSize: '0.75rem',  // Smaller font size
                      lineHeight: '1rem',  // Tighter line height
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
        <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2 mb-4">
          Gifts and Grants
        </h3>

        {localAssets.giftsAndGrants.map((gift, index) => (
          <div key={gift.id} className="mb-6 border border-gray-200 rounded-md p-4 relative">
            {/* ID is now guaranteed to exist */}
            <button
              type="button"
              onClick={() => removeGift(gift.id)}
              className="text-xs absolute top-2 right-2 text-red-500 hover:text-red-700"
              aria-label="Remove this gift or grant"
            >
              <div className="flex items-center">
                <span className="text-xs mr-1">Remove</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </button>
            
            <div className="flex flex-wrap gap-4 absolute top-2 left-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={gift.deposited || false}
                  onChange={(e) => handleGiftChange(gift.id, 'deposited', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-gray-700 text-xs">Deposited</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={gift.isVerified || false}
                  onChange={(e) => handleGiftChange(gift.id, 'isVerified', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-gray-700 text-xs">Verified</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={gift.isLiquid || false}
                  onChange={(e) => handleGiftChange(gift.id, 'isLiquid', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-gray-700 text-xs">Liquid</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Asset Type
                </label>
                <div className="relative">
                  <select
                    value={gift.assetType || 'Cash Gift'}
                    onChange={(e) => handleGiftChange(gift.id, 'assetType', e.target.value)}
                    className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Cash Gift">Cash Gift</option>
                    <option value="Grant">Grant</option>
                    <option value="Down Payment Assistance">Down Payment Assistance</option>
                    <option value="Other">Other</option>
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
                    value={gift.source || 'Relative'}
                    onChange={(e) => handleGiftChange(gift.id, 'source', e.target.value)}
                    className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Relative">Relative</option>
                    <option value="Friend">Friend</option>
                    <option value="Employer">Employer</option>
                    <option value="Municipality">Municipality</option>
                    <option value="Non-Profit">Non-Profit</option>
                    <option value="Other">Other</option>
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
                    onChange={(e) => handleGiftChange(gift.id, 'value', e.target.value)}
                    className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRing: theme.colors.primary }}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Checkboxes moved to the top */}
          </div>
        ))}

        <button
          type="button"
          onClick={addGiftOrGrant}
          style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.25rem 0.5rem',  // Reduced padding
                      borderWidth: '1px',
                      borderColor: theme.colors.primary,
                      borderRadius: '0.25rem',  // Slightly smaller border radius
                      fontSize: '0.75rem',  // Smaller font size
                      lineHeight: '1rem',  // Tighter line height
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
        <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2 mb-4">
          Miscellaneous Assets
        </h3>

        {localAssets.miscellaneous ? (
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
                    value={localAssets.miscellaneous.earnestMoney || ''}
                    onChange={(e) => handleMiscChange('earnestMoney', e.target.value)}
                    className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
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
                    value={localAssets.miscellaneous.lifeInsurance || ''}
                    onChange={(e) => handleMiscChange('lifeInsurance', e.target.value)}
                    className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
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
                    value={localAssets.miscellaneous.vestedInterestInRetirement || ''}
                    onChange={(e) => handleMiscChange('vestedInterestInRetirement', e.target.value)}
                    className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRing: theme.colors.primary }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Other Assets
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    value={localAssets.miscellaneous.otherAssets || ''}
                    onChange={(e) => handleMiscChange('otherAssets', e.target.value)}
                    className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRing: theme.colors.primary }}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={addMiscAsset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.25rem 0.5rem',  // Reduced padding
              borderWidth: '1px',
              borderColor: theme.colors.primary,
              borderRadius: '0.25rem',  // Slightly smaller border radius
              fontSize: '0.75rem',  // Smaller font size
              lineHeight: '1rem',  // Tighter line height
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
