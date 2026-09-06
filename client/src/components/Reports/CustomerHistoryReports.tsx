import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  FileText,
  Calendar,
  DollarSign,
  Printer,
  Download,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Building,
  Mail,
  Phone,
  ChevronRight,
  Filter,
  ArrowUpDown,
  ShoppingBag,
  RotateCcw,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Client, SaleInvoice } from '../../types/erp';
import { CustomerHistoryDetails } from '../Clients/CustomerHistoryDetails';

interface CustomerHistoryReportsProps {
  initialClientId?: string;
  onSelectInvoice?: (invoice: SaleInvoice) => void;
  onOpenRecordPayment?: (invoice: SaleInvoice) => void;
  onOpenNewSale?: (client: Client) => void;
}

export type CustomerReportSubView = 'statement' | 'aging' | 'profitability';

export const CustomerHistoryReports: React.FC<CustomerHistoryReportsProps> = ({
  initialClientId,
  onSelectInvoice,
  onOpenRecordPayment,
  onOpenNewSale,
}) => {
  const { clients, sales, returns, formatCurrency, settings } = useERP();

  // Selected client state
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    if (initialClientId && clients.some(c => c.id === initialClientId)) {
      return initialClientId;
    }
    return clients.length > 0 ? clients[0].id : '';
  });

  const [activeReportSubView, setActiveReportSubView] = useState<CustomerReportSubView>('statement');
  const [clientSearch, setClientSearch] = useState<string>('');

  // Selected client object
  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || clients[0] || null;
  }, [clients, selectedClientId]);

  // Filtered clients list for the left sidebar or selector
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const term = clientSearch.toLowerCase();
    return clients.filter(
      c =>
        c.name.toLowerCase().includes(term) ||
        (c.company && c.company.toLowerCase().includes(term)) ||
        c.email.toLowerCase().includes(term) ||
        c.phone.includes(term)
    );
  }, [clients, clientSearch]);

  // Customer Aging Analysis Calculation (Receivables Aging: 0-30, 31-60, 61-90, 90+ days)
  const agingReport = useMemo(() => {
    const now = new Date();
    const rows = clients
      .filter(c => c.outstandingBalance > 0)
      .map(client => {
        const clientSales = sales.filter(s => s.clientId === client.id && s.amountDue > 0);

        let current0_30 = 0;
        let days31_60 = 0;
        let days61_90 = 0;
        let days90Plus = 0;

        clientSales.forEach(sale => {
          const saleDate = new Date(sale.date);
          const diffTime = Math.abs(now.getTime() - saleDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 30) {
            current0_30 += sale.amountDue;
          } else if (diffDays <= 60) {
            days31_60 += sale.amountDue;
          } else if (diffDays <= 90) {
            days61_90 += sale.amountDue;
          } else {
            days90Plus += sale.amountDue;
          }
        });

        // Credit utilization percentage
        const creditUsagePct =
          client.creditLimit > 0
            ? Math.min(100, Math.round((client.outstandingBalance / client.creditLimit) * 100))
            : 0;

        return {
          client,
          totalDue: client.outstandingBalance,
          current0_30,
          days31_60,
          days61_90,
          days90Plus,
          creditLimit: client.creditLimit,
          creditUsagePct,
        };
      })
      .sort((a, b) => b.totalDue - a.totalDue);

    const totals = rows.reduce(
      (acc, r) => ({
        totalDue: acc.totalDue + r.totalDue,
        current0_30: acc.current0_30 + r.current0_30,
        days31_60: acc.days31_60 + r.days31_60,
        days61_90: acc.days61_90 + r.days61_90,
        days90Plus: acc.days90Plus + r.days90Plus,
      }),
      { totalDue: 0, current0_30: 0, days31_60: 0, days61_90: 0, days90Plus: 0 }
    );

    return { rows, totals };
  }, [clients, sales]);

  // Customer Profitability Ranking
  const customerProfitability = useMemo(() => {
    return clients
      .map(client => {
        const clientSales = sales.filter(s => s.clientId === client.id);
        const revenue = clientSales.reduce((acc, s) => acc + s.grandTotal, 0);
        const cost = clientSales.reduce((acc, s) => acc + (s.totalCost || 0), 0);
        const profit = clientSales.reduce((acc, s) => acc + (s.profit || 0), 0);
        const marginPct = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

        return {
          client,
          invoiceCount: clientSales.length,
          revenue,
          cost,
          profit,
          marginPct,
          outstanding: client.outstandingBalance,
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [clients, sales]);

  // Export Aging CSV
  const exportAgingCSV = () => {
    const headers = ['Client Name', 'Company', 'Phone', 'Total Due ($)', 'Current (0-30d)', '31-60 Days', '61-90 Days', '90+ Days', 'Credit Limit ($)'];
    const rows = agingReport.rows.map(r => [
      r.client.name,
      r.client.company || 'N/A',
      r.client.phone,
      r.totalDue,
      r.current0_30,
      r.days31_60,
      r.days61_90,
      r.days90Plus,
      r.creditLimit,
    ]);

    const content =
      'data:text/csv;charset=utf-8,' +
      [
        ['Nexus ERP - Accounts Receivable Aging Report'],
        ['Generated', new Date().toLocaleString()],
        [],
        headers,
        ...rows,
        [],
        ['TOTALS', '', '', agingReport.totals.totalDue, agingReport.totals.current0_30, agingReport.totals.days31_60, agingReport.totals.days61_90, agingReport.totals.days90Plus, ''],
      ]
        .map(e => e.join(','))
        .join('\n');

    const uri = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', uri);
    link.setAttribute('download', `Receivables_Aging_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Customer Profitability CSV
  const exportProfitabilityCSV = () => {
    const headers = ['Client Name', 'Company', 'Invoices Count', 'Total Revenue ($)', 'Total Cost ($)', 'Store Profit ($)', 'Margin (%)', 'Outstanding Due ($)'];
    const rows = customerProfitability.map(c => [
      c.client.name,
      c.client.company || 'N/A',
      c.invoiceCount,
      c.revenue,
      c.cost,
      c.profit,
      `${c.marginPct}%`,
      c.outstanding,
    ]);

    const content =
      'data:text/csv;charset=utf-8,' +
      [
        ['Nexus ERP - Customer Lifetime Value & Profitability Report'],
        ['Generated', new Date().toLocaleString()],
        [],
        headers,
        ...rows,
      ]
        .map(e => e.join(','))
        .join('\n');

    const uri = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', uri);
    link.setAttribute('download', `Customer_Profitability_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Customer History & Comprehensive Financial Reports
              </h2>
              <p className="text-xs text-slate-400">
                Statements of account, 360° transaction history, receivables aging analysis, and customer profitability
              </p>
            </div>
          </div>
        </div>

        {/* Sub-View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveReportSubView('statement')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeReportSubView === 'statement'
                  ? 'bg-white text-(--accent-color-dark) shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Statement & 360 History
            </button>
            <button
              onClick={() => setActiveReportSubView('aging')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeReportSubView === 'aging'
                  ? 'bg-white text-amber-800 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Receivables Aging ({agingReport.rows.length})
            </button>
            <button
              onClick={() => setActiveReportSubView('profitability')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeReportSubView === 'profitability'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Customer Profitability
            </button>
          </div>

          {activeReportSubView === 'aging' && (
            <button
              onClick={exportAgingCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Aging CSV</span>
            </button>
          )}

          {activeReportSubView === 'profitability' && (
            <button
              onClick={exportProfitabilityCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Profit CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: STATEMENT OF ACCOUNT & INDIVIDUAL CUSTOMER 360 HISTORY */}
      {activeReportSubView === 'statement' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Customer Selection Sidebar */}
          <div className="lg:col-span-1 bg-white p-4 sm:p-5 rounded-3xl ring-1 ring-slate-200/80 shadow-sm space-y-3 flex flex-col h-fit">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Select Customer
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {clients.length} Accounts
              </span>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search clients..."
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-(--accent-color)"
              />
            </div>

            {/* List */}
            <div className="space-y-1 max-h-125 overflow-y-auto pr-1">
              {filteredClients.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No clients match search.
                </div>
              ) : (
                filteredClients.map(c => {
                  const isSelected = selectedClient?.id === c.id;
                  const hasDue = c.outstandingBalance > 0;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className={`w-full p-2.5 rounded-2xl text-left text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-(--accent-color-light) text-(--accent-color-dark) ring-1 ring-(--accent-color) shadow-2xs font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{c.name}</div>
                        {c.company && (
                          <div className="text-[10px] text-slate-400 truncate">{c.company}</div>
                        )}
                      </div>
                      <div className="text-right pl-2 shrink-0">
                        {hasDue ? (
                          <span className="font-mono text-[11px] font-bold text-amber-700 block">
                            {formatCurrency(c.outstandingBalance)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-medium block">
                            Clear
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Main Customer History Component */}
          <div className="lg:col-span-3">
            {selectedClient ? (
              <CustomerHistoryDetails
                client={selectedClient}
                onSelectInvoice={onSelectInvoice}
                onOpenNewSale={onOpenNewSale}
                onOpenRecordPayment={onOpenRecordPayment}
              />
            ) : (
              <div className="bg-white p-12 rounded-3xl ring-1 ring-slate-200/80 text-center text-slate-400 text-xs">
                No customer selected. Please select a customer on the left.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: RECEIVABLES AGING ANALYSIS REPORT */}
      {activeReportSubView === 'aging' && (
        <div className="space-y-6">
          {/* Aging KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-3xl ring-1 ring-slate-200/80 shadow-sm border-l-4 border-l-amber-500">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Outstanding Due</p>
              <h3 className="text-2xl font-bold text-amber-700 mt-1">
                {formatCurrency(agingReport.totals.totalDue)}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{agingReport.rows.length} customers with balance</p>
            </div>

            <div className="bg-white p-5 rounded-3xl ring-1 ring-slate-200/80 shadow-sm">
              <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Current (0 - 30 Days)</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrency(agingReport.totals.current0_30)}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Recent invoices</p>
            </div>

            <div className="bg-white p-5 rounded-3xl ring-1 ring-slate-200/80 shadow-sm">
              <p className="text-xs text-blue-700 font-bold uppercase tracking-wider">31 - 60 Days</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrency(agingReport.totals.days31_60)}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Mildly overdue</p>
            </div>

            <div className="bg-white p-5 rounded-3xl ring-1 ring-slate-200/80 shadow-sm">
              <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">61 - 90 Days</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrency(agingReport.totals.days61_90)}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Action recommended</p>
            </div>

            <div className="bg-white p-5 rounded-3xl ring-1 ring-slate-200/80 shadow-sm">
              <p className="text-xs text-rose-700 font-bold uppercase tracking-wider">90+ Days Overdue</p>
              <h3 className="text-xl font-bold text-rose-600 mt-1">
                {formatCurrency(agingReport.totals.days90Plus)}
              </h3>
              <p className="text-xs text-rose-500 mt-0.5">High credit risk</p>
            </div>
          </div>

          {/* Aging Table */}
          <div className="bg-white rounded-3xl ring-1 ring-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Accounts Receivable Aging Schedule
                </h4>
                <p className="text-xs text-slate-400">
                  Detailed timeline of unpaid customer balances categorized by age of invoice
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-5 py-3 border-b border-slate-100">Customer</th>
                    <th className="px-5 py-3 border-b border-slate-100 font-bold text-amber-700 text-right">
                      Total Due
                    </th>
                    <th className="px-5 py-3 border-b border-slate-100 text-right">Current (0-30d)</th>
                    <th className="px-5 py-3 border-b border-slate-100 text-right">31-60 Days</th>
                    <th className="px-5 py-3 border-b border-slate-100 text-right">61-90 Days</th>
                    <th className="px-5 py-3 border-b border-slate-100 text-right text-rose-600">90+ Days</th>
                    <th className="px-5 py-3 border-b border-slate-100">Credit Limit Utilization</th>
                    <th className="px-5 py-3 border-b border-slate-100 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {agingReport.rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                        All customer accounts are clear! Zero pending receivables.
                      </td>
                    </tr>
                  ) : (
                    agingReport.rows.map(row => (
                      <tr key={row.client.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">{row.client.name}</div>
                          {row.client.company && (
                            <div className="text-[11px] text-slate-400">{row.client.company}</div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-amber-700">
                          {formatCurrency(row.totalDue)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-slate-700">
                          {row.current0_30 > 0 ? formatCurrency(row.current0_30) : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-slate-700">
                          {row.days31_60 > 0 ? formatCurrency(row.days31_60) : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-slate-700">
                          {row.days61_90 > 0 ? formatCurrency(row.days61_90) : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-600">
                          {row.days90Plus > 0 ? formatCurrency(row.days90Plus) : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-400">{row.creditUsagePct}% of limit</span>
                              <span className="font-mono text-slate-600">
                                {formatCurrency(row.creditLimit)}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  row.creditUsagePct > 90
                                    ? 'bg-rose-500'
                                    : row.creditUsagePct > 60
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${row.creditUsagePct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedClientId(row.client.id);
                              setActiveReportSubView('statement');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            View Dossier
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: CUSTOMER LIFETIME VALUE & PROFITABILITY */}
      {activeReportSubView === 'profitability' && (
        <div className="bg-white rounded-3xl ring-1 ring-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Customer Profitability & Contribution Ranking
              </h4>
              <p className="text-xs text-slate-400">
                Gross profit and contribution margins generated per customer account
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              {customerProfitability.length} Accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3 border-b border-slate-100">Customer</th>
                  <th className="px-5 py-3 border-b border-slate-100 text-center">Orders</th>
                  <th className="px-5 py-3 border-b border-slate-100 text-right">Lifetime Revenue</th>
                  <th className="px-5 py-3 border-b border-slate-100 text-right font-bold text-emerald-600">
                    Net Profit Yield
                  </th>
                  <th className="px-5 py-3 border-b border-slate-100 text-right">Margin %</th>
                  <th className="px-5 py-3 border-b border-slate-100 text-right">Current Due</th>
                  <th className="px-5 py-3 border-b border-slate-100 text-right">Statement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {customerProfitability.map((item, idx) => (
                  <tr key={item.client.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900">{item.client.name}</div>
                          {item.client.company && (
                            <div className="text-[11px] text-slate-400">{item.client.company}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono font-medium text-slate-700">
                      {item.invoiceCount}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.revenue)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600">
                      +{formatCurrency(item.profit)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-medium text-slate-700">
                      {item.marginPct}%
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono">
                      {item.outstanding > 0 ? (
                        <span className="font-bold text-amber-700">{formatCurrency(item.outstanding)}</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Clear</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedClientId(item.client.id);
                          setActiveReportSubView('statement');
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Statement
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
