import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    barcode: { type: String },
    purchasePrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    stockQuantity: { type: Number, required: true, default: 0 },
    minStockThreshold: { type: Number, required: true, default: 5 },
    unit: { type: String, required: true, default: 'pcs' },
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ProductSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.id || ret._id?.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('Product', ProductSchema);
