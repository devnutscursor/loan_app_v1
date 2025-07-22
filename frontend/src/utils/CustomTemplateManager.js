/**
 * CustomTemplateManager Utility Class
 * 
 * Handles storage, retrieval, and management of custom user-created message templates.
 * Provides localStorage-based persistence with proper data validation and error handling.
 * Supports the {client_name} placeholder format for borrower name insertion.
 */

import { templateCategories } from '../data/messageTemplates.js';

export class CustomTemplateManager {
  static STORAGE_KEY = 'customMessageTemplates';
  static MAX_TEMPLATES = 50; // Reasonable limit to prevent localStorage bloat
  static MAX_TITLE_LENGTH = 100;
  static MAX_CONTENT_LENGTH = 2000;

  /**
   * Get all custom templates from localStorage
   * 
   * @returns {Array} Array of custom template objects
   */
  static getCustomTemplates() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const templates = JSON.parse(stored);
      
      // Validate that we got an array
      if (!Array.isArray(templates)) {
        console.warn('Invalid custom templates data in localStorage, resetting');
        this.clearCustomTemplates();
        return [];
      }

      // Validate each template and filter out invalid ones
      const validTemplates = templates.filter(template => {
        const validation = this.validateTemplateData(template);
        if (!validation.isValid) {
          console.warn('Invalid custom template found, skipping:', validation.errors);
          return false;
        }
        return true;
      });

      // If we filtered out invalid templates, save the cleaned array
      if (validTemplates.length !== templates.length) {
        this.saveTemplatesArray(validTemplates);
      }

