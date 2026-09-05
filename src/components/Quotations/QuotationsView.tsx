import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trash2,
  XCircle,
  Sparkles,
  Send,
  Calendar,
  Layers,
} from 'lucide-react';
import { Quotation, SaleInvoice } from '../../types/erp';
import { NewQuotationModal } from '../Modals/NewQuotationModal';

interface QuotationsViewProps {
  onSelectInvoice?: (invoice: SaleInvoice) => void;
}

export const QuotationsView: React.FC<QuotationsViewProps> = ({ onSelectInvoice }) => {
  const {
    quotations,
    updateQuotationStatus,
    convertQuotationToInvoice,
    deleteQuotation,
    pendingQuotationsCount,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isNewQuoteOpen, setIsNewQuoteOpen] = useState(false);
  const [convertingQuoteId, setConvertingQuoteId] = useState<string | null>(null);

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleConvert = async (quoteId: string) => {
    if (window.confirm('Convert this quotation into a confirmed sales invoice and reserve product inventory?')) {
      setConvertingQuoteId(quoteId);
      try {
        const invoice = await convertQuotationToInvoice(quoteId);
        if (invoice && onSelectInvoice) {
          onSelectInvoice(invoice);
        }
      } catch (err: any) {
        alert(err.message || 'Failed to convert quotation');
      } finally {
        setConvertingQuoteId(null);
      }
    }
  };

  const totalQuotedValue = quotations.reduce((acc, q) => acc + q.grandTotal, 0);

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Quotations</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{quotations.length}</h3>
            <span className="text-xs text-violet-600 font-medium">Issued estimates & proposals</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Quotes</span>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{pendingQuotationsCount}</h3>
            <span className="text-xs text-slate-500 font-medium">Under client review</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pipeline Value</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">${totalQuotedValue.toLocaleString()}</h3>
            <span className="text-xs text-slate-500 font-medium">Combined quotation estimates</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'CONVERTED', 'REJECTED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  statusFilter === st
                    ? 'bg-violet-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search quote # or client..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <button
              onClick={() => setIsNewQuoteOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Create Quote</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-4 sm:px-6">Quote Number</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4">Grand Total</th>
                <th className="py-3.5 px-4">Valid Until</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No Quotations Found</p>
                    <p className="text-xs text-slate-400 mt-1">Create estimates that can be converted directly into sales invoices</p>
                  </td>
                </tr>
              ) : (
                filteredQuotations.map(q => {
                  const isConverted = q.status === 'CONVERTED';
                  const isAccepted = q.status === 'ACCEPTED';

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-bold text-slate-900">
                        {q.quotationNumber}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-800">{q.clientName}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {q.items.length} product lines ({q.items.reduce((a, b) => a + b.quantity, 0)} items)
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900">
                        ${q.grandTotal.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500">
                        {new Date(q.validUntil).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full ${
                            isConverted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isAccepted
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : q.status === 'REJECTED'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isConverted && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {q.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isConverted && q.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleConvert(q.id)}
                              disabled={convertingQuoteId === q.id}
                              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs flex items-center gap-1"
                              title="Convert to Sales Invoice"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              <span>Convert to Invoice</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (window.confirm('Delete this quotation?')) {
                                deleteQuotation(q.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Quote"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Quotation Modal */}
      <NewQuotationModal
        isOpen={isNewQuoteOpen}
        onClose={() => setIsNewQuoteOpen(false)}
      />
    </div>
  );
};
