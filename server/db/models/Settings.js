import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    companyName: { type: String, required: true },
    tagline: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    taxRegistrationNumber: { type: String },
    taxNumber: { type: String },
    website: { type: String },
    currencySymbol: { type: String, default: '$' },
    currencyCode: { type: String, default: 'USD' },
    defaultTaxRate: { type: Number, default: 5.0 },
    defaultPaymentTermsDays: { type: Number, default: 30 },
    defaultLowStockThreshold: { type: Number, default: 5 },
    stockAlertThreshold: { type: Number, default: 3 },
    invoicePrefix: { type: String, default: 'INV-' },
    quotePrefix: { type: String, default: 'QT-' },
    receiptHeader: { type: String, default: 'Thank you for choosing Nexus Enterprise!' },
    receiptFooter: { type: String, default: 'Goods once sold can be returned within 30 days with original invoice.' },
    receiptHeaderMessage: { type: String, default: 'Thank you for shopping at Nexus Enterprise!' },
    receiptFooterMessage: { type: String, default: 'Returns accepted within 30 days with valid receipt.' },
    showBarcodeOnReceipt: { type: Boolean, default: true },
    showTaxBreakdown: { type: Boolean, default: true },
    autoPrintReceipt: { type: Boolean, default: false },
    compactMode: { type: Boolean, default: false },
    themeAccent: { type: String, default: 'indigo' },
    enableSoundEffects: { type: Boolean, default: true },
    enableAutoPrintReceipt: { type: Boolean, default: false },
    barcodeLabelConfig: {
      labelSize: { type: String, default: '50x25' },
      showPrice: { type: Boolean, default: true },
      showSku: { type: Boolean, default: true },
      showProductName: { type: Boolean, default: true },
      showCompanyName: { type: Boolean, default: true },
      barcodeType: { type: String, default: 'CODE128' },
    },
  },
  { timestamps: true }
);

SettingsSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.id || ret._id?.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('Settings', SettingsSchema);
