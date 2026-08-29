import React, { useState, useMemo } from 'react';
import {
  Plus,
  Users,
  Search,
  Mail,
  Phone,
  Building,
  DollarSign,
  CreditCard,
  History,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Client } from '../../types/erp';

interface ClientsViewProps {
  onOpenAddClient: () => void;
  onOpenEditClient: (client: Client) => void;
  onSelectClientLedger: (client: Client) => void;
  onOpenNewSaleForClient: (client: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  onOpenAddClient,
  onOpenEditClient,
  onSelectClientLedger,
  onOpenNewSaleForClient,
}) => {
  const { clients, sales, deleteClient } = useERP();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterBalance, setFilterBalance] = useState<'ALL' | 'DUE' | 'CLEAR'>('ALL');

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm);

      const matchBalance =
        filterBalance === 'ALL'
          ? true
          : filterBalance === 'DUE'
          ? c.outstandingBalance > 0
          : c.outstandingBalance <= 0;

      return matchSearch && matchBalance;
    });
  }, [clients, searchTerm, filterBalance]);

  const totalClientsCount = clients.length;
  const clientsWithDue = clients.filter(c => c.outstandingBalance > 0).length;
  const totalOutstanding = clients.reduce((acc, c) => acc + c.outstandingBalance, 0);

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
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Registered Clients</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{totalClientsCount} Accounts</h3>
            <p className="text-xs text-slate-500 mt-0.5">Active business customers</p>
          </div>
          <div className="w-10 h-10 bg-[var(--accent-color-light)] text-[var(--accent-color)] rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Accounts with Due</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{clientsWithDue} Clients</h3>
            <p className="text-xs text-amber-600 font-medium mt-0.5">Pending collection</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-amber-400 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Outstanding</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalOutstanding)}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Net receivables ledger</p>
          </div>
          <div className="w-10 h-10 bg-[var(--accent-color-light)] text-[var(--accent-color)] rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Header & Search */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 sm:w-64 md:w-80 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, company, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[var(--accent-color)] outline-none transition-all"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilterBalance('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                filterBalance === 'ALL' ? 'bg-white text-[var(--accent-color-dark)] shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterBalance('DUE')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                filterBalance === 'DUE' ? 'bg-white text-amber-700 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              Due ({clientsWithDue})
            </button>
            <button
              onClick={() => setFilterBalance('CLEAR')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                filterBalance === 'CLEAR' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              Clear
            </button>
          </div>
        </div>

        <button
          onClick={onOpenAddClient}
          className="px-3.5 py-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-dark)] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 self-stretch sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden space-y-3">
        {filteredClients.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-400 text-xs">
            <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            No clients found matching your search.
          </div>
        ) : (
          filteredClients.map(client => {
            const clientInvoices = sales.filter(s => s.clientId === client.id);
            const hasDue = client.outstandingBalance > 0;

            return (
              <div
                key={client.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{client.name}</h4>
                    {client.company && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3" />
                        <span>{client.company}</span>
                      </p>
                    )}
                  </div>
                  {hasDue ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                      <AlertCircle className="w-3 h-3" /> {formatCurrency(client.outstandingBalance)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="w-3 h-3" /> Paid Clear
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Email:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[200px]">{client.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Phone:</span>
                    <span className="font-mono text-slate-700">{client.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Total Spent:</span>
                    <span className="font-mono font-bold text-[var(--accent-color-dark)]">
                      {formatCurrency(client.totalSpent)} ({clientInvoices.length} sales)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => onSelectClientLedger(client)}
                      className="text-xs text-[var(--accent-color)] font-semibold hover:underline flex items-center gap-1"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>View Ledger</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenNewSaleForClient(client)}
                      className="px-2.5 py-1 bg-[var(--accent-color-light)] hover:bg-[var(--accent-color-light)] text-[var(--accent-color-dark)] rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Sale</span>
                    </button>
                    <button
                      onClick={() => onOpenEditClient(client)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete client "${client.name}"?`)) {
                          deleteClient(client.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Clients Table (hidden on mobile) */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-5 py-3 border-b border-slate-100">Client / Company</th>
                <th className="px-5 py-3 border-b border-slate-100">Contact Details</th>
                <th className="px-5 py-3 border-b border-slate-100">Credit Limit</th>
                <th className="px-5 py-3 border-b border-slate-100">Total Lifetime Spent</th>
                <th className="px-5 py-3 border-b border-slate-100">Due Balance</th>
                <th className="px-5 py-3 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No clients found matching your search.
                  </td>
                </tr>
              ) : (
                filteredClients.map(client => {
                  const clientInvoices = sales.filter(s => s.clientId === client.id);
                  const hasDue = client.outstandingBalance > 0;

                  return (
                    <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Company */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{client.name}</div>
                        {client.company && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3" />
                            <span>{client.company}</span>
                          </div>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="px-5 py-3.5 space-y-0.5">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{client.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{client.phone}</span>
                        </div>
                      </td>

                      {/* Credit Limit */}
                      <td className="px-5 py-3.5 font-mono text-slate-600">
                        {formatCurrency(client.creditLimit)}
                      </td>

                      {/* Total Spent */}
                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                        {formatCurrency(client.totalSpent)}
                        <span className="text-[10px] text-slate-400 font-normal ml-1.5">
                          ({clientInvoices.length} sales)
                        </span>
                      </td>

                      {/* Due Balance */}
                      <td className="px-5 py-3.5">
                        {hasDue ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            <AlertCircle className="w-3 h-3" />
                            <span>{formatCurrency(client.outstandingBalance)}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>$0.00 (Clear)</span>
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenNewSaleForClient(client)}
                            className="px-2 py-1 bg-[var(--accent-color-light)] hover:bg-[var(--accent-color-light)] text-[var(--accent-color-dark)] rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            title="New Sale for this client"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Sale</span>
                          </button>
                          <button
                            onClick={() => onSelectClientLedger(client)}
                            className="p-1.5 text-slate-500 hover:text-[var(--accent-color)] hover:bg-[var(--accent-color-light)] rounded transition-colors"
                            title="View Transaction History / Ledger"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenEditClient(client)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                            title="Edit Client"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete client "${client.name}"?`)) {
                                deleteClient(client.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Client"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
};
