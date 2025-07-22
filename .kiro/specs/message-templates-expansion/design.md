# Design Document

## Overview

This design document outlines the enhancement of the lender messaging system to expand from 3 to at least 10 message templates with dynamic borrower name insertion. The solution will create a scalable template system that maintains the existing UI structure while providing comprehensive coverage of loan lifecycle communications.

## Architecture

### Current State Analysis
- Templates are currently hardcoded as inline onClick handlers in the messages.js component
- Each template sets the messageInput state directly with static text
- No dynamic content insertion or template management system exists
- Templates are displayed as clickable buttons with title and preview text

### Proposed Architecture
- **Template Data Structure**: Create a centralized template configuration system with support for custom templates
- **Template Engine**: Implement a simple template processing engine for variable substitution including {client_name}
- **Template Management**: Add functionality for creating, storing, and managing custom user templates
- **Component Enhancement**: Enhance the existing template UI to support more templates, categories, and template creation
- **State Management**: Maintain existing React state patterns while adding template processing and custom template management logic

## Components and Interfaces

### 1. Template Configuration System

```javascript
// Template data structure
const messageTemplates = [
  {
    id: 'application_received',
    category: 'application',
    title: 'Application Received',
    preview: 'Thank you for your application. I\'ll be your dedicated...',
    content: 'Hi {{borrowerFirstName}}, thank you for your application. I\'ll be your dedicated loan officer throughout the process. Please let me know if you have any questions.',
    variables: ['borrowerFirstName']
  },
  // ... additional templates
];
```

### 2. Template Processing Engine

```javascript
// Template processor utility
class TemplateProcessor {
  static processTemplate(template, borrowerData) {
    let processedContent = template.content;
    
    // Replace borrower name variables (support both formats)
    if (borrowerData) {
      processedContent = processedContent
        .replace(/\{\{borrowerFirstName\}\}/g, borrowerData.firstName || 'there')
        .replace(/\{\{borrowerFullName\}\}/g, `${borrowerData.firstName || ''} ${borrowerData.lastName || ''}`.trim() || 'there')
        .replace(/\{client_name\}/g, borrowerData.firstName || 'there'); // Support {client_name} format
    } else {
      // Fallback for when no borrower is selected
      processedContent = processedContent
        .replace(/\{\{borrowerFirstName\}\}/g, '[Borrower Name]')
        .replace(/\{\{borrowerFullName\}\}/g, '[Borrower Name]')
        .replace(/\{client_name\}/g, '[Client Name]');
    }
    
    return processedContent;
  }
}
```

### 3. Custom Template Management System

```javascript
// Custom template storage and management
class CustomTemplateManager {
  static getCustomTemplates() {
    const stored = localStorage.getItem('customMessageTemplates');
    return stored ? JSON.parse(stored) : [];
  }
  
  static saveCustomTemplate(template) {
    const customTemplates = this.getCustomTemplates();
    const newTemplate = {
      id: `custom_${Date.now()}`,
      category: template.category || 'custom',
      title: template.title,
      preview: template.content.substring(0, 50) + '...',
      content: template.content,
      isCustom: true,
      createdAt: new Date().toISOString()
    };
    
    customTemplates.push(newTemplate);
    localStorage.setItem('customMessageTemplates', JSON.stringify(customTemplates));
    return newTemplate;
  }
  
  static deleteCustomTemplate(templateId) {
    const customTemplates = this.getCustomTemplates();
    const filtered = customTemplates.filter(t => t.id !== templateId);
    localStorage.setItem('customMessageTemplates', JSON.stringify(filtered));
  }
}
```

### 3. Enhanced Template UI Component

```javascript
// Template categories for organization
const templateCategories = [
  { id: 'application', name: 'Application', templates: [] },
  { id: 'documentation', name: 'Documentation', templates: [] },
  { id: 'status', name: 'Status Updates', templates: [] },
  { id: 'approval', name: 'Approval & Closing', templates: [] },
  { id: 'support', name: 'General Support', templates: [] }
];
```

### 4. Custom Template Creation UI

```javascript
// Custom template creation form component
const CustomTemplateForm = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('custom');
  
  const handleSave = () => {
    if (title.trim() && content.trim()) {
      onSave({ title: title.trim(), content: content.trim(), category });
      setTitle('');
      setContent('');
    }
  };
  
  return (
    <div className="custom-template-form">
      <input 
        type="text" 
        placeholder="Template Title" 
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="custom">Custom</option>
        <option value="application">Application</option>
        <option value="documentation">Documentation</option>
        <option value="status">Status Updates</option>
        <option value="approval">Approval & Closing</option>
        <option value="support">General Support</option>
      </select>
      <textarea 
        placeholder="Template message (use {client_name} for borrower's name)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
      />
      <div className="form-actions">
        <button onClick={handleSave}>Save Template</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};
```

### 5. Template Integration Points

