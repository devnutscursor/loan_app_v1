/**
 * Validation rules for loan application forms
 * Defines required fields and conditional validation logic
 */

// Required fields for borrower information
export const borrowerRequiredFields = {
  // Personal Details
  'borrowers[0].firstName': 'First name is required',
  'borrowers[0].lastName': 'Last name is required',
  'borrowers[0].dateOfBirth': 'Date of birth is required',
  'borrowers[0].ssn': 'SSN is required',
  'borrowers[0].email': 'Email is required',
  'borrowers[0].phone': 'Phone number is required',
  'borrowers[0].maritalStatus': 'Marital status is required',
  'borrowers[0].citizenship': 'Citizenship status is required',
  
  // Current Address
  'borrowers[0].currentAddress.streetAddress': 'Street address is required',
  'borrowers[0].currentAddress.city': 'City is required',
  'borrowers[0].currentAddress.state': 'State is required',
  'borrowers[0].currentAddress.zipCode': 'ZIP code is required',
  'borrowers[0].currentAddress.housingStatus': 'Housing status is required',
  'borrowers[0].currentAddress.yearsAtAddress': 'Years at address is required',
  'borrowers[0].currentAddress.monthsAtAddress': 'Months at address is required',
  
  // Employment (at least one employer required)
  'borrowers[0].employers[0].companyName': 'Company name is required',
  'borrowers[0].employers[0].jobTitle': 'Job title is required',
  'borrowers[0].employers[0].employmentStatus': 'Employment status is required',
  'borrowers[0].employers[0].startDate': 'Start date is required',
  'borrowers[0].employers[0].yearsInProfession': 'Years in profession is required',
  'borrowers[0].employers[0].monthsInProfession': 'Months in profession is required',
  'borrowers[0].employers[0].streetAddress': 'Company address is required',
  'borrowers[0].employers[0].city': 'Company city is required',
  'borrowers[0].employers[0].state': 'Company state is required',
  'borrowers[0].employers[0].zipCode': 'Company ZIP code is required',
};

// Required fields for property information
export const propertyRequiredFields = {
  'propertyInfo.hasAcceptedOffer': 'Please indicate if you have an accepted offer on a property',
  'propertyInfo.propertyType': 'Property type is required',
  'propertyInfo.occupancyType': 'Occupancy type is required',
};

// Required fields for loan details
export const loanRequiredFields = {
  'loanInfo.loanType': 'Loan type is required',
};

// Conditional fields based on loan type
export const conditionalFields = {
  // Purchase loan specific fields
  purchase: {
    'loanInfo.purchasePrice': 'Purchase price is required for purchase loans',
    'loanInfo.downPayment': 'Down payment is required for purchase loans',
  },
  
  // Refinance loan specific fields
  refinance: {
    'loanInfo.yearAcquired': 'Year acquired is required for refinance loans',
    'loanInfo.currentLoanBalance': 'Current loan balance is required for refinance loans',
    'loanInfo.requestedLoanAmount': 'Requested loan amount is required for refinance loans',
    'loanInfo.refinanceType': 'Refinance type is required for refinance loans',
  },
  
  // Construction loan specific fields
  construction: {
    'loanInfo.yearLotAcquired': 'Year lot acquired is required for construction loans',
    'loanInfo.originalCost': 'Original cost is required for construction loans',
    'loanInfo.existingLoans': 'Existing loans is required for construction loans',
    'loanInfo.presentValueOfLot': 'Present value of lot is required for construction loans',
    'loanInfo.costOfImprovements': 'Cost of improvements is required for construction loans',
    'loanInfo.constructionType': 'Construction type is required for construction loans',
  },
  
  // Property with accepted offer (only when hasAcceptedOffer is true)
  hasAcceptedOffer: {
    'propertyInfo.contractPurchasePrice': 'Contract purchase price is required when you have an accepted offer',
    'propertyInfo.isMixedUse': 'Mixed use status is required when you have an accepted offer',
    'propertyInfo.isManufactured': 'Manufactured home status is required when you have an accepted offer',
    'propertyInfo.numberOfUnits': 'Number of units is required when you have an accepted offer',
    'propertyInfo.yearBuilt': 'Year built is required when you have an accepted offer',
    'propertyInfo.propertyValue': 'Property value is required when you have an accepted offer',
  },
  
  // Properties owned (only when ownsProperty is true)
  ownsProperty: {
    'propertiesOwned.properties.0.propertyAddress.streetAddress': 'Property address is required when you own property',
    'propertiesOwned.properties.0.propertyAddress.city': 'Property city is required when you own property',
    'propertiesOwned.properties.0.propertyAddress.state': 'Property state is required when you own property',
    'propertiesOwned.properties.0.propertyAddress.zipCode': 'Property ZIP code is required when you own property',
    'propertiesOwned.properties.0.presentMarketValue': 'Market value is required when you own property',
    'propertiesOwned.properties.0.monthlyCosts': 'Monthly costs are required when you own property',
    'propertiesOwned.properties.0.statusOfProperty': 'Property status is required when you own property',
    'propertiesOwned.properties.0.intendedOccupancy': 'Intended occupancy is required when you own property',
  },
  
  // Property has loan (only when hasLoan is true)
  hasLoan: {
    'propertiesOwned.properties.0.monthlyPayment': 'Monthly payment is required when property has a loan',
    'propertiesOwned.properties.0.unpaidBalance': 'Unpaid balance is required when property has a loan',
  },
};

