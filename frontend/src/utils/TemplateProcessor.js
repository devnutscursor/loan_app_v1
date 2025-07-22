/**
 * TemplateProcessor Utility Class
 * 
 * Handles variable substitution in message templates, specifically for borrower name insertion.
 * Provides fallback handling for missing borrower data and ensures graceful degradation.
 */

export class TemplateProcessor {
  /**
   * Process a template by replacing variables with actual borrower data
   * 
   * @param {Object} template - The template object containing content and variables
   * @param {Object} borrowerData - The borrower data object
   * @returns {string} - The processed template content with variables replaced
   */
  static processTemplate(template, borrowerData = null) {
    if (!template) {
      throw new Error('Invalid template: template must have a content property');
    }

    let processedContent;
    try {
      processedContent = template.content;
      if (typeof processedContent !== 'string') {
        throw new Error('Invalid template: template must have a content property');
      }
    } catch (error) {
      // If we can't access the content property, return empty string
      // This handles cases where the getter throws an error
      console.error('Error accessing template content:', error);
      return '';
    }

    try {
      // Replace borrower name variables
      if (borrowerData && borrowerData.user) {
        const firstName = borrowerData.user.firstName || '';
        const lastName = borrowerData.user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();

        // Replace first name placeholder
        processedContent = processedContent.replace(
          /\{\{borrowerFirstName\}\}/g, 
          firstName || 'there'
        );

        // Replace full name placeholder
        processedContent = processedContent.replace(
          /\{\{borrowerFullName\}\}/g, 
          fullName || 'there'
        );

        // Replace {client_name} placeholder (custom template format)
        processedContent = processedContent.replace(
          /\{client_name\}/g, 
          firstName || 'there'
        );
      } else {
        // Fallback for when no borrower is selected or data is missing
        processedContent = processedContent
          .replace(/\{\{borrowerFirstName\}\}/g, '[Borrower Name]')
          .replace(/\{\{borrowerFullName\}\}/g, '[Borrower Name]')
          .replace(/\{client_name\}/g, '[Client Name]');
      }

      return processedContent;
    } catch (error) {
      console.error('Error processing template:', error);
      // Return original content if processing fails
      return template.content;
    }
  }

  /**
   * Process multiple templates at once
   * 
   * @param {Array} templates - Array of template objects
   * @param {Object} borrowerData - The borrower data object
   * @returns {Array} - Array of processed template contents
   */
  static processTemplates(templates, borrowerData = null) {
    if (!Array.isArray(templates)) {
      throw new Error('Templates must be an array');
    }

    return templates.map(template => ({
      ...template,
      processedContent: this.processTemplate(template, borrowerData)
    }));
  }

  /**
   * Get available variables from a template
   * 
   * @param {Object} template - The template object
   * @returns {Array} - Array of variable names found in the template
   */
  static getTemplateVariables(template) {
    if (!template || typeof template.content !== 'string') {
      return [];
    }

    const variables = [];

    // Find {{variableName}} format variables
    const doublebraceRegex = /\{\{(\w+)\}\}/g;
    let match;
    while ((match = doublebraceRegex.exec(template.content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    // Check for {client_name} format
    if (template.content.includes('{client_name}') && !variables.includes('client_name')) {
      variables.push('client_name');
    }

    return variables;
  }

  /**
   * Validate that a template has all required variables
   * 
   * @param {Object} template - The template object
   * @returns {Object} - Validation result with isValid boolean and missing variables
   */
  static validateTemplate(template) {
    if (!template) {
      return { isValid: false, errors: ['Template is required'] };
    }

    if (!template.content || typeof template.content !== 'string') {
      return { isValid: false, errors: ['Template content is required and must be a string'] };
    }

    const foundVariables = this.getTemplateVariables(template);
    const declaredVariables = template.variables || [];
    const errors = [];

    // Check for undeclared variables in content
    const undeclaredVariables = foundVariables.filter(
      variable => !declaredVariables.includes(variable)
    );

    if (undeclaredVariables.length > 0) {
      errors.push(`Undeclared variables found: ${undeclaredVariables.join(', ')}`);
    }

    // Check for declared variables not used in content
    const unusedVariables = declaredVariables.filter(
      variable => !foundVariables.includes(variable)
    );

    if (unusedVariables.length > 0) {
      errors.push(`Declared but unused variables: ${unusedVariables.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      foundVariables,
      declaredVariables
    };
  }

  /**
   * Preview a template with sample data
   * 
   * @param {Object} template - The template object
   * @param {Object} sampleData - Optional sample data for preview
   * @returns {string} - Preview of the processed template
   */
  static previewTemplate(template, sampleData = null) {
    const defaultSampleData = {
      user: {
        firstName: 'John',
        lastName: 'Doe'
      }
    };

    return this.processTemplate(template, sampleData || defaultSampleData);
  }
}

export default TemplateProcessor;