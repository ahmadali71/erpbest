import React, { useState, useEffect } from 'react';
import { X, PlusCircle, AlertCircle, Package } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  productId,
}) => {
  const { products, restockProduct } = useERP();

  const [selectedProductId, setSelectedProductId] = useState<string>(productId || products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const selectedProduct = products.find(p => p.id === selectedProductId);

  useEffect(() => {
    if (productId) {
      setSelectedProductId(productId);
      const prod = products.find(p => p.id === productId);
      if (prod) {
        setUnitCost(prod.purchasePrice);
      }
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
      setUnitCost(products[0].purchasePrice);
    }
  }, [productId, products, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setError('Please select a product.');
      return;
    }
    if (quantity <= 0) {
      setError('Please enter a valid replenishment quantity.');
      return;
    }

    restockProduct(
      selectedProductId,
      Number(quantity),
      unitCost !== '' ? Number(unitCost) : undefined,
      notes,
      supplierName
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Restock Inventory (Purchase Order)</h3>
              <p className="text-xs text-slate-400">Receive supplier shipments and replenish stock levels</p>
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

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Product <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const prod = products.find(p => p.id === e.target.value);
                if (prod) setUnitCost(prod.purchasePrice);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium outline-none focus:bg-white focus:border-[var(--accent-color)]"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current: {p.stockQuantity} {p.unit})
                </option>
              ))}
            </select>
            {selectedProduct && (
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>SKU: {selectedProduct.sku}</span>
                <span>Current Stock: <strong className="text-slate-800">{selectedProduct.stockQuantity} {selectedProduct.unit}</strong></span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Quantity to Add <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Purchase Cost / Unit ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || '')}
                placeholder="Cost per unit"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Supplier / Vendor Name
            </label>
            <input
              type="text"
              placeholder="e.g. Global Tech Distributors LLC"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Shipment PO Notes
            </label>
            <textarea
              rows={2}
              placeholder="Batch #, container tracking, or condition notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex justify-between items-center">
            <span>New Stock Level:</span>
            <span className="font-mono font-bold">
              {(selectedProduct?.stockQuantity || 0) + (Number(quantity) || 0)} {selectedProduct?.unit || 'units'}
            </span>
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
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              Confirm Restock Reception
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
