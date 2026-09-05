import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    name: { type: String },
    email: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.id || ret._id?.toString();
    delete ret._id;
    delete ret.password;
    return ret;
  },
});

export default mongoose.model('User', UserSchema);
