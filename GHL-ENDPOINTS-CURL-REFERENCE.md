# GoHighLevel Endpoints Used In This App

This file documents the GoHighLevel endpoints that are actually used by the app's runtime code, along with `curl` examples that mirror the request patterns in the codebase.

## Scope

- Included: runtime endpoints used from `backend/routes/*.js` and `backend/services/*.js`
- Included: OAuth/token endpoints used for connect and refresh flows
- Excluded: one-off experiment/test endpoints used only inside `backend/scripts/*`

## Common Variables

```bash
export GHL_BASE_URL="https://services.leadconnectorhq.com"
export GHL_MARKETPLACE_URL="https://marketplace.gohighlevel.com"

export LOCATION_ACCESS_TOKEN="your-location-access-token"
export LOCATION_REFRESH_TOKEN="your-location-refresh-token"
export LOCATION_CLIENT_ID="your-location-client-id"
export LOCATION_CLIENT_SECRET="your-location-client-secret"

export AGENCY_ACCESS_TOKEN="your-agency-access-token"
export AGENCY_REFRESH_TOKEN="your-agency-refresh-token"
export AGENCY_CLIENT_ID="your-agency-client-id"
export AGENCY_CLIENT_SECRET="your-agency-client-secret"

export LOCATION_ID="your-location-id"
export AGENCY_ID="your-agency-id"
export APP_ID="your-app-id"
export USER_ID="your-user-id"
export CONTACT_ID="your-contact-id"
export TASK_ID="your-task-id"
export EVENT_ID="your-event-id"
export OPPORTUNITY_ID="your-opportunity-id"
export APPOINTMENT_ID="your-appointment-id"
export CALENDAR_ID="your-calendar-id"
export GROUP_ID="your-group-id"
```

## Common Headers

Location-scoped requests:

```bash
-H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
-H "Version: 2021-07-28" \
-H "Accept: application/json"
```

Agency-scoped requests:

```bash
-H "Authorization: Bearer $AGENCY_ACCESS_TOKEN" \
-H "Version: 2021-07-28" \
-H "Accept: application/json"
```

JSON body requests also add:

```bash
-H "Content-Type: application/json"
```

Form-encoded token requests use:

```bash
-H "Content-Type: application/x-www-form-urlencoded"
```

---

## Chunk 1: OAuth And Token Lifecycle

### 1. Marketplace location authorization URL

Used by the app to start the interactive location OAuth flow.

Method: `GET`  
Endpoint: `https://marketplace.gohighlevel.com/oauth/chooselocation`

```bash
curl --get "$GHL_MARKETPLACE_URL/oauth/chooselocation" \
  --data-urlencode "response_type=code" \
  --data-urlencode "redirect_uri=https://real-estate-management-xz2u.onrender.com/api/oauth/callback" \
  --data-urlencode "client_id=$LOCATION_CLIENT_ID" \
  --data-urlencode "scope=contacts.readonly contacts.write calendars.readonly calendars.write calendars/events.readonly calendars/events.write opportunities.readonly opportunities.write users.readonly users.write locations.readonly locations/tasks.readonly locations/tasks.write oauth.readonly oauth.write" \
  --data-urlencode "state=your-organization-id"
```

Notes:

- In the real app this is opened in a browser, not called server-to-server.
- The real code requests a broader scope list than the shortened example above.

### 2. Exchange authorization code for access + refresh token

Used in `backend/routes/ghl.js` during `POST /api/ghl/oauth/callback`.

Method: `POST`  
Endpoint: `https://services.leadconnectorhq.com/oauth/token`

```bash
curl -X POST "$GHL_BASE_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=authorization_code" \
  --data-urlencode "code=your-authorization-code" \
  --data-urlencode "client_id=$LOCATION_CLIENT_ID" \
  --data-urlencode "client_secret=$LOCATION_CLIENT_SECRET" \
  --data-urlencode "redirect_uri=https://real-estate-management-xz2u.onrender.com/api/oauth/callback"
```

### 3. Refresh a location token

Used in `backend/services/ghlTokenService.js` and `backend/services/tokenRefreshService.js`.

Method: `POST`  
Endpoint: `https://services.leadconnectorhq.com/oauth/token`

```bash
curl -X POST "$GHL_BASE_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "client_id=$LOCATION_CLIENT_ID" \
  --data-urlencode "client_secret=$LOCATION_CLIENT_SECRET" \
  --data-urlencode "grant_type=refresh_token" \
  --data-urlencode "refresh_token=$LOCATION_REFRESH_TOKEN"
```