// Required fields for financial information
export const financialRequiredFields = {
  'income.baseIncome': 'Base income is required',
};

// Required fields for additional information
export const additionalRequiredFields = {
  'propertiesOwned.ownsProperty': 'Please indicate if you own additional property',
  'militaryService.hasServed': 'Please indicate if you have served in the military',
  'militaryService.currentlyServing': 'Please indicate if you are currently serving in the military',
  'militaryService.isRetired': 'Please indicate if you are retired from the military',
  'militaryService.isNonActivated': 'Please indicate if you are non-activated military',
  'militaryService.isSurvivingSpouse': 'Please indicate if you are a surviving spouse',
};

// Required fields for declarations and demographics
export const declarationsRequiredFields = {
  'declarations.occupyAsPrimary': 'Please indicate if you will occupy the property as your primary residence',
  'declarations.firstTimeBuyer': 'Please indicate if you are a first time homebuyer',
  'demographics.ethnicity': 'Please select your ethnicity',
  'demographics.gender': 'Please select your gender',
  'demographics.race': 'Please select your race',
};

/**
 * Get all required fields for a specific step
 * @param {number} step - The step number
 * @param {Object} formData - Current form data
 * @param {string} tabName - Current tab name (optional)
 * @returns {Object} Object with field paths as keys and error messages as values
 */
