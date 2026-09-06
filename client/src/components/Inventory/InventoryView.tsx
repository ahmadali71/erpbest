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
  TrendingUp,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
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
    restoreProduct,
    lowStockProducts,
    inventoryCostValue,
    inventoryRetailValue,
  } = useERP();

  const { user, hasPermission } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canCreate = hasPermission('inventory.create') || hasPermission('inventory.edit') || isAdmin;
  const canEdit = hasPermission('inventory.edit') || isAdmin;
  const canDelete = hasPermission('inventory.delete') || hasPermission('inventory.edit') || isAdmin;

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);
  const [adminViewFilter, setAdminViewFilter] = useState<'all' | 'active' | 'deleted'>('active');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'margin' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const deletedProductsCount = useMemo(() => products.filter(p => p.isDeleted).length, [products]);
  const activeProductsCount = useMemo(() => products.filter(p => !p.isDeleted).length, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        // Role & deletion filtering
        if (isAdmin) {
          if (adminViewFilter === 'active' && p.isDeleted) return false;
          if (adminViewFilter === 'deleted' && !p.isDeleted) return false;
        } else {
          if (p.isDeleted) return false;
        }

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
  }, [products, selectedCategory, searchTerm, showLowStockOnly, adminViewFilter, isAdmin, sortBy, sortOrder]);

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
    <div className="space-y-4 sm:space-y-6 select-none">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Catalog</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{activeProductsCount} Items</h3>
            <p className="text-xs text-slate-500 mt-0.5">{categories.length} Categories</p>
          </div>
          <div className="w-10 h-10 bg-(--accent-color-light) text-(--accent-color) rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Inventory Valuation</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{formatCurrency(inventoryCostValue)}</h3>
            <p className="text-xs text-slate-500 mt-0.5">At purchase cost</p>
          </div>
          <div className="w-10 h-10 bg-(--accent-color-light) text-(--accent-color) rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Potential Retail</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{formatCurrency(inventoryRetailValue)}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Est. sales value</p>
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
          {canEdit && (
            <button
              onClick={() => onOpenRestock()}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Restock</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Header & Filtering */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64 md:w-80 min-w-50">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by SKU, product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-(--accent-color) outline-none transition-all"
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

            {/* Admin-only deletion filter toggle */}
            {isAdmin && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-2xl text-xs">
                <button
                  onClick={() => setAdminViewFilter('active')}
                  className={`px-3 py-1 rounded-xl font-medium transition-all ${
                    adminViewFilter === 'active'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active ({activeProductsCount})
                </button>
                <button
                  onClick={() => setAdminViewFilter('deleted')}
                  className={`px-3 py-1 rounded-xl font-medium transition-all flex items-center gap-1 ${
                    adminViewFilter === 'deleted'
                      ? 'bg-rose-500 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-rose-600'
                  }`}
                  title="Products deleted by administration role"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Deleted ({deletedProductsCount})</span>
                </button>
                <button
                  onClick={() => setAdminViewFilter('all')}
                  className={`px-3 py-1 rounded-xl font-medium transition-all ${
                    adminViewFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({products.length})
                </button>
              </div>
            )}
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

            {canEdit && (
              <button
                onClick={onOpenManageCategories}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Categories</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab('stock_logs')}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Movement Log</span>
            </button>

            {canCreate && (
              <button
                onClick={onOpenAddProduct}
                className="px-3.5 py-1.5 bg-(--accent-color) hover:bg-(--accent-color-dark) text-white rounded-2xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-(--accent-color) text-white'
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
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-(--accent-color) text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Product Cards (hidden on md and up) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-400">
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
                className={`p-4 rounded-3xl ring-1 shadow-sm space-y-3 ${
                  product.isDeleted
                    ? 'bg-rose-50/60 ring-rose-200 border-l-4 border-l-rose-500'
                    : 'bg-white ring-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className={`font-bold ${product.isDeleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {product.name}
                      </h4>
                      {product.isDeleted && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 ring-1 ring-rose-300">
                          Deleted by @{product.deletedBy || 'administration'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      SKU: {product.sku} • {product.category}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${
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

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Cost</p>
                    <p className="font-mono text-xs font-semibold text-slate-600">
                      {formatCurrency(product.purchasePrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Price</p>
                    <p className="font-mono text-xs font-bold text-slate-900">
                      {formatCurrency(product.sellingPrice)}
                    </p>
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
                    {product.isDeleted && isAdmin ? (
                      <>
                        <button
                          onClick={() => restoreProduct(product.id)}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-2xl text-xs font-bold flex items-center gap-1"
                          title="Restore product"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Permanently delete "${product.name}" from database?`)) {
                              deleteProduct(product.id, true);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-2xl"
                          title="Permanently delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        {onOpenProductProfitGraph && (
                          <button
                            onClick={() => onOpenProductProfitGraph(product.id)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-2xl"
                            title="Profit Graph"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => onOpenRestock(product.id)}
                            className="px-2.5 py-1 bg-(--accent-color-light) hover:bg-(--accent-color-light) text-(--accent-color-dark) rounded-2xl text-xs font-semibold flex items-center gap-1"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Restock</span>
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => onOpenEditProduct(product)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-2xl"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
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
                        )}
                      </>
                    )}
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
                    <tr
                      key={product.id}
                      className={`transition-colors ${
                        product.isDeleted
                          ? 'bg-rose-50/50 hover:bg-rose-100/50'
                          : 'hover:bg-(--accent-color-light)'
                      }`}
                    >
                      {/* Product Name & SKU */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${product.isDeleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {product.name}
                          </span>
                          {product.isDeleted && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 ring-1 ring-rose-300">
                              Deleted by @{product.deletedBy || 'administration'}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                          <span>SKU: {product.sku}</span>
                          <span>•</span>
                          <span>Unit: {product.unit}</span>
                          {product.isDeleted && product.deletedAt && (
                            <>
                              <span>•</span>
                              <span className="text-rose-600">On {new Date(product.deletedAt).toLocaleDateString()}</span>
                            </>
                          )}
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
                          {product.isDeleted && isAdmin ? (
                            <>
                              <button
                                onClick={() => restoreProduct(product.id)}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-2xl text-[11px] font-bold flex items-center gap-1 transition-colors"
                                title="Restore product to active catalog"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Permanently delete "${product.name}"? This cannot be undone.`)) {
                                    deleteProduct(product.id, true);
                                  }
                                }}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-2xl transition-colors"
                                title="Permanently delete product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              {onOpenProductProfitGraph && (
                                <button
                                  onClick={() => onOpenProductProfitGraph(product.id)}
                                  className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-2xl transition-colors"
                                  title="View Profit Graph for this product"
                                >
                                  <TrendingUp className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canEdit && (
                                <button
                                  onClick={() => onOpenRestock(product.id)}
                                  className="px-2 py-1 bg-(--accent-color-light) hover:bg-(--accent-color-light) text-(--accent-color-dark) rounded-2xl text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                  title="Restock this product"
                                >
                                  <PlusCircle className="w-3 h-3" />
                                  <span>Restock</span>
                                </button>
                              )}
                              {canEdit && (
                                <button
                                  onClick={() => onOpenEditProduct(product)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors"
                                  title="Edit product"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canDelete && (
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
                              )}
                            </>
                          )}
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
