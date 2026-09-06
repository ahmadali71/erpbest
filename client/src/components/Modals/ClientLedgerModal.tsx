import React from 'react';
import { X, History } from 'lucide-react';
import { Client, SaleInvoice } from '../../types/erp';
import { CustomerHistoryDetails } from '../Clients/CustomerHistoryDetails';

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
  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-5xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[var(--accent-color)] rounded-xl flex items-center justify-center text-white shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {client.name} — Customer 360 & Statement of Account
              </h3>
              <p className="text-xs text-slate-400">
                Audit ledger, running balance, sales history, quotes, returns, and purchased items
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          <CustomerHistoryDetails
            client={client}
            onSelectInvoice={inv => {
              onSelectInvoice(inv);
            }}
            onOpenNewSale={c => {
              onClose();
              onOpenNewSale(c);
            }}
            onOpenRecordPayment={inv => {
              onClose();
              onOpenRecordPayment(inv);
            }}
          />
        </div>
      </div>
    </div>
  );
};
