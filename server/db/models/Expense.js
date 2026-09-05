import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    date: { type: Date, required: true },
    reference: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

ExpenseSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.id || ret._id?.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('Expense', ExpenseSchema);
