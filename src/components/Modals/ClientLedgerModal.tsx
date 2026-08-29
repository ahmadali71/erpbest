import React from 'react';
import {
  X,
  History,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Building,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Client, SaleInvoice } from '../../types/erp';

interface ClientLedgerModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectInvoice: (invoice: SaleInvoice) => void;
  onOpenNewSale: (client: Client) => void;
  onOpenRecordPayment: (invoice: SaleInvoice) => void;
}

export const ClientLedgerModal: React.FC<ClientLedgerModalProps> = ({
  client,
  isOpen,
  onClose,
  onSelectInvoice,
  onOpenNewSale,
  onOpenRecordPayment,
}) => {
  const { sales } = useERP();

  if (!isOpen || !client) return null;

  const clientSales = sales.filter(s => s.clientId === client.id);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--accent-color)] rounded-lg flex items-center justify-center text-white">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{client.name} — Transaction Ledger</h3>
              <p className="text-xs text-slate-400">Complete transaction history and outstanding balance status</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenNewSale(client);
              }}
              className="px-3 py-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-color-dark)] text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              + Create Sale
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Client Summary Ribbon */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block">Company</span>
            <span className="font-semibold text-slate-900">{client.company || 'Individual'}</span>
            <span className="text-slate-500 block text-[11px] mt-0.5">{client.email}</span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block">Credit Limit</span>
            <span className="font-mono font-semibold text-slate-900">{formatCurrency(client.creditLimit)}</span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block">Total Spent</span>
                    <span className="font-mono font-bold text-[var(--accent-color-dark)]">{formatCurrency(client.totalSpent)}</span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block">Due Balance</span>
            <span
              className={`font-mono font-bold ${
                client.outstandingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {formatCurrency(client.outstandingBalance)}
            </span>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="p-6 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Invoices & Settlements</h4>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-2.5 border-b border-slate-200">Invoice #</th>
                  <th className="px-4 py-2.5 border-b border-slate-200">Date</th>
                  <th className="px-4 py-2.5 border-b border-slate-200">Amount</th>
                  <th className="px-4 py-2.5 border-b border-slate-200">Paid</th>
                  <th className="px-4 py-2.5 border-b border-slate-200 font-bold text-amber-700">Due</th>
                  <th className="px-4 py-2.5 border-b border-slate-200">Status</th>
                  <th className="px-4 py-2.5 border-b border-slate-200 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {clientSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No invoices recorded for this client yet.
                    </td>
                  </tr>
                ) : (
                  clientSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-[var(--accent-color)]">
                        {sale.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(sale.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {formatCurrency(sale.grandTotal)}
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-600">
                        {formatCurrency(sale.amountPaid)}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-amber-700">
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
                          {sale.amountDue > 0 && (
                            <button
                              onClick={() => {
                                onClose();
                                onOpenRecordPayment(sale);
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-[11px] font-semibold flex items-center gap-1"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Pay</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              onClose();
                              onSelectInvoice(sale);
                            }}
                            className="p-1 text-slate-400 hover:text-[var(--accent-color)]"
                            title="View Invoice"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
