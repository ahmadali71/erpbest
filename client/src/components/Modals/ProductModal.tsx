import React, { useState, useEffect } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Product } from '../../types/erp';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { categories, addProduct, updateProduct } = useERP();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [stockQuantity, setStockQuantity] = useState<number | ''>(0);
  const [minStockThreshold, setMinStockThreshold] = useState<number | ''>(5);
  const [unit, setUnit] = useState('pcs');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setCategory(productToEdit.category);
      setPurchasePrice(productToEdit.purchasePrice);
      setSellingPrice(productToEdit.sellingPrice);
      setStockQuantity(productToEdit.stockQuantity);
      setMinStockThreshold(productToEdit.minStockThreshold);
      setUnit(productToEdit.unit);
      setDescription(productToEdit.description || '');
    } else {
      setName('');
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategory(categories[0]?.name || 'General');
      setPurchasePrice('');
      setSellingPrice('');
      setStockQuantity(10);
      setMinStockThreshold(5);
      setUnit('pcs');
      setDescription('');
    }
    setError('');
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }
    if (purchasePrice === '' || Number(purchasePrice) < 0) {
      setError('Valid purchase (cost) price is required.');
      return;
    }
    if (sellingPrice === '' || Number(sellingPrice) < 0) {
      setError('Valid selling (retail) price is required.');
      return;
    }

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        name,
        sku,
        category,
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
        stockQuantity: Number(stockQuantity),
        minStockThreshold: Number(minStockThreshold),
        unit,
        description,
      });
    } else {
      addProduct({
        name,
        sku,
        category,
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
        stockQuantity: Number(stockQuantity),
        minStockThreshold: Number(minStockThreshold),
        unit,
        description,
      });
    }

    onClose();
  };

  const marginPct =
    sellingPrice && purchasePrice && Number(sellingPrice) > 0
      ? Math.round(((Number(sellingPrice) - Number(purchasePrice)) / Number(sellingPrice)) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--accent-color)] rounded-lg flex items-center justify-center text-white">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {productToEdit ? 'Edit Product & Pricing' : 'Add New Product to Inventory'}
              </h3>
              <p className="text-xs text-slate-400">Configure catalog details, purchase cost, and stock</p>
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
              Product Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Apple MacBook Pro M3"
              value={name}
              onChange={(e) => setName(e.target.value)}
               className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium outline-none focus:bg-white focus:border-[var(--accent-color)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                SKU / Barcode
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium outline-none focus:bg-white focus:border-[var(--accent-color)]"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Cost Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || '')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Selling Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || '')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Profit Margin
              </label>
              <div className="px-3 py-2 bg-slate-100 rounded-lg text-xs font-mono font-bold text-emerald-700 flex items-center justify-between">
                <span>{marginPct}%</span>
                {sellingPrice && purchasePrice && (
                  <span className="text-[10px] text-slate-500">
                    +${(Number(sellingPrice) - Number(purchasePrice)).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Current Stock Qty
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Low Stock Alert Min
              </label>
              <input
                type="number"
                min="0"
                value={minStockThreshold}
                onChange={(e) => setMinStockThreshold(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Measurement Unit
              </label>
              <input
                type="text"
                placeholder="pcs, box, kg..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Specifications & Notes
            </label>
            <textarea
              rows={2}
              placeholder="Product description, model details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              className="px-4 py-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-dark)] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              {productToEdit ? 'Save Product Changes' : 'Add to Inventory Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
