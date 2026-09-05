import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Percent,
  Check,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { PaymentMethod } from '../../types/erp';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClientId?: string;
  onOpenAddClient: () => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({
  isOpen,
  onClose,
  initialClientId,
  onOpenAddClient,
}) => {
  const { clients, products, createSale } = useERP();

  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialClientId || (clients[0]?.id ?? '')
  );
  const [items, setItems] = useState<
    Array<{
      productId: string;
      quantity: number;
      unitSellingPrice?: number;
      discountPercentage: number;
    }>
  >([
    {
      productId: products[0]?.id || '',
      quantity: 1,
      unitSellingPrice: products[0]?.sellingPrice,
      discountPercentage: 0,
    },
  ]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [initialAmountPaid, setInitialAmountPaid] = useState<string>('');
  const [taxRate, setTaxRate] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleAddItem = () => {
    const availableProd = products.find(p => !items.some(i => i.productId === p.id)) || products[0];
    if (!availableProd) return;
    setItems([
      ...items,
      {
        productId: availableProd.id,
        quantity: 1,
        unitSellingPrice: availableProd.sellingPrice,
        discountPercentage: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      updated[index] = {
        ...updated[index],
        productId: value,
        unitSellingPrice: prod?.sellingPrice ?? updated[index].unitSellingPrice,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setItems(updated);
  };

  // Calculations
  let subtotal = 0;
  let totalCost = 0;
  let totalDiscount = 0;

  items.forEach(item => {
    const prod = products.find(p => p.id === item.productId);
    if (prod) {
      const price = item.unitSellingPrice ?? prod.sellingPrice;
      const qty = item.quantity;
      const disc = (price * (item.discountPercentage / 100)) * qty;
      subtotal += price * qty;
      totalDiscount += disc;
      totalCost += prod.purchasePrice * qty;
    }
  });

  const taxableAmount = subtotal - totalDiscount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;
  const estimatedProfit = Math.round((taxableAmount - totalCost) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedClientId) {
      setError('Please select or create a client.');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one product item.');
      return;
    }

    // Check stock availability
    for (const item of items) {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) {
        setError(`Selected product does not exist.`);
        return;
      }
      if (item.quantity > prod.stockQuantity) {
        setError(`Insufficient stock for "${prod.name}". Available: ${prod.stockQuantity} ${prod.unit}`);
        return;
      }
    }

    const paidNum = initialAmountPaid === ''
      ? (paymentMethod === 'CASH' || paymentMethod === 'CARD' ? grandTotal : 0)
      : parseFloat(initialAmountPaid);

    const result = await createSale({
      clientId: selectedClientId,
      items: items.map(i => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        unitSellingPrice: Number(i.unitSellingPrice),
        discountPercentage: Number(i.discountPercentage),
      })),
      paymentMethod,
      initialAmountPaid: isNaN(paidNum) ? 0 : paidNum,
      taxRate: Number(taxRate),
      notes,
      dueDate,
    });

    if (result) {
      onClose();
    } else {
      setError('Failed to create sale invoice.');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--accent-color)] rounded-lg flex items-center justify-center text-white">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Create New Sales Invoice / Order</h3>
              <p className="text-xs text-slate-400">Automatic inventory deduction and instant profit calculation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Client Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Client / Customer <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium outline-none focus:bg-white focus:border-[var(--accent-color)]"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''} — Due: ${c.outstandingBalance}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={onOpenAddClient}
                  className="px-2.5 py-2 bg-[var(--accent-color-light)] hover:bg-[var(--accent-color-light)] text-[var(--accent-color-dark)] rounded-lg text-xs font-semibold whitespace-nowrap"
                  title="Add new client"
                >
                  + Client
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium outline-none focus:bg-white focus:border-[var(--accent-color)]"
              >
                <option value="CASH">Cash Payment (Immediate settlement)</option>
                <option value="CARD">Bank Card / POS</option>
                <option value="BANK_TRANSFER">Bank Transfer / Wire</option>
                <option value="CREDIT">On Credit (Accounts Receivable)</option>
              </select>
            </div>
          </div>

          {/* Line Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Product Items <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-[var(--accent-color)] font-semibold hover:text-[var(--accent-color-dark)] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Line Item</span>
              </button>
            </div>

            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              {items.map((item, idx) => {
                const prod = products.find(p => p.id === item.productId);
                const lineTotal = ((item.unitSellingPrice ?? 0) * (1 - item.discountPercentage / 100)) * item.quantity;
                const isOutOfStock = prod && prod.stockQuantity < item.quantity;

                return (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-3 rounded-lg border border-slate-200 shadow-2xs"
                  >
                    {/* Product Dropdown */}
                    <div className="sm:col-span-4">
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 font-medium outline-none"
                        required
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.stockQuantity} in stock)
                          </option>
                        ))}
                      </select>
                      {prod && (
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                          <span>Cost: ${prod.purchasePrice}</span>
                          <span className={isOutOfStock ? 'text-red-600 font-bold' : 'text-slate-500'}>
                            Avail: {prod.stockQuantity} {prod.unit}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Unit Price */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase">Price ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitSellingPrice ?? ''}
                        onChange={(e) => handleItemChange(idx, 'unitSellingPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono font-medium"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className={`w-full px-2 py-1 bg-slate-50 border rounded-md text-xs font-mono font-bold ${
                          isOutOfStock ? 'border-red-400 text-red-700 bg-red-50' : 'border-slate-200'
                        }`}
                      />
                    </div>

                    {/* Discount % */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase">Disc %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discountPercentage}
                        onChange={(e) => handleItemChange(idx, 'discountPercentage', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono"
                      />
                    </div>

                    {/* Line Total & Remove */}
                    <div className="sm:col-span-2 flex items-center justify-between pl-2">
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400 uppercase">Total</span>
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {formatCurrency(lineTotal)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Details & Profit Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Left Column: Settlement & Terms */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Settlement & Notes</h4>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Amount Paid Now (Leave blank for full amount if Cash/Card)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={paymentMethod === 'CREDIT' ? '$0.00 (Unpaid)' : `$${grandTotal.toFixed(2)} (Full)`}
                  value={initialAmountPaid}
                  onChange={(e) => setInitialAmountPaid(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Notes / Terms
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional delivery notes or payment terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Right Column: Calculations Breakdown */}
            <div className="bg-[var(--accent-color-light)]/70 p-4 rounded-xl border border-[var(--accent-color-light)] flex flex-col justify-between space-y-3">
              <h4 className="text-xs font-bold text-[var(--accent-color-dark)] uppercase tracking-wider">Invoice Financial Summary</h4>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount applied:</span>
                    <span className="font-mono font-medium">-{formatCurrency(totalDiscount)}</span>
                  </div>
                )}
                {taxRate > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax ({taxRate}%):</span>
                    <span className="font-mono font-medium">+{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Product Inventory Cost (COGS):</span>
                  <span className="font-mono">{formatCurrency(totalCost)}</span>
                </div>
                <div className="pt-2 border-t border-[var(--accent-color-light)] flex justify-between text-base font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-[var(--accent-color-dark)]">{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-emerald-700">
                  <span>Net Estimated Profit:</span>
                  <span className="font-mono">+{formatCurrency(estimatedProfit)}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[var(--accent-color)] hover:bg-[var(--accent-color-dark)] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Generate Invoice & Deduct Stock
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
