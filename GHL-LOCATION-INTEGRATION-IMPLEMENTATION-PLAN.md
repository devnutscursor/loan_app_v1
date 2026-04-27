# GHL Location-Level Integration Implementation Plan

## Goal

Integrate GoHighLevel (GHL) at the **location/sub-account level** for each company in our loan application, without creating sub-accounts from our app.

Each company in our app will connect its existing GHL sub-account via OAuth. We will store tokens per company, provision users (owner as admin + loan officers), sync borrower contacts with dedupe, and create/update opportunities in the company pipeline assigned to loan officers.

---

## Scope and Non-Scope

### In Scope
- Connect an existing GHL location to a company in our app (OAuth).
- Persist and refresh `access_token` + `refresh_token` per company.
- Provision company users in GHL:
  - Owner -> admin user
  - Loan officers -> assignable users for opportunities
- On loan application:
  - Create borrower contact in GHL if not existing
  - Reuse existing contact if found
- Create and maintain opportunity records in GHL pipeline, assigned to loan officer.

### Out of Scope (for this phase)
- Agency-level provisioning (creating GHL sub-accounts/locations).
- Calendar feature implementation (only ensure user model is compatible with future calendar assignment).
- Bulk historical backfill/migration of old loans (can be added later as separate job).

---

## Business Flow

1. Company admin initiates "Connect GHL" in our app.
2. User completes GHL OAuth for an existing location.
3. Callback stores location tokens and metadata against the company record.
4. System provisions owner + loan officers as GHL users (idempotent behavior).
5. When borrower applies:
   - Resolve or create GHL contact for borrower.
6. Create/update GHL opportunity for loan application and assign to selected loan officer.
7. Loan stage changes in our app update GHL pipeline stage.

---

## Technical Architecture

### Token Ownership Model
- One active GHL integration per company (location-level token pair).
- Store token + token metadata per company.
- Refresh on demand (before expiry) and via safe fallback on 401.
- Run scheduled token refresh every 4 hours for all connected companies.
- On server start, validate all stored company tokens and refresh expired/invalid tokens immediately.

### Identity Mapping Model
- Maintain mapping tables to avoid duplicates and support idempotent retries:
  - `company -> ghl_location_id`
  - `app_user -> ghl_user_id`
  - `borrower -> ghl_contact_id`
  - `loan_application -> ghl_opportunity_id`

### Sync Strategy
- Prefer **upsert-like behavior via lookup + create/update**.
- All sync operations must be idempotent and retry-safe.
- Record sync status + last error for observability and support.

---

## Endpoints to Use (Location Level Focus)

From the current endpoint reference and intended flow:

### OAuth / Token
- `GET /oauth/chooselocation` (user browser flow)
- `POST /oauth/token` (authorization code exchange)
- `POST /oauth/token` (refresh token)

### Users
- `GET /users/` (lookup/list users by location)
- `POST /users/` (create owner/admin and loan officers)
- `GET /users/{userId}` (validation if needed)

### Contacts
- `GET /contacts/` (search/list for dedupe)
- `POST /contacts/` (create borrower)
- `PUT /contacts/{contactId}` (optional enrichment updates)

### Opportunities
- `GET /opportunities/pipelines` (load pipelines/stages for location)
- `POST /opportunities/` (create loan opportunity)
- `PUT /opportunities/{opportunityId}` (stage/status/assignee updates)
- `POST /opportunities/search` (recommended official search pattern)

---

## Data Model Changes (Proposed)

## 1) Company GHL Integration
- `company.ghlConnected` (bool)
- `company.ghlLocationId` (string)
- `company.ghlCompanyId` (string, if returned)
- `company.ghlAccessToken` (encrypted)
- `company.ghlRefreshToken` (encrypted)
- `company.ghlTokenExpiresAt` (datetime)
- `company.ghlScopes` (string/text)
- `company.ghlConnectedAt` (datetime)
- `company.ghlLastSyncError` (text, nullable)

## 2) User Mapping
- `ghl_user_map`:
  - `companyId`
  - `appUserId`
  - `ghlUserId`
  - `role` (`owner_admin` | `loan_officer`)
  - `provisionStatus`
  - timestamps

