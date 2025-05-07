/**
 * Debug utilities for the application
 */

/**
 * Log objects with proper formatting and coloring in the console
 * @param {string} label - Label for the log
 * @param {any} data - Data to log
 */
export const debugLog = (label, data) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `%c [DEBUG] ${label} `, 
      'background: #333; color: #bada55; padding: 2px 4px; border-radius: 2px;', 
      data
    );
  }
};

/**
 * Log an API request with all details
 * @param {string} url - API URL
 * @param {Object} options - Request options
 * @param {Object} data - Request body data
 */
export const logApiRequest = (url, options, data) => {
  if (process.env.NODE_ENV === 'development') {
    console.group('%c API Request', 'color: #0066ff; font-weight: bold;');
    console.log('URL:', url);
    console.log('Method:', options?.method || 'GET');
    console.log('Headers:', options?.headers);
    
    try {
      console.log('Body:', typeof data === 'string' ? JSON.parse(data) : data);
    } catch (e) {
      console.log('Body:', data);
    }
    
    console.groupEnd();
  }
};

/**
 * Log an API response with all details
 * @param {string} url - API URL
 * @param {Object} response - Response object
 */
export const logApiResponse = async (url, response) => {
  if (process.env.NODE_ENV === 'development') {
    let responseData;
    try {
      // Clone the response to avoid consuming it
      const clonedResponse = response.clone();
      responseData = await clonedResponse.json();
    } catch (e) {
      responseData = 'Could not parse response as JSON';
    }

    console.group('%c API Response', 'color: #00cc66; font-weight: bold;');
    console.log('URL:', url);
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Response Data:', responseData);
    console.groupEnd();
  }
};
