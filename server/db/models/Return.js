import mongoose from 'mongoose';

const ReturnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    returnNumber: { type: String },
    invoiceId: { type: String, required: true },
    invoiceNumber: { type: String, required: true },
    clientId: { type: String, required: true },
    clientName: { type: String, required: true },
    items: {
      type: Array,
      required: true,
    },
    totalRefundAmount: { type: Number, required: true, default: 0 },
    restockingFee: { type: Number, required: true, default: 0 },
    netRefundAmount: { type: Number, required: true, default: 0 },
    itemsTotal: { type: Number, required: true, default: 0 },
    refundMethod: { type: String, enum: ['CASH', 'CARD', 'STORE_CREDIT', 'BANK_TRANSFER'], required: true },
    notes: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ReturnSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.id || ret._id?.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('Return', ReturnSchema);
