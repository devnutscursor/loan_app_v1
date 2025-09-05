### Task 1: Access control and role plumbing
- Description: Ensure the app recognizes the `company` role end-to-end.
- Steps:
  - Verify `backend/src/middleware/auth.middleware.js` supports role-based guards for `company`.
  - Ensure JWT payload and login response include `user.role` and `user.company` for company users.
  - Frontend `AuthContext` ensures the user object includes `role` and `company` on login.
- Deliverables:
  - Role guard for `company`.
  - Login response for `company` users includes `company` id.
- Acceptance:
  - A user with role `company` can authenticate; guarded endpoints recognize role.
- Dependencies: None.

### Task 2: Admin endpoint to create Company + Primary Contact (no schema changes)
- Description: Admin can create a company and a primary contact user in a single call.
- Steps:
  - Add controller handler `createCompanyWithPrimaryContact` in `admin.controller.js`.
  - Validate inputs: `companyName`, `password`, `phone`, `email`, `maxLenders`, and primary contact `firstName`, `lastName`, `email`, `phone`, `password`.
  - Use a MongoDB transaction:
    - Create `Company` with given fields (match existing schema field names). Do not change schema.
    - Create primary contact `User` with `role: 'company'`, link `user.company = company._id`.
    - Update company `primaryContact = user._id` and push user into `users`.
  - Route: `POST /admin/companies` with `auth` + `authorize('admin')`.
  - Exclude sensitive fields from response.
- Deliverables:
  - Admin endpoint documentation and route.
- Acceptance:
  - Successful creation links both records correctly.
  - Duplicate `company.name` or primary contact `email` fails with clear error.
- Dependencies: Task 1 (guards and role propagation).

### Task 3: Enforce maxLenders cap centrally
- Description: Prevent creating lenders beyond `company.maxLenders`.
- Steps:
  - Create `company.service.js` with `assertCompanyCapacity(companyId)`.
  - Integrate assertion before all lender creation flows:
    - `admin.controller.js -> createLenderUser`
    - Any other code path that creates a `Lender` with a `company`.
  - Return 400 with a clear message when limit reached.
- Deliverables:
  - Central service and its usage in controllers.
- Acceptance:
  - Attempting to add a lender that exceeds `maxLenders` fails.
- Dependencies: Task 2 (so companies exist with `maxLenders`).

### Task 4: Company statistics endpoint
- Description: Provide aggregate company-wide stats for dashboard.
- Steps:
  - Add handler `getCompanyStats` in `company.controller.js`.
  - Inputs: `:id` param; for `company` role infer from `req.user.company`.
  - Aggregations:
    - Total lenders (`Lender` by `company`).
    - Total borrowers across company lenders.
    - Active loans count and total loan volume (`Loan` joined via lenders).
  - Authorization: admin can access any; company users only their own.
  - Route: `GET /companies/:id/stats`.
- Deliverables:
  - Endpoint returning JSON aggregate metrics.
- Acceptance:
  - Returns accurate counts for seeded data; enforces access properly.
- Dependencies: Task 1 (role recognition). Optional: Task 7 indexes can improve performance but not required.

### Task 5: Top lenders endpoint with sorting
- Description: Provide top lenders by borrower count or total amount.
- Steps:
  - Add handler `getTopLenders` in `company.controller.js`.
  - Inputs: `:id`, `sortBy=borrowers|amount` (default borrowers), `limit`, `page` (optional).
  - Aggregations:
    - For each lender under company: calculate borrower count and total loan amount.
    - Sort by requested metric and return.
  - Populate `lender.user` basic fields for display.
  - Authorization same as Task 4.
  - Route: `GET /companies/:id/top-lenders`.
- Deliverables:
  - Endpoint returning ranked lender list with metrics.
- Acceptance:
  - Sorting toggle produces expected order; access control enforced.
- Dependencies: Task 1. Optional: Task 7 for performance.

### Task 6: Company lenders listing (API hardening)
- Description: Ensure lenders list endpoint is ready for the company module UI.
- Steps:
  - Review/extend existing `getCompanyLenders`:
    - Support admin (any company) and company users (own company).
    - Pagination and sorting.
    - Return enough fields for UI actions (lender id, `user` name/email).
  - Route: Use existing `/companies/:id/lenders`.
- Deliverables:
  - Stable, paginated list suitable for frontend table.
- Acceptance:
  - Company user receives their lenders; admin can query any company.
- Dependencies: Task 1.

### Task 7: Index and performance checks (optional but recommended)
- Description: Ensure acceptable performance for aggregations.
- Steps:
  - Verify/add indexes:
    - `Lender.company`
    - `Borrower.lender`
    - `Loan.lender`
  - Measure aggregation endpoints and log duration at debug level.
- Deliverables:
  - Index definitions (if missing).
- Acceptance:
  - P95 latency acceptable in test dataset; no timeouts.
- Dependencies: None (can be applied anytime). Impacts Tasks 4–6 performance.

### Task 8: Frontend auth redirect for company role
- Description: Redirect company users to the company dashboard after login.
- Steps:
  - In `AuthContext` and login flow, redirect to `/company/dashboard` when `user.role === 'company'`.
  - Ensure `user.company` is available in context.
- Deliverables:
  - Redirect logic and QA notes.
- Acceptance:
  - Logging in as company role lands on `/company/dashboard`.
- Dependencies: Task 1 (role propagation).