### 4. Refresh an agency token

Used in `backend/services/ghlTokenService.js` and `backend/services/tokenRefreshService.js`.

Method: `POST`  
Endpoint: `https://services.leadconnectorhq.com/oauth/token`

```bash
curl -X POST "$GHL_BASE_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "client_id=$AGENCY_CLIENT_ID" \
  --data-urlencode "client_secret=$AGENCY_CLIENT_SECRET" \
  --data-urlencode "grant_type=refresh_token" \
  --data-urlencode "refresh_token=$AGENCY_REFRESH_TOKEN"
```

### 5. Test whether a location token is usable

Used as a lightweight validity check in `backend/services/ghlTokenService.js`.

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/contacts/`

```bash
curl --get "$GHL_BASE_URL/contacts/" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  --data-urlencode "locationId=$LOCATION_ID"
```

---

## Chunk 2: Agency-Level Endpoints

These are used through `backend/services/ghlAgencyService.js`.

### 6. Get agency/account info

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/accounts/`

```bash
curl "$GHL_BASE_URL/accounts/" \
  -H "Authorization: Bearer $AGENCY_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json"
```

### 7. Get all locations in agency

Used by the legacy `getLocations()` method.

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/locations/`

```bash
curl "$GHL_BASE_URL/locations/" \
  -H "Authorization: Bearer $AGENCY_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json"
```

### 8. Get installed locations for a marketplace app

Used by `getAgencyLocations()`.

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/oauth/installedLocations`

```bash
curl --get "$GHL_BASE_URL/oauth/installedLocations" \
  -H "Authorization: Bearer $AGENCY_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  --data-urlencode "companyId=$AGENCY_ID" \
  --data-urlencode "appId=$APP_ID"
```

### 9. Create a sub-account/location

Used by `createSubAccount()`.

Method: `POST`  
Endpoint: `https://services.leadconnectorhq.com/locations/`

```bash
curl -X POST "$GHL_BASE_URL/locations/" \
  -H "Authorization: Bearer $AGENCY_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Realty",
    "phone": "+15551234567",
    "companyId": "'"$AGENCY_ID"'",
    "address": "123 Main St",
    "city": "Portland",
    "state": "OR",
    "country": "US",
    "postalCode": "97201",
    "website": "https://example.com",
    "timezone": "America/Los_Angeles"
  }'
```

### 10. Get location by ID

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/locations/{locationId}`

```bash
curl "$GHL_BASE_URL/locations/$LOCATION_ID" \
  -H "Authorization: Bearer $AGENCY_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json"
```

### 11. Update location

Method: `PUT`  
Endpoint: `https://services.leadconnectorhq.com/locations/{locationId}`

```bash
curl -X PUT "$GHL_BASE_URL/locations/$LOCATION_ID" \
  -H "Authorization: Bearer $AGENCY_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Realty Updated",
    "timezone": "America/Los_Angeles"
  }'
```

### 12. Delete location

Method: `DELETE`  
Endpoint: `https://services.leadconnectorhq.com/locations/{locationId}`

```bash
curl -X DELETE "$GHL_BASE_URL/locations/$LOCATION_ID" \
  -H "Authorization: Bearer $AGENCY_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json"
```

### 13. List users

Agency service uses this for management and lookup.

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/users/`

```bash
curl "$GHL_BASE_URL/users/" \
  -H "Authorization: Bearer $AGENCY_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json"
```

### 14. Get user by ID

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/users/{userId}`

```bash
curl "$GHL_BASE_URL/users/$USER_ID" \
  -H "Authorization: Bearer $AGENCY_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json"
```

### 15. Create a GHL user

Used in OAuth completion and user provisioning flows.

Method: `POST`  
Endpoint: `https://services.leadconnectorhq.com/users/`

```bash
curl -X POST "$GHL_BASE_URL/users/" \
  -H "Authorization: Bearer $AGENCY_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "'"$AGENCY_ID"'",
    "type": "account",
    "firstName": "Jane",
    "lastName": "Admin",
    "email": "jane@example.com",
    "password": "TempPassword123!",
    "role": "admin",
    "locationIds": ["'"$LOCATION_ID"'"],
    "phone": "+15551234567"
  }'
```

Notes:

