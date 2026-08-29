import React, { useState, useEffect } from 'react';
import { X, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { PaymentMethod, SaleInvoice } from '../../types/erp';

interface RecordPaymentModalProps {
  invoice: SaleInvoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  const { recordPayment } = useERP();

  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (invoice) {
      setAmount(invoice.amountDue);
      setMethod(invoice.paymentMethod === 'CREDIT' ? 'CASH' : invoice.paymentMethod);
      setNote('');
    }
    setError('');
  }, [invoice, isOpen]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }
    if (Number(amount) > invoice.amountDue + 0.01) {
      setError(`Payment amount cannot exceed remaining balance of $${invoice.amountDue.toFixed(2)}.`);
      return;
    }

    recordPayment(invoice.id, Number(amount), method, note);
    onClose();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Record Payment / Settlement</h3>
              <p className="text-xs text-slate-400">Apply payment to invoice {invoice.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Invoice Summary Pill */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Client:</span>
              <span className="font-semibold text-slate-900">{invoice.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice Total:</span>
              <span className="font-mono">{formatCurrency(invoice.grandTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Already Paid:</span>
              <span className="font-mono text-emerald-600 font-medium">{formatCurrency(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold">
              <span className="text-amber-800">Remaining Balance Due:</span>
              <span className="font-mono text-amber-800">{formatCurrency(invoice.amountDue)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Payment Amount ($) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              max={invoice.amountDue}
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-[var(--accent-color)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium outline-none focus:bg-white focus:border-[var(--accent-color)]"
            >
              <option value="CASH">Cash</option>
              <option value="CARD">Bank Card / POS Terminal</option>
              <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Receipt Reference / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Transaction # / Check # / Receipt reference"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              Confirm Payment Received
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
