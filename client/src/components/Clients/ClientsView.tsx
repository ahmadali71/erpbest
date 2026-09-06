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
  FileText,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Client } from '../../types/erp';

interface ClientsViewProps {
  onOpenAddClient: () => void;
  onOpenEditClient: (client: Client) => void;
  onSelectClientLedger: (client: Client) => void;
  onOpenNewSaleForClient: (client: Client) => void;
  onOpenCustomerReports?: (clientId?: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  onOpenAddClient,
  onOpenEditClient,
  onSelectClientLedger,
  onOpenNewSaleForClient,
  onOpenCustomerReports,
}) => {
  const { clients, sales, deleteClient, restoreClient } = useERP();
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canCreate = hasPermission('clients.create') || hasPermission('clients.edit') || isAdmin;
  const canEdit = hasPermission('clients.edit') || isAdmin;
  const canDelete = hasPermission('clients.delete') || hasPermission('clients.edit') || isAdmin;

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterBalance, setFilterBalance] = useState<'ALL' | 'DUE' | 'CLEAR'>('ALL');
  const [adminViewFilter, setAdminViewFilter] = useState<'all' | 'active' | 'deleted'>('active');

  const deletedClientsCount = useMemo(() => clients.filter(c => c.isDeleted).length, [clients]);
  const activeClientsCount = useMemo(() => clients.filter(c => !c.isDeleted).length, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      // Role & deletion filtering
      if (isAdmin) {
        if (adminViewFilter === 'active' && c.isDeleted) return false;
        if (adminViewFilter === 'deleted' && !c.isDeleted) return false;
      } else {
        if (c.isDeleted) return false;
      }

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
  }, [clients, searchTerm, filterBalance, adminViewFilter, isAdmin]);

  const activeClients = useMemo(() => clients.filter(c => !c.isDeleted), [clients]);
  const totalClientsCount = activeClients.length;
  const clientsWithDue = activeClients.filter(c => c.outstandingBalance > 0).length;
  const totalOutstanding = activeClients.reduce((acc, c) => acc + c.outstandingBalance, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  return (
    <div className="space-y-4 sm:space-y-6 select-none">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Registered Clients</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{totalClientsCount} Accounts</h3>
            <p className="text-xs text-slate-500 mt-0.5">Active business customers</p>
          </div>
          <div className="w-10 h-10 bg-(--accent-color-light) text-(--accent-color) rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Accounts with Due</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{clientsWithDue} Clients</h3>
            <p className="text-xs text-amber-600 font-medium mt-0.5">Pending collection</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm border-l-4 border-l-amber-400 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Outstanding</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalOutstanding)}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Net receivables ledger</p>
          </div>
          <div className="w-10 h-10 bg-(--accent-color-light) text-(--accent-color) rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Header & Search */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 sm:w-64 md:w-80 min-w-50">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, company, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-(--accent-color) outline-none transition-all"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilterBalance('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                filterBalance === 'ALL' ? 'bg-white text-(--accent-color-dark) shadow-xs font-semibold' : 'text-slate-600'
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

          {/* Admin-only deletion filter toggle */}
          {isAdmin && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-2xl text-xs">
              <button
                onClick={() => setAdminViewFilter('active')}
                className={`px-3 py-1 rounded-xl font-medium transition-all ${
                  adminViewFilter === 'active'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({activeClientsCount})
              </button>
              <button
                onClick={() => setAdminViewFilter('deleted')}
                className={`px-3 py-1 rounded-xl font-medium transition-all flex items-center gap-1 ${
                  adminViewFilter === 'deleted'
                    ? 'bg-rose-500 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-rose-600'
                }`}
                title="Clients deleted by administration role"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Deleted ({deletedClientsCount})</span>
              </button>
              <button
                onClick={() => setAdminViewFilter('all')}
                className={`px-3 py-1 rounded-xl font-medium transition-all ${
                  adminViewFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({clients.length})
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onOpenCustomerReports && (
            <button
              onClick={() => onOpenCustomerReports()}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 self-stretch sm:self-auto"
              title="Open Statement & Customer Reports"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Statements & Reports</span>
            </button>
          )}

          {canCreate && (
            <button
              onClick={onOpenAddClient}
              className="px-3.5 py-2 bg-(--accent-color) hover:bg-(--accent-color-dark) text-white rounded-2xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 self-stretch sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Client</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden space-y-3">
        {filteredClients.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-3xl ring-1 ring-slate-200/80 text-slate-400 text-xs">
            <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            No clients found matching your search.
          </div>
        ) : (
          filteredClients.map(client => {
            const hasDue = client.outstandingBalance > 0;

            return (
              <div
                key={client.id}
                className={`p-5 sm:p-6 rounded-3xl ring-1 shadow-sm transition-all duration-300 space-y-3 ${
                  client.isDeleted
                    ? 'bg-rose-50/60 ring-rose-200 border-l-4 border-l-rose-500'
                    : 'bg-white ring-slate-200/80 hover:shadow-xl hover:-translate-y-1'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`font-bold ${client.isDeleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {client.name}
                      </h4>
                      {client.isDeleted && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 ring-1 ring-rose-300">
                          Deleted by @{client.deletedBy || 'administration'}
                        </span>
                      )}
                    </div>
                    {client.company && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{client.company}</span>
                      </p>
                    )}
                  </div>
                  {hasDue ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 ring-1 ring-amber-300/60">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{formatCurrency(client.outstandingBalance)}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/60">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client.phone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-400">
                    Spent: <strong className="text-slate-700 font-mono">{formatCurrency(client.totalSpent)}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {client.isDeleted && isAdmin ? (
                      <>
                        <button
                          onClick={() => restoreClient(client.id)}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-2xl text-xs font-bold flex items-center gap-1"
                          title="Restore client"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Permanently delete "${client.name}"?`)) {
                              deleteClient(client.id, true);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-2xl"
                          title="Permanently delete client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onOpenNewSaleForClient(client)}
                          className="px-2.5 py-1 bg-(--accent-color-light) hover:bg-(--accent-color-light) text-(--accent-color-dark) rounded-2xl text-xs font-semibold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Sale</span>
                        </button>
                        <button
                          onClick={() => onSelectClientLedger(client)}
                          className="p-1.5 text-slate-500 hover:text-(--accent-color) hover:bg-(--accent-color-light) rounded-2xl"
                          title="Ledger"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => onOpenEditClient(client)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-2xl"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete client "${client.name}"?`)) {
                                deleteClient(client.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Clients Table (hidden on mobile) */}
      <div className="hidden md:block bg-white rounded-3xl ring-1 ring-slate-200/80 shadow-sm overflow-hidden">
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
                  const hasDue = client.outstandingBalance > 0;

                  return (
                    <tr
                      key={client.id}
                      className={`transition-colors ${
                        client.isDeleted
                          ? 'bg-rose-50/50 hover:bg-rose-100/50'
                          : 'hover:bg-(--accent-color-light)'
                      }`}
                    >
                      {/* Name & Company */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${client.isDeleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {client.name}
                          </span>
                          {client.isDeleted && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 ring-1 ring-rose-300">
                              Deleted by @{client.deletedBy || 'administration'}
                            </span>
                          )}
                        </div>
                        {client.company && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3" />
                            <span>{client.company}</span>
                          </div>
                        )}
                        {client.isDeleted && client.deletedAt && (
                          <div className="text-[10px] text-rose-600 mt-0.5">
                            Deleted on {new Date(client.deletedAt).toLocaleDateString()}
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

                      {/* Lifetime Spent */}
                      <td className="px-5 py-3.5 font-mono font-medium text-slate-800">
                        {formatCurrency(client.totalSpent)}
                      </td>

                      {/* Outstanding Balance */}
                      <td className="px-5 py-3.5">
                        {hasDue ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 ring-1 ring-amber-300/60">
                            <AlertCircle className="w-3 h-3" />
                            <span>{formatCurrency(client.outstandingBalance)}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300/60">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>$0.00 (Clear)</span>
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {client.isDeleted && isAdmin ? (
                            <>
                              <button
                                onClick={() => restoreClient(client.id)}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-2xl text-[11px] font-bold flex items-center gap-1 transition-colors"
                                title="Restore client"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Permanently delete "${client.name}"? This cannot be undone.`)) {
                                    deleteClient(client.id, true);
                                  }
                                }}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-2xl transition-colors"
                                title="Permanently delete client"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => onOpenNewSaleForClient(client)}
                                className="px-2 py-1 bg-(--accent-color-light) hover:bg-(--accent-color-light) text-(--accent-color-dark) rounded-2xl text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                title="New Sale for this client"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Sale</span>
                              </button>
                              <button
                                onClick={() => onSelectClientLedger(client)}
                                className="p-1.5 text-slate-500 hover:text-(--accent-color) hover:bg-(--accent-color-light) rounded-2xl transition-colors"
                                title="View Customer 360 History & Ledger"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                              {onOpenCustomerReports && (
                                <button
                                  onClick={() => onOpenCustomerReports(client.id)}
                                  className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-2xl transition-colors"
                                  title="Open Customer Reports & Statement of Account"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canEdit && (
                                <button
                                  onClick={() => onOpenEditClient(client)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors"
                                  title="Edit Client"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Delete client "${client.name}"?`)) {
                                      deleteClient(client.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
                                  title="Delete Client"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
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
