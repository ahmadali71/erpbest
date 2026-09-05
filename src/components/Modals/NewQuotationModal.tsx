import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { X, Plus, Trash2, FileText, Calendar, Sparkles } from 'lucide-react';

interface NewQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuoteLineItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
}

export const NewQuotationModal: React.FC<NewQuotationModalProps> = ({ isOpen, onClose }) => {
  const { products, clients, createQuotation } = useERP();

  const [clientId, setClientId] = useState('');
  const [taxRate, setTaxRate] = useState<number>(0);
  const [validDays, setValidDays] = useState<number>(15);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<QuoteLineItem[]>([
    {
      productId: products[0]?.id || '',
      quantity: 1,
      unitPrice: products[0]?.sellingPrice || 0,
      discountPercentage: 0,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const defaultProd = products[0];
    setItems(prev => [
      ...prev,
      {
        productId: defaultProd ? defaultProd.id : '',
        quantity: 1,
        unitPrice: defaultProd ? defaultProd.sellingPrice : 0,
        discountPercentage: 0,
      },
    ]);
  };

  const handleProductChange = (index: number, newProductId: string) => {
    const prod = products.find(p => p.id === newProductId);
    setItems(prev =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              productId: newProductId,
              unitPrice: prod ? prod.sellingPrice : item.unitPrice,
            }
          : item
      )
    );
  };

  const handleItemChange = (
    index: number,
    field: keyof QuoteLineItem,
    value: number
  ) => {
    setItems(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => {
    const itemTotal = item.quantity * item.unitPrice * (1 - item.discountPercentage / 100);
    return acc + itemTotal;
  }, 0);

  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert('Please select a client for this quotation.');
      return;
    }

    if (items.length === 0 || items.some(it => !it.productId || it.quantity <= 0)) {
      alert('Please select valid products with quantities greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + Number(validDays));

      await createQuotation({
        clientId,
        items: items.map(it => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discountPercentage: it.discountPercentage,
        })),
        taxRate,
        validUntil: validUntilDate.toISOString(),
        notes,
      });

      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to create quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Create New Quotation / Estimate</h2>
              <p className="text-xs text-slate-500">
                Generate professional price estimates with real-time conversion to sales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Top Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Client *
              </label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value="">Select a Client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Validity (Days)
              </label>
              <select
                value={validDays}
                onChange={e => setValidDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value={7}>7 Days</option>
                <option value={15}>15 Days</option>
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={taxRate}
                onChange={e => setTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Quote Line Items
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {items.map((item, idx) => {
                const lineTotal = item.quantity * item.unitPrice * (1 - item.discountPercentage / 100);
                return (
                  <div key={idx} className="p-3 bg-white flex flex-wrap sm:flex-nowrap items-center gap-3">
                    <div className="flex-1 min-w-[180px]">
                      <select
                        value={item.productId}
                        onChange={e => handleProductChange(idx, e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) - Stock: {p.stockQuantity}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>

                    <div className="w-28">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={e => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full pl-6 pr-2.5 py-1.5 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                    </div>

                    <div className="w-20">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Disc%"
                          value={item.discountPercentage}
                          onChange={e => handleItemChange(idx, 'discountPercentage', Number(e.target.value))}
                          className="w-full pr-5 pl-2 py-1.5 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                      </div>
                    </div>

                    <div className="w-24 text-right font-bold text-sm text-slate-800">
                      ${lineTotal.toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes & Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Terms / Notes
              </label>
              <textarea
                rows={3}
                placeholder="Include quotation terms, estimated turnaround, or delivery clauses..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tax ({taxRate}%):</span>
                  <span className="font-semibold text-slate-900">${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
                <span>Estimated Total:</span>
                <span className="text-violet-700">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-violet-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Generating...' : 'Save & Issue Quotation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
