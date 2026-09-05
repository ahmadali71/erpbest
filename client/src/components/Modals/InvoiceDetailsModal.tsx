import React, { useState } from 'react';
import {
  X,
  Printer,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Building,
  User,
  Mail,
  Phone,
  RotateCcw,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { PaymentMethod, SaleInvoice } from '../../types/erp';

interface InvoiceDetailsModalProps {
  invoice: SaleInvoice | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecordPayment: (invoice: SaleInvoice) => void;
  onOpenReturn?: (invoice: SaleInvoice) => void;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onOpenRecordPayment,
  onOpenReturn,
}) => {
  const { formatCurrency, settings } = useERP();
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = invoice.paymentStatus === 'PAID';
  const isPartial = invoice.paymentStatus === 'PARTIAL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Actions */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[var(--accent-color-dark)] bg-[var(--accent-color-light)] px-2.5 py-1 rounded-md border border-[var(--accent-color-light)]">
              {invoice.invoiceNumber}
            </span>
            {isPaid ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Fully Paid
              </span>
            ) : isPartial ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                Partial Payment ({formatCurrency(invoice.amountDue)} due)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                Pending Payment ({formatCurrency(invoice.amountDue)} due)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onOpenReturn && (
              <button
                onClick={() => {
                  onClose();
                  onOpenReturn(invoice);
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition-colors flex items-center gap-1.5"
                title="Process return or refund for this invoice"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Return / Refund</span>
              </button>
            )}

            {invoice.amountDue > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRecordPayment(invoice);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Collect Payment</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Document Body */}
        <div className="p-8 space-y-6 bg-white text-slate-800">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[var(--accent-color)] rounded flex items-center justify-center text-white">
                  <div className="w-3 h-3 border-2 border-white rotate-45"></div>
                </div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Nexus ERP Corp</h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">100 Enterprise Way, Tech Valley, CA 94016</p>
              <p className="text-xs text-slate-500">tax@nexuserp.io • +1 (800) 555-0199</p>
            </div>

            <div className="text-right">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Tax Invoice</h2>
              <p className="font-mono text-xs font-bold text-[var(--accent-color)] mt-1">No: {invoice.invoiceNumber}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Date: {new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              {invoice.dueDate && (
                <p className="text-xs text-amber-700 font-medium mt-0.5">Due Date: {invoice.dueDate}</p>
              )}
            </div>
          </div>

          {/* Bill To & Payment Info */}
          <div className="grid grid-cols-2 gap-6 py-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To</p>
              <h3 className="text-sm font-bold text-slate-900">{invoice.clientName}</h3>
              {invoice.clientEmail && <p className="text-xs text-slate-600 mt-0.5">{invoice.clientEmail}</p>}
              {invoice.clientPhone && <p className="text-xs text-slate-500">{invoice.clientPhone}</p>}
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Method</p>
              <p className="text-xs font-semibold text-slate-900 font-mono">{invoice.paymentMethod}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Status: <span className="font-bold">{invoice.paymentStatus}</span></p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-2.5 border-b border-slate-200">Item Description</th>
                  <th className="px-4 py-2.5 border-b border-slate-200">SKU</th>
                  <th className="px-4 py-2.5 border-b border-slate-200 text-center">Qty</th>
                  <th className="px-4 py-2.5 border-b border-slate-200 text-right">Unit Price</th>
                  <th className="px-4 py-2.5 border-b border-slate-200 text-right">Disc %</th>
                  <th className="px-4 py-2.5 border-b border-slate-200 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.productName}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{item.sku}</td>
                    <td className="px-4 py-3 text-center font-bold">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(item.unitSellingPrice)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500">{item.discountPercentage}%</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotals & Balances */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono">-{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({invoice.taxRate}%):</span>
                  <span className="font-mono">+{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono text-[var(--accent-color-dark)]">{formatCurrency(invoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                <span>Total Paid:</span>
                <span className="font-mono">+{formatCurrency(invoice.amountPaid)}</span>
              </div>
              {invoice.amountDue > 0 && (
                <div className="flex justify-between text-xs text-red-600 font-bold pt-1 border-t border-dashed border-slate-200">
                  <span>Balance Due:</span>
                  <span className="font-mono">{formatCurrency(invoice.amountDue)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment History Timeline */}
          {invoice.payments.length > 0 && (
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Payment Receipts on this Invoice</h4>
              <div className="space-y-1.5">
                {invoice.payments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-medium text-slate-800">
                        {new Date(p.date).toLocaleDateString()} via {p.method}
                      </span>
                      {p.note && <span className="text-slate-400 text-[11px]">({p.note})</span>}
                    </div>
                    <span className="font-mono font-bold text-emerald-700">+{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {invoice.notes && (
            <div className="pt-4 border-t border-slate-200 text-xs text-slate-500">
              <span className="font-bold text-slate-700">Notes: </span>
              {invoice.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
