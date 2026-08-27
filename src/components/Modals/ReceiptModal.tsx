import React from 'react';
import { SaleInvoice } from '../../types/erp';
import { Printer, X, CheckCircle, Download, Building2 } from 'lucide-react';

interface ReceiptModalProps {
  invoice: SaleInvoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ invoice, isOpen, onClose }) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Actions */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <h3 className="font-semibold text-slate-800 text-sm">Thermal POS Receipt</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Area */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 bg-white space-y-4 print:p-0 print:m-0">
          {/* Business Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            <div className="flex justify-center items-center gap-1.5 mb-1">
              <div className="w-6 h-6 bg-slate-900 text-white rounded flex items-center justify-center font-bold text-xs">
                N
              </div>
              <span className="font-bold text-sm tracking-wider uppercase text-slate-900">NEXUS ENTERPRISE</span>
            </div>
            <p className="text-[11px] text-slate-600">Enterprise Solutions & Wholesale Corp</p>
            <p className="text-[10px] text-slate-500">742 Tech Hub Blvd, Suite 400 • Austin, TX</p>
            <p className="text-[10px] text-slate-500">Tax ID: US-EIN-994102 • Tel: (555) 019-2834</p>
          </div>

          {/* Receipt Info */}
          <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">RECEIPT NO:</span>
              <span className="font-bold text-slate-900">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">DATE & TIME:</span>
              <span>{new Date(invoice.date).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CUSTOMER:</span>
              <span className="font-semibold text-slate-900">{invoice.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CASHIER:</span>
              <span>POS Terminal #01 (Admin)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">PAYMENT METHOD:</span>
              <span className="font-semibold text-indigo-700">{invoice.paymentMethod}</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-2 pb-3 border-b border-dashed border-slate-300">
            <div className="flex justify-between font-bold text-[10px] text-slate-500 uppercase tracking-wider">
              <span className="w-1/2">Item</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/6 text-right">Price</span>
              <span className="w-1/6 text-right">Total</span>
            </div>
            {invoice.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-[11px]">
                <div className="w-1/2">
                  <div className="font-medium text-slate-900 leading-tight">{item.productName}</div>
                  <div className="text-[9px] text-slate-400">SKU: {item.sku}</div>
                </div>
                <div className="w-1/6 text-center text-slate-600">{item.quantity}</div>
                <div className="w-1/6 text-right text-slate-600">${item.unitSellingPrice.toFixed(2)}</div>
                <div className="w-1/6 text-right font-medium text-slate-900">${item.total.toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Summary Math */}
          <div className="space-y-1.5 text-[11px] pb-3 border-b border-dashed border-slate-300">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>${invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span>-${invoice.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Sales Tax ({invoice.taxRate}%):</span>
                <span>+${invoice.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
              <span>TOTAL DUE:</span>
              <span>${invoice.grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-700 font-semibold">
              <span>AMOUNT TENDERED:</span>
              <span>${invoice.amountPaid.toFixed(2)}</span>
            </div>
            {invoice.amountDue > 0 ? (
              <div className="flex justify-between text-amber-600 font-bold">
                <span>BALANCE DUE (CREDIT):</span>
                <span>${invoice.amountDue.toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>STATUS:</span>
                <span>PAID IN FULL</span>
              </div>
            )}
          </div>

          {/* Barcode & Footer Note */}
          <div className="text-center space-y-2 pt-1">
            {/* Simulated Barcode */}
            <div className="flex justify-center items-center py-1">
              <div className="h-10 w-48 flex items-center justify-between px-2 bg-slate-900 text-white rounded">
                <div className="flex gap-[2px] h-7 items-center w-full">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div
                      key={i}
                      className={`bg-white h-full ${i % 3 === 0 ? 'w-1' : i % 2 === 0 ? 'w-[1.5px]' : 'w-[0.5px]'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest">*{invoice.invoiceNumber}*</p>
            <p className="text-[10px] text-slate-500 font-sans">
              Thank you for your business! Please retain receipt for warranty & returns within 30 days.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