- In one runtime path this same endpoint is called with a location token after OAuth succeeds.
- The payload shape is consistent across both user-creation paths.

---

## Chunk 3: Contact Endpoints

These are used by both `ghlAgencyService` and `ghlCalendarService`.

### 16. List contacts for a location

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/contacts/`

```bash
curl --get "$GHL_BASE_URL/contacts/" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  --data-urlencode "locationId=$LOCATION_ID" \
  --data-urlencode "limit=100"
```

Optional pagination used by the app:

```bash
curl --get "$GHL_BASE_URL/contacts/" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  --data-urlencode "locationId=$LOCATION_ID" \
  --data-urlencode "limit=100" \
  --data-urlencode "startAfterId=last-contact-id"
```

### 17. Create contact

Method: `POST`  
Endpoint: `https://services.leadconnectorhq.com/contacts/`

```bash
curl -X POST "$GHL_BASE_URL/contacts/" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "'"$LOCATION_ID"'",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+15550001111"
  }'
```

Note:

- The calendar service also uses this endpoint to auto-create a fallback "System Contact" when an event needs a contact and none exists.

### 18. Get contact by ID

This exists in runtime service code.

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/contacts/{contactId}`

```bash
curl "$GHL_BASE_URL/contacts/$CONTACT_ID" \
  -H "Authorization: Bearer $AGENCY_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json"
```

### 19. Update contact

Method: `PUT`  
Endpoint: `https://services.leadconnectorhq.com/contacts/{contactId}`

```bash
curl -X PUT "$GHL_BASE_URL/contacts/$CONTACT_ID" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe Updated",
    "email": "john.updated@example.com",
    "phone": "+15550002222"
  }'
```

### 20. Delete contact

Method: `DELETE`  
Endpoint: `https://services.leadconnectorhq.com/contacts/{contactId}`

```bash
curl -X DELETE "$GHL_BASE_URL/contacts/$CONTACT_ID" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json"
```

---

## Chunk 4: Task Endpoints

Tasks are handled in two different ways in the app:

- direct task collection endpoints via `ghlAgencyService`
- contact-scoped task endpoints via `ghlLocationService`

### 21. List tasks

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/tasks/`

```bash
curl --get "$GHL_BASE_URL/tasks/" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  --data-urlencode "locationId=$LOCATION_ID" \
  --data-urlencode "limit=100"
```

Optional filters actually used in code:

```bash
curl --get "$GHL_BASE_URL/tasks/" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  --data-urlencode "locationId=$LOCATION_ID" \
  --data-urlencode "contactId=$CONTACT_ID" \
  --data-urlencode "limit=100" \
  --data-urlencode "startAfterId=last-task-id"
```

### 22. Create task through generic task endpoint

This exists in `ghlAgencyService`.

Method: `POST`  
Endpoint: `https://services.leadconnectorhq.com/tasks/`

```bash
curl -X POST "$GHL_BASE_URL/tasks/" \
  -H "Authorization: Bearer $AGENCY_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "'"$LOCATION_ID"'",
    "title": "Follow up with buyer",
    "body": "Call buyer to confirm disclosures",
    "dueDate": "2026-04-20T18:00:00.000Z"
  }'
```

### 23. Get task by ID

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/tasks/{taskId}`

```bash
curl "$GHL_BASE_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $AGENCY_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json"
```

### 24. Update task through generic task endpoint

Method: `PUT`  
Endpoint: `https://services.leadconnectorhq.com/tasks/{taskId}`

```bash
curl -X PUT "$GHL_BASE_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $AGENCY_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Follow up with buyer",
    "status": "in_progress"
  }'
```

### 25. Complete task

The app uses the same update endpoint and sets `status=completed`.

Method: `PUT`  
Endpoint: `https://services.leadconnectorhq.com/tasks/{taskId}`

```bash
curl -X PUT "$GHL_BASE_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $AGENCY_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

### 26. Delete task through generic task endpoint

Method: `DELETE`  
Endpoint: `https://services.leadconnectorhq.com/tasks/{taskId}`

```bash
curl -X DELETE "$GHL_BASE_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $AGENCY_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json"
```

### 27. Create contact-scoped task

This is the task endpoint actively used from `backend/routes/tasks.js`.

Method: `POST`  
Endpoint: `https://services.leadconnectorhq.com/contacts/{contactId}/tasks`