export const getRequiredFieldsForStep = (step, formData, tabName = null) => {
  const requiredFields = {};
  
  switch (step) {
    case 1: // Borrower step
      if (tabName === 'personalDetails') {
        // Personal details validation
        requiredFields['borrowers[0].firstName'] = borrowerRequiredFields['borrowers[0].firstName'];
        requiredFields['borrowers[0].lastName'] = borrowerRequiredFields['borrowers[0].lastName'];
        requiredFields['borrowers[0].dateOfBirth'] = borrowerRequiredFields['borrowers[0].dateOfBirth'];
        requiredFields['borrowers[0].ssn'] = borrowerRequiredFields['borrowers[0].ssn'];
        requiredFields['borrowers[0].email'] = borrowerRequiredFields['borrowers[0].email'];
        requiredFields['borrowers[0].phone'] = borrowerRequiredFields['borrowers[0].phone'];
        requiredFields['borrowers[0].maritalStatus'] = borrowerRequiredFields['borrowers[0].maritalStatus'];
        requiredFields['borrowers[0].citizenship'] = borrowerRequiredFields['borrowers[0].citizenship'];
      } else if (tabName === 'residenceHistory') {
        // Residence history validation
        requiredFields['borrowers[0].currentAddress.streetAddress'] = borrowerRequiredFields['borrowers[0].currentAddress.streetAddress'];
        requiredFields['borrowers[0].currentAddress.city'] = borrowerRequiredFields['borrowers[0].currentAddress.city'];
        requiredFields['borrowers[0].currentAddress.state'] = borrowerRequiredFields['borrowers[0].currentAddress.state'];
        requiredFields['borrowers[0].currentAddress.zipCode'] = borrowerRequiredFields['borrowers[0].currentAddress.zipCode'];
        requiredFields['borrowers[0].currentAddress.housingStatus'] = borrowerRequiredFields['borrowers[0].currentAddress.housingStatus'];
        requiredFields['borrowers[0].currentAddress.yearsAtAddress'] = borrowerRequiredFields['borrowers[0].currentAddress.yearsAtAddress'];
        requiredFields['borrowers[0].currentAddress.monthsAtAddress'] = borrowerRequiredFields['borrowers[0].currentAddress.monthsAtAddress'];
      } else if (tabName === 'employmentHistory') {
        // Employment history validation
        requiredFields['borrowers[0].employers[0].companyName'] = borrowerRequiredFields['borrowers[0].employers[0].companyName'];
        requiredFields['borrowers[0].employers[0].jobTitle'] = borrowerRequiredFields['borrowers[0].employers[0].jobTitle'];
        requiredFields['borrowers[0].employers[0].employmentStatus'] = borrowerRequiredFields['borrowers[0].employers[0].employmentStatus'];
        requiredFields['borrowers[0].employers[0].startDate'] = borrowerRequiredFields['borrowers[0].employers[0].startDate'];
        requiredFields['borrowers[0].employers[0].yearsInProfession'] = borrowerRequiredFields['borrowers[0].employers[0].yearsInProfession'];
        requiredFields['borrowers[0].employers[0].monthsInProfession'] = borrowerRequiredFields['borrowers[0].employers[0].monthsInProfession'];
        requiredFields['borrowers[0].employers[0].streetAddress'] = borrowerRequiredFields['borrowers[0].employers[0].streetAddress'];
        requiredFields['borrowers[0].employers[0].city'] = borrowerRequiredFields['borrowers[0].employers[0].city'];
        requiredFields['borrowers[0].employers[0].state'] = borrowerRequiredFields['borrowers[0].employers[0].state'];
        requiredFields['borrowers[0].employers[0].zipCode'] = borrowerRequiredFields['borrowers[0].employers[0].zipCode'];
      } else {
        // If no tab specified, validate all borrower fields
        Object.assign(requiredFields, borrowerRequiredFields);
      }
      break;
      
    case 2: // Property & Loan step
      Object.assign(requiredFields, propertyRequiredFields);
      Object.assign(requiredFields, loanRequiredFields);
      
      // Add conditional fields based on loan type
      const loanType = formData.loanInfo?.loanType;
      if (loanType && conditionalFields[loanType.toLowerCase()]) {
        Object.assign(requiredFields, conditionalFields[loanType.toLowerCase()]);
      }
      
      // Add conditional fields based on accepted offer
      if (formData.propertyInfo?.hasAcceptedOffer === true) {
        Object.assign(requiredFields, conditionalFields.hasAcceptedOffer);
      }
      break;
      
    case 3: // Financial step
      if (!tabName || tabName === 'income') {
        Object.assign(requiredFields, financialRequiredFields);
      }
      break;
      
    case 4: // Additional Information step
      if (!tabName || tabName === 'propertiesOwned') {
        requiredFields['propertiesOwned.ownsProperty'] = additionalRequiredFields['propertiesOwned.ownsProperty'];

        if (formData.propertiesOwned?.ownsProperty === true) {
          const properties = formData.propertiesOwned.properties || [];
          
          if (properties.length > 0) {
            // Validate first property at minimum
            properties.forEach((property, index) => {
              requiredFields[`propertiesOwned.properties[${index}].propertyAddress.streetAddress`] = `Property ${index + 1}: Street address is required`;
              requiredFields[`propertiesOwned.properties[${index}].propertyAddress.city`] = `Property ${index + 1}: City is required`;
              requiredFields[`propertiesOwned.properties[${index}].propertyAddress.state`] = `Property ${index + 1}: State is required`;
              requiredFields[`propertiesOwned.properties[${index}].propertyAddress.zipCode`] = `Property ${index + 1}: ZIP code is required`;
            });
          }
        }
      }
      if (!tabName || tabName === 'militaryService') {
        requiredFields['militaryService.hasServed'] = additionalRequiredFields['militaryService.hasServed'];
      }
      break;
      
    case 5: // Declarations & Demographics step
      // if (!tabName || tabName === 'declarations') {
      //   requiredFields['declarations.occupyAsPrimary'] = declarationsRequiredFields['declarations.occupyAsPrimary'];
      //   requiredFields['declarations.firstTimeBuyer'] = declarationsRequiredFields['declarations.firstTimeBuyer'];
      // }
      // if (!tabName || tabName === 'demographics') {
      //   requiredFields['demographics.ethnicity'] = declarationsRequiredFields['demographics.ethnicity'];
      //   requiredFields['demographics.gender'] = declarationsRequiredFields['demographics.gender'];
      //   requiredFields['demographics.race'] = declarationsRequiredFields['demographics.race'];
      // }
      // All fields in this step are optional - no validation required
      break;

  }
  
  return requiredFields;
};

