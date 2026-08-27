import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Search,
  Filter,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Building,
  Sparkles,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { SaleReturn, ReturnItem } from '../../types/erp';

interface ReturnsViewProps {
  onOpenProcessReturn?: () => void;
  onSelectInvoice?: (invoiceId: string) => void;
}

export const ReturnsView: React.FC<ReturnsViewProps> = ({
  onOpenProcessReturn,
  onSelectInvoice,
}) => {
  const { returns, sales, formatCurrency } = useERP();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterReason, setFilterReason] = useState<string>('ALL');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [expandedReturnId, setExpandedReturnId] = useState<string | null>(null);

  // Metrics
  const totalRefundAmount = useMemo(() => {
    return returns.reduce((acc, r) => acc + r.netRefundAmount, 0);
  }, [returns]);

  const totalRestockedItems = useMemo(() => {
    let count = 0;
    returns.forEach(r => {
      r.items.forEach(i => {
        if (i.restockItem) count += i.quantity;
      });
    });
    return count;
  }, [returns]);

  const defectiveDamagedCount = useMemo(() => {
    let count = 0;
    returns.forEach(r => {
      r.items.forEach(i => {
        if (i.reason === 'DEFECTIVE' || i.reason === 'DAMAGED') count += i.quantity;
      });
    });
    return count;
  }, [returns]);

  // Filtered Returns
  const filteredReturns = useMemo(() => {
    return returns.filter(r => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        r.returnNumber.toLowerCase().includes(q) ||
        r.invoiceNumber.toLowerCase().includes(q) ||
        (r.clientName && r.clientName.toLowerCase().includes(q)) ||
        (r.notes && r.notes.toLowerCase().includes(q));

      const matchesReason =
        filterReason === 'ALL' ||
        r.items.some(i => i.reason === filterReason);

      const matchesMethod =
        filterMethod === 'ALL' || r.refundMethod === filterMethod;

      return matchesSearch && matchesReason && matchesMethod;
    });
  }, [returns, searchQuery, filterReason, filterMethod]);

  const toggleExpand = (id: string) => {
    setExpandedReturnId(prev => (prev === id ? null : id));
  };

  const getReasonBadge = (reason: ReturnItem['reason']) => {
    switch (reason) {
      case 'DEFECTIVE':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 rounded-md border border-rose-100">Defective</span>;
      case 'DAMAGED':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 rounded-md border border-amber-100">Damaged</span>;
      case 'WRONG_ITEM':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-md border border-blue-100">Wrong Item</span>;
      case 'CUSTOMER_CHANGE_OF_MIND':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-50 text-purple-700 rounded-md border border-purple-100">Change of Mind</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md border border-slate-200">Other</span>;
    }
  };

  const getRefundMethodBadge = (method: SaleReturn['refundMethod']) => {
    switch (method) {
      case 'STORE_CREDIT':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Store Credit
          </span>
        );
      case 'CARD':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-full border border-blue-100 flex items-center gap-1">
            <CreditCard className="w-2.5 h-2.5" />
            Card Reversal
          </span>
        );
      case 'BANK_TRANSFER':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 flex items-center gap-1">
            <Building className="w-2.5 h-2.5" />
            Bank Transfer
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-800 rounded-full border border-slate-200 flex items-center gap-1">
            <DollarSign className="w-2.5 h-2.5" />
            Cash Refund
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <RotateCcw className="w-6 h-6 text-rose-600" />
            <span>Returns & Refunds Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Track merchandise returns, inventory restock adjustments, and customer refund credits
          </p>
        </div>

        {onOpenProcessReturn && (
          <button
            onClick={onOpenProcessReturn}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Process New Return</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Refunded
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatCurrency(totalRefundAmount)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Lifetime processed refunds</span>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Returns Processed
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            {returns.length}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Total return transactions</span>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Items Restocked
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            {totalRestockedItems}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">Returned to catalog count</span>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Defects & Damaged
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            {defectiveDamagedCount}
          </p>
          <span className="text-[11px] text-amber-600 font-semibold">Non-restocked units</span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search return #, invoice #, client..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 border border-slate-200 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500">Reason:</span>
            <select
              value={filterReason}
              onChange={e => setFilterReason(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Reasons</option>
              <option value="CUSTOMER_CHANGE_OF_MIND">Change of Mind</option>
              <option value="DEFECTIVE">Defective</option>
              <option value="WRONG_ITEM">Wrong Item</option>
              <option value="DAMAGED">Damaged</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500">Payout:</span>
            <select
              value={filterMethod}
              onChange={e => setFilterMethod(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card Reversal</option>
              <option value="STORE_CREDIT">Store Credit</option>
              <option value="BANK_TRANSFER">Bank Wire</option>
            </select>
          </div>
        </div>
      </div>

      {/* Returns List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {filteredReturns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mx-auto mb-3 shadow-2xs">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Return Records Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || filterReason !== 'ALL' || filterMethod !== 'ALL'
                ? 'No returns match your active search or filter criteria.'
                : 'No sales returns have been recorded yet.'}
            </p>
            {onOpenProcessReturn && (
              <button
                onClick={onOpenProcessReturn}
                className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Process First Return</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReturns.map(ret => {
              const isExpanded = expandedReturnId === ret.id;
              const totalUnits = ret.items.reduce((acc, i) => acc + i.quantity, 0);

              return (
                <div key={ret.id} className="transition-colors hover:bg-slate-50/50">
                  {/* Summary Row */}
                  <div
                    onClick={() => toggleExpand(ret.id)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100/80 flex items-center justify-center text-rose-600 flex-shrink-0">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50/80 px-2.5 py-0.5 rounded-md border border-rose-200/60">
                            {ret.returnNumber}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            for Invoice{' '}
                            <span className="font-mono font-bold text-slate-700">
                              #{ret.invoiceNumber}
                            </span>
                          </span>
                          {getRefundMethodBadge(ret.refundMethod)}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="font-bold text-slate-800">{ret.clientName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(ret.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span>•</span>
                          <span>{totalUnits} item(s)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0">
                      <div className="text-right">
                        <div className="font-mono text-sm sm:text-base font-black text-rose-600">
                          {formatCurrency(ret.netRefundAmount)}
                        </div>
                        {ret.restockingFee > 0 && (
                          <div className="text-[10px] text-slate-400 font-medium">
                            Fee: {formatCurrency(ret.restockingFee)}
                          </div>
                        )}
                      </div>

                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 transition-transform">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Item Breakdown */}
                  {isExpanded && (
                    <div className="px-4 pb-4 sm:px-6 sm:pb-5 pt-1 bg-slate-50/70 border-t border-slate-100 animate-in fade-in duration-150">
                      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-slate-50/80 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-3">Product Description</th>
                              <th className="p-3">SKU</th>
                              <th className="p-3 text-center">Qty</th>
                              <th className="p-3">Reason</th>
                              <th className="p-3 text-center">Restocked?</th>
                              <th className="p-3 text-right">Unit Price</th>
                              <th className="p-3 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {ret.items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/40">
                                <td className="p-3 font-semibold text-slate-900">{item.productName}</td>
                                <td className="p-3 font-mono text-slate-500 text-[11px]">{item.sku}</td>
                                <td className="p-3 text-center font-bold">{item.quantity}</td>
                                <td className="p-3">{getReasonBadge(item.reason)}</td>
                                <td className="p-3 text-center">
                                  {item.restockItem ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[11px] font-medium">No (Written off)</span>
                                  )}
                                </td>
                                <td className="p-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                                <td className="p-3 text-right font-mono font-bold text-slate-900">
                                  {formatCurrency(item.total)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Footer Remarks */}
                      <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
                        {ret.notes ? (
                          <div>
                            <span className="font-bold text-slate-700">Notes:</span> {ret.notes}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No notes provided</span>
                        )}

                        <div className="flex items-center gap-4 text-slate-700 font-semibold self-end">
                          <span>Items Total: {formatCurrency(ret.itemsTotal)}</span>
                          {ret.restockingFee > 0 && (
                            <span className="text-slate-500">
                              Fee: -{formatCurrency(ret.restockingFee)}
                            </span>
                          )}
                          <span className="text-rose-600 font-bold">
                            Net Refund: {formatCurrency(ret.netRefundAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
