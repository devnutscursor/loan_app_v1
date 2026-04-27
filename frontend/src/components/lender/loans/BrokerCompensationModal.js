import React, { useEffect, useMemo, useState } from 'react';
import { X, Info } from 'lucide-react';
import {
  COMP_INITIAL,
  FIXED_BORROWER_SECTION_A_FEE_PCT,
  validateCompensation,
} from '../../../utils/compensationRouting';

/**
 * Broker Compensation — LO edits the **thin / LPC %** only (e.g. 1.250%).
 * Borrower Section A fee is fixed at 0.750% per product policy (not editable).
 */
const BrokerCompensationModal = ({ isOpen, loanAmount, initialValue, onCancel, onApply }) => {
  const [comp, setComp] = useState({ ...COMP_INITIAL, ...(initialValue || {}) });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setComp({
        ...COMP_INITIAL,
        ...(initialValue || {}),
        borrowerPaidFeePct: FIXED_BORROWER_SECTION_A_FEE_PCT,
        bpcEqualsLpc: false,
      });
      setTouched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const validation = useMemo(
    () =>
      validateCompensation({
        ...comp,
        borrowerPaidFeePct: FIXED_BORROWER_SECTION_A_FEE_PCT,
      }),
    [comp]
  );
  const errors = touched ? validation.errors : {};

  const dollar = (pct) => {
    const la = Number(loanAmount) || 0;
    const p = Number(pct) || 0;
    return (la * p) / 100;
  };

  const fmtDollar = (v) => {
    const n = Number(v) || 0;
    return n.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const setLenderPaidPct = (raw) => {
    setComp((prev) => {
      const next = raw === '' ? '' : raw;
      const npct = next === '' ? '' : Number(next);
      return { ...prev, lenderPaidDefaultPct: next === '' ? '' : npct };
    });
  };

  const handleReset = () => {
    setComp({ ...COMP_INITIAL });
    setTouched(false);
  };

  const handleApply = () => {
    setTouched(true);
    if (!validation.ok) return;
    const normalized = {
      lenderPaidDefaultPct: Number(Number(comp.lenderPaidDefaultPct || 0).toFixed(3)),
      borrowerPaidFeePct: FIXED_BORROWER_SECTION_A_FEE_PCT,
      lenderPaidDefaultAmt: Number(dollar(comp.lenderPaidDefaultPct).toFixed(2)),
      bpcEqualsLpc: false,
      updatedAt: new Date().toISOString(),
    };
    onApply(normalized);
  };

  if (!isOpen) return null;

  const fieldCls =
    'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white';
  const labelCls =
    'block text-[10px] uppercase font-semibold text-gray-500 mb-1 tracking-wide';

  const sectionAFeeDollar = dollar(FIXED_BORROWER_SECTION_A_FEE_PCT);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gradient-to-b from-blue-50 to-blue-100">
          <h2 className="text-sm font-semibold text-gray-900">Broker Compensation</h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pt-3">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-[12px] text-amber-900">
            <Info className="h-4 w-4 mt-[1px] flex-shrink-0 text-amber-600" />
            <div>
              <span className="font-semibold">Note:</span> Adjust the broker thin percentage (LPC
              plan). Borrower Section A fee is fixed at {FIXED_BORROWER_SECTION_A_FEE_PCT.toFixed(3)}
              % of loan and is added as a Prepaid Finance Charge when Comp Payer is Borrower Paid.
            </div>
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Thin / LPC (%)</label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min={0}
                max={10}
                value={comp.lenderPaidDefaultPct}
                onChange={(e) => setLenderPaidPct(e.target.value)}
                className={`${fieldCls} pr-7`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                %
              </span>
            </div>
            {errors.lenderPaidDefaultPct && (
              <div className="text-[11px] text-red-600 mt-1">{errors.lenderPaidDefaultPct}</div>
            )}
            <div className="text-[11px] text-gray-500 mt-1">
              {fmtDollar(dollar(comp.lenderPaidDefaultPct))} of loan amount
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Amount
              <span className="ml-1 text-gray-400 normal-case font-normal">(auto)</span>
            </label>
            <input
              type="text"
              readOnly
              value={fmtDollar(dollar(comp.lenderPaidDefaultPct))}
              className={`${fieldCls} bg-gray-50 cursor-default`}
            />
            <div className="text-[11px] text-gray-500 mt-1">Derived from loan amount × thin %.</div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-[12px] text-gray-700">
            <div className="font-semibold text-gray-800 mb-0.5">Borrower Section A fee (fixed)</div>
            <div className="tabular-nums">
              {FIXED_BORROWER_SECTION_A_FEE_PCT.toFixed(3)}% → {fmtDollar(sectionAFeeDollar)} — PFC
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-t border-gray-200">
          <button
            type="button"
            onClick={handleReset}
            className="h-9 px-3 rounded-md border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Reset to Default
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-4 rounded-md border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={touched && !validation.ok}
            className="h-9 px-4 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrokerCompensationModal;
