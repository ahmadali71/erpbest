import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { X, Plus, Trash2, ShoppingBag, Calendar, Truck } from 'lucide-react';

interface NewPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface POLineItem {
  productId: string;
  quantity: number;
  unitCost: number;
}

export const NewPurchaseOrderModal: React.FC<NewPurchaseOrderModalProps> = ({ isOpen, onClose }) => {
  const { products, suppliers, createPurchaseOrder } = useERP();

  const [supplierId, setSupplierId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<POLineItem[]>([
    { productId: products[0]?.id || '', quantity: 10, unitCost: products[0]?.purchasePrice || 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const defaultProd = products[0];
    setItems(prev => [
      ...prev,
      {
        productId: defaultProd ? defaultProd.id : '',
        quantity: 10,
        unitCost: defaultProd ? defaultProd.purchasePrice : 0,
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
              unitCost: prod ? prod.purchasePrice : item.unitCost,
            }
          : item
      )
    );
  };

  const handleItemChange = (index: number, field: keyof POLineItem, value: number) => {
    setItems(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const totalCost = items.reduce((acc, i) => acc + i.quantity * i.unitCost, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.length === 0) {
      alert('Please select a supplier and add at least one line item.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPurchaseOrder({
        supplierId,
        items,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      alert(`Failed to create purchase order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[var(--accent-color)]" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              Create New Purchase Order (PO)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Supplier & Delivery Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Select Vendor / Supplier <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] bg-white"
              >
                <option value="">Choose Supplier...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.company ? `(${s.company})` : ''} - Terms: {s.paymentTerms || 'Net 30'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={e => setExpectedDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] bg-white"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Order Line Items
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-semibold text-[var(--accent-color)] hover:text-[var(--accent-color-dark)]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <div className="flex-1">
                    <select
                      value={item.productId}
                      onChange={e => handleProductChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stockQuantity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-center"
                      />
                    </div>

                    <div className="w-24">
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Cost"
                          value={item.unitCost}
                          onChange={e => handleItemChange(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                          className="w-full pl-5 pr-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-right"
                        />
                      </div>
                    </div>

                    <div className="w-24 text-right font-bold text-xs text-slate-800">
                      ${(item.quantity * item.unitCost).toFixed(2)}
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes & Summary */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Procurement Notes / Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Standard sea freight container #88. Deliver to Dallas Receiving Bay 3."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)]"
            />
          </div>

          {/* Total Bar */}
          <div className="p-3 bg-[var(--accent-color-light)]/70 border border-[var(--accent-color-light)] rounded-xl flex items-center justify-between">
            <span className="font-semibold text-slate-700">Estimated Total Order Value:</span>
            <span className="text-xl font-bold text-[var(--accent-color-dark)]">${totalCost.toFixed(2)}</span>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-dark)] text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating PO...' : 'Issue Purchase Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
