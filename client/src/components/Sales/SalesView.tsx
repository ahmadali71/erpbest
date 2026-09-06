import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ShoppingCart,
  DollarSign,
  FileText,
  Trash2,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { PaymentMethod, PaymentStatus, SaleInvoice } from '../../types/erp';

interface SalesViewProps {
  onOpenNewSale: () => void;
  onSelectInvoice: (invoice: SaleInvoice) => void;
  onOpenRecordPayment: (invoice: SaleInvoice) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  onOpenNewSale,
  onSelectInvoice,
  onOpenRecordPayment,
}) => {
  const { sales, deleteSale, restoreSale, totalRevenue, totalCollected, totalPendingReceivables } = useERP();
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canCreate = hasPermission('sales.create') || isAdmin;
  const canDelete = hasPermission('sales.delete') || isAdmin;

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'ALL'>('ALL');
  const [adminViewFilter, setAdminViewFilter] = useState<'all' | 'active' | 'deleted'>('active');

  const deletedSalesCount = useMemo(() => sales.filter(s => s.isDeleted).length, [sales]);
  const activeSalesCount = useMemo(() => sales.filter(s => !s.isDeleted).length, [sales]);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      // Role & deletion filtering
      if (isAdmin) {
        if (adminViewFilter === 'active' && s.isDeleted) return false;
        if (adminViewFilter === 'deleted' && !s.isDeleted) return false;
      } else {
        if (s.isDeleted) return false;
      }

      const matchSearch =
        s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || s.paymentStatus === statusFilter;
      const matchMethod = methodFilter === 'ALL' || s.paymentMethod === methodFilter;
      return matchSearch && matchStatus && matchMethod;
    });
  }, [sales, searchTerm, statusFilter, methodFilter, adminViewFilter, isAdmin]);

  const totalInvoicedProfit = useMemo(() => {
    return sales.filter(s => !s.isDeleted).reduce((acc, s) => acc + s.profit, 0);
  }, [sales]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  const getStatusBadge = (sale: SaleInvoice) => {
    if (sale.paymentStatus === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> Paid
        </span>
      );
    }
    if (sale.paymentStatus === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
          <Clock className="w-3 h-3" /> Unpaid (${sale.amountDue})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
        <AlertCircle className="w-3 h-3" /> Partial (${sale.amountDue} due)
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 select-none">
      {/* Sales Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm">
          <p className="text-[11px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Total Invoiced</p>
          <h3 className="text-lg sm:text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalRevenue)}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{activeSalesCount} Invoices</p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm">
          <p className="text-[11px] sm:text-xs text-emerald-600 font-bold uppercase tracking-wider">Collected</p>
          <h3 className="text-lg sm:text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalCollected)}</h3>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">Cash/Bank</p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm border-l-4 border-l-amber-400">
          <p className="text-[11px] sm:text-xs text-amber-700 font-bold uppercase tracking-wider">Receivables</p>
          <h3 className="text-lg sm:text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalPendingReceivables)}</h3>
          <p className="text-[11px] text-amber-600 mt-0.5 font-medium">Pending Due</p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm">
          <p className="text-[11px] sm:text-xs text-(--accent-color) font-bold uppercase tracking-wider">Gross Profit</p>
          <h3 className="text-lg sm:text-2xl font-bold text-(--accent-color-dark) mt-1">{formatCurrency(totalInvoicedProfit)}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Margin</p>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64 min-w-45">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice # or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-(--accent-color) outline-none transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium outline-none focus:border-(--accent-color)"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partial</option>
            <option value="PENDING">Pending / Credit</option>
          </select>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium outline-none focus:border-(--accent-color)"
          >
            <option value="ALL">All Methods</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="CREDIT">Credit</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>

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
                Active ({activeSalesCount})
              </button>
              <button
                onClick={() => setAdminViewFilter('deleted')}
                className={`px-3 py-1 rounded-xl font-medium transition-all flex items-center gap-1 ${
                  adminViewFilter === 'deleted'
                    ? 'bg-rose-500 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-rose-600'
                }`}
                title="Sales deleted by administration role"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Deleted ({deletedSalesCount})</span>
              </button>
              <button
                onClick={() => setAdminViewFilter('all')}
                className={`px-3 py-1 rounded-xl font-medium transition-all ${
                  adminViewFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({sales.length})
              </button>
            </div>
          )}
        </div>

        {canCreate && (
          <button
            onClick={onOpenNewSale}
            className="px-4 py-2 bg-(--accent-color) hover:bg-(--accent-color-dark) text-white rounded-2xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 self-stretch sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Sale</span>
          </button>
        )}
      </div>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden space-y-3">
        {filteredSales.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-3xl ring-1 ring-slate-200/80 text-slate-400 text-xs">
            <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            No sales invoices match your search filters.
          </div>
        ) : (
          filteredSales.map(sale => {
            const formattedDate = new Date(sale.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const totalUnits = sale.items.reduce((acc, i) => acc + i.quantity, 0);

            return (
              <div
                key={sale.id}
                onClick={() => onSelectInvoice(sale)}
                className={`p-5 sm:p-6 rounded-3xl ring-1 shadow-sm transition-all space-y-3 cursor-pointer ${
                  sale.isDeleted
                    ? 'bg-rose-50/60 ring-rose-200 border-l-4 border-l-rose-500'
                    : 'bg-white ring-slate-200/80 hover:shadow-xl hover:-translate-y-1 active:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-(--accent-color)">
                        {sale.invoiceNumber}
                      </span>
                      {sale.isDeleted && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 ring-1 ring-rose-300">
                          Deleted by @{sale.deletedBy || 'administration'}
                        </span>
                      )}
                    </div>
                    <p className={`font-semibold text-sm ${sale.isDeleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {sale.clientName}
                    </p>
                    <p className="text-[11px] text-slate-400">{formattedDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(sale.grandTotal)}</p>
                    <div className="mt-1">{getStatusBadge(sale)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span>{sale.items.length} items ({totalUnits} pcs)</span>
                  <span className="font-mono font-semibold text-emerald-600">+{formatCurrency(sale.profit)}</span>
                </div>

                {sale.isDeleted && isAdmin ? (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-200" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => restoreSale(sale.id)}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore Invoice</span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Permanently delete invoice "${sale.invoiceNumber}"?`)) {
                          deleteSale(sale.id, true);
                        }
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-xl"
                      title="Permanently delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Invoices Table (hidden on mobile) */}
      <div className="hidden md:block bg-white rounded-3xl ring-1 ring-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-5 py-3 border-b border-slate-100">Invoice #</th>
                <th className="px-5 py-3 border-b border-slate-100">Client</th>
                <th className="px-5 py-3 border-b border-slate-100">Date</th>
                <th className="px-5 py-3 border-b border-slate-100">Items Count</th>
                <th className="px-5 py-3 border-b border-slate-100">Total Amount</th>
                <th className="px-5 py-3 border-b border-slate-100">Status</th>
                <th className="px-5 py-3 border-b border-slate-100">Payment</th>
                <th className="px-5 py-3 border-b border-slate-100 text-right">Profit</th>
                <th className="px-5 py-3 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No sales invoices match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const formattedDate = new Date(sale.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const totalItemsCount = sale.items.reduce((acc, i) => acc + i.quantity, 0);

                  return (
                    <tr
                      key={sale.id}
                      onClick={() => onSelectInvoice(sale)}
                      className={`cursor-pointer transition-colors ${
                        sale.isDeleted
                          ? 'bg-rose-50/50 hover:bg-rose-100/50'
                          : 'hover:bg-(--accent-color-light)'
                      }`}
                    >
                      {/* Invoice # */}
                      <td className="px-5 py-3.5 font-mono font-bold text-(--accent-color)">
                        <div className="flex items-center gap-1.5">
                          <span>{sale.invoiceNumber}</span>
                          {sale.isDeleted && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 ring-1 ring-rose-300">
                              Deleted by @{sale.deletedBy || 'administration'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Client Name */}
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        <span className={sale.isDeleted ? 'line-through text-slate-500' : ''}>
                          {sale.clientName}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {formattedDate}
                        {sale.isDeleted && sale.deletedAt && (
                          <div className="text-[10px] text-rose-600">
                            Deleted on {new Date(sale.deletedAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* Items Count */}
                      <td className="px-5 py-3.5 text-slate-600">
                        {sale.items.length} sku ({totalItemsCount} units)
                      </td>

                      {/* Grand Total */}
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                        {formatCurrency(sale.grandTotal)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        {getStatusBadge(sale)}
                      </td>

                      {/* Method */}
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-mono ring-1 ring-slate-300/60">
                          {sale.paymentMethod}
                        </span>
                      </td>

                      {/* Profit */}
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-emerald-600">
                        +{formatCurrency(sale.profit)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {sale.isDeleted && isAdmin ? (
                            <>
                              <button
                                onClick={() => restoreSale(sale.id)}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-2xl text-[11px] font-bold flex items-center gap-1 transition-colors"
                                title="Restore invoice and re-apply inventory/debt"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Permanently delete invoice "${sale.invoiceNumber}"? This cannot be undone.`)) {
                                    deleteSale(sale.id, true);
                                  }
                                }}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-2xl transition-colors"
                                title="Permanently delete invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              {!sale.isDeleted && sale.amountDue > 0 && (
                                <button
                                  onClick={() => onOpenRecordPayment(sale)}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-2xl text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                  title="Record payment"
                                >
                                  <DollarSign className="w-3 h-3" />
                                  <span>Pay</span>
                                </button>
                              )}
                              <button
                                onClick={() => onSelectInvoice(sale)}
                                className="p-1.5 text-slate-400 hover:text-(--accent-color) hover:bg-(--accent-color-light) rounded-2xl transition-colors"
                                title="View Invoice"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              {canDelete && !sale.isDeleted && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Cancel invoice "${sale.invoiceNumber}" and restore items to inventory?`)) {
                                      deleteSale(sale.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
                                  title="Cancel and revert stock"
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
