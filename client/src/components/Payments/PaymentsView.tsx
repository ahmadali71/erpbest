import React, { useState, useMemo } from 'react';
import {
  Search,
  DollarSign,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { SaleInvoice } from '../../types/erp';

interface PaymentsViewProps {
  onOpenRecordPayment: (invoice: SaleInvoice) => void;
  onSelectInvoice: (invoice: SaleInvoice) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  onOpenRecordPayment,
  onSelectInvoice,
}) => {
  const { sales, totalPendingReceivables, totalCollected } = useERP();
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'history'>('pending');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Unpaid or partially paid sales
  const dueSales = useMemo(() => {
    return sales
      .filter(s => s.amountDue > 0)
      .filter(s =>
        s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.clientName.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [sales, searchTerm]);

  // Flatten all payment transactions
  const allPaymentLogs = useMemo(() => {
    const logs: Array<{
      id: string;
      saleId: string;
      invoiceNumber: string;
      clientName: string;
      amount: number;
      method: string;
      date: string;
      note?: string;
      recordedBy: string;
    }> = [];

    sales.forEach(sale => {
      sale.payments.forEach(p => {
        logs.push({
          id: p.id,
          saleId: sale.id,
          invoiceNumber: sale.invoiceNumber,
          clientName: sale.clientName,
          amount: p.amount,
          method: p.method,
          date: p.date,
          note: p.note,
          recordedBy: p.recordedBy,
        });
      });
    });

    return logs
      .filter(l =>
        l.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.note && l.note.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, searchTerm]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-amber-200/80 shadow-sm border-l-4 border-l-amber-400 flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Pending Receivables</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalPendingReceivables)}</h3>
            <p className="text-xs text-amber-600 font-medium mt-0.5">{dueSales.length} Invoices Pending</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-emerald-200/80 shadow-sm border-l-4 border-l-emerald-400 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Collected to Date</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalCollected)}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">{allPaymentLogs.length} Receipts</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Collection Ratio</p>
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--accent-color-dark)] mt-1">
              {totalCollected + totalPendingReceivables > 0
                ? `${Math.round((totalCollected / (totalCollected + totalPendingReceivables)) * 100)}%`
                : '100%'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Realized Cashflow</p>
          </div>
          <div className="w-10 h-10 bg-[var(--accent-color-light)] text-[var(--accent-color)] rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation and Search */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/60 self-stretch sm:self-auto">
          <button
            onClick={() => setActiveSubTab('pending')}
            className={`flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeSubTab === 'pending' ? 'bg-white text-[var(--accent-color-dark)] shadow-sm ring-1 ring-[var(--accent-color-light)] font-extrabold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({dueSales.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeSubTab === 'history' ? 'bg-white text-[var(--accent-color-dark)] shadow-sm ring-1 ring-[var(--accent-color-light)] font-extrabold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Receipts ({allPaymentLogs.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64 md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[var(--accent-color)] outline-none transition-all"
          />
        </div>
      </div>

      {/* Content based on sub tab */}
      {activeSubTab === 'pending' ? (
        <>
          {/* Mobile Card List (< md) */}
          <div className="md:hidden space-y-3">
            {dueSales.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-3xl ring-1 ring-slate-200/80 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                All invoices are fully settled! No pending receivables.
              </div>
            ) : (
              dueSales.map(sale => (
                <div
                  key={sale.id}
                  className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-[var(--accent-color)] block">{sale.invoiceNumber}</span>
                      <h4 className="font-semibold text-slate-900 text-sm mt-0.5">{sale.clientName}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(sale.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-medium block">Amount Due</span>
                      <span className="font-mono text-base font-bold text-amber-700 block">
                        {formatCurrency(sale.amountDue)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Invoice</span>
                      <span className="font-mono font-semibold text-slate-800">{formatCurrency(sale.grandTotal)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Paid So Far</span>
                      <span className="font-mono font-semibold text-emerald-600">{formatCurrency(sale.amountPaid)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => onSelectInvoice(sale)}
                      className="text-xs text-[var(--accent-color)] font-semibold hover:underline"
                    >
                      View Invoice →
                    </button>
                    <button
                      onClick={() => onOpenRecordPayment(sale)}
                      className="px-3 py-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-color-dark)] text-white rounded-2xl text-xs font-semibold shadow-sm flex items-center gap-1.5"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table (hidden on mobile) */}
          <div className="hidden md:block bg-white rounded-3xl ring-1 ring-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Outstanding & Partial Invoices</h3>
                <p className="text-xs text-slate-400">Click "Record Payment" to apply partial or full settlements</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-5 py-3 border-b border-slate-100">Invoice #</th>
                    <th className="px-5 py-3 border-b border-slate-100">Client</th>
                    <th className="px-5 py-3 border-b border-slate-100">Invoice Total</th>
                    <th className="px-5 py-3 border-b border-slate-100">Amount Paid</th>
                    <th className="px-5 py-3 border-b border-slate-100 font-bold text-amber-700">Amount Due</th>
                    <th className="px-5 py-3 border-b border-slate-100">Status</th>
                    <th className="px-5 py-3 border-b border-slate-100 text-right">Collect Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {dueSales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                        All invoices are fully settled! No pending receivables.
                      </td>
                    </tr>
                  ) : (
                    dueSales.map(sale => {
                      const isPartial = sale.paymentStatus === 'PARTIAL';
                       return (
                          <tr key={sale.id} className="hover:bg-[var(--accent-color-light)] transition-colors">
                          <td className="px-5 py-3.5 font-mono font-semibold text-[var(--accent-color)]">
                            {sale.invoiceNumber}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-slate-900">{sale.clientName}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(sale.date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-800">
                            {formatCurrency(sale.grandTotal)}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-emerald-600 font-medium">
                            {formatCurrency(sale.amountPaid)}
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-amber-700">
                            {formatCurrency(sale.amountDue)}
                          </td>
                          <td className="px-5 py-3.5">
                             <span
                               className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ring-1 ${
                                 isPartial
                                   ? 'bg-blue-100 text-blue-800 ring-blue-300/60'
                                   : 'bg-amber-100 text-amber-800 ring-amber-300/60'
                               }`}
                             >
                              {sale.paymentStatus}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                             <button
                               onClick={() => onOpenRecordPayment(sale)}
                               className="px-3 py-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-color-dark)] text-white rounded-2xl text-xs font-semibold shadow-sm transition-colors inline-flex items-center gap-1.5"
                             >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Record Payment</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Payment History Log */
        <>
          {/* Mobile Card List for History (< md) */}
          <div className="md:hidden space-y-3">
            {allPaymentLogs.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-3xl ring-1 ring-slate-200/80 text-slate-400 text-xs">
                <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                No payment transactions recorded yet.
              </div>
            ) : (
              allPaymentLogs.map(log => {
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
                    className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-[var(--accent-color)] block">{log.invoiceNumber}</span>
                        <h4 className="font-semibold text-slate-900 text-sm mt-0.5">{log.clientName}</h4>
                        <p className="text-[11px] text-slate-400">{formattedDate}</p>
                      </div>
                      <span className="font-mono text-base font-bold text-emerald-600">
                        +{formatCurrency(log.amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-mono ring-1 ring-slate-300/60">
                        {log.method}
                      </span>
                      <span className="text-[11px] text-slate-400">By: {log.recordedBy}</span>
                    </div>
                    {log.note && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded">
                        Note: {log.note}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop History Table (hidden on mobile) */}
          <div className="hidden md:block bg-white rounded-3xl ring-1 ring-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Payment Receipts & Settlement Ledger</h3>
                <p className="text-xs text-slate-400">Audit trail of all received cash, card, and wire payments</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-5 py-3 border-b border-slate-100">Date & Time</th>
                    <th className="px-5 py-3 border-b border-slate-100">Invoice #</th>
                    <th className="px-5 py-3 border-b border-slate-100">Client</th>
                    <th className="px-5 py-3 border-b border-slate-100">Amount Received</th>
                    <th className="px-5 py-3 border-b border-slate-100">Payment Method</th>
                    <th className="px-5 py-3 border-b border-slate-100">Recorded By</th>
                    <th className="px-5 py-3 border-b border-slate-100">Receipt Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {allPaymentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                        <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        No payment transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    allPaymentLogs.map(log => {
                      const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                       return (
                          <tr key={log.id} className="hover:bg-[var(--accent-color-light)] transition-colors">
                          <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                            {formattedDate}
                          </td>
                          <td className="px-5 py-3.5 font-mono font-semibold text-[var(--accent-color)]">
                            {log.invoiceNumber}
                          </td>
                          <td className="px-5 py-3.5 font-medium text-slate-900">
                            {log.clientName}
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-emerald-600">
                            +{formatCurrency(log.amount)}
                          </td>
                           <td className="px-5 py-3.5">
                             <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-mono ring-1 ring-slate-300/60">
                               {log.method}
                             </span>
                           </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {log.recordedBy}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 italic max-w-xs truncate">
                            {log.note || '--'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
