import { useCallback, useEffect, useMemo, useState } from 'react';
import CredentialService from '../../services/api/creditVendorCredential.service';


export function useLenderCredentials({ userId, companyId, role }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!userId || role !== 'lender') return;
    setLoading(true);
    setError(null);
    const res = await CredentialService.listForLender(userId);
    if (res.success) setCredentials(res.data || []);
    else setError(res.error?.message || 'Failed to load credentials');
    setLoading(false);
  }, [userId, role]);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async ({ vendorKey, username, password, credentialType, smartApiUrl, creditApiUrl, mclInterface, mlcId, vendorName }) => {
    if (!userId) return { success: false };
    setSaving(true);
    const res = await CredentialService.create({
      ownerType: 'User',
      ownerId: userId,
      vendorKey,
      vendorName,
      username,
      password,
      credentialType,
      smartApiUrl,
      creditApiUrl,
      mclInterface,
      mlcId
    });
    setSaving(false);
    if (res.success) await load();
    return res;
  }, [userId, load]);

  const update = useCallback(async (id, data) => {
    console.log('UPDATE FUNCTION CALLED'); 
    console.log('CREDENTIAL TYPE', data.credentialType);
    const { vendorKey, username, password, credentialType } = data || {};
    setSaving(true);
    const payload = {
      vendorKey,
      username,
      password,
      credentialType
    };
    const res = await CredentialService.update(id, payload);
    setSaving(false);
    if (res.success) await load();
    return res;
  }, [load]);

  const remove = useCallback(async (id) => {
    setSaving(true);
    const res = await CredentialService.remove(id);
    setSaving(false);
    if (res.success) await load();
    return res;
  }, [load]);

  return { credentials, loading, saving, error, create, update, remove, reload: load };
}


