import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { companyService } from '@/services/api';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

const StatusBadge = ({ connected }) => (
  <span
    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
      connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
    }`}
  >
    {connected ? 'Connected' : 'Not Connected'}
  </span>
);

const AdminBadge = ({ linked }) => (
  <span
    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
      linked ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
    }`}
  >
    {linked ? 'Admin Exists in GHL' : 'Admin Not Linked'}
  </span>
);

const ActionButton = ({ onClick, label, loading, disabled = false, variant = 'primary' }) => {
  const base = 'px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed';
  const styles =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : variant === 'secondary'
      ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
      : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <button type="button" onClick={onClick} disabled={disabled || loading} className={`${base} ${styles}`}>
      {loading ? 'Please wait...' : label}
    </button>
  );
};

const GhlIntegrationSection = ({ companyId }) => {
  const [statusData, setStatusData] = useState(null);
  const [tokenStorageData, setTokenStorageData] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminResult, setAdminResult] = useState(null);

  const integration = useMemo(() => statusData?.ghlIntegration || {}, [statusData]);
  const adminUser = useMemo(() => statusData?.adminUser || {}, [statusData]);
  const tokenStorage = useMemo(() => tokenStorageData?.tokenStorage || {}, [tokenStorageData]);
  const tokenStorageVerified = Boolean(
    tokenStorage.hasAccessTokenParts && tokenStorage.hasRefreshTokenParts
  );
  const adminLinked = Boolean(adminUser?.linked || adminResult?.ghlUserId);

  const loadStatus = async () => {
    if (!companyId) return;
    setLoadingStatus(true);
    try {
      const [statusResponse, tokenStorageResponse] = await Promise.all([
        companyService.getGhlStatus(companyId),
        companyService.getGhlTokenStorageStatus(companyId)
      ]);
      setStatusData(statusResponse.data?.data || null);
      setTokenStorageData(tokenStorageResponse.data?.data || null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading GHL status:', error);
      toast.error(error?.response?.data?.message || 'Failed to load GHL status');
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleConnect = async () => {
    if (!companyId) return;
    setConnectLoading(true);
    // Open a blank tab synchronously so browser treats this as direct user action.
    // Avoid noopener/noreferrer here because some browsers return a null handle
    // even when popups are allowed, which causes false "popup blocked" errors.
    const popup = window.open('about:blank', '_blank');

    try {
      const response = await companyService.getGhlConnectUrl(companyId);
      const connectUrl = response?.data?.data?.connectUrl;
      if (!connectUrl) {
        throw new Error('Connect URL was not returned');
      }
      if (popup) {
        popup.location.href = connectUrl;
        popup.focus?.();
        toast.success('GHL connect flow opened in a new tab. Complete it there, then return here.');
      } else {
        throw new Error('Popup blocked by browser');
      }
    } catch (error) {
      if (popup) popup.close();
      // eslint-disable-next-line no-console
      console.error('Error generating connect URL:', error);
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          'Failed to start GHL connect flow. Please allow popups and try again.'
      );
    } finally {
      setConnectLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!companyId) return;
    setRefreshLoading(true);
    try {
      await companyService.refreshGhlToken(companyId);
      toast.success('GHL token refreshed successfully');
      await loadStatus();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error refreshing GHL token:', error);
      toast.error(error?.response?.data?.message || 'Token refresh failed');
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleHealthCheck = async () => {
    if (!companyId) return;
    setHealthLoading(true);
    try {
      await companyService.checkGhlHealth(companyId);
      toast.success('GHL health check passed');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error running GHL health check:', error);
      toast.error(error?.response?.data?.message || 'GHL health check failed');
    } finally {
      setHealthLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!companyId) return;
    const confirmed = window.confirm('Disconnect GHL from this company? This will clear stored tokens.');
    if (!confirmed) return;

    setDisconnectLoading(true);
    try {
      await companyService.disconnectGhl(companyId);
      toast.success('GHL disconnected');
      await loadStatus();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error disconnecting GHL:', error);
      toast.error(error?.response?.data?.message || 'Failed to disconnect GHL');
    } finally {
      setDisconnectLoading(false);
    }
  };

  const handleCreateAdminUser = async () => {
    if (!companyId) return;
    setAdminLoading(true);
    try {
      const response = await companyService.createGhlAdminUser(companyId);
      const result = response?.data?.data || null;
      setAdminResult(result);
      toast.success(
        result?.action === 'created'
          ? 'GHL admin user created successfully'
          : 'GHL admin user already exists and was linked'
      );
      await loadStatus();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating GHL admin user:', error);
      toast.error(error?.response?.data?.message || 'Failed to create GHL admin user');
    } finally {
      setAdminLoading(false);
    }
  };

  React.useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  React.useEffect(() => {
    const onMessage = async (event) => {
      if (event?.data?.type !== 'GHL_OAUTH_CONNECTED') return;
      toast.success('GHL connected successfully. Status refreshed.');
      await loadStatus();
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">GoHighLevel Integration</h2>
          <p className="text-sm text-gray-600 mt-1">
            Connect your existing GHL location, then test and manage token health.
          </p>
          <p className="text-sm mt-2">
            <span className="font-medium text-gray-700">Token Storage:</span>{' '}
            <span className={tokenStorageVerified ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
              {tokenStorageVerified ? 'Verified' : 'Not Verified'}
            </span>
            {tokenStorageData ? (
              <span className="text-gray-500">
                {' '}
                ({tokenStorage.hasAccessTokenParts ? 'access:yes' : 'access:no'},{' '}
                {tokenStorage.hasRefreshTokenParts ? 'refresh:yes' : 'refresh:no'})
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge connected={Boolean(integration.connected)} />
          <AdminBadge linked={adminLinked} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-gray-500">Location ID</div>
          <div className="font-medium text-gray-900 mt-1">{integration.locationId || '—'}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-gray-500">Token Expires At</div>
          <div className="font-medium text-gray-900 mt-1">{formatDate(integration.tokenExpiresAt)}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-gray-500">Last Token Refresh</div>
          <div className="font-medium text-gray-900 mt-1">{formatDate(integration.lastTokenRefreshAt)}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-gray-500">Scope</div>
          <div className="font-medium text-gray-900 mt-1 break-all">{integration.scope || '—'}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg md:col-span-2">
          <div className="text-gray-500">GHL Admin User ID</div>
          <div className="font-medium text-gray-900 mt-1 break-all">
            {adminUser?.ghlUserId || adminResult?.ghlUserId || 'Not Linked'}
          </div>
        </div>
      </div>

      {integration.lastSyncError ? (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <div className="text-sm font-semibold text-red-700">Last Sync Error</div>
          <div className="text-sm text-red-700 mt-1">{integration.lastSyncError}</div>
          <div className="text-xs text-red-600 mt-1">At: {formatDate(integration.lastSyncErrorAt)}</div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <ActionButton onClick={handleConnect} label={integration.connected ? 'Reconnect GHL' : 'Connect GHL'} loading={connectLoading} />
        <ActionButton onClick={loadStatus} label="Reload Status" loading={loadingStatus} variant="secondary" />
        <ActionButton
          onClick={handleCreateAdminUser}
          label={adminLinked ? 'GHL Admin Already Linked' : 'Create GHL Admin User'}
          loading={adminLoading}
          disabled={!integration.connected || adminLinked}
          variant="secondary"
        />
        <ActionButton onClick={handleHealthCheck} label="Run Health Check" loading={healthLoading} disabled={!integration.connected} variant="secondary" />
        <ActionButton onClick={handleRefresh} label="Refresh Token Now" loading={refreshLoading} disabled={!integration.connected} variant="secondary" />
        <ActionButton onClick={handleDisconnect} label="Disconnect" loading={disconnectLoading} disabled={!integration.connected} variant="danger" />
      </div>

      {adminResult ? (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="text-sm font-semibold text-blue-800">Last Admin User Sync</div>
          <div className="text-sm text-blue-800 mt-1">
            Email: {adminResult.email || '—'} | Action: {adminResult.action || '—'} | Role: {adminResult.role || '—'}
          </div>
          <div className="text-xs text-blue-700 mt-1">GHL User ID: {adminResult.ghlUserId || '—'}</div>
        </div>
      ) : null}
    </div>
  );
};

export default GhlIntegrationSection;