      return validTemplates;
    } catch (error) {
      console.error('Error retrieving custom templates:', error);
      // Clear corrupted data and return empty array
      this.clearCustomTemplates();
      return [];
    }
  }

  /**
   * Save a new custom template
   * 
   * @param {Object} templateData - The template data to save
   * @param {string} templateData.title - Template title
   * @param {string} templateData.content - Template content
   * @param {string} templateData.category - Template category (optional, defaults to 'custom')
   * @returns {Object} Result object with success status and template or error details
   */
  static saveCustomTemplate(templateData) {
    try {
      // Validate input data
      const validation = this.validateTemplateInput(templateData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          details: validation.errors
        };
      }

      const customTemplates = this.getCustomTemplates();

      // Check template limit
      if (customTemplates.length >= this.MAX_TEMPLATES) {
        return {
          success: false,
          error: `Maximum number of custom templates (${this.MAX_TEMPLATES}) reached`
        };
      }

      // Check for duplicate titles
      const existingTitles = customTemplates.map(t => t.title.toLowerCase());
      if (existingTitles.includes(templateData.title.toLowerCase())) {
        return {
          success: false,
          error: 'A template with this title already exists'
        };
      }

      // Create new template object
      const newTemplate = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        category: templateData.category || 'custom',
        title: templateData.title.trim(),
        preview: this.generatePreview(templateData.content),
        content: templateData.content.trim(),
        variables: this.extractVariables(templateData.content),
        isCustom: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to templates array
      customTemplates.push(newTemplate);

      // Save to localStorage
      const saveResult = this.saveTemplatesArray(customTemplates);
      if (!saveResult.success) {
        return saveResult;
      }

      return {
        success: true,
        template: newTemplate
      };

    } catch (error) {
      console.error('Error saving custom template:', error);
      return {
        success: false,
        error: 'Failed to save template',
        details: error.message
      };
    }
  }

  /**
   * Update an existing custom template
   * 
   * @param {string} templateId - ID of the template to update
   * @param {Object} updateData - Data to update
   * @returns {Object} Result object with success status and updated template or error details
   */
  static updateCustomTemplate(templateId, updateData) {
    try {
      const customTemplates = this.getCustomTemplates();
      const templateIndex = customTemplates.findIndex(t => t.id === templateId);

      if (templateIndex === -1) {
        return {
          success: false,
          error: 'Template not found'
        };
      }

      const existingTemplate = customTemplates[templateIndex];

      // Validate update data
      const validation = this.validateTemplateInput(updateData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          details: validation.errors
        };
      }

      // Check for duplicate titles (excluding current template)
      const otherTemplates = customTemplates.filter(t => t.id !== templateId);
      const existingTitles = otherTemplates.map(t => t.title.toLowerCase());
      if (existingTitles.includes(updateData.title.toLowerCase())) {
        return {
          success: false,
          error: 'A template with this title already exists'
        };
      }

      // Update template
      const updatedTemplate = {
        ...existingTemplate,
        title: updateData.title.trim(),
        content: updateData.content.trim(),
        category: updateData.category || existingTemplate.category,
        preview: this.generatePreview(updateData.content),
        variables: this.extractVariables(updateData.content),
        updatedAt: new Date().toISOString()
      };

      customTemplates[templateIndex] = updatedTemplate;

      // Save to localStorage
      const saveResult = this.saveTemplatesArray(customTemplates);
      if (!saveResult.success) {
        return saveResult;
      }

      return {
        success: true,
        template: updatedTemplate
      };

    } catch (error) {
      console.error('Error updating custom template:', error);
      return {
        success: false,
        error: 'Failed to update template',
        details: error.message
      };
    }
  }

  /**
   * Delete a custom template
   * 
   * @param {string} templateId - ID of the template to delete
   * @returns {Object} Result object with success status or error details
   */
  static deleteCustomTemplate(templateId) {
    try {
      if (!templateId) {
        return {
          success: false,
          error: 'Template ID is required'
        };
      }

      const customTemplates = this.getCustomTemplates();
      const templateIndex = customTemplates.findIndex(t => t.id === templateId);

      if (templateIndex === -1) {
        return {
          success: false,
          error: 'Template not found'
        };
      }

      // Remove template from array
      const deletedTemplate = customTemplates.splice(templateIndex, 1)[0];

      // Save updated array to localStorage
      const saveResult = this.saveTemplatesArray(customTemplates);
      if (!saveResult.success) {
        return saveResult;
      }

      return {
        success: true,
        deletedTemplate
      };

    } catch (error) {
      console.error('Error deleting custom template:', error);
      return {
        success: false,
        error: 'Failed to delete template',
        details: error.message
      };
    }
  }

  /**
   * Get a specific custom template by ID
   * 
   * @param {string} templateId - ID of the template to retrieve
   * @returns {Object|null} Template object or null if not found
   */
  static getCustomTemplateById(templateId) {
    try {
      const customTemplates = this.getCustomTemplates();
      return customTemplates.find(template => template.id === templateId) || null;
    } catch (error) {
      console.error('Error retrieving custom template by ID:', error);
      return null;
    }
  }

  /**
   * Get custom templates by category
   * 
   * @param {string} categoryId - Category ID to filter by
   * @returns {Array} Array of templates in the specified category
   */
  static getCustomTemplatesByCategory(categoryId) {
    try {
      const customTemplates = this.getCustomTemplates();
      return customTemplates.filter(template => template.category === categoryId);
    } catch (error) {
      console.error('Error retrieving custom templates by category:', error);
      return [];
    }
  }

  /**
   * Clear all custom templates
   * 
   * @returns {Object} Result object with success status
   */
  static clearCustomTemplates() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return { success: true };
    } catch (error) {
      console.error('Error clearing custom templates:', error);
      return {
        success: false,
        error: 'Failed to clear templates',
        details: error.message
      };
    }
  }

  /**
   * Export custom templates as JSON
   * 
   * @returns {string} JSON string of custom templates
   */
  static exportCustomTemplates() {
    try {
      const customTemplates = this.getCustomTemplates();
      return JSON.stringify(customTemplates, null, 2);
    } catch (error) {
      console.error('Error exporting custom templates:', error);
      return '[]';
    }
  }

  /**
   * Import custom templates from JSON
   * 
   * @param {string} jsonData - JSON string containing templates to import
   * @param {boolean} merge - Whether to merge with existing templates or replace them
   * @returns {Object} Result object with success status and import details
   */
  static importCustomTemplates(jsonData, merge = true) {
    try {
      let importedTemplates;
      
      try {
        importedTemplates = JSON.parse(jsonData);
      } catch (parseError) {
        return {
          success: false,
          error: 'Invalid JSON format'
        };
      }

      if (!Array.isArray(importedTemplates)) {
        return {
          success: false,
          error: 'Imported data must be an array of templates'
        };
      }

      // Validate imported templates
      const validTemplates = [];
      const errors = [];

      importedTemplates.forEach((template, index) => {
        const validation = this.validateTemplateData(template);
        if (validation.isValid) {
          // Generate new ID and timestamps for imported templates
          validTemplates.push({
            ...template,
            id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            isCustom: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } else {
          errors.push(`Template ${index + 1}: ${validation.errors.join(', ')}`);
        }
      });

      if (validTemplates.length === 0) {
        return {
          success: false,
          error: 'No valid templates found in import data',
          details: errors
        };
      }

      let finalTemplates;
      if (merge) {
        const existingTemplates = this.getCustomTemplates();
        finalTemplates = [...existingTemplates, ...validTemplates];
        
        // Check total limit
        if (finalTemplates.length > this.MAX_TEMPLATES) {
          return {
            success: false,
            error: `Import would exceed maximum template limit (${this.MAX_TEMPLATES})`
          };
        }
      } else {
        finalTemplates = validTemplates;
      }

      // Save templates
      const saveResult = this.saveTemplatesArray(finalTemplates);
      if (!saveResult.success) {
        return saveResult;
      }

      return {
        success: true,
        imported: validTemplates.length,
        errors: errors.length > 0 ? errors : null
      };

    } catch (error) {
      console.error('Error importing custom templates:', error);
      return {
        success: false,
        error: 'Failed to import templates',
        details: error.message
      };
    }
  }

  // Private helper methods

  /**
   * Save templates array to localStorage
   * 
   * @private
   * @param {Array} templates - Array of templates to save
   * @returns {Object} Result object with success status
   */
  static saveTemplatesArray(templates) {
    try {
      const jsonString = JSON.stringify(templates);
      
      // Check localStorage quota
      try {
        localStorage.setItem(this.STORAGE_KEY, jsonString);
      } catch (quotaError) {
        if (quotaError.name === 'QuotaExceededError') {
          return {
            success: false,
            error: 'Storage quota exceeded. Please delete some templates.'
          };
        }
        throw quotaError;
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving templates to localStorage:', error);
      return {
        success: false,
        error: 'Failed to save templates',
        details: error.message
      };
    }
  }

  /**
   * Validate template input data
   * 
   * @private
   * @param {Object} templateData - Template data to validate
   * @returns {Object} Validation result
   */
  static validateTemplateInput(templateData) {
    const errors = [];

    if (!templateData || typeof templateData !== 'object') {
      errors.push('Template data must be an object');
      return { isValid: false, errors };
    }

    // Validate title
    if (!templateData.title || typeof templateData.title !== 'string') {
      errors.push('Title is required and must be a string');
    } else if (templateData.title.trim().length === 0) {
      errors.push('Title cannot be empty');
    } else if (templateData.title.length > this.MAX_TITLE_LENGTH) {
      errors.push(`Title cannot exceed ${this.MAX_TITLE_LENGTH} characters`);
    }

    // Validate content
    if (!templateData.content || typeof templateData.content !== 'string') {
      errors.push('Content is required and must be a string');
    } else if (templateData.content.trim().length === 0) {
      errors.push('Content cannot be empty');
    } else if (templateData.content.length > this.MAX_CONTENT_LENGTH) {
      errors.push(`Content cannot exceed ${this.MAX_CONTENT_LENGTH} characters`);
    }

    // Validate category (optional)
    if (templateData.category !== undefined) {
      if (typeof templateData.category !== 'string') {
        errors.push('Category must be a string');
      } else {
        const validCategories = templateCategories.map(cat => cat.id).concat(['custom']);
        if (!validCategories.includes(templateData.category)) {
          errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate complete template data structure
   * 
   * @private
   * @param {Object} template - Complete template object to validate
   * @returns {Object} Validation result
   */
  static validateTemplateData(template) {
    const errors = [];

    if (!template || typeof template !== 'object') {
      errors.push('Template must be an object');
      return { isValid: false, errors };
    }

    // Required fields
    const requiredFields = ['id', 'title', 'content', 'category'];
    requiredFields.forEach(field => {
      if (!template[field] || typeof template[field] !== 'string') {
        errors.push(`${field} is required and must be a string`);
      }
    });

    // Validate specific fields
    if (template.title && template.title.length > this.MAX_TITLE_LENGTH) {
      errors.push(`Title cannot exceed ${this.MAX_TITLE_LENGTH} characters`);
    }

    if (template.content && template.content.length > this.MAX_CONTENT_LENGTH) {
      errors.push(`Content cannot exceed ${this.MAX_CONTENT_LENGTH} characters`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate preview text from template content
   * 
   * @private
   * @param {string} content - Template content
   * @returns {string} Preview text
   */
  static generatePreview(content) {
    if (!content || typeof content !== 'string') {
      return '';
    }

    // Remove variable placeholders for preview
    let preview = content
      .replace(/\{\{[^}]+\}\}/g, '[Name]')
      .replace(/\{client_name\}/g, '[Name]');

    // Truncate to reasonable length
    const maxLength = 60;
    if (preview.length > maxLength) {
      preview = preview.substring(0, maxLength).trim() + '...';
    }

    return preview;
  }

  /**
   * Extract variables from template content
   * 
   * @private
   * @param {string} content - Template content
   * @returns {Array} Array of variable names
   */
  static extractVariables(content) {
    if (!content || typeof content !== 'string') {
      return [];
    }

    const variables = new Set();

    // Extract {{variableName}} format
    const doublebraceRegex = /\{\{(\w+)\}\}/g;
    let match;
    while ((match = doublebraceRegex.exec(content)) !== null) {
      variables.add(match[1]);
    }

    // Check for {client_name} format
    if (content.includes('{client_name}')) {
      variables.add('client_name');
    }

    return Array.from(variables);
  }
}

export default CustomTemplateManager;