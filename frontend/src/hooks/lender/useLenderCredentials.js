import { useCallback, useEffect, useMemo, useState } from 'react';
import CredentialService from '../../services/api/creditVendorCredential.service';

const VENDORS = [
  { key: 'advantage_credit', name: 'Advantage Credit' },
  { key: 'advantage_credit_bureau', name: 'Advantage Credit Bureau' },
  { key: 'advantage_credit_inc', name: 'Advantage Credit, Inc by Credit Interlink' },
  { key: 'advantage_plus_credit', name: 'Advantage Plus Credit' },
  { key: 'alliance_2020', name: 'Alliance 2020' },
  { key: 'american_reporting_company', name: 'American Reporting Company' },
  { key: 'birchwood_credit_services', name: 'Birchwood Credit Services' },
  { key: 'certified_credit_reporting', name: 'Certified Credit Reporting' },
  { key: 'cic_credit', name: 'CIC Credit' },
  { key: 'cisco_credit', name: 'CISCO Credit' },
  { key: 'cis_info_systems', name: 'CIS Info Systems (Xactus)' },
  { key: 'credocredit', name: 'Credco Credit' },
  { key: 'credit_info_ml', name: 'Credit Info ML (formerly A Plus)' },
  { key: 'credit_link', name: 'Credit Link' },
  { key: 'credit_plus', name: 'Credit Plus' },
  { key: 'credit_technology', name: 'Credit Technology' },
  { key: 'credit_technologies', name: 'Credit Technologies' },
  { key: 'isc_credit', name: 'ISC Credit' },
  { key: 'kcb_credit', name: 'KCB Credit' }
];


export function useLenderCredentials({ userId, companyId }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    const res = await CredentialService.listForLender(userId);
    if (res.success) setCredentials(res.data || []);
    else setError(res.error?.message || 'Failed to load credentials');
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async ({ vendorKey, username, password }) => {
    if (!userId) return { success: false };
    setSaving(true);
    const vendor = VENDORS.find(v => v.key === vendorKey);
    const res = await CredentialService.create({
      ownerType: 'User',
      ownerId: userId,
      vendorKey,
      vendorName: vendor?.name || vendorKey,
      username,
      password
    });
    setSaving(false);
    if (res.success) await load();
    return res;
  }, [userId, load]);

  const update = useCallback(async (id, { vendorKey, username, password }) => {
    setSaving(true);
    const vendor = vendorKey ? VENDORS.find(v => v.key === vendorKey) : null;
    const payload = {
      vendorKey,
      vendorName: vendor ? vendor.name : undefined,
      username,
      password
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

  const vendors = useMemo(() => VENDORS, []);

  return { credentials, vendors, loading, saving, error, create, update, remove, reload: load };
}


