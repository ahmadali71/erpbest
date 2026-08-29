import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types/erp';
import { X, Building2, Phone, Mail, MapPin, CreditCard } from 'lucide-react';

interface SupplierModalProps {
  supplier?: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Supplier, 'id' | 'totalPurchased' | 'createdAt'>) => void;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  supplier,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<Supplier['paymentTerms']>('NET_30');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (supplier) {
      setName(supplier.name);
      setCompany(supplier.company || '');
      setEmail(supplier.email);
      setPhone(supplier.phone);
      setAddress(supplier.address || '');
      setPaymentTerms(supplier.paymentTerms || 'Net 30');
      setNotes(supplier.notes || '');
    } else {
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setAddress('');
      setPaymentTerms('NET_30');
      setNotes('');
    }
  }, [supplier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    onSave({
      name: name.trim(),
      contactPerson: name.trim(),
      company: company.trim() || undefined,
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      paymentTerms: paymentTerms as Supplier['paymentTerms'],
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[var(--accent-color)]" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              {supplier ? 'Edit Vendor / Supplier' : 'Register New Supplier'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Contact Person Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Marcus Vance"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)]"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Company / Entity</label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g. Apex Global Logistics"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="supply@vendor.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)]"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value as Supplier['paymentTerms'])}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] bg-white"
              >
                <option value="NET_15">Net 15 Days</option>
                <option value="NET_30">Net 30 Days</option>
                <option value="NET_60">Net 60 Days</option>
                <option value="DUE_ON_RECEIPT">Due on Receipt / COD</option>
                <option value="PREPAID">100% Prepaid</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Address / Warehouse</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="104 Industrial Pkwy, Dallas, TX"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Internal Notes & Product Lines</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Key supplier for electronics, OLED displays, and microcontrollers."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-dark)] text-white rounded-lg font-semibold shadow-xs transition-colors"
            >
              {supplier ? 'Update Supplier' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