### Task 9: Company layout and sidebar
- Description: Create company-specific layout with navigation.
- Steps:
  - New `CompanyLayout` component with sidebar entries:
    - Dashboard
    - Lenders
  - Consistent styling with lender layout; responsive behavior.
- Deliverables:
  - Layout wrapper used by company pages.
- Acceptance:
  - Navigation highlights current page; hides for non-company users.
- Dependencies: None (can be built independently).

### Task 10: Company dashboard page
- Description: Display company-wide aggregates and top lenders.
- Steps:
  - Page `/company/dashboard`.
  - Fetch `GET /companies/:id/stats` using `user.company`.
  - Top Lenders section:
    - Toggle control for sorting by Borrowers vs Amount.
    - Fetch `GET /companies/:id/top-lenders?sortBy=...`.
  - Reuse existing stats widgets from lender dashboard where possible (adapted for aggregates).
- Deliverables:
  - Page with widgets and top lenders list.
- Acceptance:
  - Toggle switches correctly; data matches API output.
- Dependencies: Tasks 4, 5 (APIs), Task 8 (redirect).

### Task 11: Company lenders page and drilldown
- Description: List company’s lenders with actions that reuse lender pages.
- Steps:
  - Page `/company/lenders`.
  - Fetch `GET /companies/:id/lenders` with pagination.
  - Table columns: Lender name, email, optional counts/volume, actions:
    - View Stats → route to existing lender dashboard page (pass `lenderId` as query or path per current design).
    - View Borrowers → route to lender’s borrowers list page.
  - Drilldown flow reuse:
    - Borrowers list → `/lender/loans?borrowerId=...`
    - Loans list → `/lender/loans/{loanId}?tab=dashboard`
- Deliverables:
  - Functional page and navigation actions.
- Acceptance:
  - Navigations resolve to existing lender pages; no duplicate UI.
- Dependencies: Task 6 (API), Task 9 (layout).

### Task 12: Frontend API client functions
- Description: Add typed API methods for company module.
- Steps:
  - In `frontend/src/services/api.js`, add:
    - `getCompanyStats(companyId)`
    - `getCompanyTopLenders(companyId, { sortBy, limit, page })`
    - `getCompanyLenders(companyId, { page, limit })`
  - Ensure auth headers and error handling match existing conventions.
- Deliverables:
  - API helpers with unit tests or mocks.
- Acceptance:
  - Pages can fetch and render data using these helpers.
- Dependencies: Tasks 4–6 (endpoints).

### Task 13: Validation and error messaging
- Description: Standardize request validation and errors for new endpoints.
- Steps:
  - Add validation middleware for:
    - `POST /admin/companies`: required fields and types; `maxLenders >= 1`.
    - Stats/top-lenders/lenders routes: validate `:id` as ObjectId; `sortBy` whitelist.
  - Ensure responses do not expose `User.password`/`Company.password`.
- Deliverables:
  - Validation middleware and error messages.
- Acceptance:
  - Invalid inputs return consistent 400 errors.
- Dependencies: Tasks 2, 4–6 (endpoints).

### Task 14: Testing (backend)
- Description: Cover company module flows with tests.
- Steps:
  - Unit: `assertCompanyCapacity`.
  - Integration:
    - Admin creates company + primary contact (transaction success and rollback on error).
    - Exceed `maxLenders` → creation blocked.
    - Company user can fetch own stats/top-lenders/lenders; admin can fetch any.
- Deliverables:
  - Test suites and fixtures.
- Acceptance:
  - All tests pass locally and in CI.
- Dependencies: Tasks 2–6.

### Task 15: Testing (frontend)
- Description: Verify UI navigation and rendering.
- Steps:
  - Unit tests for new API helpers.
  - Integration:
    - Login as company user → redirected.
    - Dashboard loads aggregates and toggles sorting.
    - Lenders page loads and actions navigate to lender pages correctly.
- Deliverables:
  - Test specs and CI config updates (if any).
- Acceptance:
  - Tests pass; manual QA scenarios verified.
- Dependencies: Tasks 8–12.

### Task 16: Observability and logs
- Description: Add meaningful logs and optional timing for heavy queries.
- Steps:
  - Log company creation and primary contact linking.
  - Log when lender creation is blocked by cap.
  - Add debug timing for stats/top-lenders aggregations.
- Deliverables:
  - Structured logs in existing logger.
- Acceptance:
  - Logs visible in `backend/logs` with expected messages.
- Dependencies: Tasks 2–6.

### Task 17: Data verification and seeding
- Description: Ensure environment has data to test new module.
- Steps:
  - Seed script to create a company with `maxLenders=2`, a few lenders, borrowers, loans.
  - Verify existing records meet required company fields; if not, document manual remediation steps (no schema changes).
- Deliverables:
  - Seed script and short runbook.
- Acceptance:
  - Local environment can demo dashboards and cap behavior.
- Dependencies: None.

### Notes on unavoidable dependencies
- Task 2 depends on Task 1 so the created primary contact has correct role handling.
- Tasks 4–6 rely on Task 1 (role/context) and are consumed by frontend Tasks 10–12.
- Testing tasks (14–15) depend on completion of the relevant API/UI tasks.

- End state acceptance
  - Admin can create company + primary contact, with links set.
  - `maxLenders` enforced everywhere lenders are created.
  - Company login redirects to `/company/dashboard`.
  - Company dashboard shows aggregates and ranked lenders.
  - Company lenders page lists lenders and reuses existing lender pages for drilldowns.
  - No changes to `Company` schema.