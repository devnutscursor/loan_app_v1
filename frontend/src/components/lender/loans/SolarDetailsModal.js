import React, { useEffect, useMemo, useState } from 'react';
import { X, AlertTriangle, Sun, Info } from 'lucide-react';
import {
  PACE_PAYOFF_OPTIONS,
  SOLAR_INITIAL,
  validateSolarDetails,
} from '../../../utils/solarRouting';

/**
 * SolarDetailsModal — Captures PACE/HERO lien status + Solar Lease details.
 *
 * Props:
 *   isOpen       boolean
 *   initialValue object (SOLAR_INITIAL shape)
 *   onCancel()   void — close without saving (caller decides whether to uncheck Solar).
 *   onSubmit(solar) — persist and close; hasSolar is forced true here.
 */
const SolarDetailsModal = ({ isOpen, initialValue, onCancel, onSubmit }) => {
  const [solar, setSolar] = useState({ ...SOLAR_INITIAL, ...(initialValue || {}) });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSolar({ ...SOLAR_INITIAL, ...(initialValue || {}) });
      setTouched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const validation = useMemo(() => validateSolarDetails(solar), [solar]);

  if (!isOpen) return null;

  const set = (patch) => setSolar((prev) => ({ ...prev, ...patch }));

  const handleContinue = () => {
    setTouched(true);
    if (!validation.ok) return;
    onSubmit({
      ...solar,
      hasSolar: true,
      paceLienBalance: solar.hasPaceLien ? Number(solar.paceLienBalance) || 0 : 0,
      monthlyLeasePayment:
        solar.hasLease && solar.leaseAssumed ? Number(solar.monthlyLeasePayment) || 0 : 0,
    });
  };

  const errors = touched ? validation.errors : {};

  // ───────── styled primitives (match the project's Tailwind system) ─────────
  const panelCls =
    'bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm';
  const warnPanelCls =
    'bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3';
  const panelTitleCls = 'text-sm font-bold text-gray-900';
  const helperBoxCls =
    'mt-3 border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-[11px] text-gray-600 leading-snug';
  const helperTitleCls = 'text-xs font-semibold text-gray-800 mb-1';
  const amountInputCls =
    'w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white';

  const ToggleYesNo = ({ name, value, onChange, disabled = false }) => (
    <div className="flex items-center gap-4">
      {[
        { v: true, label: 'Yes' },
        { v: false, label: 'No' },
      ].map((opt) => {
        const active = value === opt.v;
        return (
          <label
            key={String(opt.v)}
            className={`flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name={name}
              checked={active}
              disabled={disabled}
              onChange={() => onChange(opt.v)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={`relative inline-block w-10 h-5 rounded-full transition-colors ${
                active ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  active ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </span>
            <span className="text-xs font-medium text-gray-800">{opt.label}</span>
          </label>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gradient-to-b from-blue-50 to-blue-100">
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-900">
              Solar Panel (PACE/Lease) Details
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto">
          {/* ────────── PACE / HERO LIEN CHECK ────────── */}
          <section className={warnPanelCls}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-900">PACE Lien Check</h3>
            </div>
            <p className="text-xs text-gray-800 mb-3 leading-relaxed">
              Is there an existing PACE/HERO Lien (Property Assessed Clean Energy)
              attached to this property tax bill?{' '}
              <strong>
                If Yes, Agency (FNMA/FHLMC) requirements state it must be paid off for
                eligibility.
              </strong>
            </p>
            <ToggleYesNo
              name="hasPaceLien"
              value={!!solar.hasPaceLien}
              onChange={(v) =>
                set({
                  hasPaceLien: v,
                  ...(v ? {} : { pacePayoff: '', paceLienBalance: '' }),
                })
              }
            />
          </section>

          {/* PACE Payoff details (only when hasPaceLien) */}
          {solar.hasPaceLien && (
            <section className={panelCls}>
              <h3 className={panelTitleCls}>PACE/HERO Payoff Details</h3>
              <p className="text-xs text-gray-700 mt-1 mb-3">
                Will this lien be paid off at or before closing?
              </p>
              <div className="space-y-2 mb-3">
                {PACE_PAYOFF_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="pacePayoff"
                      checked={solar.pacePayoff === opt.value}
                      onChange={() => set({ pacePayoff: opt.value })}
                      className="h-3.5 w-3.5 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-800">{opt.label}</span>
                  </label>
                ))}
              </div>
              {errors.pacePayoff && (
                <div className="text-[11px] text-red-600 mb-2">{errors.pacePayoff}</div>
              )}

              <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1 tracking-wide">
                PACE Lien Balance ($)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={solar.paceLienBalance}
                onChange={(e) => set({ paceLienBalance: e.target.value })}
                placeholder="Enter PACE lien balance (e.g. 25000)"
                className={amountInputCls}
              />
              {errors.paceLienBalance && (
                <div className="text-[11px] text-red-600 mt-1">{errors.paceLienBalance}</div>
              )}

              <div className={helperBoxCls}>
                <div className={helperTitleCls}>Agency / Government overlays</div>
                <p>
                  FNMA/FHLMC generally require payoff of first-lien PACE obligations
                  because a super-priority PACE assessment can make the loan ineligible
                  for purchase or refinance.
                </p>
              </div>
            </section>
          )}

          {/* ────────── SOLAR LEASE INFORMATION ────────── */}
          <section className={panelCls}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={panelTitleCls}>Solar Lease Information</h3>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-800">Are the solar panels leased?</span>
              <ToggleYesNo
                name="hasLease"
                value={!!solar.hasLease}
                onChange={(v) =>
                  set({
                    hasLease: v,
                    ...(v ? {} : { leaseAssumed: false, monthlyLeasePayment: '' }),
                  })
                }
              />
            </div>

            {solar.hasLease && (
              <div className="ml-3 pl-3 border-l-2 border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-800">
                    Will this Lease be Assumed by the Buyer?
                  </span>
                  <ToggleYesNo
                    name="leaseAssumed"
                    value={!!solar.leaseAssumed}
                    onChange={(v) =>
                      set({
                        leaseAssumed: v,
                        ...(v ? {} : { monthlyLeasePayment: '' }),
                      })
                    }
                  />
                </div>

                {solar.leaseAssumed && (
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1 tracking-wide">
                      Current Monthly Lease Payment ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={solar.monthlyLeasePayment}
                      onChange={(e) => set({ monthlyLeasePayment: e.target.value })}
                      placeholder="e.g. 215"
                      className={amountInputCls}
                    />
                    {errors.monthlyLeasePayment && (
                      <div className="text-[11px] text-red-600 mt-1">
                        {errors.monthlyLeasePayment}
                      </div>
                    )}
                    <p className="mt-1 text-[11px] text-gray-500">
                      This amount will be added to the borrower's monthly debts in the
                      DTI calculation.
                    </p>
                  </div>
                )}

                {!solar.leaseAssumed && (
                  <div className="flex items-start gap-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                    <Info className="h-3.5 w-3.5 mt-[1px] flex-shrink-0" />
                    <div>
                      Seller must terminate or move the solar panels; verify via
                      contract.
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={helperBoxCls}>
              <div className={helperTitleCls}>Loan program notes</div>
              <p>
                For VA/FHA scenarios, review lien-priority overlays, title exceptions,
                and any separate PACE/HERO financing that may affect first-lien
                position.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-10 rounded-md border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={touched && !validation.ok}
            className="flex-1 h-10 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Continue to Pricing
          </button>
        </div>
      </div>
    </div>
  );
};

export default SolarDetailsModal;
