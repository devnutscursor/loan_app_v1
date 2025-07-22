# Design Document

## Overview

This feature enhances the lender loan creation workflow by providing two options when clicking the "New Loan" button: the existing XML upload functionality and a new manual loan creation option that reuses the borrower application form. The design focuses on code reuse, maintaining existing functionality, and providing a seamless user experience.

## Architecture

### High-Level Flow
1. **Modal Selection**: When lenders click "New Loan", a modal presents two options
2. **XML Upload Path**: Maintains existing XMLLoanUpload component workflow
3. **Manual Creation Path**: Redirects to new route that renders the borrower application form
4. **Form Adaptation**: The borrower form detects user context and adapts behavior accordingly
5. **Submission Handling**: Different submission logic based on user type (lender vs borrower)

### Key Design Principles
- **Code Reuse**: Leverage existing borrower application form without duplication
- **Minimal Changes**: Preserve existing XML upload functionality unchanged
- **Context Awareness**: Form components detect and adapt to user type
- **Consistent UX**: Maintain familiar patterns for both workflows

## Components and Interfaces

### 1. New Loan Selection Modal (`NewLoanModal.js`)
**Purpose**: Present loan creation options to lenders

**Props**:
```javascript
{
  isOpen: boolean,
  onClose: function,
  onXMLUpload: function,
  onManualCreate: function
}
```

**Features**:
- Two prominent option buttons
- Clear visual distinction between options
- Keyboard navigation support
- Responsive design

### 2. Enhanced Lender Loans Index Page
**Modifications**:
- Replace direct XML upload trigger with modal trigger
- Add state management for new modal
- Maintain existing XMLLoanUpload integration

### 3. New Route: `/lender/loans/create`
**Purpose**: Render borrower application form for lenders

**Implementation**:
- New Next.js page component
- Import and render existing borrower application form
- Pass lender context to form component
- Handle lender-specific routing after submission

### 4. Enhanced Borrower Application Form
**Context Detection**:
```javascript
const isLenderContext = router.pathname.includes('/lender/');
const userRole = user?.role; // From AuthContext
```

**Adaptations**:
- **Submission Logic**: Different API endpoints or parameters based on user type
- **Redirect Logic**: Lenders redirect to loan details, borrowers to confirmation
- **Association Logic**: Auto-associate loans with logged-in lender
- **UI Adjustments**: Minor text/label changes for lender context

### 5. API Integration Points
**Existing Endpoints** (maintained):
- `LoanService.submitLoan()` - for borrower submissions
- XML upload endpoints - unchanged

**Enhanced/New Endpoints**:
- Modify `LoanService.submitLoan()` to handle lender context
- Add lender association logic in submission payload

## Data Models

### Form Data Structure
The existing borrower form data structure will be maintained:
```javascript
{
  borrowers: [...],
  propertyInfo: {...},
  loanInfo: {...},
  assets: {...},
  income: {...},
  debts: [...],
  // ... other existing fields
}
```

### Lender Context Enhancement
Additional fields for lender submissions:
```javascript
{
  // Existing form data...
  submittedByLender: true,
  lenderId: user._id, // Auto-populated from auth context
  submissionSource: 'manual' // vs 'xml'
}
```

### User Role Detection
Leverage existing AuthContext structure:
```javascript
{
  user: {
    _id: string,
    role: 'lender' | 'borrower' | 'admin',
    // ... other user fields
  }
}
```

## Error Handling

### Modal Interaction Errors
- Handle modal close events gracefully
- Prevent multiple simultaneous modal opens
- Provide clear error messages for navigation failures

### Form Submission Errors
- Maintain existing validation error handling
- Add lender-specific error messages where appropriate
- Ensure error states don't break existing borrower functionality

### Route Protection
- Ensure `/lender/loans/create` is protected for lender role only
- Graceful handling of unauthorized access attempts
- Proper redirects for authentication failures

## Testing Strategy

### Unit Tests
1. **NewLoanModal Component**
   - Modal open/close behavior
   - Option selection callbacks
   - Keyboard navigation
   - Accessibility compliance

2. **Form Context Detection**
   - User role detection logic
   - Route-based context determination
   - Conditional rendering based on context

3. **Submission Logic**
   - Lender vs borrower submission paths
   - Data transformation for lender submissions
   - Error handling for different user types

### Integration Tests
1. **End-to-End Workflows**
   - Complete lender manual loan creation flow
   - XML upload workflow (regression testing)
   - Form submission and redirect behavior

2. **Route Testing**
   - `/lender/loans/create` accessibility and rendering
   - Proper form component mounting
   - Authentication and authorization

### Regression Tests
1. **Existing Functionality**
   - XML upload workflow unchanged
   - Borrower application form unchanged for borrower users
   - Existing API endpoints function correctly

## Implementation Phases

### Phase 1: Modal and Route Setup
- Create NewLoanModal component
- Add `/lender/loans/create` route
- Integrate modal into lender loans index page

### Phase 2: Form Context Adaptation
- Add context detection to borrower application form
- Implement conditional logic for lender vs borrower behavior
- Handle submission differences

### Phase 3: Integration and Testing
- Connect all components
- Implement proper error handling
- Add comprehensive testing
- Performance optimization

## Security Considerations

### Route Protection
- Ensure lender-only access to manual creation route
- Validate user permissions on both frontend and backend
- Prevent unauthorized loan creation

### Data Validation
- Maintain existing form validation rules
- Add lender-specific validation where needed
- Ensure data integrity for lender-created loans

### Audit Trail
- Log lender manual loan creation events
- Track submission source (manual vs XML)
- Maintain proper attribution for created loans

## Performance Considerations

### Code Splitting
- Lazy load NewLoanModal component
- Ensure borrower form bundle size doesn't increase significantly
- Optimize route-based code splitting

### Caching Strategy
- Leverage existing form data caching mechanisms
- Ensure proper cache invalidation for different user contexts
- Optimize API call patterns

### Bundle Size Impact
- Minimal impact due to code reuse approach
- Monitor bundle size changes
- Implement tree shaking for unused code paths