## 3) Borrower Contact Mapping
- `ghl_contact_map`:
  - `companyId`
  - `borrowerId` (or canonical applicant ID)
  - `ghlContactId`
  - `dedupeKey` (email/phone normalized)
  - timestamps

## 4) Opportunity Mapping
- `ghl_opportunity_map`:
  - `companyId`
  - `loanApplicationId`
  - `ghlOpportunityId`
  - `pipelineId`
  - `pipelineStageId`
  - `assignedGhlUserId`
  - sync timestamps/status

---

## Implementation Phases

## Phase 1: Connection + Token Foundation
- Add connect endpoint and callback handler.
- Implement OAuth code exchange and token persistence.
- Add token refresh service:
  - proactive refresh using `expiresAt`
  - scheduled refresh every 4 hours
  - startup-time refresh check for all connected companies
  - reactive refresh on 401 with one retry.
- Add integration health check endpoint per company.

### Acceptance Criteria
- Company can connect one location successfully.
- Token pair is stored and refresh works reliably.
- API calls can be made with refreshed token without user reconnect.

## Phase 2: User Provisioning (Critical Path)
- Define canonical company users to sync:
  - owner (must be admin in GHL)
  - all active loan officers
- Build provisioning service:
  - lookup existing GHL users
  - create missing users
  - persist `app_user -> ghl_user` mapping
- Add idempotent "re-provision users" action.
- Add validation rules for assignability (loan officers must have valid `ghlUserId`).

### Acceptance Criteria
- Owner is present as admin in GHL.
- Every active loan officer has valid GHL user mapping.
- Re-running provisioning does not create duplicates.

## Phase 3: Borrower Contact Dedupe + Create
- Define contact dedupe policy:
  - primary key: normalized email
  - secondary key: normalized phone
  - fallback: name + company-specific context (optional)
- Implement contact resolver service:
  - search existing contact
  - create if not found
  - save borrower mapping
- Add safe update path for missing fields (optional enrichment).

### Acceptance Criteria
- Repeated borrower submissions do not create duplicate contacts.
- Existing contacts are reused and mapping is persisted.

## Phase 4: Opportunity Create/Assign/Update
- Fetch/configure pipeline + stage mapping for each company.
- On loan application:
  - ensure contact exists
  - resolve assigned loan officer `ghlUserId`
  - create opportunity if new loan
  - update existing opportunity if loan already mapped
- On loan status/stage change:
  - move opportunity stage accordingly.

### Acceptance Criteria
- Each loan application maps to one opportunity in GHL.
- Opportunity is assigned to correct loan officer.
- Stage changes in app reflect in GHL.

## Phase 5: Reliability + Observability
- Add structured logs with correlation IDs (company/loan IDs).
- Add retry policy + dead-letter strategy for failed syncs (if async jobs are used).
- Add admin diagnostics endpoint/page:
  - connection status
  - last token refresh
  - user/contact/opportunity sync status
  - last error.

### Acceptance Criteria
- Sync failures are visible and actionable.
- Support team can identify root cause quickly.

---

## Detailed Rules and Decisions

## 1) OAuth and Connection Rules
- Use environment-provided client credentials only.
- Redirect URI must exactly match configured app settings in GHL.
- Persist and rotate refresh token every time refresh succeeds.
- If refresh fails with invalid_grant, mark integration disconnected and prompt reconnect.
- Token refresh cadence is every 4 hours via scheduler, regardless of request traffic.
- At API server boot, run a token validation sweep and refresh expired tokens on the spot before marking integration healthy.

## 2) User Provisioning Rules
- Owner account from our company profile is source-of-truth admin user.
- Loan officers are provisioned from active internal user list.
- Email is unique identity for matching existing GHL users.
- Do not hard-delete GHL users from app actions; if user is deactivated in app, mark non-assignable locally.

## 3) Contact Dedupe Rules
- Normalize email to lowercase + trim.
- Normalize phone to E.164 where possible.
- Matching priority:
  1. exact email
  2. exact phone
  3. mapped borrower record
- If ambiguous multiple matches, log warning and choose deterministic oldest/first strategy.

## 4) Opportunity Rules
- One app loan application -> one GHL opportunity mapping.
- Assignment requires valid mapped GHL user; if missing, use fallback owner admin and log warning.
- Keep pipeline and stage IDs configurable per company (or default template).

---

## Security and Compliance

