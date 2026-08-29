import React, { useState, useRef } from 'react';
import {
  Building2,
  Receipt,
  Barcode,
  Palette,
  Database,
  Save,
  CheckCircle2,
  RotateCcw,
  Download,
  Upload,
  Printer,
  ShieldCheck,
  Globe,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Percent,
  Sliders,
  Sparkles,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { CompanySettings, ThemeAccent } from '../../types/erp';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    products,
    exportBackup,
    restoreDatabase,
    resetToDemoData,
    serverStatus,
    formatCurrency,
  } = useERP();

  const [activeSubTab, setActiveSubTab] = useState<
    'profile' | 'tax_stock' | 'receipt' | 'barcode' | 'theme' | 'backup'
  >('profile');

  // Form State
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // Barcode Preview state
  const [previewProductId, setPreviewProductId] = useState<string>(
    products[0]?.id || ''
  );
  const selectedProduct = products.find(p => p.id === previewProductId) || products[0];

  const handleInputChange = (field: keyof CompanySettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setSaveSuccess(false);
  };

  const handleBarcodeConfigChange = (
    field: keyof CompanySettings['barcodeLabelConfig'],
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      barcodeLabelConfig: {
        ...prev.barcodeLabelConfig,
        [field]: value,
      },
    }));
    setSaveSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await restoreDatabase(json);
        alert('Database backup restored successfully!');
        setRestoreError(null);
      } catch (err: any) {
        setRestoreError('Invalid backup JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const themeOptions: Array<{ id: ThemeAccent; label: string; color: string; bgClass: string }> = [
    { id: 'indigo', label: 'Indigo Classic', color: '#4f46e5', bgClass: 'bg-indigo-600' },
    { id: 'emerald', label: 'Emerald Mint', color: '#10b981', bgClass: 'bg-emerald-600' },
    { id: 'violet', label: 'Royal Violet', color: '#8b5cf6', bgClass: 'bg-violet-600' },
    { id: 'rose', label: 'Rose Berry', color: '#f43f5e', bgClass: 'bg-rose-600' },
    { id: 'amber', label: 'Amber Gold', color: '#f59e0b', bgClass: 'bg-amber-600' },
    { id: 'slate', label: 'Obsidian Slate', color: '#64748b', bgClass: 'bg-slate-800' },
    { id: 'cyan', label: 'Cyan Ocean', color: '#06b6d4', bgClass: 'bg-cyan-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-[var(--accent-color)]" />
            <span>Company Settings & Preferences</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Configure enterprise identity, tax rules, POS receipts, barcode generator, and themes
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 bg-[var(--accent-color)] hover:bg-[var(--accent-color-dark)] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
        >
          {saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Saved Successfully</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
            </>
          )}
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-xs font-semibold animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Settings saved and synchronized in real-time across all connected terminals.</span>
          </div>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar Sub-tabs */}
        <div className="lg:col-span-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all text-left ${
              activeSubTab === 'profile'
                ? 'bg-[var(--accent-color-light)] text-[var(--accent-color-dark)] font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 flex-shrink-0" />
            <span>Company Profile</span>
          </button>

          <button
            onClick={() => setActiveSubTab('tax_stock')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all text-left ${
              activeSubTab === 'tax_stock'
                ? 'bg-[var(--accent-color-light)] text-[var(--accent-color-dark)] font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Percent className="w-4 h-4 flex-shrink-0" />
            <span>Tax & Stock Defaults</span>
          </button>

          <button
            onClick={() => setActiveSubTab('receipt')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all text-left ${
              activeSubTab === 'receipt'
                ? 'bg-[var(--accent-color-light)] text-[var(--accent-color-dark)] font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 flex-shrink-0" />
            <span>POS & Receipts</span>
          </button>

          <button
            onClick={() => setActiveSubTab('barcode')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all text-left ${
              activeSubTab === 'barcode'
                ? 'bg-[var(--accent-color-light)] text-[var(--accent-color-dark)] font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Barcode className="w-4 h-4 flex-shrink-0" />
            <span>Barcode Label Printer</span>
          </button>

          <button
            onClick={() => setActiveSubTab('theme')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all text-left ${
              activeSubTab === 'theme'
                ? 'bg-[var(--accent-color-light)] text-[var(--accent-color-dark)] font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Palette className="w-4 h-4 flex-shrink-0" />
            <span>Theme & Accent</span>
          </button>

          <button
            onClick={() => setActiveSubTab('backup')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all text-left ${
              activeSubTab === 'backup'
                ? 'bg-[var(--accent-color-light)] text-[var(--accent-color-dark)] font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 flex-shrink-0" />
            <span>Data Backup & Reset</span>
          </button>
        </div>

        {/* Content Pane */}
        <div className="lg:col-span-9 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          {/* TAB 1: COMPANY PROFILE */}
          {activeSubTab === 'profile' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Company Identity & Legal Details</h3>
                <p className="text-xs text-slate-500">
                  This information appears on all invoices, quotations, receipts, and client statements.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Company / Trade Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={e => handleInputChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-color-light)] focus:border-[var(--accent-color)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Legal Tax Number / VAT ID
                  </label>
                  <input
                    type="text"
                    value={formData.taxNumber}
                    onChange={e => handleInputChange('taxNumber', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-color-light)] focus:border-[var(--accent-color)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Support / Billing Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-color-light)] focus:border-[var(--accent-color)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-color-light)] focus:border-[var(--accent-color)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Physical Headquarters Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-color-light)] focus:border-[var(--accent-color)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={e => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-color-light)] focus:border-[var(--accent-color)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      value={formData.currencySymbol}
                      onChange={e => handleInputChange('currencySymbol', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-color-light)] focus:border-[var(--accent-color)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Currency Code
                    </label>
                    <select
                      value={formData.currencyCode}
                      onChange={e => handleInputChange('currencyCode', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-color-light)] focus:border-[var(--accent-color)]"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD (C$)</option>
                      <option value="AUD">AUD (A$)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="AED">AED (AED)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TAX & STOCK DEFAULTS */}
          {activeSubTab === 'tax_stock' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Tax Rates & Inventory Thresholds</h3>
                <p className="text-xs text-slate-500">
                  Global parameters applied to new sales, purchase orders, and low-stock telemetry.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Default Sales Tax Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.defaultTaxRate}
                      onChange={e => handleInputChange('defaultTaxRate', parseFloat(e.target.value) || 0)}
                      className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-color-light)] focus:border-[var(--accent-color)]"
                    />
                    <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Automatically pre-filled on new POS transactions and invoices
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Default Payment Term (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={formData.defaultPaymentTermsDays}
                    onChange={e => handleInputChange('defaultPaymentTermsDays', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-color-light)] focus:border-[var(--accent-color)]"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Number of days added to sale date for invoice due date
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Default Low Stock Threshold (Units)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.defaultLowStockThreshold}
                    onChange={e => handleInputChange('defaultLowStockThreshold', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-color-light)] focus:border-[var(--accent-color)]"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Items below this trigger dashboard low-stock warning indicators
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Stock Alert Notification Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.stockAlertThreshold}
                    onChange={e => handleInputChange('stockAlertThreshold', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-color-light)] focus:border-[var(--accent-color)]"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Critical stock level for red sidebar counter badge
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: POS & RECEIPT CUSTOMIZATION */}
          {activeSubTab === 'receipt' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">POS Register & Thermal Receipt Format</h3>
                <p className="text-xs text-slate-500">
                  Customize the customer receipt printout from the POS terminal.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Receipt Header Banner Message
                  </label>
                  <input
                    type="text"
                    value={formData.receiptHeaderMessage}
                    onChange={e => handleInputChange('receiptHeaderMessage', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-color-light)] focus:border-[var(--accent-color)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Receipt Footer Note / Return Policy
                  </label>
                  <textarea
                    rows={2}
                    value={formData.receiptFooterMessage}
                    onChange={e => handleInputChange('receiptFooterMessage', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-color-light)] focus:border-[var(--accent-color)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.showBarcodeOnReceipt}
                      onChange={e => handleInputChange('showBarcodeOnReceipt', e.target.checked)}
                      className="w-4 h-4 text-[var(--accent-color)] rounded border-slate-300 focus:ring-[var(--accent-color)]"
                    />
                    <span className="text-xs font-bold text-slate-800">Print Barcode on Receipt</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.showTaxBreakdown}
                      onChange={e => handleInputChange('showTaxBreakdown', e.target.checked)}
                      className="w-4 h-4 text-[var(--accent-color)] rounded border-slate-300 focus:ring-[var(--accent-color)]"
                    />
                    <span className="text-xs font-bold text-slate-800">Print Tax Breakdown</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.autoPrintReceipt}
                      onChange={e => handleInputChange('autoPrintReceipt', e.target.checked)}
                      className="w-4 h-4 text-[var(--accent-color)] rounded border-slate-300 focus:ring-[var(--accent-color)]"
                    />
                    <span className="text-xs font-bold text-slate-800">Auto Prompt Print on Sale</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BARCODE LABEL PRINTER */}
          {activeSubTab === 'barcode' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Barcode Sticker Label Generator</h3>
                <p className="text-xs text-slate-500">
                  Configure format and live generate printable adhesive barcode labels for merchandise.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Configuration form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Label Size Preset
                    </label>
                    <select
                      value={formData.barcodeLabelConfig.labelSize}
                      onChange={e => handleBarcodeConfigChange('labelSize', e.target.value as any)}
                       className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-color-light)] focus:border-[var(--accent-color)]"
                    >
                      <option value="50x25">50mm × 25mm (Standard Retail Sticker)</option>
                      <option value="38x25">38mm × 25mm (Compact Jewelry / Small Item)</option>
                      <option value="70x35">70mm × 35mm (Large Warehouse Pallet / Box)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Preview with Product
                    </label>
                    <select
                      value={previewProductId}
                      onChange={e => setPreviewProductId(e.target.value)}
                       className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-color-light)] focus:border-[var(--accent-color)]"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) - {formatCurrency(p.sellingPrice)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.barcodeLabelConfig.showPrice}
                        onChange={e => handleBarcodeConfigChange('showPrice', e.target.checked)}
                        className="w-4 h-4 text-[var(--accent-color)] rounded border-slate-300 focus:ring-[var(--accent-color)]"
                      />
                      <span>Show Retail Selling Price</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.barcodeLabelConfig.showSku}
                        onChange={e => handleBarcodeConfigChange('showSku', e.target.checked)}
                        className="w-4 h-4 text-[var(--accent-color)] rounded border-slate-300 focus:ring-[var(--accent-color)]"
                      />
                      <span>Show SKU Code</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.barcodeLabelConfig.showProductName}
                        onChange={e => handleBarcodeConfigChange('showProductName', e.target.checked)}
                        className="w-4 h-4 text-[var(--accent-color)] rounded border-slate-300 focus:ring-[var(--accent-color)]"
                      />
                      <span>Show Product Name</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.barcodeLabelConfig.showCompanyName}
                        onChange={e => handleBarcodeConfigChange('showCompanyName', e.target.checked)}
                        className="w-4 h-4 text-[var(--accent-color)] rounded border-slate-300 focus:ring-[var(--accent-color)]"
                      />
                      <span>Show Company Brand Header</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Single / Batch Labels</span>
                  </button>
                </div>

                {/* Live Sticker Preview Canvas */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-100 rounded-2xl border border-dashed border-slate-300">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">
                    Live Sticker Label Preview ({formData.barcodeLabelConfig.labelSize}mm)
                  </span>

                  {selectedProduct && (
                    <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-md text-center w-64 select-none space-y-1">
                      {formData.barcodeLabelConfig.showCompanyName && (
                        <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                          {formData.companyName}
                        </div>
                      )}

                      {formData.barcodeLabelConfig.showProductName && (
                        <div className="text-xs font-extrabold text-slate-900 truncate">
                          {selectedProduct.name}
                        </div>
                      )}

                      {/* SVG Barcode simulation */}
                      <div className="py-1 flex flex-col items-center">
                        <svg className="w-48 h-12" viewBox="0 0 160 40">
                          <g fill="#000">
                            {/* Realistic vertical bars */}
                            {[
                              2, 5, 8, 12, 15, 17, 21, 24, 28, 30, 34, 38, 41, 45, 48,
                              52, 55, 59, 62, 66, 70, 73, 77, 80, 83, 87, 91, 94, 98,
                              101, 105, 108, 112, 115, 119, 123, 126, 130, 133, 137,
                              140, 144, 147, 151, 155,
                            ].map((pos, i) => (
                              <rect
                                key={i}
                                x={pos}
                                y="0"
                                width={(i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1.2)}
                                height="40"
                              />
                            ))}
                          </g>
                        </svg>
                        <span className="font-mono text-[10px] tracking-widest text-slate-700 font-bold mt-0.5">
                          {selectedProduct.barcode || selectedProduct.sku}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                        {formData.barcodeLabelConfig.showSku && (
                          <span className="font-mono font-bold text-slate-500">{selectedProduct.sku}</span>
                        )}
                        {formData.barcodeLabelConfig.showPrice && (
                          <span className="font-mono font-black text-[var(--accent-color-dark)] ml-auto">
                            {formatCurrency(selectedProduct.sellingPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: THEME & BRAND ACCENT */}
          {activeSubTab === 'theme' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Brand Color Accent & Interface Theme</h3>
                <p className="text-xs text-slate-500">
                  Select your organization's primary visual theme for UI highlights, buttons, and badges.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Select Primary Brand Accent
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {themeOptions.map(opt => {
                    const isSelected = formData.themeAccent === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleInputChange('themeAccent', opt.id)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-2 ${
                          isSelected ? 'shadow-md' : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                        style={isSelected ? { borderColor: opt.color, backgroundColor: `${opt.color}10` } : {}}
                      >
                        <div className={`w-8 h-8 rounded-xl ${opt.bgClass} shadow-xs flex items-center justify-center text-white`}>
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.compactMode}
                    onChange={e => handleInputChange('compactMode', e.target.checked)}
                      className="w-4 h-4 text-[var(--accent-color)] rounded border-slate-300 focus:ring-[var(--accent-color)]"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800">Compact Density Table Rows</span>
                    <span className="block text-[11px] text-slate-400">
                      Tighter padding for high-volume POS and warehouse operations
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 6: BACKUP & RESTORE */}
          {activeSubTab === 'backup' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Database Backup, Migration & Reset</h3>
                <p className="text-xs text-slate-500">
                  Export snapshot files for offline security, migrate to another instance, or restore data.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-4">
                  <div>
                     <div className="w-10 h-10 rounded-xl bg-[var(--accent-color-light)] border border-[var(--accent-color-light)] flex items-center justify-center text-[var(--accent-color)] mb-3">
                      <Download className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Export Full JSON Database Backup</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Downloads an instant snapshot containing products, clients, sales, stock logs, returns, suppliers, and settings.
                    </p>
                  </div>

                  <button
                    onClick={exportBackup}
                     className="w-full px-4 py-2.5 bg-[var(--accent-color)] hover:bg-[var(--accent-color-dark)] text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download JSON Backup</span>
                  </button>
                </div>

                {/* Import / Restore Card */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                      <Upload className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Restore Database from Backup</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Upload a previously exported JSON backup file to overwrite and restore the state.
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".json"
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload & Restore Backup</span>
                  </button>
                </div>
              </div>

              {restoreError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{restoreError}</span>
                </div>
              )}

              {/* Danger Zone */}
              <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-3">
                <div className="flex items-center gap-2 text-rose-700">
                  <AlertCircle className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Danger Zone: Reset Demo Data</h4>
                </div>
                <p className="text-xs text-slate-600">
                  Resets the database back to initial demonstration sample data. All newly created invoices and custom products will be replaced.
                </p>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset all database records back to the default demonstration sample dataset?')) {
                      resetToDemoData();
                    }
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All to Demo Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