```bash
curl -X POST "$GHL_BASE_URL/contacts/$CONTACT_ID/tasks" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Collect earnest money receipt",
    "body": "Ask buyer agent to upload receipt",
    "completed": false,
    "dueDate": "2026-04-22T17:00:00.000Z"
  }'
```

### 28. Update contact-scoped task

Method: `PUT`  
Endpoint: `https://services.leadconnectorhq.com/contacts/{contactId}/tasks/{taskId}`

```bash
curl -X PUT "$GHL_BASE_URL/contacts/$CONTACT_ID/tasks/$TASK_ID" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Collect earnest money receipt",
    "completed": true
  }'
```

### 29. Delete contact-scoped task

Method: `DELETE`  
Endpoint: `https://services.leadconnectorhq.com/contacts/{contactId}/tasks/{taskId}`

```bash
curl -X DELETE "$GHL_BASE_URL/contacts/$CONTACT_ID/tasks/$TASK_ID" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json"
```

---

## Chunk 5: Opportunity Endpoints

### 30. List opportunities

Used by `ghlAgencyService.getOpportunities()`.

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/opportunities/`

```bash
curl --get "$GHL_BASE_URL/opportunities/" \
  -H "Authorization: Bearer $AGENCY_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  --data-urlencode "locationId=$LOCATION_ID" \
  --data-urlencode "limit=100"
```

### 31. Create opportunity

Used by:
- `ghlAgencyService.createOpportunity()`
- `ghlOpportunityService.createOpportunity()` (transaction sync flow)

Method: `POST`  
Endpoint: `https://services.leadconnectorhq.com/opportunities/`

```bash
curl -X POST "$GHL_BASE_URL/opportunities/" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "'"$LOCATION_ID"'",
    "name": "Sitton Way, Sacramento",
    "pipelineId": "ONDyMNa7bBrb7mIX6MfE",
    "pipelineStageId": "1a9b43d7-33f0-4012-b319-6792b091a207",
    "contactId": "'"$CONTACT_ID"'",
    "assignedTo": "'"$USER_ID"'",
    "status": "open",
    "monetaryValue": 375000
  }'
```

### 32. Update opportunity

Used by `ghlOpportunityService.updateOpportunity()` and update-sync flow.

Method: `PUT`  
Endpoint: `https://services.leadconnectorhq.com/opportunities/{opportunityId}`

```bash
curl -X PUT "$GHL_BASE_URL/opportunities/$OPPORTUNITY_ID" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "'"$LOCATION_ID"'",
    "name": "Sitton Way, Sacramento",
    "pipelineId": "ONDyMNa7bBrb7mIX6MfE",
    "pipelineStageId": "1a9b43d7-33f0-4012-b319-6792b091a207",
    "contactId": "'"$CONTACT_ID"'",
    "assignedTo": "'"$USER_ID"'",
    "status": "won",
    "monetaryValue": 380000
  }'
```

### 33. List pipelines for a location

Used by `ghlOpportunityService.getPipelines()` and pipeline dropdowns in UI.

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/opportunities/pipelines`

```bash
curl --get "$GHL_BASE_URL/opportunities/pipelines" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  --data-urlencode "locationId=$LOCATION_ID"
```

### 34. Search opportunities by contact (duplicate recovery / link existing)

Used by `ghlOpportunityService.searchOpportunitiesByContact()`.

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/opportunities/search`

Snake-case variant:

```bash
curl --get "$GHL_BASE_URL/opportunities/search" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  --data-urlencode "location_id=$LOCATION_ID" \
  --data-urlencode "contact_id=$CONTACT_ID" \
  --data-urlencode "limit=50"
```

Camel-case fallback variant used by code:

```bash
curl --get "$GHL_BASE_URL/opportunities/search" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  --data-urlencode "locationId=$LOCATION_ID" \
  --data-urlencode "contactId=$CONTACT_ID" \
  --data-urlencode "limit=50"
```

### 35. Contact lookup helper for dedupe/autolink

Used by `ghlOpportunityService.findExistingContact()`.

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/contacts/`

```bash
curl --get "$GHL_BASE_URL/contacts/" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  --data-urlencode "locationId=$LOCATION_ID" \
  --data-urlencode "limit=50" \
  --data-urlencode "query=john@example.com"
```

---

## Chunk 6: Calendar And Appointment Endpoints

These are used heavily by `backend/services/ghlCalendarService.js`.

### 36. List calendars for a location

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/calendars/`