- Encrypt tokens at rest.
- Never log access/refresh tokens.
- Add scoped permission checks so only authorized company admins can connect/disconnect GHL.
- Audit trail for:
  - connect/disconnect
  - token refresh failures
  - user provisioning actions
  - opportunity assignment changes.

---

## Error Handling and Retry Strategy

- For transient HTTP failures (`429`, `5xx`): exponential backoff with jitter.
- For `401`: refresh token and retry once.
- For validation errors (`400/422`): store actionable error against entity (user/contact/opportunity) and stop retry loop.
- For rate limits: respect retry headers when present.

---

## Testing Plan

## Unit Tests
- Token refresh service behavior.
- Contact dedupe resolver (email/phone/ambiguous cases).
- Opportunity assignment fallback logic.
- Idempotent mapping creation/update behavior.

## Integration Tests (API + DB)
- OAuth callback persists tokens and metadata.
- User provisioning creates mappings and avoids duplicates.
- Borrower sync reuses existing contact.
- Loan -> opportunity create and update stage workflow.

## End-to-End (Staging)
- Connect one real GHL location.
- Provision owner + multiple loan officers.
- Submit new loan application and confirm:
  - contact created/reused
  - opportunity created
  - assigned user correct
- Update loan stage and confirm pipeline stage movement in GHL.

---

## Rollout Plan

1. Feature flag by company (`ghl_integration_enabled`).
2. Internal testing with sandbox/staging locations.
3. Pilot with 1-2 real companies.
4. Gradual rollout to all companies.
5. Monitor sync error rate and token refresh success rate.

---

## Open Questions to Finalize Before Coding

1. Which exact internal role maps to GHL admin besides owner (if any)?
2. Are we enforcing one GHL location per company, or supporting multiple in future?
3. Where will company-specific pipeline/stage mapping be configured (admin UI vs seed/config)?
4. What is the fallback assignee rule if loan officer provisioning is incomplete?
5. Should borrower contact updates be one-way (app -> GHL) only, or bi-directional later?

---

## Deliverables Checklist

- [ ] DB schema updates for tokens + mappings.
- [ ] OAuth connect/callback endpoints.
- [ ] Token manager with refresh + retry.
- [ ] User provisioning service + idempotent sync.
- [ ] Borrower contact dedupe/create service.
- [ ] Opportunity create/update/assignment service.
- [ ] Diagnostics/logging and error surfaces.
- [ ] Automated tests across unit/integration/e2e.

---

## Execution Checklist (File-Level)

This section is the implementation playbook for this codebase (`backend/src/*`) so we can execute in small, testable PR-sized steps.

### A) Environment and Config Validation
- [ ] Confirm these env vars are present in `backend/.env` and deployment environment:
  - `GHL_OAUTH_REDIRECT_URI=http://localhost:5000/api/oauth/callback`
  - `LOCATION_CLIENT_ID`
  - `LOCATION_CLIENT_SECRET`
  - `GHL_BASE_URL` (default `https://services.leadconnectorhq.com`)
  - `GHL_MARKETPLACE_URL` (default `https://marketplace.gohighlevel.com`)
- [ ] Add a lightweight config helper:
  - create `backend/src/config/ghl.config.js`
  - centralize env reads and required-var validation.

### B) Data Layer Changes
- [ ] Update `backend/src/models/company.model.js` with GHL integration fields:
  - connection state + location/company IDs
  - encrypted token fields + expiry metadata
  - sync status/error fields.
- [ ] Add mapping models:
  - create `backend/src/models/ghlUserMap.model.js`
  - create `backend/src/models/ghlContactMap.model.js`
  - create `backend/src/models/ghlOpportunityMap.model.js`
- [ ] Register any new model imports if your app bootstrapping requires explicit model loading.

### C) GHL Client and Token Services
- [ ] Create a reusable API client:
  - `backend/src/services/ghlApiClient.service.js`
  - handles base URL, auth header, version header, retries, and normalized errors.
- [ ] Create token manager:
  - `backend/src/services/ghlToken.service.js`
  - implements refresh flow + refresh-token rotation + 401 retry-once logic.
  - exposes `refreshCompanyToken(companyId)` and `refreshAllCompanyTokens()` helpers.
