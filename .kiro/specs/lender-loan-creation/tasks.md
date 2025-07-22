# Implementation Plan

- [x] 1. Create NewLoanModal component

  - Create `frontend/src/components/lender/loans/NewLoanModal.js` with modal UI for loan creation options
  - Implement two option buttons: "Upload XML File" and "Create Manually"
  - Add proper modal styling, keyboard navigation, and accessibility features
  - Include close functionality and click-outside-to-close behavior
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

-

- [x] 2. Integrate NewLoanModal into lender loans index page

  - Modify `frontend/src/pages/lender/loans/index.js` to import and use NewLoanModal
  - Replace direct XML upload trigger with modal trigger in "New Loan" button click handler

  - Add state management for modal open/close
  - Connect XML upload option to existing XMLLoanUpload workflow
  - Connect manual creation option to redirect to `/lender/loans/create`
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 3. Create lender manual loan creation route

  - Create `frontend/src/pages/lender/loans/create.js` page component
  - Import and render the existing borrower application form component from `/borrower/apply`
  - Add proper route protection to ensure only lenders can access this page
  - Set up basic page structure with MainLayout and ProtectedRoute wrapper
  - _Requirements: 3.2, 5.1_

- [x] 4. Implement user context detection in borrower application form

  - Modify `frontend/src/pages/borrower/apply.js` to detect if being used by lender vs borrower
  - Add logic to check current route path and user role from AuthContext
  - Create conditional variables for lender context: `isLenderContext` and `userRole`
  - _Requirements: 5.1, 5.2_

- [x] 5. Adapt form submission logic for lender context

  - Modify the `handleSubmit` function in borrower application form to detect lender usage
  - Add lender-specific fields to submission data when used by lender: `submittedByLender`, `lenderId`, `submissionSource`
  - Implement automatic lender association using logged-in user ID from AuthContext
  - _Requirements: 5.2, 5.3_

- [x] 6. Implement lender-specific redirect logic

  - Modify post-submission redirect logic in borrower application form
  - Add conditional redirect: lenders go to loan details page, borrowers go to confirmation page
  - Ensure proper loan ID handling for redirect URLs
  - _Requirements: 3.5, 6.1, 6.2, 6.3_

- [x] 7. Add form validation and error handling for lender context


  - Ensure existing validation rules apply when form is used by lenders
  - Add lender-specific error messages where appropriate
  - Implement proper error handling for lender loan creation failures
  - Test that validation behavior remains unchanged for borrower usage
  - _Requirements: 3.3, 4.1, 4.2, 4.4, 6.4_

- [x] 8. Create unit tests for NewLoanModal component





  - Write tests for modal open/close behavior
  - Test option selection callbacks and event handling
  - Verify keyboard navigation and accessibility features
  - Test responsive design and styling
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 9. Create integration tests for lender manual loan creation workflow

  - Write end-to-end test for complete lender manual loan creation flow
  - Test route protection for `/lender/loans/create`
  - Verify form rendering and context detection
  - Test submission and redirect behavior for lenders
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 10. Add regression tests for existing XML upload functionality
  - Verify XML upload workflow remains unchanged after modal integration
  - Test that borrower application form behavior is unchanged for borrower users
  - Ensure existing API endpoints and submission logic work correctly
  - Test backward compatibility of all existing features
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2, 4.3, 4.4_
