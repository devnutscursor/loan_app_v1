# Requirements Document

## Introduction

This feature enhances the "New Loan" button functionality for lenders by providing two loan creation options: the existing XML file upload and a new manual loan creation option. The manual creation option will reuse the existing borrower application form, allowing lenders to create loans through the same multi-step workflow that borrowers currently use.

## Requirements

### Requirement 1

**User Story:** As a lender, I want to see multiple loan creation options when I click the "New Loan" button, so that I can choose between uploading an XML file or creating a loan manually.

#### Acceptance Criteria

1. WHEN a lender clicks the "New Loan" button THEN the system SHALL display a modal with two distinct options
2. WHEN the modal is displayed THEN the system SHALL show "Upload XML File" as the first option
3. WHEN the modal is displayed THEN the system SHALL show "Create Manually" as the second option
4. WHEN a lender clicks outside the modal or presses escape THEN the system SHALL close the modal without taking any action

### Requirement 2

**User Story:** As a lender, I want to continue using the existing XML upload functionality, so that my current workflow remains unchanged.

#### Acceptance Criteria

1. WHEN a lender selects "Upload XML File" from the modal THEN the system SHALL maintain the existing XML upload workflow
2. WHEN the XML upload process completes successfully THEN the system SHALL redirect to the appropriate loan details page
3. WHEN the XML upload encounters an error THEN the system SHALL display the same error handling as the current implementation

### Requirement 3

**User Story:** As a lender, I want to create loans manually using the same form that borrowers use, so that I can input loan details directly without requiring an XML file.

#### Acceptance Criteria

1. WHEN a lender selects "Create Manually" from the modal THEN the system SHALL redirect to /lender/loans/create
2. WHEN the lender accesses /lender/loans/create THEN the system SHALL render the exact same form component used at /borrower/apply
3. WHEN the form is rendered for a lender THEN the system SHALL maintain all existing validation rules and multi-step workflow
4. WHEN the form is rendered for a lender THEN the system SHALL automatically associate the loan with the logged-in lender
5. WHEN a lender completes the manual loan creation successfully THEN the system SHALL redirect to the loan details page

### Requirement 4

**User Story:** As a lender, I want the manual loan creation process to behave identically to the borrower application process, so that I have a familiar and consistent experience.

#### Acceptance Criteria

1. WHEN a lender uses the manual creation form THEN the system SHALL use the same multi-step workflow as /borrower/apply
2. WHEN a lender navigates through form steps THEN the system SHALL apply the same validation rules as the borrower form
3. WHEN a lender submits the form THEN the system SHALL use the same submission process as the borrower application
4. WHEN form validation fails THEN the system SHALL display the same error messages and behavior as the borrower form

### Requirement 5

**User Story:** As a system administrator, I want the form component to detect whether it's being used by a lender or borrower, so that the appropriate business logic is applied without code duplication.

#### Acceptance Criteria

1. WHEN the form component is rendered THEN the system SHALL detect if the current user is a lender or borrower
2. WHEN the form is used by a lender THEN the system SHALL automatically set the lender association for the loan
3. WHEN the form is used by a borrower THEN the system SHALL maintain the existing borrower application logic
4. WHEN the form submission occurs THEN the system SHALL apply the appropriate post-submission redirect based on user type

### Requirement 6

**User Story:** As a lender, I want to be redirected to the appropriate loan details page after successful manual loan creation, so that I can immediately view and manage the newly created loan.

#### Acceptance Criteria

1. WHEN a lender successfully submits the manual loan creation form THEN the system SHALL create the loan record in the database
2. WHEN the loan is successfully created THEN the system SHALL redirect the lender to the loan details page
3. WHEN the redirect occurs THEN the system SHALL display the newly created loan with all submitted information
4. IF the loan creation fails THEN the system SHALL display appropriate error messages and allow the lender to retry