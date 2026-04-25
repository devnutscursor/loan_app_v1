# Email Testing Guide (End-to-End QA)

This guide is for thoroughly testing all user-facing features that send email.
It focuses on **what to test**, **how to test**, and **how to confirm delivery**.

---

## 1) Test Environment Setup

Before running scenarios:

1. Configure a test SMTP inbox (Mailtrap, Ethereal, or staging mailbox).
2. Confirm backend email settings are active for your environment.
3. Keep one shared QA spreadsheet with:
   - test case id
   - trigger time
   - recipient
   - subject
   - status (sent/failed)
   - screenshot link
4. Use unique email addresses per scenario when possible (avoid confusion from old emails).

---

## 2) Core Verification Checklist (Use for every email test)

For each flow, verify:

- UI success message appears
- no frontend error toast
- expected recipient receives email
- subject/body matches feature
- links/buttons in email work
- duplicate click behavior is safe (no accidental spam)
- backend returns success response

If email not received:

- check spam/junk
- verify recipient address
- verify SMTP logs/provider dashboard
- verify feature-specific preconditions (status, borrower email, etc.)

---

## 3) Priority Flows (Must Pass)

## A. Pre-Approval Letter Email

**Where to trigger**
- `Lender > Loan Details > Send Pre-Approval Letter` button

**Preconditions**
- loan has borrower with valid email
- lender has permission to send
- loan is in a state where pre-approval can be sent

**Test steps**
1. Open a loan with valid borrower email.
2. Click `Send Pre-Approval Letter`.
3. Confirm success toast in UI.
4. Check recipient inbox for pre-approval email.
5. Open email and verify:
   - borrower name and loan context are correct
   - content formatting is correct
   - no broken links

**Negative tests**
- borrower email missing -> should fail gracefully with clear error
- repeat send click quickly -> should not create uncontrolled duplicates

---

## B. Document Request Email

**Where to trigger**
- `Lender > Loan > Documents` request flow
- single document request
- batch document request

**Preconditions**
- borrower exists with valid email
- document request data is valid

**Test steps**
1. Open loan documents section.
2. Request one document.
3. Confirm success message (email notification expected).
4. Check borrower inbox for document request email.
5. Repeat with batch request.
6. Validate each request is represented correctly in email content.

**Negative tests**
- borrower email unavailable -> request may still save but email warning/failure path should be clear
- partial batch failure handling should be visible in UI

---

## 4) Authentication & Account Email Flows

## A. Email Verification (Registration)

**Trigger**
- new user registration (borrower/lender paths)

**Verify**
- verification email delivered
- link opens verification page successfully
- account can log in after verification

## B. Resend Verification Email

**Trigger**
- resend verification action/page

**Verify**
- new verification email delivered
- latest link works

## C. Forgot Password / Password Reset

**Trigger**
- forgot password with valid email

**Verify**
- reset email delivered
- reset link opens valid page
- password reset succeeds
- old password fails, new password works

---

## 5) Additional Email Flows (If Enabled in Your Build)

- consent request email
- user email notification test endpoint
- request email change / verify email change

Run these if your role/UI exposes them.

---

## 6) Regression Matrix (Recommended)

Run each key scenario with:

- role: lender / admin (as applicable)
- borrower with valid email
- borrower with missing/invalid email
- one normal run
- one rapid repeat click run
- one network-failure simulation run

Mark each as Pass/Fail with evidence.

---

## 7) Evidence to Capture

For every tested flow:

- screenshot of trigger action
- screenshot of UI success/failure message
- screenshot of received email (subject + body)
- screenshot of clicked email link destination

This ensures audit-ready QA proof.

---

## 8) Exit Criteria for “Email Testing Thoroughly Complete”

You can mark testing complete only when:

1. Pre-approval email flow is pass (positive + negative paths)
2. Document request email flow is pass (single + batch + negative path)
3. Registration/verification and password reset email flows are pass
4. No blocking defects remain for email send or email link actions

