import LoanService from './loan.service';

/**
 * AutoSave Service
 * 
 * Provides functionality for automatically saving form data at regular intervals.
 * Includes local storage backup, configurable intervals, and status tracking.
 */
class AutoSaveService {
  constructor() {
    this.isEnabled = true;
    this.interval = 30000; // Default: 30 seconds
    this.timer = null;
    this.currentFormId = null;
    this.lastSavedData = null;
    this.lastSavedTime = null;
    this.saveCallback = null;
    this.statusCallback = null;
    this.localStorageKey = 'loan_application_backup';
    this.saveStatus = 'idle'; // idle, saving, saved, error
  }

  /**
   * Initialize auto-save for a specific form
   * @param {string} formId - ID of the form/draft to save
   * @param {Function} saveCallback - Function to call when save occurs (optional)
   * @param {Function} statusCallback - Function to call when status changes (optional)
   * @param {Object} options - Configuration options
   */
  init(formId, saveCallback = null, statusCallback = null, options = {}) {
    this.stop(); // Stop any existing timers
    
    this.currentFormId = formId;
    this.saveCallback = saveCallback;
    this.statusCallback = statusCallback;
    
    // Apply options
    if (options.interval) this.interval = options.interval;
    if (options.enabled !== undefined) this.isEnabled = options.enabled;
    if (options.localStorageKey) this.localStorageKey = options.localStorageKey;
    
    // Start auto-save if enabled
    if (this.isEnabled) {
      this.start();
    }
    
    this.updateStatus('idle');
    
    // Attempt to recover from local storage if needed
    this.checkLocalStorageBackup();
  }

  /**
   * Start the auto-save timer
   */
  start() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    this.isEnabled = true;
    this.timer = setInterval(() => this.saveCurrentForm(), this.interval);
    console.log(`Auto-save started with interval: ${this.interval}ms`);
  }

  /**
   * Stop the auto-save timer
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    this.isEnabled = false;
    console.log('Auto-save stopped');
  }

  /**
   * Toggle auto-save on/off
   * @returns {boolean} New enabled state
   */
  toggle() {
    if (this.isEnabled) {
      this.stop();
    } else {
      this.start();
    }
    
    return this.isEnabled;
  }

  /**
   * Change the auto-save interval
   * @param {number} milliseconds - New interval in milliseconds
   */
  setInterval(milliseconds) {
    this.interval = milliseconds;
    
    // Restart timer with new interval if enabled
    if (this.isEnabled && this.timer) {
      this.stop();
      this.start();
    }
  }

  /**
   * Save current form data
   * @param {Object} formData - Form data to save (if not provided, uses saveCallback)
   * @returns {Promise<Object>} Save result
   */
  async saveCurrentForm(formData = null) {
    if (!this.currentFormId) {
      console.error('No form ID specified for auto-save');
      return { success: false, message: 'No form ID specified' };
    }
    
    try {
      this.updateStatus('saving');
      
      // Get form data from callback if not provided
      if (!formData && this.saveCallback) {
        formData = this.saveCallback();
      }
      
      if (!formData) {
        throw new Error('No form data available to save');
      }
      
      // Don't save if data hasn't changed
      if (this.lastSavedData && JSON.stringify(formData) === JSON.stringify(this.lastSavedData)) {
        console.log('Form data unchanged, skipping auto-save');
        this.updateStatus('unchanged');
        return { success: true, unchanged: true, message: 'Form data unchanged' };
      }
      
      // Save to local storage as backup
      this.saveToLocalStorage(formData);
      
      // Save to server
      const response = await LoanService.saveDraft({
        ...formData,
        draftId: this.currentFormId
      });
      
      if (response.success) {
        this.lastSavedData = { ...formData };
        this.lastSavedTime = new Date();
        this.updateStatus('saved');
        
        console.log('Form auto-saved successfully', response.data);
        return { success: true, data: response.data };
      } else {
        this.updateStatus('error', response.message);
        console.error('Auto-save failed:', response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      this.updateStatus('error', error.message);
      console.error('Auto-save error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Force an immediate save
   * @param {Object} formData - Form data to save
   * @returns {Promise<Object>} Save result
   */
  async forceSave(formData) {
    return this.saveCurrentForm(formData);
  }

  /**
   * Save form data to local storage as backup
   * @param {Object} formData - Form data to save
   */
  saveToLocalStorage(formData) {
    try {
      const backupData = {
        formId: this.currentFormId,
        data: formData,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(this.localStorageKey, JSON.stringify(backupData));
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }

  /**
   * Check for backup data in local storage
   * @returns {Object|null} Recovered form data or null
   */
  checkLocalStorageBackup() {
    try {
      const backupString = localStorage.getItem(this.localStorageKey);
      if (!backupString) return null;
      
      const backup = JSON.parse(backupString);
      
      // Only recover if for the same form
      if (backup.formId === this.currentFormId) {
        return backup.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error checking local storage backup:', error);
      return null;
    }
  }

  /**
   * Clear the local storage backup
   */
  clearLocalStorageBackup() {
    try {
      localStorage.removeItem(this.localStorageKey);
    } catch (error) {
      console.error('Error clearing local storage backup:', error);
    }
  }

  /**
   * Get the last auto-save time
   * @returns {Date|null} Last save time or null
   */
  getLastSaveTime() {
    return this.lastSavedTime;
  }

  /**
   * Get the current auto-save status
   * @returns {string} Current status
   */
  getStatus() {
    return this.saveStatus;
  }

  /**
   * Update the auto-save status and notify via callback
   * @param {string} status - New status
   * @param {string} message - Optional status message
   */
  updateStatus(status, message = '') {
    this.saveStatus = status;
    
    if (this.statusCallback) {
      this.statusCallback(status, message);
    }
  }

  /**
   * Clean up resources when done
   */
  cleanup() {
    this.stop();
    this.currentFormId = null;
    this.lastSavedData = null;
    this.lastSavedTime = null;
    this.saveCallback = null;
    this.statusCallback = null;
  }
}

export default new AutoSaveService();