export function isFieldVisible(fieldPath, formData) {
  // Check loan type conditional fields
  const loanType = formData.loanInfo?.loanType;
  if (loanType && conditionalFields[loanType.toLowerCase()] && conditionalFields[loanType.toLowerCase()][fieldPath]) {
    return true;
  }
  
  // Check hasAcceptedOffer conditional fields
  if (formData.propertyInfo?.hasAcceptedOffer !== undefined) {
    if (fieldPath === 'propertyInfo.contractPurchasePrice') {
      if (formData.propertyInfo.hasAcceptedOffer === true && conditionalFields.hasAcceptedOffer[fieldPath]) {
        return true;
      }
    } else if (conditionalFields.hasAcceptedOffer[fieldPath]) {
      return true;
    }
  }
  
  // Check ownsProperty conditional fields
  if (formData.propertiesOwned?.ownsProperty === true && conditionalFields.ownsProperty[fieldPath]) {
    return true;
  }
  
  // Check hasLoan conditional fields (for properties)
  if (formData.propertiesOwned?.properties && formData.propertiesOwned.properties.length > 0) {
    const firstProperty = formData.propertiesOwned.properties[0];
    if (firstProperty.hasLoan === true && conditionalFields.hasLoan[fieldPath]) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get field value from nested object using dot notation
 * @param {Object} obj - The object to search in
 * @param {string} path - The dot notation path
 * @returns {any} The value at the path
 */
export const getFieldValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    if (key.includes('[')) {
      const arrayMatch = key.match(/([^\[]+)\[(\d+)\]/);
      if (arrayMatch) {
        const arrayName = arrayMatch[1];
        const index = parseInt(arrayMatch[2], 10);
        return current && current[arrayName] && current[arrayName][index];
      }
    }
    return current && current[key];
  }, obj);
};

/**
 * Validate a specific step and return detailed error messages
 * @param {number} step - The step number
 * @param {Object} formData - Current form data
 * @param {string} tabName - Current tab name (optional)
 * @returns {Object} Object with field paths as keys and error messages as values
 */
export const validateStep = (step, formData, tabName = null) => {
  const errors = {};
  const requiredFields = getRequiredFieldsForStep(step, formData, tabName);
  
  for (const [fieldPath, errorMessage] of Object.entries(requiredFields)) {
    const value = getFieldValue(formData, fieldPath);
    
    // Skip validation for hasAcceptedOffer if it has been selected (either true or false)
    if (fieldPath === 'propertyInfo.hasAcceptedOffer' && value !== undefined) {
      continue;
    }
    
    // Skip validation for hasServed if it has been selected (either true or false)
    if (fieldPath === 'militaryService.hasServed' && value !== undefined) {
      continue;
    }

    if (fieldPath === 'propertiesOwned.ownsProperty' && value !== undefined) {
      continue;
    }
    
    // Skip validation for declarations fields if they have been selected (either true or false)
    if ((fieldPath === 'declarations.occupyAsPrimary' || fieldPath === 'declarations.firstTimeBuyer') && value !== undefined) {
      continue;
    }
    
    // Check if field is empty or undefined
    if (!value || (typeof value === 'string' && value.trim() === '') || 
        (Array.isArray(value) && value.length === 0)) {
      errors[fieldPath] = errorMessage;
    }
  }
  
  return errors;
}; 