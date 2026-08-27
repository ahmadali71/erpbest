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
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
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
  const { sales, deleteSale, totalRevenue, totalCollected, totalPendingReceivables } = useERP();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'ALL'>('ALL');

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchSearch =
        s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || s.paymentStatus === statusFilter;
      const matchMethod = methodFilter === 'ALL' || s.paymentMethod === methodFilter;
      return matchSearch && matchStatus && matchMethod;
    });
  }, [sales, searchTerm, statusFilter, methodFilter]);

  const totalInvoicedProfit = useMemo(() => {
    return sales.reduce((acc, s) => acc + s.profit, 0);
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="w-3 h-3" /> Paid
        </span>
      );
    }
    if (sale.paymentStatus === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
          <Clock className="w-3 h-3" /> Unpaid (${sale.amountDue})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
        <AlertCircle className="w-3 h-3" /> Partial (${sale.amountDue} due)
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Sales Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Total Invoiced</p>
          <h3 className="text-lg sm:text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalRevenue)}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{sales.length} Invoices</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] sm:text-xs text-emerald-600 font-bold uppercase tracking-wider">Collected</p>
          <h3 className="text-lg sm:text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalCollected)}</h3>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">Cash/Bank</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-amber-400">
          <p className="text-[11px] sm:text-xs text-amber-700 font-bold uppercase tracking-wider">Receivables</p>
          <h3 className="text-lg sm:text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalPendingReceivables)}</h3>
          <p className="text-[11px] text-amber-600 mt-0.5 font-medium">Pending Due</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] sm:text-xs text-indigo-600 font-bold uppercase tracking-wider">Gross Profit</p>
          <h3 className="text-lg sm:text-2xl font-bold text-indigo-700 mt-1">{formatCurrency(totalInvoicedProfit)}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Margin</p>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice # or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium outline-none focus:border-indigo-500"
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
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Methods</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="CREDIT">Credit</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>
        </div>

        <button
          onClick={onOpenNewSale}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 self-stretch sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Sale</span>
        </button>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden space-y-3">
        {filteredSales.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-400 text-xs">
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
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 cursor-pointer active:bg-slate-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-600 block">{sale.invoiceNumber}</span>
                    <h4 className="font-semibold text-slate-900 text-sm mt-0.5">{sale.clientName}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formattedDate} • {totalUnits} units</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-base font-bold text-slate-900 block">{formatCurrency(sale.grandTotal)}</span>
                    <span className="text-[11px] font-mono font-semibold text-emerald-600">+{formatCurrency(sale.profit)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(sale)}
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                      {sale.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {sale.amountDue > 0 && (
                      <button
                        onClick={() => onOpenRecordPayment(sale)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Pay</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm(`Cancel invoice "${sale.invoiceNumber}" and restore stock?`)) {
                          deleteSale(sale.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Cancel invoice"
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

      {/* Invoices List Table (hidden on mobile) */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-5 py-3 border-b border-slate-100">Invoice #</th>
                <th className="px-5 py-3 border-b border-slate-100">Client</th>
                <th className="px-5 py-3 border-b border-slate-100">Date</th>
                <th className="px-5 py-3 border-b border-slate-100">Items</th>
                <th className="px-5 py-3 border-b border-slate-100">Grand Total</th>
                <th className="px-5 py-3 border-b border-slate-100">Payment Status</th>
                <th className="px-5 py-3 border-b border-slate-100">Method</th>
                <th className="px-5 py-3 border-b border-slate-100 text-right">Profit</th>
                <th className="px-5 py-3 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                    <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No sales invoices match your search filters.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const totalItemsCount = sale.items.reduce((acc, i) => acc + i.quantity, 0);
                  const formattedDate = new Date(sale.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => onSelectInvoice(sale)}
                    >
                      {/* Invoice Number */}
                      <td className="px-5 py-3.5 font-mono font-semibold text-indigo-600">
                        {sale.invoiceNumber}
                      </td>

                      {/* Client */}
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {sale.clientName}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {formattedDate}
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
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono">
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
                          {sale.amountDue > 0 && (
                            <button
                              onClick={() => onOpenRecordPayment(sale)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                              title="Record payment"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Pay</span>
                            </button>
                          )}
                          <button
                            onClick={() => onSelectInvoice(sale)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="View Invoice"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Cancel invoice "${sale.invoiceNumber}" and restore items to inventory?`)) {
                                deleteSale(sale.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Cancel and revert stock"
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
