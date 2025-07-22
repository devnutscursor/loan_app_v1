import React, { useState, useEffect } from 'react';
import { templateCategories } from '../../data/messageTemplates';
import { CustomTemplateManager } from '../../utils/CustomTemplateManager';
import { TemplateProcessor } from '../../utils/TemplateProcessor';

/**
 * CustomTemplateForm Component
 * 
 * A form component for creating and editing custom message templates.
 * Provides title and content inputs, category selection, form validation,
 * and preview functionality with {client_name} placeholder support.
 */
const CustomTemplateForm = ({ 
  onSave, 
  onCancel, 
  selectedBorrower = null,
  editTemplate = null,
  isVisible = true 
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('custom');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  
  // Initialize form when editing
  useEffect(() => {
    if (editTemplate) {
      setTitle(editTemplate.title || '');
      setContent(editTemplate.content || '');
      setCategory(editTemplate.category || 'custom');
    } else {
      // Reset form for new template
      setTitle('');
      setContent('');
      setCategory('custom');
    }
    setErrors({});
  }, [editTemplate]);

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    // Validate title
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > CustomTemplateManager.MAX_TITLE_LENGTH) {
      newErrors.title = `Title cannot exceed ${CustomTemplateManager.MAX_TITLE_LENGTH} characters`;
    }

    // Validate content
    if (!content.trim()) {
      newErrors.content = 'Content is required';
    } else if (content.length > CustomTemplateManager.MAX_CONTENT_LENGTH) {
      newErrors.content = `Content cannot exceed ${CustomTemplateManager.MAX_CONTENT_LENGTH} characters`;
    }

    // Validate category
    const validCategories = templateCategories.map(cat => cat.id).concat(['custom']);
    if (!validCategories.includes(category)) {
      newErrors.category = 'Please select a valid category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const templateData = {
        title: title.trim(),
        content: content.trim(),
        category
      };

      let result;
      if (editTemplate) {
        result = CustomTemplateManager.updateCustomTemplate(editTemplate.id, templateData);
      } else {
        result = CustomTemplateManager.saveCustomTemplate(templateData);
      }

      if (result.success) {
        // Reset form
        setTitle('');
        setContent('');
        setCategory('custom');
        setErrors({});
        setShowPreview(false);
        
        // Call parent callback
        if (onSave) {
          onSave(result.template);
        }
      } else {
        // Handle save errors
        if (result.error === 'A template with this title already exists') {
          setErrors({ title: result.error });
        } else {
          setErrors({ general: result.error });
        }
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setErrors({ general: 'Failed to save template. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setTitle('');
    setContent('');
    setCategory('custom');
    setErrors({});
    setShowPreview(false);
    
    if (onCancel) {
      onCancel();
    }
  };

  // Generate preview content
  const getPreviewContent = () => {
    if (!content.trim()) {
      return 'Enter template content to see preview...';
    }

    try {
      // Create a mock template object for processing
      const mockTemplate = {
        content: content,
        variables: ['borrowerFirstName', 'client_name']
      };
      
      return TemplateProcessor.processTemplate(mockTemplate, selectedBorrower);
    } catch (error) {
      console.error('Error generating preview:', error);
      return content;
    }
  };

  // Get available categories for dropdown
  const getAvailableCategories = () => {
    return [
      { id: 'custom', name: 'Custom' },
      ...templateCategories
    ];
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-gray-900">
          {editTemplate ? 'Edit Custom Template' : 'Create Custom Template'}
        </h4>
        <button
          onClick={handleCancel}
          className="text-gray-400 hover:text-gray-600 focus:outline-none"
          disabled={isSubmitting}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* General error message */}
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Title Input */}
        <div>
          <label htmlFor="template-title" className="block text-sm font-medium text-gray-700 mb-1">
            Template Title *
          </label>
          <input
            id="template-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a descriptive title for your template"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
            maxLength={CustomTemplateManager.MAX_TITLE_LENGTH}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {title.length}/{CustomTemplateManager.MAX_TITLE_LENGTH} characters
          </p>
        </div>

        {/* Category Selection */}
        <div>
          <label htmlFor="template-category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="template-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.category ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          >
            {getAvailableCategories().map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        {/* Content Input */}
        <div>
          <label htmlFor="template-content" className="block text-sm font-medium text-gray-700 mb-1">
            Template Content *
          </label>
          <textarea
            id="template-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your template message. Use {client_name} to insert the borrower's name."
            rows={6}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
              errors.content ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
            maxLength={CustomTemplateManager.MAX_CONTENT_LENGTH}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
          )}
          <div className="mt-1 flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Use {'{client_name}'} to automatically insert the borrower's name
            </p>
            <p className="text-xs text-gray-500">
              {content.length}/{CustomTemplateManager.MAX_CONTENT_LENGTH} characters
            </p>
          </div>
        </div>

        {/* Preview Toggle */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
            disabled={isSubmitting}
          >
            <svg 
              className={`h-4 w-4 mr-1 transition-transform ${showPreview ? 'rotate-90' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Preview:</h5>
            <div className="text-sm text-gray-900 whitespace-pre-wrap bg-white p-3 rounded border">
              {getPreviewContent()}
            </div>
            {selectedBorrower && (
              <p className="mt-2 text-xs text-gray-500">
                Preview shown with {selectedBorrower.user?.firstName || 'selected borrower'}'s name
              </p>
            )}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || !title.trim() || !content.trim()}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              editTemplate ? 'Update Template' : 'Save Template'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomTemplateForm;