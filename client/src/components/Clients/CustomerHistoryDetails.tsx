import React, { useState, useMemo } from 'react';
import {
  History,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Building,
  Printer,
  Download,
  ShoppingBag,
  RotateCcw,
  CreditCard,
  TrendingUp,
  Receipt,
  FileCheck,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ExternalLink,
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
} from 'recharts';
import { useERP } from '../../context/ERPContext';
import { Client, SaleInvoice, SaleReturn, Quotation, PaymentTransaction } from '../../types/erp';

export interface CustomerHistoryDetailsProps {
  client: Client;
  onSelectInvoice?: (invoice: SaleInvoice) => void;
  onOpenNewSale?: (client: Client) => void;
  onOpenRecordPayment?: (invoice: SaleInvoice) => void;
  initialTab?: 'statement' | 'invoices' | 'payments' | 'products' | 'returns' | 'quotations';
}

export type HistoryTab =
  | 'statement'
  | 'invoices'
  | 'payments'
  | 'products'
  | 'returns'
  | 'quotations';

export const CustomerHistoryDetails: React.FC<CustomerHistoryDetailsProps> = ({
  client,
  onSelectInvoice,
  onOpenNewSale,
  onOpenRecordPayment,
  initialTab = 'statement',
}) => {
  const { sales, quotations, returns, settings, formatCurrency } = useERP();
  const [activeTab, setActiveTab] = useState<HistoryTab>(initialTab);
  const [dateFilter, setDateFilter] = useState<'ALL' | 'THIS_YEAR' | 'LAST_90' | 'LAST_30'>('ALL');

  // Filter client records
  const clientSales = useMemo(() => {
    return sales
      .filter(s => s.clientId === client.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, client.id]);

  const clientQuotations = useMemo(() => {
    return quotations
      .filter(q => q.clientId === client.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [quotations, client.id]);

  const clientReturns = useMemo(() => {
    return returns
      .filter(r => r.clientId === client.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [returns, client.id]);

  // Date filtering logic
  const now = new Date();
  const dateThreshold = useMemo(() => {
    if (dateFilter === 'THIS_YEAR') {
      return new Date(now.getFullYear(), 0, 1);
    }
    if (dateFilter === 'LAST_90') {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      return d;
    }
    if (dateFilter === 'LAST_30') {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d;
    }
    return null;
  }, [dateFilter]);

  const filteredSales = useMemo(() => {
    if (!dateThreshold) return clientSales;
    return clientSales.filter(s => new Date(s.date) >= dateThreshold);
  }, [clientSales, dateThreshold]);

  // All payments received from this customer
  const clientPayments = useMemo(() => {
    const list: Array<{
      id: string;
      invoiceId: string;
      invoiceNumber: string;
      amount: number;
      method: string;
      date: string;
      note?: string;
      recordedBy: string;
    }> = [];

    clientSales.forEach(sale => {
      if (sale.payments && Array.isArray(sale.payments)) {
        sale.payments.forEach(p => {
          list.push({
            id: p.id,
            invoiceId: sale.id,
            invoiceNumber: sale.invoiceNumber,
            amount: p.amount,
            method: p.method,
            date: p.date,
            note: p.note,
            recordedBy: p.recordedBy,
          });
        });
      }
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [clientSales]);

  // Statement of Account (Chronological Running Balance Ledger)
  const statementLedger = useMemo(() => {
    interface LedgerEvent {
      id: string;
      date: string;
      type: 'INVOICE' | 'PAYMENT' | 'RETURN';
      reference: string;
      description: string;
      debit: number;  // increases balance
      credit: number; // decreases balance
      balance: number;
      invoiceObj?: SaleInvoice;
    }

    const events: LedgerEvent[] = [];

    // 1. Invoices
    clientSales.forEach(s => {
      events.push({
        id: `inv-${s.id}`,
        date: s.date,
        type: 'INVOICE',
        reference: s.invoiceNumber,
        description: `Sale Invoice (${s.items?.length || 0} items)`,
        debit: s.grandTotal,
        credit: 0,
        balance: 0,
        invoiceObj: s,
      });
    });

    // 2. Payments
    clientPayments.forEach(p => {
      events.push({
        id: `pay-${p.id}`,
        date: p.date,
        type: 'PAYMENT',
        reference: `PAY-${p.invoiceNumber}`,
        description: `Payment via ${p.method}${p.note ? ` (${p.note})` : ''}`,
        debit: 0,
        credit: p.amount,
        balance: 0,
      });
    });

    // 3. Returns
    clientReturns.forEach(r => {
      events.push({
        id: `ret-${r.id}`,
        date: r.date,
        type: 'RETURN',
        reference: r.returnNumber,
        description: `Credit Memo / Return for ${r.invoiceNumber}`,
        debit: 0,
        credit: r.netRefundAmount,
        balance: 0,
      });
    });

    // Sort chronologically ascending to compute running balance correctly
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    events.forEach(e => {
      running += (e.debit - e.credit);
      e.balance = Math.round(running * 100) / 100;
    });

    // If date filter is applied, filter after running balance has accumulated
    if (dateThreshold) {
      return events
        .filter(e => new Date(e.date) >= dateThreshold)
        .reverse();
    }

    return events.reverse();
  }, [clientSales, clientPayments, clientReturns, dateThreshold]);

  // Purchased Products Portfolio (Products bought by this customer)
  const purchasedProducts = useMemo(() => {
    const map = new Map<
      string,
      {
        productId: string;
        productName: string;
        sku: string;
        totalQty: number;
        totalSpent: number;
        totalProfit: number;
        lastPurchased: string;
        orderCount: number;
      }
    >();

    clientSales.forEach(s => {
      s.items.forEach(it => {
        const existing = map.get(it.productId);
        const itemTotal = it.total || it.quantity * it.unitSellingPrice;
        const itemProfit = it.profit !== undefined ? it.profit : (it.unitSellingPrice - it.unitPurchasePrice) * it.quantity;

        if (!existing) {
          map.set(it.productId, {
            productId: it.productId,
            productName: it.productName,
            sku: it.sku,
            totalQty: it.quantity,
            totalSpent: itemTotal,
            totalProfit: itemProfit,
            lastPurchased: s.date,
            orderCount: 1,
          });
        } else {
          existing.totalQty += it.quantity;
          existing.totalSpent += itemTotal;
          existing.totalProfit += itemProfit;
          existing.orderCount += 1;
          if (new Date(s.date) > new Date(existing.lastPurchased)) {
            existing.lastPurchased = s.date;
          }
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [clientSales]);

  // Visual Spending & Payment Trend Chart (Monthly)
  const customerMonthlyTrends = useMemo(() => {
    const monthMap = new Map<string, { label: string; invoiced: number; paid: number; order: number }>();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = now.getFullYear();

    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      let m = now.getMonth() - i;
      let yr = currentYear;
      if (m < 0) {
        m += 12;
        yr -= 1;
      }
      const key = `${yr}-${m}`;
      monthMap.set(key, {
        label: `${monthNames[m]}`,
        invoiced: 0,
        paid: 0,
        order: yr * 12 + m,
      });
    }

    clientSales.forEach(s => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthMap.has(key)) {
        monthMap.get(key)!.invoiced += s.grandTotal;
      }
    });

    clientPayments.forEach(p => {
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthMap.has(key)) {
        monthMap.get(key)!.paid += p.amount;
      }
    });

    return Array.from(monthMap.values()).sort((a, b) => a.order - b.order);
  }, [clientSales, clientPayments]);

  // Overall Customer Stats
  const totalInvoiced = clientSales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalPaid = clientSales.reduce((acc, s) => acc + s.amountPaid, 0);
  const totalReturnsAmount = clientReturns.reduce((acc, r) => acc + r.netRefundAmount, 0);
  const averageOrderValue = clientSales.length > 0 ? Math.round(totalInvoiced / clientSales.length) : 0;
  const overdueBalance = client.outstandingBalance;

  // Print Statement of Account
  const handlePrintStatement = () => {
    window.print();
  };

  // Export Statement to CSV
  const handleExportStatementCSV = () => {
    const headers = ['Date', 'Type', 'Reference', 'Description', 'Charges/Debit ($)', 'Credits/Payments ($)', 'Balance ($)'];
    const rows = statementLedger.map(e => [
      new Date(e.date).toLocaleDateString(),
      e.type,
      e.reference,
      `"${e.description.replace(/"/g, '""')}"`,
      e.debit,
      e.credit,
      e.balance,
    ]);

    const content =
      'data:text/csv;charset=utf-8,' +
      [
        [`STATEMENT OF ACCOUNT - ${client.name}`],
        [`Company: ${client.company || 'N/A'}`],
        [`Email: ${client.email}`, `Phone: ${client.phone}`],
        [`Generated: ${new Date().toLocaleString()}`],
        [`Current Outstanding Balance: $${client.outstandingBalance}`],
        [],
        headers,
        ...rows,
      ]
        .map(r => r.join(','))
        .join('\n');

    const uri = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', uri);
    link.setAttribute(
      'download',
      `Statement_Of_Account_${client.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Printable Header (Visible when printed) */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{settings.companyName || 'Nexus ERP'}</h1>
            <p className="text-xs text-slate-500">{settings.address || 'Enterprise Headquarters'}</p>
            <p className="text-xs text-slate-500">Phone: {settings.phone} | Email: {settings.email}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-slate-900">STATEMENT OF ACCOUNT</h2>
            <p className="text-xs text-slate-500">Statement Date: {new Date().toLocaleDateString()}</p>
            <p className="text-xs font-semibold text-slate-800">Account ID: {client.id}</p>
          </div>
        </div>
      </div>

      {/* Customer 360 Ribbon */}
      <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Client / Entity</span>
          <h4 className="font-bold text-slate-900 text-sm mt-0.5">{client.name}</h4>
          {client.company && (
            <p className="text-slate-600 font-medium flex items-center gap-1 mt-0.5">
              <Building className="w-3 h-3 text-slate-400" />
              <span>{client.company}</span>
            </p>
          )}
          <div className="text-slate-500 text-[11px] mt-1 space-y-0.5">
            <div className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 text-slate-400" /> {client.email}</div>
            <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {client.phone}</div>
          </div>
        </div>

        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Credit Standing</span>
          <div className="mt-1">
            <span className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(client.creditLimit)}</span>
            <span className="text-slate-400 block text-[11px]">Credit Limit Allocated</span>
          </div>
          <div className="mt-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                client.outstandingBalance > 0
                  ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300/60'
                  : 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/60'
              }`}
            >
              {client.outstandingBalance > 0 ? (
                <>
                  <AlertCircle className="w-3 h-3" /> Due: {formatCurrency(client.outstandingBalance)}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" /> Paid Clear ($0.00)
                </>
              )}
            </span>
          </div>
        </div>

        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Lifetime Volumes</span>
          <div className="mt-1">
            <span className="font-mono font-bold text-[var(--accent-color-dark)] text-sm">
              {formatCurrency(totalInvoiced)}
            </span>
            <span className="text-slate-400 block text-[11px]">Total Lifetime Purchases</span>
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-slate-600 text-[11px]">
            <span><strong>{clientSales.length}</strong> Invoices</span>
            <span>•</span>
            <span>Avg Order: <strong>{formatCurrency(averageOrderValue)}</strong></span>
          </div>
        </div>

        <div className="flex flex-col justify-between items-start md:items-end gap-2 print:hidden">
          <div className="flex items-center gap-2">
            {onOpenNewSale && (
              <button
                onClick={() => onOpenNewSale(client)}
                className="px-3 py-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-color-dark)] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1 transition-all"
              >
                + New Sale
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrintStatement}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
              title="Print official statement of account"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleExportStatementCSV}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
              title="Export ledger to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Customer Volume Trend & Key Metrics Ribbon */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:hidden">
        {/* Monthly Activity Graph */}
        <div className="lg:col-span-2 bg-white p-5 rounded-3xl ring-1 ring-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Monthly Invoiced vs Payments Trend
              </h4>
              <p className="text-[11px] text-slate-400">Past 6 months payment and purchasing behavior</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Recent 6 Mo
            </span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerMonthlyTrends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                  }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                <Bar dataKey="invoiced" name="Invoiced ($)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid" name="Paid ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio Summary Card */}
        <div className="bg-white p-5 rounded-3xl ring-1 ring-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Relationship Highlights
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-500">Total Payments Recorded:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {formatCurrency(totalPaid)} ({clientPayments.length} transactions)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-500">Products Purchased:</span>
                <span className="font-mono font-bold text-slate-800">
                  {purchasedProducts.length} unique items
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-500">Refunds / Returns:</span>
                <span className="font-mono font-bold text-rose-600">
                  {formatCurrency(totalReturnsAmount)} ({clientReturns.length} returns)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-500">Quotations Requested:</span>
                <span className="font-mono font-bold text-slate-800">
                  {clientQuotations.length} quotes
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">First Order Date:</span>
            <span className="font-semibold text-slate-700">
              {clientSales.length > 0
                ? new Date(clientSales[clientSales.length - 1].date).toLocaleDateString()
                : 'No orders yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Bar & Date Range Filter */}
      <div className="bg-white rounded-3xl ring-1 ring-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50 print:hidden">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('statement')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'statement'
                  ? 'bg-white text-[var(--accent-color-dark)] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Statement of Account</span>
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'invoices'
                  ? 'bg-white text-[var(--accent-color-dark)] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Invoices ({clientSales.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'payments'
                  ? 'bg-white text-[var(--accent-color-dark)] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payments Received ({clientPayments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'products'
                  ? 'bg-white text-[var(--accent-color-dark)] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Purchased Products ({purchasedProducts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('quotations')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'quotations'
                  ? 'bg-white text-[var(--accent-color-dark)] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Quotations ({clientQuotations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('returns')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'returns'
                  ? 'bg-white text-[var(--accent-color-dark)] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Returns ({clientReturns.length})</span>
            </button>
          </div>

          {/* Date Filter Dropdown */}
          <div className="flex items-center gap-1 self-end sm:self-auto">
            <span className="text-[11px] text-slate-400 font-medium">Period:</span>
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs">
              {(
                [
                  { id: 'ALL', label: 'All Time' },
                  { id: 'THIS_YEAR', label: 'This Year' },
                  { id: 'LAST_90', label: '90 Days' },
                  { id: 'LAST_30', label: '30 Days' },
                ] as const
              ).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setDateFilter(opt.id)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                    dateFilter === opt.id
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TAB 1: STATEMENT OF ACCOUNT (RUNNING BALANCE LEDGER) */}
        {activeTab === 'statement' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Audit Ledger & Running Balance
                </h4>
                <p className="text-xs text-slate-400">
                  Chronological double-entry audit trail of invoices, settlements, and credits
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Closing Balance Due</span>
                <span
                  className={`font-mono font-bold text-base ${
                    client.outstandingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {formatCurrency(client.outstandingBalance)}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-200">Date</th>
                    <th className="px-4 py-3 border-b border-slate-200">Reference</th>
                    <th className="px-4 py-3 border-b border-slate-200">Description</th>
                    <th className="px-4 py-3 border-b border-slate-200 text-right">Debit (Charge)</th>
                    <th className="px-4 py-3 border-b border-slate-200 text-right">Credit (Paid)</th>
                    <th className="px-4 py-3 border-b border-slate-200 text-right font-bold text-slate-900">
                      Balance
                    </th>
                    <th className="px-4 py-3 border-b border-slate-200 text-right print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {statementLedger.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                        No financial transactions recorded for this customer in this period.
                      </td>
                    </tr>
                  ) : (
                    statementLedger.map(event => (
                      <tr key={event.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono">
                          {new Date(event.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              event.type === 'INVOICE'
                                ? 'bg-indigo-50 text-indigo-700'
                                : event.type === 'PAYMENT'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {event.reference}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 max-w-xs truncate">
                          {event.description}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                          {event.debit > 0 ? formatCurrency(event.debit) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600">
                          {event.credit > 0 ? `-${formatCurrency(event.credit)}` : '—'}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-bold ${
                            event.balance > 0 ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {formatCurrency(event.balance)}
                        </td>
                        <td className="px-4 py-3 text-right print:hidden">
                          {event.invoiceObj && onSelectInvoice && (
                            <button
                              onClick={() => onSelectInvoice(event.invoiceObj!)}
                              className="p-1 text-slate-400 hover:text-[var(--accent-color)] rounded"
                              title="View Invoice Details"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: INVOICES */}
        {activeTab === 'invoices' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-200">Invoice #</th>
                    <th className="px-4 py-3 border-b border-slate-200">Date</th>
                    <th className="px-4 py-3 border-b border-slate-200">Items</th>
                    <th className="px-4 py-3 border-b border-slate-200 text-right">Grand Total</th>
                    <th className="px-4 py-3 border-b border-slate-200 text-right">Paid</th>
                    <th className="px-4 py-3 border-b border-slate-200 text-right font-bold text-amber-700">Due</th>
                    <th className="px-4 py-3 border-b border-slate-200">Status</th>
                    <th className="px-4 py-3 border-b border-slate-200 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                        No invoices recorded for this client in the selected timeframe.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map(sale => (
                      <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-[var(--accent-color)]">
                          {sale.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(sale.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {sale.items.length} products
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(sale.grandTotal)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600">
                          {formatCurrency(sale.amountPaid)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">
                          {formatCurrency(sale.amountDue)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sale.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sale.paymentStatus === 'PARTIAL'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {sale.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {sale.amountDue > 0 && onOpenRecordPayment && (
                              <button
                                onClick={() => onOpenRecordPayment(sale)}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-[11px] font-semibold flex items-center gap-1"
                              >
                                <DollarSign className="w-3 h-3" />
                                <span>Pay</span>
                              </button>
                            )}
                            {onSelectInvoice && (
                              <button
                                onClick={() => onSelectInvoice(sale)}
                                className="p-1 text-slate-400 hover:text-[var(--accent-color)]"
                                title="View Details"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PAYMENTS RECEIVED */}
        {activeTab === 'payments' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-200">Date</th>
                    <th className="px-4 py-3 border-b border-slate-200">Invoice Ref</th>
                    <th className="px-4 py-3 border-b border-slate-200">Method</th>
                    <th className="px-4 py-3 border-b border-slate-200">Note / Reference</th>
                    <th className="px-4 py-3 border-b border-slate-200">Recorded By</th>
                    <th className="px-4 py-3 border-b border-slate-200 text-right font-bold text-emerald-600">
                      Amount Paid
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {clientPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No payment transactions recorded for this client.
                      </td>
                    </tr>
                  ) : (
                    clientPayments.map(pay => (
                      <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(pay.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                          {pay.invoiceNumber}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                            {pay.method}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{pay.note || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{pay.recordedBy || 'System'}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                          +{formatCurrency(pay.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PURCHASED PRODUCTS PORTFOLIO */}
        {activeTab === 'products' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Customer Purchase Preferences & Velocity
                </h4>
                <p className="text-xs text-slate-400">
                  Complete catalogue of items ordered by {client.name}, sorted by total expenditure
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                {purchasedProducts.length} Products
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-200">Product Name & SKU</th>
                    <th className="px-4 py-3 border-b border-slate-200 text-center">Total Units</th>
                    <th className="px-4 py-3 border-b border-slate-200 text-right">Total Spent</th>
                    <th className="px-4 py-3 border-b border-slate-200 text-right font-bold text-emerald-600">
                      Store Profit
                    </th>
                    <th className="px-4 py-3 border-b border-slate-200 text-center">Orders Count</th>
                    <th className="px-4 py-3 border-b border-slate-200 text-right">Last Purchased</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {purchasedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No product purchase history available.
                      </td>
                    </tr>
                  ) : (
                    purchasedProducts.map(item => (
                      <tr key={item.productId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{item.productName}</div>
                          <div className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-900">
                          {item.totalQty} units
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(item.totalSpent)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                          +{formatCurrency(item.totalProfit)}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                          {item.orderCount} orders
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 whitespace-nowrap">
                          {new Date(item.lastPurchased).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: QUOTATIONS */}
        {activeTab === 'quotations' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-200">Quote #</th>
                    <th className="px-4 py-3 border-b border-slate-200">Date Issued</th>
                    <th className="px-4 py-3 border-b border-slate-200">Valid Until</th>
                    <th className="px-4 py-3 border-b border-slate-200">Items</th>
                    <th className="px-4 py-3 border-b border-slate-200 text-right font-bold text-slate-900">
                      Total Amount
                    </th>
                    <th className="px-4 py-3 border-b border-slate-200 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {clientQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No quotations recorded for this client.
                      </td>
                    </tr>
                  ) : (
                    clientQuotations.map(q => (
                      <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                          {q.quotationNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(q.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(q.validUntil).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{q.items.length} items</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(q.grandTotal)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              q.status === 'ACCEPTED' || q.status === 'CONVERTED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : q.status === 'SENT'
                                ? 'bg-blue-100 text-blue-800'
                                : q.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: RETURNS */}
        {activeTab === 'returns' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-200">Return #</th>
                    <th className="px-4 py-3 border-b border-slate-200">Date</th>
                    <th className="px-4 py-3 border-b border-slate-200">Invoice Ref</th>
                    <th className="px-4 py-3 border-b border-slate-200">Items Returned</th>
                    <th className="px-4 py-3 border-b border-slate-200">Method</th>
                    <th className="px-4 py-3 border-b border-slate-200 text-right font-bold text-rose-600">
                      Refund Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {clientReturns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No product returns processed for this client.
                      </td>
                    </tr>
                  ) : (
                    clientReturns.map(ret => (
                      <tr key={ret.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-rose-600">
                          {ret.returnNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(ret.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-800">
                          {ret.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {ret.items.length} items
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                            {ret.refundMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                          -{formatCurrency(ret.netRefundAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
