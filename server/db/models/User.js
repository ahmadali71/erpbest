import mongoose from 'mongoose';

const VALID_ROLES = ['admin', 'administration', 'manager', 'invoice', 'cashier', 'viewer'];

const VALID_PERMISSIONS = [
  'dashboard.view',
  'pos.access',
  'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
  'sales.view', 'sales.create', 'sales.delete',
  'returns.view', 'returns.create',
  'quotations.view', 'quotations.create',
  'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
  'suppliers.view', 'suppliers.edit',
  'payments.view', 'payments.record',
  'expenses.view', 'expenses.create',
  'reports.view',
  'stock_logs.view',
  'settings.view', 'settings.edit',
  'users.view', 'users.edit',
];

const UserSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: VALID_ROLES,
      default: 'viewer',
    },
    /** Custom per-user permission overrides (merged on top of role defaults) */
    customPermissions: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.every((p) => VALID_PERMISSIONS.includes(p)),
        message: 'Invalid permission value in customPermissions',
      },
    },
    name: { type: String },
    email: { type: String },
    isActive: { type: Boolean, default: true },
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
