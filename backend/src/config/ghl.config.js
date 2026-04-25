const DEFAULT_GHL_BASE_URL = 'https://services.leadconnectorhq.com';
const DEFAULT_GHL_MARKETPLACE_URL = 'https://marketplace.gohighlevel.com';
const DEFAULT_GHL_VERSION = '2021-07-28';
const DEFAULT_GHL_OAUTH_SCOPES = [
  'calendars.readonly',
  'calendars.write',
  'calendars/events.readonly',
  'calendars/events.write',
  'calendars/groups.readonly',
  'calendars/groups.write',
  'calendars/resources.readonly',
  'calendars/resources.write',
  'campaigns.readonly',
  'conversations.write',
  'conversations/message.write',
  'conversations.readonly',
  'conversations/message.readonly',
  'conversations/reports.readonly',
  'conversations/livechat.write',
  'contacts.readonly',
  'contacts.write',
  'objects/schema.readonly',
  'objects/schema.write',
  'objects/record.readonly',
  'objects/record.write',
  'associations.write',
  'associations.readonly',
  'associations/relation.readonly',
  'associations/relation.write',
  'courses.write',
  'courses.readonly',
  'forms.readonly',
  'forms.write',
  'invoices.readonly',
  'invoices.write',
  'locations.readonly',
  'locations/customValues.readonly',
  'locations/customValues.write',
  'locations/customFields.write',
  'locations/customFields.readonly',
  'locations/tasks.readonly',
  'locations/tasks.write',
  'recurring-tasks.readonly',
  'recurring-tasks.write',
  'locations/tags.readonly',
  'locations/tags.write',
  'locations/templates.readonly',
  'oauth.write',
  'oauth.readonly',
  'opportunities.readonly',
  'opportunities.write',
  'users.readonly',
  'documents_contracts/list.readonly',
  'documents_contracts/sendLink.write',
  'documents_contracts_template/sendLink.write',
  'documents_contracts_template/list.readonly',
  'users.write'
].join(' ');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getGhlConfig() {
  const oauthScopes = process.env.GHL_OAUTH_SCOPES || DEFAULT_GHL_OAUTH_SCOPES;

  return {
    baseUrl: process.env.GHL_BASE_URL || DEFAULT_GHL_BASE_URL,
    marketplaceUrl: process.env.GHL_MARKETPLACE_URL || DEFAULT_GHL_MARKETPLACE_URL,
    version: process.env.GHL_API_VERSION || DEFAULT_GHL_VERSION,
    oauthRedirectUri: requireEnv('GHL_OAUTH_REDIRECT_URI'),
    locationClientId: requireEnv('LOCATION_CLIENT_ID'),
    locationClientSecret: requireEnv('LOCATION_CLIENT_SECRET'),
    oauthScopes,
    tokenRefreshIntervalMs: 4 * 60 * 60 * 1000, // 4 hours
    oauthStateSecret: process.env.GHL_OAUTH_STATE_SECRET || process.env.LOCATION_CLIENT_SECRET
  };
}

module.exports = {
  getGhlConfig
};
