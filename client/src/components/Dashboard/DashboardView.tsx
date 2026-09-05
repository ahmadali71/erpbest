import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Calendar,
  Layers,
  ChevronRight,
  DollarSign,
  PlusCircle,
  Sparkles,
  Zap,
  Clock,
  ArrowRight,
  ShieldCheck,
  Store,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useERP } from '../../context/ERPContext';
import { SaleInvoice, TimeRange } from '../../types/erp';

interface DashboardViewProps {
  onSelectInvoice: (invoice: SaleInvoice) => void;
  onNavigateTab: (tab: any) => void;
  onOpenNewSale: () => void;
  onOpenRestockProduct: (productId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectInvoice,
  onNavigateTab,
  onOpenNewSale,
  onOpenRestockProduct,
}) => {
  const {
    sales,
    totalRevenue,
    netProfit,
    grossProfit,
    totalExpenses,
    totalPendingReceivables,
    inventoryCostValue,
    inventoryRetailValue,
    lowStockProducts,
    getFinancialPerformanceData,
    activeTerminals,
    quotations,
    purchaseOrders,
  } = useERP();

  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');

  const chartData = getFinancialPerformanceData(timeRange);

  const pendingInvoicesCount = sales.filter(s => s.paymentStatus !== 'PAID').length;
  const recentSales = sales.slice(0, 6);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-5 select-none animate-in fade-in duration-300">
      {/* Top Welcome / Command Bar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-2/5 bg-gradient-to-l from-[var(--accent-color)]/25 via-[var(--accent-color)]/10 to-transparent pointer-events-none" />
        <div className="absolute left-10 bottom-0 w-32 h-32 bg-[var(--accent-color)]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[var(--accent-color)] text-xs font-bold tracking-wide">
              <Calendar className="w-3.5 h-3.5" />
              <span>{currentDate}</span>
              <span className="text-[var(--accent-color)]/50">|</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync ({activeTerminals} Terminal{activeTerminals !== 1 ? 's' : ''})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2">
              Welcome back, Administrator
            </h1>
            <p className="text-xs sm:text-sm text-white/60 mt-1.5 max-w-2xl leading-relaxed">
              Enterprise operations running smoothly. Real-time sales, inventory valuations, and order conversions are synced across all active registers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('pos')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-2xl transition-all shadow-lg shadow-emerald-900/30 hover:scale-[1.03] active:scale-[0.98]"
            >
              <Store className="w-4 h-4" />
              <span>Launch POS</span>
            </button>
            <button
              onClick={onOpenNewSale}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl backdrop-blur-md border border-white/10 transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4 text-[var(--accent-color)]" />
              <span>New Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 transition-all duration-300 hover:shadow-xl hover:accent-shadow hover:ring-[var(--accent-color-light)] hover:-translate-y-1">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Total Sales</p>
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent-color-light)] text-[var(--accent-color-dark)] flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <h2 className="text-[26px] font-black text-slate-900 mt-3 font-mono tracking-tight leading-none">
              {formatCurrency(totalRevenue)}
            </h2>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
              </span>
              <span className="text-slate-400 font-medium">all channels</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-100/50 hover:ring-emerald-300/60 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-emerald-50/0 transition-all duration-300 group-hover:from-emerald-50/40 group-hover:to-emerald-50/10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Net Profit</p>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-100">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <h2 className="text-[26px] font-black text-slate-900 mt-3 font-mono tracking-tight leading-none">
              {formatCurrency(netProfit)}
            </h2>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-bold">Gross: {formatCurrency(grossProfit)}</span>
              <span className="text-slate-400 font-medium">Exp: {formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 transition-all duration-300 hover:shadow-xl hover:shadow-amber-100/50 hover:ring-amber-300/60 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/0 to-amber-50/0 transition-all duration-300 group-hover:from-amber-50/40 group-hover:to-amber-50/10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Receivables</p>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-amber-100">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <h2 className="text-[26px] font-black text-amber-600 mt-3 font-mono tracking-tight leading-none">
              {formatCurrency(totalPendingReceivables)}
            </h2>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded-lg">{pendingInvoicesCount} invoice{pendingInvoicesCount !== 1 ? 's' : ''} pending</span>
              <button
                onClick={() => onNavigateTab('payments')}
                className="text-[var(--accent-color)] hover:text-[var(--accent-color-dark)] font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform"
              >
                Collect <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 transition-all duration-300 hover:shadow-xl hover:shadow-red-100/50 hover:ring-red-300/60 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-50/0 transition-all duration-300 group-hover:from-red-50/40 group-hover:to-red-50/10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Low Stock Alerts</p>
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-red-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <h2 className="text-[26px] font-black text-slate-900 mt-3 font-mono tracking-tight leading-none">
              {lowStockProducts.length} <span className="text-sm font-sans font-medium text-slate-500">Items</span>
            </h2>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-red-600 font-bold">Below reorder minimum</span>
              <button
                onClick={() => onNavigateTab('inventory')}
                className="text-[var(--accent-color)] hover:text-[var(--accent-color-dark)] font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform"
              >
                Restock <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Section: Business Financial Performance */}
      <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/80 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-slate-900">Financial Performance & Net Profitability</h3>
                <span className="px-2.5 py-1 text-[10px] font-extrabold bg-[var(--accent-color-light)] text-[var(--accent-color-dark)] rounded-lg ring-1 ring-[var(--accent-color-light)]">
                  ANALYTICS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Real-time revenue, product cost margin, operating expenses, and net profit</p>
            </div>

            {/* Time range selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
              {(['daily', 'weekly', 'monthly', 'yearly'] as TimeRange[]).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-all duration-200 ${
                    timeRange === range
                      ? 'bg-white text-[var(--accent-color-dark)] shadow-sm ring-1 ring-[var(--accent-color-light)] font-extrabold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={v => `$${v}`} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '12px 16px',
                  }}
                  formatter={(val) => (val !== undefined ? [`$${val.toLocaleString()}`, ''] : ['--', ''])}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
                <Area type="monotone" dataKey="cost" name="Product Cost" stroke="#f59e0b" strokeWidth={1.5} fillOpacity={0} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={1.5} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two-Column Lower Grid: Recent Sales Log + Critical Stock & Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Invoices & Sales Table */}
        <div className="lg:col-span-2 rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/80 flex flex-col overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50/80 to-white">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Sales & Profit Realization</h3>
              <p className="text-xs text-slate-400 mt-0.5">Transactions processed across registers</p>
            </div>
            <button
              onClick={() => onNavigateTab('sales')}
              className="text-xs text-[var(--accent-color)] font-bold hover:text-[var(--accent-color-dark)] flex items-center gap-1 hover:underline underline-offset-4"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50/60 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 border-b border-slate-100 font-semibold">Invoice / Client</th>
                  <th className="px-5 py-3.5 border-b border-slate-100 font-semibold">Total</th>
                  <th className="px-5 py-3.5 border-b border-slate-100 font-semibold">Method</th>
                  <th className="px-5 py-3.5 border-b border-slate-100 font-semibold">Status</th>
                  <th className="px-5 py-3.5 border-b border-slate-100 text-right font-semibold">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentSales.map(sale => {
                  let statusBadge = (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                      Paid
                    </span>
                  );
                  if (sale.paymentStatus === 'PENDING') {
                    statusBadge = (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                        Pending
                      </span>
                    );
                  } else if (sale.paymentStatus === 'PARTIAL') {
                    statusBadge = (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                        Partial (${sale.amountDue} due)
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={sale.id}
                      onClick={() => onSelectInvoice(sale)}
                      className="hover:bg-[var(--accent-color-light)] transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 group-hover:text-[var(--accent-color-dark)] transition-colors">
                          {sale.clientName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sale.invoiceNumber}</div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">
                        {formatCurrency(sale.grandTotal)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-mono font-bold">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">{statusBadge}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600">
                        +{formatCurrency(sale.profit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Stock & Assets Card */}
        <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/80 flex flex-col overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50/80 to-white">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Critical Inventory</h3>
              <p className="text-xs text-slate-400 mt-0.5">Items nearing replenishment threshold</p>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs text-[var(--accent-color)] font-bold hover:underline underline-offset-4"
            >
              Manage
            </button>
          </div>

          <div className="p-5 sm:p-6 flex-1 space-y-5">
            {lowStockProducts.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                <Package className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                All products meet safe inventory thresholds.
              </div>
            ) : (
              lowStockProducts.slice(0, 4).map(prod => {
                const percent = Math.min(100, Math.round((prod.stockQuantity / (prod.minStockThreshold * 2)) * 100));
                const isVeryLow = prod.stockQuantity <= prod.minStockThreshold / 2;

                return (
                  <div key={prod.id} className="space-y-2.5 pb-4 border-b border-slate-100 last:border-0 last:pb-0 last:mb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate">{prod.name}</span>
                        <span className="text-[10px] text-slate-400">{prod.category}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-bold font-mono ${isVeryLow ? 'text-red-600' : 'text-amber-600'}`}>
                          {prod.stockQuantity} {prod.unit}
                        </span>
                        <button
                          onClick={() => onOpenRestockProduct(prod.id)}
                           className="p-1.5 text-[var(--accent-color)] hover:bg-[var(--accent-color-light)] rounded-xl transition-colors"
                          title="Restock now"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isVeryLow ? 'bg-red-500' : 'bg-amber-400'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}

            {/* Inventory Asset Valuation Box */}
            <div className="mt-5 pt-5 border-t border-slate-100">
              <div className="p-5 bg-gradient-to-br from-[var(--accent-color-light)] via-[var(--accent-color-light)] to-white rounded-2xl ring-1 ring-[var(--accent-color-light)]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-extrabold text-[var(--accent-color-dark)] uppercase tracking-wider">Total Inventory Assets</p>
                  <span className="text-[10px] text-[var(--accent-color-dark)] font-bold">Cost vs Retail</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-lg font-black text-slate-900 font-mono">{formatCurrency(inventoryCostValue)}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-medium">(At Cost)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-600 font-mono">{formatCurrency(inventoryRetailValue)}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-medium">(Retail)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

