import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true },
    description: { type: String },
    color: { type: String },
  },
  { timestamps: true }
);

CategorySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.id || ret._id?.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('Category', CategorySchema);
