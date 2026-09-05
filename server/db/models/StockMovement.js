import mongoose from 'mongoose';

const StockMovementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    type: { type: String, required: true },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    unitCost: { type: Number },
    note: { type: String },
    referenceId: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

StockMovementSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.id || ret._id?.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('StockMovement', StockMovementSchema);
