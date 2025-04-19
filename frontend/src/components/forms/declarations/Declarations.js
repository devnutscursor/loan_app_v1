import React, { useState, useEffect } from 'react';

/**
 * Declarations Component
 * 
 * Manages the declarations section in the Declarations & Demographics step
 * 
 * @param {Object} props - Component props
 * @param {Object} props.declarations - Declarations data
 * @param {Function} props.onChange - Function to handle changes
 * @param {Object} props.borrower - Borrower information
 * @param {Object} props.errors - Validation errors
 * @returns {JSX.Element} Declarations form component
 */
const Declarations = ({ declarations = {}, onChange, borrower = {}, errors = {} }) => {
  // Local state for immediate UI updates
  const [localDeclarations, setLocalDeclarations] = useState({
    occupyAsPrimary: declarations.occupyAsPrimary ?? false,
    hadOwnershipInterest: declarations.hadOwnershipInterest ?? null,
    ownedPropertyType: declarations.ownedPropertyType || '',
    titleHoldingType: declarations.titleHoldingType || '',
    borrowingMoney: declarations.borrowingMoney ?? false,
    borrowingMoneyAmount: declarations.borrowingMoneyAmount || '',
    applyingForMortgage: declarations.applyingForMortgage ?? false,
    applyingForNewCredit: declarations.applyingForNewCredit ?? false,
    propertySubjectToLien: declarations.propertySubjectToLien ?? false,
    coSigner: declarations.coSigner ?? false,
    delinquent: declarations.delinquent ?? false,
    partyToLawsuit: declarations.partyToLawsuit ?? false,
    conveyedTitle: declarations.conveyedTitle ?? false,
    preForeclosureSale: declarations.preForeclosureSale ?? false,
    propertyForeclosed: declarations.propertyForeclosed ?? false,
    outstandingJudgements: declarations.outstandingJudgements ?? false,
    declaredBankruptcy: declarations.declaredBankruptcy ?? false,
    bankruptcyType: declarations.bankruptcyType || '',
    familyRelationship: declarations.familyRelationship ?? false,
    firstTimeBuyer: declarations.firstTimeBuyer ?? false
  });
  
  // Update local state when props change
  useEffect(() => {
    setLocalDeclarations({
      occupyAsPrimary: declarations.occupyAsPrimary ?? false,
      hadOwnershipInterest: declarations.hadOwnershipInterest ?? null,
      ownedPropertyType: declarations.ownedPropertyType || '',
      titleHoldingType: declarations.titleHoldingType || '',
      borrowingMoney: declarations.borrowingMoney ?? false,
      borrowingMoneyAmount: declarations.borrowingMoneyAmount || '',
      applyingForMortgage: declarations.applyingForMortgage ?? false,
      applyingForNewCredit: declarations.applyingForNewCredit ?? false,
      propertySubjectToLien: declarations.propertySubjectToLien ?? false,
      coSigner: declarations.coSigner ?? false,
      delinquent: declarations.delinquent ?? false,
      partyToLawsuit: declarations.partyToLawsuit ?? false,
      conveyedTitle: declarations.conveyedTitle ?? false,
      preForeclosureSale: declarations.preForeclosureSale ?? false,
      propertyForeclosed: declarations.propertyForeclosed ?? false,
      outstandingJudgements: declarations.outstandingJudgements ?? false,
      declaredBankruptcy: declarations.declaredBankruptcy ?? false,
      bankruptcyType: declarations.bankruptcyType || '',
      familyRelationship: declarations.familyRelationship ?? false,
      firstTimeBuyer: declarations.firstTimeBuyer ?? false
    });
  }, [declarations]);

  // Handle change for a specific field
  const handleChange = (field, value) => {
    let updatedDeclarations = {
      ...localDeclarations,
      [field]: value
    };

    // Reset dependent fields if the condition changes
    if (field === 'occupyAsPrimary' && value === false) {
      updatedDeclarations = {
        ...updatedDeclarations,
        hadOwnershipInterest: null,
        ownedPropertyType: '',
        titleHoldingType: ''
      };
    }

    if (field === 'hadOwnershipInterest' && value === false) {
      updatedDeclarations = {
        ...updatedDeclarations,
        ownedPropertyType: '',
        titleHoldingType: ''
      };
    }
    
    if (field === 'borrowingMoney' && value === false) {
      updatedDeclarations = { ...updatedDeclarations, borrowingMoneyAmount: '' };
    }

    if (field === 'declaredBankruptcy' && value === false) {
      updatedDeclarations = { ...updatedDeclarations, bankruptcyType: '' };
    }

    setLocalDeclarations(updatedDeclarations);
    onChange(updatedDeclarations);
  };

  // Get borrower's name for display
  const getBorrowerName = () => {
    if (borrower.firstName && borrower.lastName) {
      return `${borrower.firstName} ${borrower.lastName}`;
    }
    return 'the borrower';
  };

  // Render a toggle button for Yes/No questions
  const renderToggle = (field, label) => {
    return (
      <div className="mb-6">
        <p className="text-sm text-gray-700 mb-2">{label}</p>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => handleChange(field, true)}
            className={`flex items-center justify-center px-4 py-2 border ${
              localDeclarations[field] === true
                ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                : 'border-gray-300 text-gray-700'
            } rounded-md focus:outline-none`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => handleChange(field, false)}
            className={`flex items-center justify-center px-4 py-2 border ${
              localDeclarations[field] === false
                ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                : 'border-gray-300 text-gray-700'
            } rounded-md focus:outline-none`}
          >
            No
          </button>
        </div>
        {errors[field] && <p className="mt-1 text-sm text-red-600">{errors[field]}</p>}
      </div>
    );
  };

  // Render a dropdown select input
  const renderDropdown = (field, label, options) => {
    return (
      <div className="mb-6">
        <label className="block text-sm text-gray-700 mb-2">{label}</label>
        <div className="relative">
          <select
            value={localDeclarations[field]}
            onChange={(e) => handleChange(field, e.target.value)}
            className="appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">--Select--</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
        {errors[field] && <p className="mt-1 text-sm text-red-600">{errors[field]}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Declarations</h2>
        <p className="text-gray-600 mb-4">
          Almost done! We just need a few more details about your property, your funding, and your past financial history.
        </p>
        <hr className="border-t border-gray-300 mb-6" />
      </div>

      <div>
        <h3 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-2 mb-4">
          Declarations about the Property and your Money for the Loan
        </h3>

        {/* Will you occupy the property as your primary residence? */}
        {renderToggle('occupyAsPrimary', 'Will you occupy the property as your primary residence?')}

        {/* Conditionally render ownership interest question */}
        {localDeclarations.occupyAsPrimary === true && (
          <>
            {renderToggle('hadOwnershipInterest', 'Have you had an ownership interest in another property in the last three years?')}

            {/* Conditionally render property details */}
            {localDeclarations.hadOwnershipInterest === true && (
              <div className="pl-6 border-l-2 border-gray-200 ml-4">
                {renderDropdown('ownedPropertyType', 'What type of property did you own?', [
                  { value: 'primary residence', label: 'Primary Residence' },
                  { value: 'vacation home', label: 'Vacation Home' },
                  { value: 'investment', label: 'Investment' }
                ])}
                {renderDropdown('titleHoldingType', 'How did you hold title to the property?', [
                  { value: 'yourself', label: 'Yourself' },
                  { value: 'jointly with spouse', label: 'Jointly with your spouse' },
                  { value: 'jointly with someone else', label: 'Jointly with someone else' }
                ])}
              </div>
            )}
          </>
        )}

        {/* Are you borrowing any money for this real estate transaction? */}
        {renderToggle('borrowingMoney', 'Are you borrowing any money for this real estate transaction (e.g., money for your closing costs or down payment) or obtaining any money from another party, such as the seller or realtor, that you have not disclosed on this loan application?')}

        {/* Amount of borrowed money */}
        {localDeclarations.borrowingMoney && (
          <div className="mb-6">
            <label className="block text-sm text-gray-700 mb-2">
              WHAT IS THE AMOUNT OF THIS MONEY?
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                value={localDeclarations.borrowingMoneyAmount}
                onChange={(e) => handleChange('borrowingMoneyAmount', e.target.value)}
                className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {/* Have you or will you be applying for a mortgage loan on another property? */}
        {renderToggle('applyingForMortgage', 'Have you or will you be applying for a mortgage loan on another property (not the property securing this loan) on or before closing this transaction that is not disclosed on this loan application?')}

        {/* Have you or will you be applying for any new credit? */}
        {renderToggle('applyingForNewCredit', 'Have you or will you be applying for any new credit (e.g., installment loan, credit card, etc.) on or before closing this loan that is not disclosed on this application?')}

        {/* Will this property be subject to a lien? */}
        {renderToggle('propertySubjectToLien', 'Will this property be subject to a lien that could take priority over the first mortgage lien, such as a clean energy lien paid through your property taxes (e.g., the Property Assessed Clean Energy Program)?')}

        <h3 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-2 mb-4 mt-8">
          Declarations about your Finances
        </h3>

        {/* Are you a co-signer or co-obligor on any debt or loan? */}
        {renderToggle('coSigner', 'Are you a co-signer or guarantor on any debt or loan that is not disclosed on this application?')}

        {/* Are you currently delinquent or in default on a Federal debt? */}
        {renderToggle('delinquent', 'Are you currently delinquent or in default on a Federal debt?')}

        {/* Are you a party to a lawsuit? */}
        {renderToggle('partyToLawsuit', 'Are you a party to a lawsuit in which you potentially have any personal financial liability?')}

        {/* Have you conveyed title to any property in lieu of foreclosure? */}
        {renderToggle('conveyedTitle', 'Have you conveyed title to any property in lieu of foreclosure in the past 7 years?')}

        {/* Within the past 7 years, have you completed a pre-foreclosure sale? */}
        {renderToggle('preForeclosureSale', 'Within the past 7 years, have you completed a pre-foreclosure sale or short sale, whereby the property was sold to a third party and the Lender agreed to accept less than the outstanding mortgage balance due?')}

        {/* Have you had property foreclosed upon in the last 7 years? */}
        {renderToggle('propertyForeclosed', 'Have you had property foreclosed upon in the last 7 years?')}

        {/* Are there any outstanding judgements against you? */}
        {renderToggle('outstandingJudgements', 'Are there any outstanding judgements against you?')}

        {/* Have you declared bankruptcy within the past 7 years? */}
        {renderToggle('declaredBankruptcy', 'Have you declared bankruptcy within the past 7 years?')}

        {/* Type of bankruptcy */}
        {localDeclarations.declaredBankruptcy && (
          <div className="mb-6">
            {renderDropdown('bankruptcyType', 'WHAT TYPE OF BANKRUPTCY DID YOU DECLARE?', [
              { value: 'Chapter 7', label: 'Chapter 7' },
              { value: 'Chapter 11', label: 'Chapter 11' },
              { value: 'Chapter 12', label: 'Chapter 12' },
              { value: 'Chapter 13', label: 'Chapter 13' }
            ])}
          </div>
        )}

        {/* Are/were you obligated on a loan? */}
        {renderToggle('familyRelationship', 'Are/were you employed by a family member, property seller, real estate agent, or other party to the transaction?')}

        {/* Are you a first time homebuyer? */}
        {renderToggle('firstTimeBuyer', 'Are you a first time homebuyer?')}
      </div>
    </div>
  );
};

export default Declarations;
