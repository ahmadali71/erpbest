import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Package,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { StockMovementType } from '../../types/erp';

export const StockMovementLogs: React.FC = () => {
  const { stockMovements } = useERP();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<StockMovementType | 'ALL'>('ALL');

  const filteredLogs = useMemo(() => {
    return stockMovements.filter(m => {
      const matchSearch =
        m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.referenceId && m.referenceId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.note && m.note.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchType = typeFilter === 'ALL' || m.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [stockMovements, searchTerm, typeFilter]);

  const getBadge = (type: StockMovementType) => {
    if (type === 'PURCHASE_RESTOCK') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
          <ArrowUpRight className="w-3 h-3" /> Purchase Restock
        </span>
      );
    }
    if (type === 'SALE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--accent-color-light)] text-[var(--accent-color-dark)]">
          <ArrowDownLeft className="w-3 h-3" /> Customer Sale
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
        <RefreshCw className="w-3 h-3" /> Adjustment
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-[var(--accent-color)]" />
            <span>Stock Movement Audit Log</span>
          </h2>
          <p className="text-xs text-slate-400">
            Tracking restocks, sale deductions, and adjustments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by SKU, product, ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[var(--accent-color)] outline-none transition-all"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium outline-none focus:border-[var(--accent-color)]"
          >
            <option value="ALL">All Event Types</option>
            <option value="PURCHASE_RESTOCK">Restock (+)</option>
            <option value="SALE">Sale (-)</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
        </div>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-400 text-xs">
            <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            No stock movements recorded matching filters.
          </div>
        ) : (
          filteredLogs.map(log => {
            const isPositive = log.quantity > 0;
            const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={log.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{log.productName}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {log.sku}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formattedDate}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-mono text-base font-bold block ${
                        isPositive ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {isPositive ? `+${log.quantity}` : log.quantity}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {log.previousStock} → {log.newStock}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  {getBadge(log.type)}
                  {log.referenceId && (
                    <span className="font-mono text-[11px] font-semibold text-[var(--accent-color)]">
                      {log.referenceId}
                    </span>
                  )}
                </div>
                {log.note && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded">
                    {log.note}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table (hidden on mobile) */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-5 py-3 border-b border-slate-100">Date & Time</th>
                <th className="px-5 py-3 border-b border-slate-100">Product / SKU</th>
                <th className="px-5 py-3 border-b border-slate-100">Event Type</th>
                <th className="px-5 py-3 border-b border-slate-100 font-bold">Quantity Changed</th>
                <th className="px-5 py-3 border-b border-slate-100">Stock Balance</th>
                <th className="px-5 py-3 border-b border-slate-100">Reference / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No stock movements recorded matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isPositive = log.quantity > 0;
                  const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{log.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {log.sku}</div>
                      </td>
                      <td className="px-5 py-3.5">{getBadge(log.type)}</td>
                      <td className="px-5 py-3.5 font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-600' : 'text-slate-800'}>
                          {isPositive ? `+${log.quantity}` : log.quantity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">
                        <span className="text-slate-400">{log.previousStock}</span>
                        <span className="mx-1 text-slate-400">→</span>
                        <span className="font-bold text-slate-900">{log.newStock}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {log.referenceId && (
                          <span className="font-mono text-xs font-semibold text-[var(--accent-color)] block">
                            {log.referenceId}
                          </span>
                        )}
                        <span className="text-slate-500 text-[11px] italic">{log.note || '--'}</span>
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
