# Email Verification UI Fix - Requirements Document

## Introduction

This feature addresses the current UI issues with email verification functionality and improves the user experience for both borrowers and lenders when changing their email addresses. The current implementation has overlapping UI elements and lacks proper visual feedback during the verification process.

## Requirements

### Requirement 1

**User Story:** As a borrower or lender, I want to change my email address with a clean, non-overlapping UI, so that I can easily initiate the email change process.

#### Acceptance Criteria

1. WHEN I view the profile settings page THEN the email field SHALL display with a pen icon button that does not overlap with the email text
2. WHEN I click the pen icon THEN the system SHALL open an email change modal or inline form
3. WHEN the email change UI is displayed THEN it SHALL be visually distinct from the read-only email display
4. IF the email field is in read-only mode THEN only the pen icon SHALL be visible, not a "Change" text button

### Requirement 2

**User Story:** As a borrower or lender, I want to see clear visual feedback during the email verification process, so that I understand the current status of my email change request.

#### Acceptance Criteria

1. WHEN I submit a new email address THEN the system SHALL display a verification pending status
2. WHEN verification is pending THEN the UI SHALL show a clear indication that verification is required
3. WHEN I click the verification link in my email THEN the system SHALL update the UI to reflect the successful email change
4. IF the verification fails or expires THEN the system SHALL display an appropriate error message with retry options

### Requirement 3

**User Story:** As a borrower or lender, I want the email verification process to work reliably, so that I can successfully update my email address without server errors.

#### Acceptance Criteria

1. WHEN I request an email change THEN the system SHALL send a verification email to the new address
2. WHEN the email service fails THEN the system SHALL display a user-friendly error message
3. WHEN I click the verification link THEN the system SHALL validate the token and update my email address
4. IF the verification token is invalid or expired THEN the system SHALL provide clear feedback and allow me to request a new verification email

### Requirement 4

**User Story:** As a borrower or lender, I want the email change functionality to be consistent across both user roles, so that the experience is uniform regardless of my account type.

#### Acceptance Criteria

1. WHEN I am a borrower THEN the email change UI SHALL function identically to the lender experience
2. WHEN I am a lender THEN the email change UI SHALL function identically to the borrower experience
3. WHEN either role initiates email change THEN the backend SHALL handle the request using the same verification flow
4. WHEN verification is complete THEN both roles SHALL receive the same success confirmation

### Requirement 5

**User Story:** As a user, I want to be able to cancel an email change request, so that I can revert back to my original email if I change my mind.

#### Acceptance Criteria

1. WHEN I have a pending email change THEN the UI SHALL display an option to cancel the change request
2. WHEN I cancel a pending email change THEN the system SHALL clear the pending email and verification token
3. WHEN I cancel a pending email change THEN my original email SHALL remain active and unchanged
4. IF I cancel a pending change THEN I SHALL be able to initiate a new email change request immediately