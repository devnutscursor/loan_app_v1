/**
 * Utility functions for formatting values in the application
 */

/**
 * Format a number as currency (USD)
 * @param {number} amount - The amount to format
 * @param {boolean} hideCents - Whether to hide cents in the formatted amount
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, hideCents = false) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hideCents ? 0 : 2,
    maximumFractionDigits: hideCents ? 0 : 2
  });
  return formatter.format(amount);
};

/**
 * Format a percentage
 * @param {number} value - The percentage value to format
 * @param {number} decimalPlaces - Number of decimal places to include
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimalPlaces = 2) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  });
  return formatter.format(value / 100);
};

/**
 * Format a date
 * @param {string|Date} date - The date to format
 * @param {string} formatStyle - The format style to use ('short', 'medium', 'long', 'full')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatStyle = 'medium') => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: formatStyle
    }).format(dateObj);
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
};

/**
 * Format a number with commas
 * @param {number} value - The number to format
 * @param {number} decimalPlaces - Number of decimal places to include
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, decimalPlaces = 0) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(value);
};

/**
 * Format a phone number as (XXX) XXX-XXXX
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-numeric characters
  const cleaned = ('' + phoneNumber).replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  
  return phoneNumber; // Return original if not formattable
};

/**
 * Format SSN as XXX-XX-XXXX
 * @param {string} ssn - SSN to format
 * @returns {string} Formatted SSN
 */
export const formatSSN = (ssn) => {
  if (!ssn) return '';
  
  // Remove all non-numeric characters
  const cleaned = ('' + ssn).replace(/\D/g, '');
  
  // Format as XXX-XX-XXXX
  const match = cleaned.match(/^(\d{3})(\d{2})(\d{4})$/);
  if (match) {
    return match[1] + '-' + match[2] + '-' + match[3];
  }
  
  return ssn; // Return original if not formattable
};

/**
 * Return a masked version of sensitive data (like SSN)
 * @param {string} value - Value to mask
 * @param {number} visibleChars - Number of characters to leave visible at the end
 * @returns {string} Masked string
 */
export const maskSensitiveData = (value, visibleChars = 4) => {
  if (!value) return '';
  
  const valueStr = String(value);
  if (valueStr.length <= visibleChars) {
    return valueStr;
  }
  
  const maskedLength = valueStr.length - visibleChars;
  const maskedPart = '•'.repeat(maskedLength);
  const visiblePart = valueStr.substring(maskedLength);
  
  return maskedPart + visiblePart;
};
