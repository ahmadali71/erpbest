import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Download,
  Printer,
  Calendar,
  DollarSign,
  Receipt,
  Users,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useERP } from '../../context/ERPContext';
import { TimeRange } from '../../types/erp';

export const ReportsView: React.FC = () => {
  const {
    sales,
    expenses,
    products,
    clients,
    totalRevenue,
    totalCollected,
    totalCostOfGoodsSold,
    grossProfit,
    totalExpenses,
    netProfit,
    totalPendingReceivables,
    getFinancialPerformanceData,
  } = useERP();

  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
  const [reportTab, setReportTab] = useState<'pnl' | 'products' | 'clients' | 'payment_methods'>('pnl');

  const performanceData = getFinancialPerformanceData(timeRange);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  // Payment method distribution
  const paymentMethodData = useMemo(() => {
    const map: { [method: string]: number } = {
      CASH: 0,
      CARD: 0,
      CREDIT: 0,
      BANK_TRANSFER: 0,
    };
    sales.forEach(s => {
      map[s.paymentMethod] = (map[s.paymentMethod] || 0) + s.grandTotal;
    });
    return Object.entries(map).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value: Math.round(value),
    }));
  }, [sales]);

  // Product sales performance
  const productPerformance = useMemo(() => {
    const map: { [id: string]: { name: string; sku: string; unitsSold: number; revenue: number; profit: number } } = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        if (!map[item.productId]) {
          map[item.productId] = {
            name: item.productName,
            sku: item.sku,
            unitsSold: 0,
            revenue: 0,
            profit: 0,
          };
        }
        map[item.productId].unitsSold += item.quantity;
        map[item.productId].revenue += item.total;
        map[item.productId].profit += item.profit;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  // Top clients ranking
  const topClients = useMemo(() => {
    return [...clients].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);
  }, [clients]);

  // Profit Margin calculation
  const grossMarginPct = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;
  const netMarginPct = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

  // CSV Export utility
  const exportToCSV = () => {
    const rows = [
      ['Nexus ERP Financial Performance Summary'],
      ['Generated Date', new Date().toISOString()],
      ['Time Period', timeRange.toUpperCase()],
      [],
      ['Metric', 'Amount (USD)'],
      ['Total Revenue', totalRevenue],
      ['Cost of Goods Sold (COGS)', totalCostOfGoodsSold],
      ['Gross Profit', grossProfit],
      ['Gross Margin (%)', `${grossMarginPct}%`],
      ['Total Operating Expenses', totalExpenses],
      ['Net Profit', netProfit],
      ['Net Margin (%)', `${netMarginPct}%`],
      ['Total Pending Receivables', totalPendingReceivables],
      [],
      ['Top Products by Revenue'],
      ['Product Name', 'SKU', 'Units Sold', 'Revenue ($)', 'Profit ($)'],
      ...productPerformance.map(p => [p.name, p.sku, p.unitsSold, p.revenue, p.profit]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ERP_Financial_Report_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span>Business Intelligence & Financial Reports</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time profit & loss accounting, revenue breakdown, and sales velocity
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            {(['daily', 'weekly', 'monthly', 'yearly'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all ${
                  timeRange === range
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={exportToCSV}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Gross Revenue</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalRevenue)}</h3>
          <p className="text-xs text-emerald-600 font-medium mt-0.5">{sales.length} Invoiced Orders</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cost of Goods (COGS)</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalCostOfGoodsSold)}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Product purchase basis</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Operating Expenses</p>
          <h3 className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalExpenses)}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{expenses.length} overhead logs</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-500">
          <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Net Profit</p>
          <h3 className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(netProfit)}</h3>
          <p className="text-xs text-emerald-600 font-semibold mt-0.5">{netMarginPct}% Net Margin</p>
        </div>
      </div>

      {/* Recharts Multi-Period Bar Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {timeRange.toUpperCase()} Financial Trends
            </h3>
            <p className="text-xs text-slate-400">Comparison of Revenue vs Costs vs Net Profit</p>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                  fontSize: '12px',
                }}
                formatter={(val) => (val !== undefined ? [`$${val.toLocaleString()}`, ''] : ['--', ''])}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="revenue" name="Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" name="Product Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Net Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sub-Reports Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/50 overflow-x-auto">
          <button
            onClick={() => setReportTab('pnl')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              reportTab === 'pnl' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profit & Loss Statement
          </button>
          <button
            onClick={() => setReportTab('products')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              reportTab === 'products' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Product Sales Velocity ({productPerformance.length})
          </button>
          <button
            onClick={() => setReportTab('clients')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              reportTab === 'clients' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Top Customer Accounts ({topClients.length})
          </button>
          <button
            onClick={() => setReportTab('payment_methods')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              reportTab === 'payment_methods' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Payment Channels & Settlement
          </button>
        </div>

        {/* Tab 1: P&L Statement */}
        {reportTab === 'pnl' && (
          <div className="p-6 space-y-6">
            <div className="max-w-3xl mx-auto bg-slate-50/50 p-6 rounded-xl border border-slate-200 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h4 className="font-bold text-slate-900 text-sm">Income Statement (P&L)</h4>
                <p className="text-xs text-slate-400">Statement of Operations</p>
              </div>

              {/* Revenue */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-900">
                  <span>Gross Operating Revenue</span>
                  <span>{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 pl-4">
                  <span>Less: Cost of Goods Sold (COGS)</span>
                  <span className="text-red-600">-{formatCurrency(totalCostOfGoodsSold)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-indigo-700 pt-2 border-t border-slate-200">
                  <span>Gross Profit</span>
                  <span>{formatCurrency(grossProfit)} ({grossMarginPct}%)</span>
                </div>
              </div>

              {/* Operating Expenses */}
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <div className="flex justify-between text-xs font-bold text-slate-900">
                  <span>Operating Expenses (Overhead)</span>
                  <span className="text-red-600">-{formatCurrency(totalExpenses)}</span>
                </div>
                {expenses.map(e => (
                  <div key={e.id} className="flex justify-between text-xs text-slate-500 pl-4">
                    <span>{e.title} ({e.category})</span>
                    <span>-{formatCurrency(e.amount)}</span>
                  </div>
                ))}
              </div>

              {/* Net Operating Profit */}
              <div className="pt-4 border-t-2 border-slate-300">
                <div className="flex justify-between text-sm font-bold text-emerald-700">
                  <span>Net Operating Profit</span>
                  <span>{formatCurrency(netProfit)} ({netMarginPct}%)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Products Performance */}
        {reportTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3 border-b border-slate-100">Product & SKU</th>
                  <th className="px-5 py-3 border-b border-slate-100">Units Sold</th>
                  <th className="px-5 py-3 border-b border-slate-100">Total Revenue</th>
                  <th className="px-5 py-3 border-b border-slate-100 font-bold text-emerald-600">Total Profit</th>
                  <th className="px-5 py-3 border-b border-slate-100">Profit Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {productPerformance.map(p => {
                  const marginPct = p.revenue > 0 ? Math.round((p.profit / p.revenue) * 100) : 0;
                  return (
                    <tr key={p.sku} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {p.unitsSold} units
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                        {formatCurrency(p.revenue)}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-emerald-600">
                        +{formatCurrency(p.profit)}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-medium text-slate-700">
                        {marginPct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Top Clients */}
        {reportTab === 'clients' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3 border-b border-slate-100">Client / Company</th>
                  <th className="px-5 py-3 border-b border-slate-100">Email</th>
                  <th className="px-5 py-3 border-b border-slate-100">Total Invoiced</th>
                  <th className="px-5 py-3 border-b border-slate-100">Outstanding Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {topClients.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {c.name} {c.company && <span className="text-slate-400 font-normal">({c.company})</span>}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{c.email}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      {c.outstandingBalance > 0 ? (
                        <span className="font-bold text-amber-700">{formatCurrency(c.outstandingBalance)}</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Clear</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Payment Methods Distribution */}
        {reportTab === 'payment_methods' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {paymentMethodData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Total']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-sm">Settlement Channel Breakdown</h4>
              {paymentMethodData.map((m, idx) => (
                <div key={m.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="font-medium text-xs text-slate-800">{m.name}</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-slate-900">{formatCurrency(m.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
