import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Truck,
  Plus,
  Search,
  Package,
  CheckCircle2,
  Clock,
  Building2,
  Mail,
  Phone,
  ArrowUpRight,
  Trash2,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Supplier, PurchaseOrder } from '../../types/erp';
import { SupplierModal } from '../Modals/SupplierModal';
import { NewPurchaseOrderModal } from '../Modals/NewPurchaseOrderModal';

export const SuppliersView: React.FC = () => {
  const {
    suppliers,
    purchaseOrders,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    receivePurchaseOrder,
    updatePurchaseOrderStatus,
    deletePurchaseOrder,
    totalAccountsPayable,
    orderedPOCount,
  } = useERP();

  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'suppliers'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false);
  const [receivingPOId, setReceivingPOId] = useState<string | null>(null);

  // Filtered lists
  const filteredSuppliers = suppliers.filter(
    s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = purchaseOrders.filter(
    po =>
      po.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReceivePO = async (poId: string) => {
    if (window.confirm('Receive this purchase order and automatically increment product inventory counts?')) {
      setReceivingPOId(poId);
      try {
        await receivePurchaseOrder(poId);
      } finally {
        setReceivingPOId(null);
      }
    }
  };

   const handleSaveSupplier = async (data: Omit<Supplier, 'id' | 'totalPurchased' | 'createdAt'>) => {
     if (supplierToEdit) {
       await updateSupplier(supplierToEdit.id, data);
     } else {
       await addSupplier(data);
     }
   };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      {/* Top Banner / Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Suppliers</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{suppliers.length}</h3>
            <span className="text-xs text-[var(--accent-color)] font-medium">Verified supply chain vendors</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-color-light)] text-[var(--accent-color)] flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Purchase Orders</span>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{orderedPOCount}</h3>
            <span className="text-xs text-slate-500 font-medium">Awaiting warehouse delivery</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Accounts Payable Total</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">${totalAccountsPayable.toLocaleString()}</h3>
            <span className="text-xs text-slate-500 font-medium">Cumulative supply obligations</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl ring-1 ring-slate-200/80 shadow-sm overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('orders')}
              className={`px-4 py-2 text-sm font-bold rounded-2xl transition-all duration-200 ${
                activeSubTab === 'orders'
                  ? 'bg-[var(--accent-color)] text-white shadow-sm ring-2 ring-[var(--accent-color-dark)]/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Purchase Orders ({purchaseOrders.length})
            </button>
            <button
              onClick={() => setActiveSubTab('suppliers')}
              className={`px-4 py-2 text-sm font-bold rounded-2xl transition-all duration-200 ${
                activeSubTab === 'suppliers'
                  ? 'bg-[var(--accent-color)] text-white shadow-sm ring-2 ring-[var(--accent-color-dark)]/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Suppliers Directory ({suppliers.length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeSubTab === 'orders' ? 'Search PO # or vendor...' : 'Search supplier name...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              />
            </div>

            {activeSubTab === 'orders' ? (
              <button
                onClick={() => setIsNewPOModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-dark)] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>New PO</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSupplierToEdit(null);
                  setIsSupplierModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-dark)] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Supplier</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        {activeSubTab === 'orders' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6 border-b border-slate-200 font-semibold">PO Number</th>
                  <th className="py-3.5 px-4 border-b border-slate-200 font-semibold">Supplier</th>
                  <th className="py-3.5 px-4 border-b border-slate-200 font-semibold">Items Count</th>
                  <th className="py-3.5 px-4 border-b border-slate-200 font-semibold">Total Amount</th>
                  <th className="py-3.5 px-4 border-b border-slate-200 font-semibold">Order Date</th>
                  <th className="py-3.5 px-4 border-b border-slate-200 font-semibold">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 border-b border-slate-200 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">No Purchase Orders Found</p>
                      <p className="text-xs text-slate-400 mt-1">Create purchase orders to restock products from suppliers</p>
                    </td>
                  </tr>
                 ) : (
                   filteredOrders.map(po => {
                     const isReceived = po.status === 'RECEIVED';
                     const isCancelled = po.status === 'CANCELLED';

                     return (
                       <tr key={po.id} className="hover:bg-[var(--accent-color-light)] transition-colors">
                        <td className="py-4 px-4 sm:px-6 font-bold text-slate-900">
                          {po.orderNumber}
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-800">{po.supplierName}</span>
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          {po.items.reduce((acc, it) => acc + it.quantity, 0)} items ({po.items.length} lines)
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-900">
                          ${po.grandTotal.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-500">
                          {new Date(po.date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full ${
                              isReceived
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isCancelled
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isReceived ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                            {po.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isReceived && !isCancelled && (
                              <button
                                onClick={() => handleReceivePO(po.id)}
                                disabled={receivingPOId === po.id}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition-colors shadow-sm flex items-center gap-1"
                              >
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>Receive Stock</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (window.confirm('Delete this purchase order?')) {
                                  deletePurchaseOrder(po.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
                              title="Delete PO"
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-6">
            {filteredSuppliers.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400">
                <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">No Suppliers Found</p>
                <p className="text-xs text-slate-400 mt-1">Add your product suppliers and vendors to manage purchasing</p>
              </div>
            ) : (
              filteredSuppliers.map(sup => (
                 <div
                   key={sup.id}
                   className="bg-white p-5 rounded-3xl ring-1 ring-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
                 >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-base text-slate-900">{sup.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Contact: {sup.contactPerson}</p>
                      </div>
                       <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-full ring-1 ring-slate-300/60">
                         {sup.paymentTerms}
                       </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{sup.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sup.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Ordered</span>
                      <p className="font-bold text-slate-900">${sup.totalPurchased.toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSupplierToEdit(sup);
                            setIsSupplierModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-[var(--accent-color)] hover:bg-[var(--accent-color-light)] rounded-2xl transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete supplier ${sup.name}?`)) {
                              deleteSupplier(sup.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-2xl transition-colors"
                          title="Delete"
                        >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => {
          setIsSupplierModalOpen(false);
          setSupplierToEdit(null);
        }}
        supplier={supplierToEdit}
        onSave={handleSaveSupplier}
      />

      <NewPurchaseOrderModal
        isOpen={isNewPOModalOpen}
        onClose={() => setIsNewPOModalOpen(false)}
      />
    </div>
  );
};