- **Message Input Handler**: Modify existing onClick handlers to use template processor
- **Borrower Context**: Utilize existing selectedBorrower state for dynamic content
- **UI Layout**: Enhance existing template section to accommodate more templates with categorization
- **Custom Template Management**: Add UI for creating, editing, and deleting custom templates

## Data Models

### Template Model
```javascript
{
  id: string,           // Unique identifier
  category: string,     // Category for organization
  title: string,        // Display title
  preview: string,      // Short preview text
  content: string,      // Full template content with variables
  variables: string[],  // List of available variables
  order: number        // Display order within category
}
```

### Borrower Context Model
```javascript
{
  _id: string,
  user: {
    firstName: string,
    lastName: string,
    email: string
  }
}
```

## Template Content Design

### 10+ Comprehensive Templates

1. **Application Received** (Category: Application)
   - Content: "Hi {{borrowerFirstName}}, thank you for your application. I'll be your dedicated loan officer throughout the process. Please let me know if you have any questions."

2. **Document Request** (Category: Documentation)
   - Content: "Hi {{borrowerFirstName}}, to proceed with your application, we need the following documents: 1) Last 2 months of bank statements, 2) Recent pay stubs, 3) W-2 forms from the last 2 years. Please upload these to your dashboard."

3. **Application Approved** (Category: Approval & Closing)
   - Content: "Great news {{borrowerFirstName}}! Your loan application has been approved. The next step is to review and sign the closing documents. We'll schedule a convenient time for the closing process."

4. **Document Follow-up** (Category: Documentation)
   - Content: "Hi {{borrowerFirstName}}, I wanted to follow up on the documents we requested. Please upload them to your dashboard when convenient. Let me know if you need any assistance."

5. **Application Under Review** (Category: Status)
   - Content: "Hi {{borrowerFirstName}}, your application is currently under review. We're working diligently to process it and will update you within 2-3 business days. Thank you for your patience."

6. **Additional Information Needed** (Category: Documentation)
   - Content: "Hi {{borrowerFirstName}}, we need some additional information to complete your application review. Please check your dashboard for the specific requirements. Feel free to reach out if you have questions."

7. **Closing Scheduled** (Category: Approval & Closing)
   - Content: "Hi {{borrowerFirstName}}, your closing has been scheduled. Please check your dashboard for the date, time, and location details. We'll send you a reminder closer to the date."

8. **Welcome & Introduction** (Category: Application)
   - Content: "Welcome {{borrowerFirstName}}! I'm excited to work with you on your loan application. I'll be here to guide you through every step of the process and answer any questions you may have."

9. **Milestone Update** (Category: Status)
   - Content: "Hi {{borrowerFirstName}}, I wanted to update you on your loan progress. We've completed [milestone] and are moving forward with the next steps. Everything is progressing smoothly."

10. **General Support** (Category: Support)
    - Content: "Hi {{borrowerFirstName}}, I'm here to help with any questions or concerns you may have about your loan application. Please don't hesitate to reach out anytime."

11. **Document Received Confirmation** (Category: Documentation)
    - Content: "Hi {{borrowerFirstName}}, thank you for uploading the requested documents. We've received them and will review them shortly. I'll update you once the review is complete."

12. **Pre-Closing Checklist** (Category: Approval & Closing)
    - Content: "Hi {{borrowerFirstName}}, as we approach your closing date, please review the pre-closing checklist in your dashboard. This will help ensure a smooth closing process."

## Error Handling

### Template Processing Errors
- **Missing Variables**: Gracefully handle missing borrower data with fallback text
- **Template Not Found**: Log error and display generic message option
- **Processing Failures**: Maintain original template content if processing fails

### UI Error States
- **No Templates Available**: Display message indicating templates are loading
- **Template Load Failure**: Show error message with retry option
- **Borrower Data Missing**: Templates still function with placeholder text

## Testing Strategy

### Unit Testing
- **Template Processor**: Test variable substitution with various borrower data scenarios
- **Template Configuration**: Validate template data structure and content
- **Error Handling**: Test graceful degradation when data is missing

### Integration Testing
- **Template Selection**: Verify templates populate message input correctly
- **Dynamic Content**: Test borrower name insertion with real borrower data
- **UI Interaction**: Ensure template buttons work with existing message flow

### User Acceptance Testing
- **Template Coverage**: Verify all loan lifecycle stages are covered
- **Content Quality**: Review template language for professionalism and clarity
- **User Experience**: Test template selection and message sending workflow

## Implementation Considerations

### Performance
- **Template Loading**: Templates loaded once on component mount
- **Processing Efficiency**: Simple string replacement for minimal overhead
- **UI Responsiveness**: Maintain existing smooth interaction patterns

### Maintainability
- **Centralized Configuration**: All templates in single configuration file
- **Easy Updates**: Template content can be modified without code changes
- **Extensibility**: New templates can be added by extending configuration

### Backward Compatibility
- **Existing Functionality**: All current features remain unchanged
- **State Management**: Existing React state patterns preserved
- **API Integration**: No changes to existing message sending logic