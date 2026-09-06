import React, { useState, useMemo } from 'react';
import {
  Plus,
  Package,
  AlertTriangle,
  ArrowUpDown,
  Search,
  Edit2,
  Trash2,
  PlusCircle,
  History,
  Tag,
  DollarSign,
  Boxes,
  TrendingUp,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Product } from '../../types/erp';

interface InventoryViewProps {
  onOpenAddProduct: () => void;
  onOpenEditProduct: (product: Product) => void;
  onOpenRestock: (productId?: string) => void;
  onOpenManageCategories: () => void;
  onNavigateTab: (tab: any) => void;
  onOpenProductProfitGraph?: (productId?: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  onOpenAddProduct,
  onOpenEditProduct,
  onOpenRestock,
  onOpenManageCategories,
  onNavigateTab,
  onOpenProductProfitGraph,
}) => {
  const {
    products,
    categories,
    deleteProduct,
    lowStockProducts,
    inventoryCostValue,
    inventoryRetailValue,
  } = useERP();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'margin' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
        const matchSearch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchLow = !showLowStockOnly || p.stockQuantity <= p.minStockThreshold;
        return matchCat && matchSearch && matchLow;
      })
      .sort((a, b) => {
        let valA: any = a.name.toLowerCase();
        let valB: any = b.name.toLowerCase();

        if (sortBy === 'stock') {
          valA = a.stockQuantity;
          valB = b.stockQuantity;
        } else if (sortBy === 'price') {
          valA = a.sellingPrice;
          valB = b.sellingPrice;
        } else if (sortBy === 'margin') {
          valA = ((a.sellingPrice - a.purchasePrice) / a.sellingPrice) * 100;
          valB = ((b.sellingPrice - b.purchasePrice) / b.sellingPrice) * 100;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [products, selectedCategory, searchTerm, showLowStockOnly, sortBy, sortOrder]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  const toggleSort = (field: 'name' | 'stock' | 'margin' | 'price') => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Products</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{products.length} SKUs</h3>
            <p className="text-xs text-slate-500 mt-0.5">{categories.length} Active Categories</p>
          </div>
          <div className="w-10 h-10 bg-[var(--accent-color-light)] text-[var(--accent-color)] rounded-xl flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Stock Valuation (Cost)</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{formatCurrency(inventoryCostValue)}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">Retail: {formatCurrency(inventoryRetailValue)}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-5 sm:p-6 rounded-3xl ring-1 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
            lowStockProducts.length > 0
              ? 'bg-amber-50/70 ring-amber-200 shadow-amber-100/50'
              : 'bg-white ring-slate-200/80'
          }`}
        >
          <div>
            <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">Low Stock Warnings</p>
            <h3 className="text-xl sm:text-2xl font-bold text-amber-900 mt-1">{lowStockProducts.length} Items</h3>
            <p className="text-xs text-amber-700 mt-0.5">Below alert threshold</p>
          </div>
            <button
              onClick={() => onOpenRestock()}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
            >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Restock</span>
          </button>
        </div>
      </div>

      {/* Action Header & Filtering */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64 md:w-80 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by SKU, product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[var(--accent-color)] outline-none transition-all"
              />
            </div>

            {/* Low stock toggle button */}
            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                showLowStockOnly
                  ? 'bg-amber-100 border-amber-300 text-amber-800 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Low Stock ({lowStockProducts.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            {onOpenProductProfitGraph && (
              <button
                onClick={() => onOpenProductProfitGraph()}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-2xl transition-colors flex items-center gap-1.5 shadow-2xs"
                title="View Product Profit Graphs & Comparison"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Profit Graphs</span>
              </button>
            )}

            <button
              onClick={onOpenManageCategories}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Categories</span>
            </button>

            <button
              onClick={() => onNavigateTab('stock_logs')}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Movement Log</span>
            </button>

            <button
              onClick={onOpenAddProduct}
              className="px-3.5 py-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-color-dark)] text-white rounded-2xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-[var(--accent-color)] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({products.length})
          </button>
          {categories.map(cat => {
            const count = products.filter(p => p.category === cat.name).length;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-[var(--accent-color)] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Card View (< md) */}
      <div className="md:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-3xl ring-1 ring-slate-200/80 text-slate-400 text-xs">
            <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            No products found matching your criteria.
          </div>
        ) : (
          filteredProducts.map(product => {
            const marginPct = Math.round(
              ((product.sellingPrice - product.purchasePrice) / product.sellingPrice) * 100
            );
            const isLowStock = product.stockQuantity <= product.minStockThreshold;
            const isOutOfStock = product.stockQuantity === 0;

            return (
              <div
                key={product.id}
                className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{product.name}</h4>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                      <span>SKU: {product.sku}</span>
                      <span>•</span>
                      <span className="text-slate-600 font-medium">{product.category}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ring-1 ${
                      isOutOfStock
                        ? 'bg-red-100 text-red-700 ring-red-300/60'
                        : isLowStock
                        ? 'bg-amber-100 text-amber-700 ring-amber-300/60'
                        : 'bg-slate-100 text-slate-800 ring-slate-300/60'
                    }`}
                  >
                    {product.stockQuantity} {product.unit}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Cost Price</p>
                    <p className="font-mono font-semibold text-slate-700">{formatCurrency(product.purchasePrice)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Selling Price</p>
                    <p className="font-mono font-bold text-[var(--accent-color-dark)]">{formatCurrency(product.sellingPrice)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Margin</p>
                    <p className={`font-mono font-bold ${marginPct >= 30 ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {marginPct}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-400">
                    {isLowStock && (
                      <span className="text-amber-600 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Min: {product.minStockThreshold}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {onOpenProductProfitGraph && (
                      <button
                        onClick={() => onOpenProductProfitGraph(product.id)}
                        className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-2xl"
                        title="Profit Graph"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onOpenRestock(product.id)}
                      className="px-2.5 py-1 bg-[var(--accent-color-light)] hover:bg-[var(--accent-color-light)] text-[var(--accent-color-dark)] rounded-2xl text-xs font-semibold flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Restock</span>
                    </button>
                    <button
                      onClick={() => onOpenEditProduct(product)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-2xl"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete product "${product.name}"?`)) {
                          deleteProduct(product.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Products Table (hidden on mobile) */}
      <div className="hidden md:block bg-white rounded-3xl ring-1 ring-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-5 py-3 border-b border-slate-100 cursor-pointer" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>Product & SKU</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-5 py-3 border-b border-slate-100">Category</th>
                <th className="px-5 py-3 border-b border-slate-100">Cost Price</th>
                <th className="px-5 py-3 border-b border-slate-100 cursor-pointer" onClick={() => toggleSort('price')}>
                  <div className="flex items-center gap-1">
                    <span>Selling Price</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-5 py-3 border-b border-slate-100 cursor-pointer" onClick={() => toggleSort('margin')}>
                  <div className="flex items-center gap-1">
                    <span>Profit Margin</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-5 py-3 border-b border-slate-100 cursor-pointer" onClick={() => toggleSort('stock')}>
                  <div className="flex items-center gap-1">
                    <span>Stock Level</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-5 py-3 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No products found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const marginPct = Math.round(
                    ((product.sellingPrice - product.purchasePrice) / product.sellingPrice) * 100
                  );
                  const isLowStock = product.stockQuantity <= product.minStockThreshold;
                  const isOutOfStock = product.stockQuantity === 0;

                  return (
                    <tr key={product.id} className="hover:bg-[var(--accent-color-light)] transition-colors">
                      {/* Product Name & SKU */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{product.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                          <span>SKU: {product.sku}</span>
                          <span>•</span>
                          <span>Unit: {product.unit}</span>
                        </div>
                      </td>

                       {/* Category */}
                       <td className="px-5 py-3.5">
                         <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[11px] font-medium ring-1 ring-slate-300/60">
                           {product.category}
                         </span>
                       </td>

                      {/* Cost Price */}
                      <td className="px-5 py-3.5 font-mono text-slate-600">
                        {formatCurrency(product.purchasePrice)}
                      </td>

                      {/* Selling Price */}
                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                        {formatCurrency(product.sellingPrice)}
                      </td>

                      {/* Profit Margin */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-medium ${marginPct >= 30 ? 'text-emerald-600' : 'text-slate-600'}`}>
                            {marginPct}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (+{formatCurrency(product.sellingPrice - product.purchasePrice)})
                          </span>
                        </div>
                      </td>

                      {/* Stock Level */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                           <span
                             className={`px-2 py-0.5 rounded-full text-[11px] font-bold ring-1 ${
                               isOutOfStock
                                 ? 'bg-red-100 text-red-700 ring-red-300/60'
                                 : isLowStock
                                 ? 'bg-amber-100 text-amber-700 ring-amber-300/60'
                                 : 'bg-slate-100 text-slate-800 ring-slate-300/60'
                             }`}
                           >
                            {product.stockQuantity} {product.unit}
                          </span>
                          {isLowStock && (
                            <span className="text-[10px] text-amber-600 font-medium flex items-center">
                              <AlertTriangle className="w-3 h-3 inline mr-0.5" />
                              Min: {product.minStockThreshold}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="px-5 py-3.5 text-right">
                         <div className="flex items-center justify-end gap-1.5">
                            {onOpenProductProfitGraph && (
                              <button
                                onClick={() => onOpenProductProfitGraph(product.id)}
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-2xl transition-colors"
                                title="View Profit Graph for this product"
                              >
                                <TrendingUp className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onOpenRestock(product.id)}
                             className="px-2 py-1 bg-[var(--accent-color-light)] hover:bg-[var(--accent-color-light)] text-[var(--accent-color-dark)] rounded-2xl text-[11px] font-semibold flex items-center gap-1 transition-colors"
                             title="Restock this product"
                           >
                             <PlusCircle className="w-3 h-3" />
                             <span>Restock</span>
                           </button>
                           <button
                             onClick={() => onOpenEditProduct(product)}
                             className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors"
                             title="Edit product"
                           >
                             <Edit2 className="w-3.5 h-3.5" />
                           </button>
                           <button
                             onClick={() => {
                               if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
                                 deleteProduct(product.id);
                               }
                             }}
                             className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
                             title="Delete product"
                           >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                           </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