- [ ] Add utility helpers:
  - `backend/src/utils/phone.js` for E.164 normalization (if no existing helper)
  - `backend/src/utils/ghlDedupe.js` for deterministic contact matching.
- [ ] Add scheduler wiring:
  - use existing `backend/src/utils/scheduler.js`
  - register a 4-hour recurring job for `refreshAllCompanyTokens()`.
- [ ] Add server-start hook:
  - call `refreshAllCompanyTokens({ onlyExpired: true })` during backend bootstrap
  - log success/fail counts and keep server up even if some companies fail refresh.

### D) OAuth Connection Endpoints
- [ ] Create controller:
  - `backend/src/controllers/ghl.controller.js`
  - handlers:
    - `getConnectUrl`
    - `oauthCallback`
    - `getIntegrationStatus`
    - `disconnectIntegration` (soft disconnect).
- [ ] Create routes:
  - `backend/src/routes/ghl.routes.js`
  - include:
    - `GET /api/ghl/connect-url`
    - `GET /api/oauth/callback`
    - `GET /api/ghl/status`
    - `POST /api/ghl/disconnect`
- [ ] Mount route in `backend/src/routes/index.routes.js`.
- [ ] Add permission checks so only company admin/owner can connect/disconnect.

### E) User Provisioning (Owner + Loan Officers)
- [ ] Create provisioning service:
  - `backend/src/services/ghlUserProvisioning.service.js`
  - responsibilities:
    - list existing GHL users for location
    - create missing owner/admin and loan officers
    - persist/update `ghlUserMap`.
- [ ] Add orchestration endpoint:
  - `POST /api/ghl/provision-users` in `ghl.routes.js` + `ghl.controller.js`.
- [ ] Add idempotency safeguards:
  - email-based match first
  - mapping uniqueness index (`companyId + appUserId`).

### F) Borrower Contact Dedupe and Sync
- [ ] Create contact sync service:
  - `backend/src/services/ghlContactSync.service.js`
  - flow:
    - resolve borrower identity from `borrower` and/or `loan.borrowerDetails`
    - search GHL contacts by normalized email/phone
    - reuse matched contact or create new contact
    - persist/update `ghlContactMap`.
- [ ] Integrate into loan application lifecycle:
  - update `backend/src/controllers/loan.controller.js` at loan create/submit path
  - call contact resolver before opportunity sync.

### G) Opportunity Create/Assign/Update
- [ ] Create opportunity sync service:
  - `backend/src/services/ghlOpportunitySync.service.js`
  - flow:
    - fetch pipelines/stages (cached per company/location)
    - resolve assigned loan officer `ghlUserId` (fallback owner admin)
    - create/update opportunity
    - persist/update `ghlOpportunityMap`.
- [ ] Hook into loan status transitions:
  - update `backend/src/controllers/loan.controller.js`
  - optionally add hook in `backend/src/models/loan.model.js` only if controller coverage is insufficient.

### H) API Surface for Diagnostics
- [ ] Add diagnostic endpoints in `ghl.controller.js`:
  - `GET /api/ghl/health`
  - `GET /api/ghl/sync-status/:companyId`
- [ ] Log sync attempts/errors with existing logger:
  - `backend/src/utils/logger.js`
  - include `companyId`, `loanId`, `borrowerId`, `opportunityId`, error code.

### I) Tests
- [ ] Add service unit tests:
  - `backend/src/services/__tests__/ghlToken.service.test.js`
  - `backend/src/services/__tests__/ghlContactSync.service.test.js`
  - `backend/src/services/__tests__/ghlOpportunitySync.service.test.js`
- [ ] Add route/controller integration tests:
  - `backend/src/controllers/__tests__/ghl.controller.test.js`
  - `backend/src/controllers/__tests__/loan.ghl.integration.test.js`
- [ ] Add fixture-based tests for dedupe edge cases:
  - same email, different phone
  - same phone, different email
  - multiple matches.

### J) Rollout Sequence (Suggested)
- [ ] Step 1: merge config + data models.
- [ ] Step 2: merge OAuth + token manager + health endpoints.
- [ ] Step 3: merge user provisioning and validate mappings.
- [ ] Step 4: merge contact sync and dedupe.
- [ ] Step 5: merge opportunity sync + loan lifecycle wiring.
- [ ] Step 6: production hardening (retry tuning, observability, runbook).

