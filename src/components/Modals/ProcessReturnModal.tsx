import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Package,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  Search,
  Sparkles,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { SaleInvoice, ReturnItem } from '../../types/erp';

interface ProcessReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInvoiceId?: string;
}

export const ProcessReturnModal: React.FC<ProcessReturnModalProps> = ({
  isOpen,
  onClose,
  initialInvoiceId,
}) => {
  const { sales, products, processReturn, formatCurrency, settings } = useERP();

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(initialInvoiceId || '');
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState<string>('');
  const [returnItems, setReturnItems] = useState<
    Array<{
      productId: string;
      productName: string;
      sku: string;
      maxQuantity: number;
      unitPrice: number;
      returnQuantity: number;
      reason: 'DEFECTIVE' | 'WRONG_ITEM' | 'CUSTOMER_CHANGE_OF_MIND' | 'DAMAGED' | 'OTHER';
      restockItem: boolean;
    }>
  >([]);
  const [restockingFee, setRestockingFee] = useState<number>(0);
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'CARD' | 'STORE_CREDIT' | 'BANK_TRANSFER'>('CASH');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initialInvoiceId when opened
  useEffect(() => {
    if (initialInvoiceId) {
      setSelectedInvoiceId(initialInvoiceId);
    }
  }, [initialInvoiceId, isOpen]);

  // When selectedInvoiceId changes, populate returnItems
  useEffect(() => {
    if (!selectedInvoiceId) {
      setReturnItems([]);
      return;
    }
    const inv = sales.find(s => s.id === selectedInvoiceId);
    if (!inv) {
      setReturnItems([]);
      return;
    }

    const items = inv.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      maxQuantity: item.quantity,
      unitPrice: item.unitSellingPrice,
      returnQuantity: 0,
      reason: 'CUSTOMER_CHANGE_OF_MIND' as const,
      restockItem: true,
    }));
    setReturnItems(items);
    setRestockingFee(0);
    setErrorMessage(null);
  }, [selectedInvoiceId, sales]);

  const selectedInvoice = useMemo(() => {
    return sales.find(s => s.id === selectedInvoiceId) || null;
  }, [sales, selectedInvoiceId]);

  const filteredInvoices = useMemo(() => {
    if (!invoiceSearchQuery.trim()) return sales.slice(0, 15);
    const q = invoiceSearchQuery.toLowerCase();
    return sales.filter(
      s =>
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.clientName.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [sales, invoiceSearchQuery]);

  // Calculations
  const calculatedItemsTotal = useMemo(() => {
    return returnItems.reduce((acc, item) => acc + item.returnQuantity * item.unitPrice, 0);
  }, [returnItems]);

  const netRefundAmount = useMemo(() => {
    return Math.max(0, calculatedItemsTotal - (Number(restockingFee) || 0));
  }, [calculatedItemsTotal, restockingFee]);

  const totalItemsToReturn = useMemo(() => {
    return returnItems.reduce((acc, item) => acc + item.returnQuantity, 0);
  }, [returnItems]);

  if (!isOpen) return null;

  const handleQuantityChange = (index: number, val: number) => {
    setReturnItems(prev => {
      const copy = [...prev];
      const max = copy[index].maxQuantity;
      copy[index].returnQuantity = Math.max(0, Math.min(max, val));
      return copy;
    });
  };

  const handleReasonChange = (
    index: number,
    reason: 'DEFECTIVE' | 'WRONG_ITEM' | 'CUSTOMER_CHANGE_OF_MIND' | 'DAMAGED' | 'OTHER'
  ) => {
    setReturnItems(prev => {
      const copy = [...prev];
      copy[index].reason = reason;
      // Auto toggle restock to false if damaged/defective
      if (reason === 'DAMAGED' || reason === 'DEFECTIVE') {
        copy[index].restockItem = false;
      }
      return copy;
    });
  };

  const handleRestockToggle = (index: number, restock: boolean) => {
    setReturnItems(prev => {
      const copy = [...prev];
      copy[index].restockItem = restock;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) {
      setErrorMessage('Please select a valid invoice to return against.');
      return;
    }

    const activeReturns = returnItems.filter(item => item.returnQuantity > 0);
    if (activeReturns.length === 0) {
      setErrorMessage('Please select at least 1 item with quantity greater than 0 to return.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await processReturn({
        invoiceId: selectedInvoice.id,
        items: activeReturns.map(i => ({
          productId: i.productId,
          quantity: i.returnQuantity,
          reason: i.reason,
          restockItem: i.restockItem,
        })),
        restockingFee: Number(restockingFee) || 0,
        refundMethod,
        notes: notes.trim() || undefined,
      });

      if (result) {
        onClose();
      } else {
        setErrorMessage('Failed to process return. Please check item quantities and try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while processing the return.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Process Sale Return & Refund</h2>
              <p className="text-xs text-slate-500">
                Issue refund, adjust inventory restock, and balance client ledger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Invoice Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Select Original Invoice
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search invoice number or client name..."
                  value={invoiceSearchQuery}
                  onChange={e => setInvoiceSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <select
                value={selectedInvoiceId}
                onChange={e => setSelectedInvoiceId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="">-- Choose Invoice to Return Items From --</option>
                {filteredInvoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} • {inv.clientName} ({formatCurrency(inv.grandTotal)})
                  </option>
                ))}
              </select>
            </div>

            {selectedInvoice && (
              <div className="mt-2.5 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{selectedInvoice.clientName}</span>
                  <span className="text-slate-500 ml-2 font-mono">Invoice #{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Date: {selectedInvoice.date.split('T')[0]}</span>
                  <span className="font-bold text-indigo-700 ml-3">Total: {formatCurrency(selectedInvoice.grandTotal)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Line Items selection */}
          {selectedInvoice && returnItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Select Items & Quantities to Return
                </label>
                <span className="text-[11px] font-medium text-slate-500">
                  {totalItemsToReturn} item(s) selected
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 text-[10px] font-extrabold uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3 text-center">Purchased</th>
                      <th className="p-3 text-center">Return Qty</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3 text-center">Restock?</th>
                      <th className="p-3 text-right">Refund Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {returnItems.map((item, idx) => {
                      const itemSubtotal = item.returnQuantity * item.unitPrice;
                      const isSelected = item.returnQuantity > 0;
                      return (
                        <tr
                          key={item.productId}
                          className={`transition-colors ${
                            isSelected ? 'bg-rose-50/40 font-medium' : 'hover:bg-slate-50/50'
                          }`}
                        >
                          <td className="p-3">
                            <div className="font-semibold text-slate-900">{item.productName}</div>
                            <div className="text-[11px] font-mono text-slate-400">{item.sku}</div>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-500">{item.maxQuantity}</td>
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max={item.maxQuantity}
                                value={item.returnQuantity}
                                onChange={e => handleQuantityChange(idx, parseInt(e.target.value) || 0)}
                                className="w-16 text-center py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                              />
                            </div>
                          </td>
                          <td className="p-3">
                            <select
                              disabled={item.returnQuantity === 0}
                              value={item.reason}
                              onChange={e => handleReasonChange(idx, e.target.value as any)}
                              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-800 disabled:opacity-50"
                            >
                              <option value="CUSTOMER_CHANGE_OF_MIND">Change of Mind</option>
                              <option value="DEFECTIVE">Defective / Malfunction</option>
                              <option value="WRONG_ITEM">Wrong Item Sent</option>
                              <option value="DAMAGED">Damaged in Transit</option>
                              <option value="OTHER">Other Reason</option>
                            </select>
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              disabled={item.returnQuantity === 0}
                              checked={item.restockItem}
                              onChange={e => handleRestockToggle(idx, e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-40"
                              title="Restock back to active inventory count"
                            />
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(itemSubtotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Refund Details & Fees */}
          {selectedInvoice && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Refund Payout Method
                  </label>
                  <select
                    value={refundMethod}
                    onChange={e => setRefundMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="CASH">Cash Refund</option>
                    <option value="CARD">Credit / Debit Card Reversal</option>
                    <option value="STORE_CREDIT">Store Credit (Client Balance Credit)</option>
                    <option value="BANK_TRANSFER">Bank Wire / Electronic Transfer</option>
                  </select>
                  {refundMethod === 'STORE_CREDIT' && (
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                      ✓ Will automatically reduce client outstanding debt or add to credit balance.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Return Notes / Reason Remarks
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Customer statement or inspection findings..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Items Total Value:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(calculatedItemsTotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Restocking Fee / Deduction:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-mono">-</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={restockingFee}
                        onChange={e => setRestockingFee(parseFloat(e.target.value) || 0)}
                        className="w-20 text-right px-2 py-0.5 bg-white border border-slate-200 rounded-md font-mono text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                    <span>Net Refund Payout:</span>
                    <span className="font-mono text-rose-600 text-base">
                      {formatCurrency(netRefundAmount)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>Inventory movements will be logged automatically.</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedInvoice || totalItemsToReturn === 0}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing...' : `Confirm Return (${formatCurrency(netRefundAmount)})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