```bash
curl --get "$GHL_BASE_URL/calendars/" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  --data-urlencode "locationId=$LOCATION_ID"
```

### 37. Get location users for calendar assignment

Used as a support endpoint before event/appointment creation.

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/users/`

```bash
curl --get "$GHL_BASE_URL/users/" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  --data-urlencode "locationId=$LOCATION_ID"
```

### 38. Get location contacts for calendar assignment

Used as a support endpoint before event/appointment creation.

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/contacts/`

```bash
curl --get "$GHL_BASE_URL/contacts/" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  --data-urlencode "locationId=$LOCATION_ID" \
  --data-urlencode "limit=1"
```

### 39. Get location details for fallback owner lookup

Used as a support endpoint to resolve a fallback `ownerId` / location context.

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/locations/{locationId}`

```bash
curl "$GHL_BASE_URL/locations/$LOCATION_ID" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json"
```

### 40. List calendar events

The app always sends `locationId`, `startTime`, `endTime`, and one of `calendarId`, `userId`, or `groupId`.

Method: `GET`  
Endpoint: `https://services.leadconnectorhq.com/calendars/events`

```bash
curl --get "$GHL_BASE_URL/calendars/events" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  --data-urlencode "locationId=$LOCATION_ID" \
  --data-urlencode "startTime=1711929600000" \
  --data-urlencode "endTime=1714521600000" \
  --data-urlencode "calendarId=$CALENDAR_ID"
```

Alternative identifier forms the app can use:

```bash
curl --get "$GHL_BASE_URL/calendars/events" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  --data-urlencode "locationId=$LOCATION_ID" \
  --data-urlencode "startTime=1711929600000" \
  --data-urlencode "endTime=1714521600000" \
  --data-urlencode "userId=$USER_ID"
```

```bash
curl --get "$GHL_BASE_URL/calendars/events" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  --data-urlencode "locationId=$LOCATION_ID" \
  --data-urlencode "startTime=1711929600000" \
  --data-urlencode "endTime=1714521600000" \
  --data-urlencode "groupId=$GROUP_ID"
```

### 41. Create calendar event / appointment

The runtime code uses the appointments endpoint for both event creation and appointment creation.

Method: `POST`  
Endpoint: `https://services.leadconnectorhq.com/calendars/events/appointments`

```bash
curl -X POST "$GHL_BASE_URL/calendars/events/appointments" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Inspection Deadline",
    "description": "Transaction milestone",
    "meetingLocationType": "custom",
    "meetingLocationId": "custom_0",
    "overrideLocationConfig": true,
    "appointmentStatus": "confirmed",
    "assignedUserId": "'"$USER_ID"'",
    "address": "123 Main St",
    "ignoreDateRange": false,
    "toNotify": false,
    "ignoreFreeSlotValidation": true,
    "calendarId": "'"$CALENDAR_ID"'",
    "locationId": "'"$LOCATION_ID"'",
    "contactId": "'"$CONTACT_ID"'",
    "startTime": "2026-04-20T18:00:00.000Z",
    "endTime": "2026-04-20T19:00:00.000Z"
  }'
```

Optional field used by the app for recurring items:

```json
"rrule": "FREQ=WEEKLY;INTERVAL=1"
```

### 42. Update calendar event

Used by `updateEvent()`.

Method: `PUT`  
Endpoint: `https://services.leadconnectorhq.com/calendars/events/{eventId}`

```bash
curl -X PUT "$GHL_BASE_URL/calendars/events/$EVENT_ID" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "'"$LOCATION_ID"'",
    "title": "Inspection Deadline Updated",
    "description": "Updated milestone"
  }'
```

### 43. Delete calendar event

Used by `deleteEvent()` and also by runtime appointment deletion.

Method: `DELETE`  
Endpoint: `https://services.leadconnectorhq.com/calendars/events/{eventId}`

```bash
curl -X DELETE "$GHL_BASE_URL/calendars/events/$EVENT_ID" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  --get \
  --data-urlencode "locationId=$LOCATION_ID"
```

### 44. Update appointment

Used by `updateAppointment()`.

Method: `PUT`  
Endpoint: `https://services.leadconnectorhq.com/calendars/events/appointments/{appointmentId}`

