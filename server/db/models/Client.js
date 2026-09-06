import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    company: { type: String },
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    taxNumber: { type: String },
    creditLimit: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: String },
    deletedByRole: { type: String },
  },
  { timestamps: true }
);

ClientSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.id || ret._id?.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('Client', ClientSchema);
