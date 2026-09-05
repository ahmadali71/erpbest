import mongoose from 'mongoose';

const QuotationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    quotationNumber: { type: String },
    clientId: { type: String, required: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String },
    clientPhone: { type: String },
    items: {
      type: Array,
      required: true,
    },
    subtotal: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    status: { type: String, enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED'], default: 'DRAFT' },
    date: { type: Date, default: Date.now },
    validUntil: { type: String },
    notes: { type: String },
    convertedInvoiceId: { type: String },
  },
  { timestamps: true }
);

QuotationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.id || ret._id?.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('Quotation', QuotationSchema);
