import mongoose from 'mongoose';

const PurchaseOrderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    orderNumber: { type: String },
    supplierId: { type: String, required: true },
    supplierName: { type: String, required: true },
    items: {
      type: Array,
      required: true,
    },
    subtotal: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED'], default: 'ORDERED' },
    date: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: String },
    receivedDate: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

PurchaseOrderSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.id || ret._id?.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('PurchaseOrder', PurchaseOrderSchema);
