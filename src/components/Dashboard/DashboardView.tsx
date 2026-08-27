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
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      {/* Top Welcome / Command Bar */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        {/* Abstract background decorative accents */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/15 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold tracking-wide">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentDate}</span>
              <span className="text-indigo-400">•</span>
              <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync ({activeTerminals} Terminals)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1.5">
              Welcome back, Administrator
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-xl">
              Enterprise operations running smoothly. Real-time sales, inventory valuations, and order conversions are synced across all active registers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('pos')}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-sm hover:scale-[1.02]"
            >
              <Store className="w-4 h-4" />
              <span>Launch POS</span>
            </button>
            <button
              onClick={onOpenNewSale}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-xs border border-white/10 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-indigo-300" />
              <span>New Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all hover:shadow-md group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Total Sales</p>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-2 font-mono tracking-tight">
            {formatCurrency(totalRevenue)}
          </h2>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
            </span>
            <span className="text-slate-400 font-medium">all channels</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all hover:shadow-md group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Net Profit</p>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-2 font-mono tracking-tight">
            {formatCurrency(netProfit)}
          </h2>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-indigo-600 font-bold">Gross: {formatCurrency(grossProfit)}</span>
            <span className="text-slate-400 font-medium">Exp: {formatCurrency(totalExpenses)}</span>
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-200 transition-all hover:shadow-md group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Receivables</p>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-2 font-mono tracking-tight text-amber-600">
            {formatCurrency(totalPendingReceivables)}
          </h2>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-amber-700 font-bold">{pendingInvoicesCount} invoices pending</span>
            <button
              onClick={() => onNavigateTab('payments')}
              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
            >
              Collect <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-red-200 transition-all hover:shadow-md group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Low Stock Alerts</p>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-2 font-mono tracking-tight">
            {lowStockProducts.length} <span className="text-sm font-sans font-medium text-slate-500">Items</span>
          </h2>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-red-600 font-bold">Below reorder minimum</span>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
            >
              Restock <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Section: Business Financial Performance */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Financial Performance & Net Profitability</h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-50 text-indigo-700 rounded-md">
                ANALYTICS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Real-time revenue, product cost margin, operating expenses, and net profit</p>
          </div>

          {/* Time range selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60">
            {(['daily', 'weekly', 'monthly', 'yearly'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                  timeRange === range
                    ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="h-68 sm:h-76 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
                formatter={(val) => (val !== undefined ? [`$${val.toLocaleString()}`, ''] : ['--', ''])}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
              <Area type="monotone" dataKey="cost" name="Product Cost" stroke="#f59e0b" strokeWidth={1.5} fillOpacity={0} />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={1.5} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-Column Lower Grid: Recent Sales Log + Critical Stock & Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices & Sales Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Sales & Profit Realization</h3>
              <p className="text-xs text-slate-400">Transactions processed across registers</p>
            </div>
            <button
              onClick={() => onNavigateTab('sales')}
              className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1 hover:underline"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 border-b border-slate-100">Invoice / Client</th>
                  <th className="px-5 py-3.5 border-b border-slate-100">Total</th>
                  <th className="px-5 py-3.5 border-b border-slate-100">Method</th>
                  <th className="px-5 py-3.5 border-b border-slate-100">Status</th>
                  <th className="px-5 py-3.5 border-b border-slate-100 text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentSales.map(sale => {
                  let statusBadge = (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Paid
                    </span>
                  );
                  if (sale.paymentStatus === 'PENDING') {
                    statusBadge = (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Pending
                      </span>
                    );
                  } else if (sale.paymentStatus === 'PARTIAL') {
                    statusBadge = (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Partial (${sale.amountDue} due)
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={sale.id}
                      onClick={() => onSelectInvoice(sale)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {sale.clientName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{sale.invoiceNumber}</div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">
                        {formatCurrency(sale.grandTotal)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-mono font-bold">
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
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Critical Inventory</h3>
              <p className="text-xs text-slate-400">Items nearing replenishment threshold</p>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              Manage
            </button>
          </div>

          <div className="p-4 sm:p-5 flex-1 space-y-4">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                All products meet safe inventory thresholds.
              </div>
            ) : (
              lowStockProducts.slice(0, 4).map(prod => {
                const percent = Math.min(100, Math.round((prod.stockQuantity / (prod.minStockThreshold * 2)) * 100));
                const isVeryLow = prod.stockQuantity <= prod.minStockThreshold / 2;

                return (
                  <div key={prod.id} className="space-y-1.5 pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800 truncate max-w-[160px]">{prod.name}</span>
                        <span className="text-[10px] text-slate-400">{prod.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold font-mono ${isVeryLow ? 'text-red-600' : 'text-amber-600'}`}>
                          {prod.stockQuantity} {prod.unit} left
                        </span>
                        <button
                          onClick={() => onOpenRestockProduct(prod.id)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Restock now"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${isVeryLow ? 'bg-red-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.max(8, percent)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Inventory Asset Valuation Box */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-slate-50 rounded-xl border border-indigo-100/80">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-extrabold text-indigo-800 uppercase tracking-wider">Total Inventory Assets</p>
                  <span className="text-[10px] text-indigo-600 font-bold">Cost vs Retail</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <div>
                    <span className="text-lg font-black text-slate-900 font-mono">{formatCurrency(inventoryCostValue)}</span>
                    <span className="text-[10px] text-slate-400 ml-1 font-medium">(At Cost)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-600 font-mono">{formatCurrency(inventoryRetailValue)}</span>
                    <span className="text-[10px] text-slate-400 ml-1 font-medium">(Retail)</span>
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

