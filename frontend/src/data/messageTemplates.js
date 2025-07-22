// src/data/messageTemplates.js

/**
 * Message Template Configuration System
 * 
 * Centralized template data structure with all message templates organized by categories.
 * Includes proper variable placeholders for borrower name insertion and supports
 * easy maintenance and expansion of templates.
 */

// Template categories for organization
export const templateCategories = [
  { id: 'application', name: 'Application', order: 1 },
  { id: 'documentation', name: 'Documentation', order: 2 },
  { id: 'status', name: 'Status Updates', order: 3 },
  { id: 'approval', name: 'Approval & Closing', order: 4 },
  { id: 'support', name: 'General Support', order: 5 }
];

// Comprehensive message templates covering the entire loan lifecycle
export const messageTemplates = [
  // Application Category
  {
    id: 'application_received',
    category: 'application',
    title: 'Application Received',
    preview: 'Thank you for your application. I\'ll be your dedicated...',
    content: 'Hi {{borrowerFirstName}}, thank you for your application. I\'ll be your dedicated loan officer throughout the process. Please let me know if you have any questions.',
    variables: ['borrowerFirstName'],
    order: 1
  },
  {
    id: 'welcome_introduction',
    category: 'application',
    title: 'Welcome & Introduction',
    preview: 'Welcome! I\'m excited to work with you on your loan...',
    content: 'Welcome {{borrowerFirstName}}! I\'m excited to work with you on your loan application. I\'ll be here to guide you through every step of the process and answer any questions you may have.',
    variables: ['borrowerFirstName'],
    order: 2
  },

  // Documentation Category
  {
    id: 'document_request',
    category: 'documentation',
    title: 'Document Request',
    preview: 'To proceed with your application, we need the following...',
    content: 'Hi {{borrowerFirstName}}, to proceed with your application, we need the following documents: 1) Last 2 months of bank statements, 2) Recent pay stubs, 3) W-2 forms from the last 2 years. Please upload these to your dashboard.',
    variables: ['borrowerFirstName'],
    order: 1
  },
  {
    id: 'document_followup',
    category: 'documentation',
    title: 'Document Follow-up',
    preview: 'I wanted to follow up on the documents we requested...',
    content: 'Hi {{borrowerFirstName}}, I wanted to follow up on the documents we requested. Please upload them to your dashboard when convenient. Let me know if you need any assistance.',
    variables: ['borrowerFirstName'],
    order: 2
  },
  {
    id: 'additional_information_needed',
    category: 'documentation',
    title: 'Additional Information Needed',
    preview: 'We need some additional information to complete...',
    content: 'Hi {{borrowerFirstName}}, we need some additional information to complete your application review. Please check your dashboard for the specific requirements. Feel free to reach out if you have questions.',
    variables: ['borrowerFirstName'],
    order: 3
  },
  {
    id: 'document_received_confirmation',
    category: 'documentation',
    title: 'Document Received Confirmation',
    preview: 'Thank you for uploading the requested documents...',
    content: 'Hi {{borrowerFirstName}}, thank you for uploading the requested documents. We\'ve received them and will review them shortly. I\'ll update you once the review is complete.',
    variables: ['borrowerFirstName'],
    order: 4
  },

  // Status Updates Category
  {
    id: 'application_under_review',
    category: 'status',
    title: 'Application Under Review',
    preview: 'Your application is currently under review...',
    content: 'Hi {{borrowerFirstName}}, your application is currently under review. We\'re working diligently to process it and will update you within 2-3 business days. Thank you for your patience.',
    variables: ['borrowerFirstName'],
    order: 1
  },
  {
    id: 'milestone_update',
    category: 'status',
    title: 'Milestone Update',
    preview: 'I wanted to update you on your loan progress...',
    content: 'Hi {{borrowerFirstName}}, I wanted to update you on your loan progress. We\'ve completed [milestone] and are moving forward with the next steps. Everything is progressing smoothly.',
    variables: ['borrowerFirstName'],
    order: 2
  },

  // Approval & Closing Category
  {
    id: 'application_approved',
    category: 'approval',
    title: 'Application Approved',
    preview: 'Great news! Your loan application has been approved...',
    content: 'Great news {{borrowerFirstName}}! Your loan application has been approved. The next step is to review and sign the closing documents. We\'ll schedule a convenient time for the closing process.',
    variables: ['borrowerFirstName'],
    order: 1
  },
  {
    id: 'closing_scheduled',
    category: 'approval',
    title: 'Closing Scheduled',
    preview: 'Your closing has been scheduled...',
    content: 'Hi {{borrowerFirstName}}, your closing has been scheduled. Please check your dashboard for the date, time, and location details. We\'ll send you a reminder closer to the date.',
    variables: ['borrowerFirstName'],
    order: 2
  },
  {
    id: 'pre_closing_checklist',
    category: 'approval',
    title: 'Pre-Closing Checklist',
    preview: 'As we approach your closing date, please review...',
    content: 'Hi {{borrowerFirstName}}, as we approach your closing date, please review the pre-closing checklist in your dashboard. This will help ensure a smooth closing process.',
    variables: ['borrowerFirstName'],
    order: 3
  },

  // General Support Category
  {
    id: 'general_support',
    category: 'support',
    title: 'General Support',
    preview: 'I\'m here to help with any questions or concerns...',
    content: 'Hi {{borrowerFirstName}}, I\'m here to help with any questions or concerns you may have about your loan application. Please don\'t hesitate to reach out anytime.',
    variables: ['borrowerFirstName'],
    order: 1
  }
];

// Helper function to get templates by category
export const getTemplatesByCategory = (categoryId) => {
  return messageTemplates
    .filter(template => template.category === categoryId)
    .sort((a, b) => a.order - b.order);
};

// Helper function to get all templates organized by category
export const getTemplatesGroupedByCategory = () => {
  const grouped = {};
  
  templateCategories
    .sort((a, b) => a.order - b.order)
    .forEach(category => {
      grouped[category.id] = {
        ...category,
        templates: getTemplatesByCategory(category.id)
      };
    });
  
  return grouped;
};

// Helper function to get a specific template by ID
export const getTemplateById = (templateId) => {
  return messageTemplates.find(template => template.id === templateId);
};

// Helper function to get all available template variables
export const getAllTemplateVariables = () => {
  const variables = new Set();
  messageTemplates.forEach(template => {
    template.variables.forEach(variable => variables.add(variable));
  });
  return Array.from(variables);
};

// Template variable definitions for documentation
export const templateVariables = {
  borrowerFirstName: {
    name: 'borrowerFirstName',
    description: 'The borrower\'s first name',
    placeholder: '{{borrowerFirstName}}',
    fallback: 'there'
  },
  borrowerFullName: {
    name: 'borrowerFullName', 
    description: 'The borrower\'s full name (first and last)',
    placeholder: '{{borrowerFullName}}',
    fallback: 'there'
  }
};