```bash
curl -X PUT "$GHL_BASE_URL/calendars/events/appointments/$APPOINTMENT_ID" \
  -H "Authorization: Bearer $LOCATION_ACCESS_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Closing Appointment",
    "description": "Updated closing appointment",
    "startTime": "2026-05-01T20:00:00.000Z",
    "endTime": "2026-05-01T21:00:00.000Z",
    "meetingLocationType": "custom",
    "meetingLocationId": "custom_0",
    "overrideLocationConfig": true,
    "appointmentStatus": "confirmed",
    "assignedUserId": "'"$USER_ID"'",
    "address": "123 Main St",
    "ignoreDateRange": true,
    "toNotify": false,
    "ignoreFreeSlotValidation": true,
    "calendarId": "'"$CALENDAR_ID"'",
    "contactId": "'"$CONTACT_ID"'"
  }'
```

---

## Chunk 7: Endpoint Crosswalk By App Feature

### OAuth connect flow

- `GET https://marketplace.gohighlevel.com/oauth/chooselocation`
- `POST https://services.leadconnectorhq.com/oauth/token`
- `POST https://services.leadconnectorhq.com/users/` (optional admin-user auto-creation after connect)

### Scheduled token refresh

- `POST https://services.leadconnectorhq.com/oauth/token`

### Agency management

- `GET https://services.leadconnectorhq.com/accounts/`
- `GET https://services.leadconnectorhq.com/locations/`
- `GET https://services.leadconnectorhq.com/oauth/installedLocations`
- `POST https://services.leadconnectorhq.com/locations/`
- `GET https://services.leadconnectorhq.com/locations/{locationId}`
- `PUT https://services.leadconnectorhq.com/locations/{locationId}`
- `DELETE https://services.leadconnectorhq.com/locations/{locationId}`

### User management

- `GET https://services.leadconnectorhq.com/users/`
- `GET https://services.leadconnectorhq.com/users/{userId}`
- `POST https://services.leadconnectorhq.com/users/`

### Contact sync

- `GET https://services.leadconnectorhq.com/contacts/`
- `POST https://services.leadconnectorhq.com/contacts/`
- `GET https://services.leadconnectorhq.com/contacts/{contactId}`
- `PUT https://services.leadconnectorhq.com/contacts/{contactId}`
- `DELETE https://services.leadconnectorhq.com/contacts/{contactId}`

### Task sync

- `GET https://services.leadconnectorhq.com/tasks/`
- `POST https://services.leadconnectorhq.com/tasks/`
- `GET https://services.leadconnectorhq.com/tasks/{taskId}`
- `PUT https://services.leadconnectorhq.com/tasks/{taskId}`
- `DELETE https://services.leadconnectorhq.com/tasks/{taskId}`
- `POST https://services.leadconnectorhq.com/contacts/{contactId}/tasks`
- `PUT https://services.leadconnectorhq.com/contacts/{contactId}/tasks/{taskId}`
- `DELETE https://services.leadconnectorhq.com/contacts/{contactId}/tasks/{taskId}`

### Opportunities

- `GET https://services.leadconnectorhq.com/opportunities/`
- `POST https://services.leadconnectorhq.com/opportunities/`
- `PUT https://services.leadconnectorhq.com/opportunities/{opportunityId}`
- `GET https://services.leadconnectorhq.com/opportunities/pipelines`
- `GET https://services.leadconnectorhq.com/opportunities/search`
- `GET https://services.leadconnectorhq.com/contacts/` (lookup helper for duplicate/autolink)

### Calendar and milestone sync

- `GET https://services.leadconnectorhq.com/calendars/`
- `GET https://services.leadconnectorhq.com/calendars/events`
- `POST https://services.leadconnectorhq.com/calendars/events/appointments`
- `PUT https://services.leadconnectorhq.com/calendars/events/{eventId}`
- `DELETE https://services.leadconnectorhq.com/calendars/events/{eventId}`
- `PUT https://services.leadconnectorhq.com/calendars/events/appointments/{appointmentId}`
- `GET https://services.leadconnectorhq.com/users/`
- `GET https://services.leadconnectorhq.com/contacts/`
- `GET https://services.leadconnectorhq.com/locations/{locationId}`

## Notes And Findings

- The app uses both agency-token and location-token calls depending on the feature area.
- Runtime appointment deletion goes through `DELETE /calendars/events/{eventId}`, not `DELETE /calendars/events/appointments/{appointmentId}`.
- Calendar creation code uses `POST /calendars/events/appointments` for both generic event creation and appointment creation.
- Several support endpoints are used indirectly by the calendar service to discover a valid contact, user, or location owner before creating events.
