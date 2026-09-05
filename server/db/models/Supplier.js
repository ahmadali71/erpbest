import mongoose from 'mongoose';

const SupplierSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    contactPerson: { type: String },
    company: { type: String },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    paymentTerms: { type: String, default: 'NET_30' },
    taxNumber: { type: String },
    notes: { type: String },
    totalPurchased: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SupplierSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.id || ret._id?.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('Supplier', SupplierSchema);
