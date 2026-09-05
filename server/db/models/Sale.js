import mongoose from 'mongoose';

const SaleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    invoiceNumber: { type: String },
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
    totalCost: { type: Number, required: true, default: 0 },
    profit: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, required: true, default: 0 },
    amountDue: { type: Number, required: true, default: 0 },
    paymentStatus: { type: String, enum: ['PENDING', 'PARTIAL', 'PAID'], default: 'PENDING' },
    paymentMethod: { type: String, required: true },
    notes: { type: String },
    dueDate: { type: String },
    date: { type: Date, default: Date.now },
    payments: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

SaleSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.id || ret._id?.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('Sale', SaleSchema);
