import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Key,
  X,
  Save,
  RefreshCw,
  Search,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  UserRole,
  Permission,
  ROLE_LABELS,
  ROLE_COLORS,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
  getEffectivePermissions,
} from '../../config/permissions';

interface UserRecord {
  id: string;
  username: string;
  role: UserRole;
  name?: string;
  email?: string;
  isActive: boolean;
  customPermissions: Permission[];
  createdAt?: string;
}

// ─── Password visibility toggle input ────────────────────────
const PasswordInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}> = ({ value, onChange, placeholder = 'Password', autoComplete = 'new-password' }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-color)/30 focus:border-(--accent-color)"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

// ─── Role badge ───────────────────────────────────────────────
const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const c = ROLE_COLORS[role] || ROLE_COLORS.viewer;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${c.bg} ${c.text} ${c.ring}`}
    >
      {role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
      {ROLE_LABELS[role]}
    </span>
  );
};

// ─── All permission list in two columns ──────────────────────
const ALL_PERMISSIONS: { group: string; perms: Permission[] }[] = [
  { group: 'Dashboard', perms: ['dashboard.view'] },
  { group: 'POS', perms: ['pos.access'] },
  { group: 'Inventory', perms: ['inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete'] },
  { group: 'Sales', perms: ['sales.view', 'sales.create', 'sales.delete'] },
  { group: 'Returns', perms: ['returns.view', 'returns.create'] },
  { group: 'Quotations', perms: ['quotations.view', 'quotations.create'] },
  { group: 'Clients', perms: ['clients.view', 'clients.create', 'clients.edit', 'clients.delete'] },
  { group: 'Suppliers', perms: ['suppliers.view', 'suppliers.edit'] },
  { group: 'Payments', perms: ['payments.view', 'payments.record'] },
  { group: 'Expenses', perms: ['expenses.view', 'expenses.create'] },
  { group: 'Reports', perms: ['reports.view'] },
  { group: 'Stock Logs', perms: ['stock_logs.view'] },
  { group: 'Settings', perms: ['settings.view', 'settings.edit'] },
  { group: 'User Mgmt', perms: ['users.view', 'users.edit'] },
];

// ─── Create / Edit User Modal ─────────────────────────────────
interface UserFormProps {
  existing?: UserRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

const UserFormModal: React.FC<UserFormProps> = ({ existing, onClose, onSaved }) => {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    username: existing?.username || '',
    name: existing?.name || '',
    email: existing?.email || '',
    role: (existing?.role || 'viewer') as UserRole,
    password: '',
    isActive: existing?.isActive !== false,
    customPermissions: (existing?.customPermissions || []) as Permission[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleDefaults = ROLE_PERMISSIONS[form.role] || [];

  const toggleCustomPerm = (p: Permission) => {
    setForm(f => {
      // Can't remove role-default perms through custom (they're always there)
      if (roleDefaults.includes(p)) return f;
      const has = f.customPermissions.includes(p);
      return {
        ...f,
        customPermissions: has
          ? f.customPermissions.filter(x => x !== p)
          : [...f.customPermissions, p],
      };
    });
  };

  const handleSubmit = async () => {
    if (!form.username.trim()) return setError('Username is required');
    if (!form.role) return setError('Role is required');
    if (!isEdit && !form.password) return setError('Password is required for new users');
    if (form.password && form.password.length < 6) return setError('Password must be at least 6 chars');
    setLoading(true);
    setError('');
    try {
      const payload: any = {
        username: form.username.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        isActive: form.isActive,
        customPermissions: form.customPermissions,
      };
      if (form.password) payload.password = form.password;

      if (isEdit && existing?.id) {
        await api.updateUser(existing.id, payload);
      } else {
        await api.createUser(payload);
      }
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-(--accent-color) text-white flex items-center justify-center">
              {isEdit ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{isEdit ? 'Edit User' : 'Create New User'}</h2>
              <p className="text-xs text-slate-400">{isEdit ? `Editing @${existing?.username}` : 'Fill in the details below'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Username *</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="john_doe"
                autoComplete="off"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-color)/30 focus:border-(--accent-color)"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-color)/30 focus:border-(--accent-color)"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="john@company.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-color)/30 focus:border-(--accent-color)"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isEdit ? 'New Password (leave blank to keep)' : 'Password *'}
              </label>
              <PasswordInput value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Role *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(Object.keys(ROLE_LABELS) as UserRole[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: r, customPermissions: [] }))}
                  className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                    form.role === r
                      ? 'border-(--accent-color) bg-(--accent-color-light)'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <RoleBadge role={r} />
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-tight">{ROLE_DESCRIPTIONS[r]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Permissions panel */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-600">
                Permissions Preview
              </label>
              <span className="text-[11px] text-slate-400">
                ✦ = role default &nbsp; ☐ = custom override (admin-grantable)
              </span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 text-[11px] text-slate-500 font-medium border-b border-slate-200">
                Effective permissions for <strong>{ROLE_LABELS[form.role]}</strong>
              </div>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 max-h-56 overflow-y-auto">
                {ALL_PERMISSIONS.map(group => (
                  <div key={group.group}>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-2 mb-0.5">
                      {group.group}
                    </p>
                    {group.perms.map(p => {
                      const isDefault = roleDefaults.includes(p);
                      const isCustom = form.customPermissions.includes(p);
                      const isGranted = isDefault || isCustom;
                      return (
                        <label
                          key={p}
                          className={`flex items-center gap-2 py-0.5 cursor-pointer group ${
                            isDefault ? 'opacity-70' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isGranted}
                            disabled={isDefault} // Role defaults can't be removed
                            onChange={() => toggleCustomPerm(p)}
                            className="w-3.5 h-3.5 accent-(--accent-color) cursor-pointer"
                          />
                          <span className={`text-xs ${isGranted ? 'text-slate-700' : 'text-slate-400'}`}>
                            {p}
                          </span>
                          {isDefault && (
                            <span className="text-[9px] text-slate-400 font-bold">ROLE</span>
                          )}
                          {isCustom && !isDefault && (
                            <span className="text-[9px] text-emerald-600 font-bold">EXTRA</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status toggle */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-(--accent-color) after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
            <span className="text-sm font-medium text-slate-700">
              Account is {form.isActive ? 'Active' : 'Deactivated'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-(--accent-color) text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Change Password Modal ────────────────────────────────────
const ChangePasswordModal: React.FC<{ user: UserRecord; onClose: () => void }> = ({ user, onClose }) => {
  const { isAdmin } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (next.length < 6) return setError('New password must be at least 6 characters');
    if (next !== confirm) return setError('Passwords do not match');
    setLoading(true); setError('');
    try {
      await api.changePassword(user.id, current, next);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Change Password</h2>
              <p className="text-xs text-slate-400">@{user.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {success ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
              <CheckCircle2 className="w-4 h-4" /> Password updated!
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
              {!isAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Current Password</label>
                  <PasswordInput value={current} onChange={setCurrent} placeholder="Current password" autoComplete="current-password" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
                <PasswordInput value={next} onChange={setNext} placeholder="Min. 6 characters" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm New Password</label>
                <PasswordInput value={confirm} onChange={setConfirm} placeholder="Repeat new password" />
              </div>
            </>
          )}
        </div>
        {!success && (
          <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Update Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main User Management View ────────────────────────────────
export const UserManagementView: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [changePwUser, setChangePwUser] = useState<UserRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserRecord | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleDelete = async (u: UserRecord) => {
    try {
      await api.deleteUser(u.id);
      setDeleteConfirm(null);
      loadUsers();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const filtered = users.filter(u =>
    !search ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-(--accent-color)" />
            User Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage system users, roles, and permissions
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditingUser(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-(--accent-color) text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users by name, username or email…"
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-color)/30 focus:border-(--accent-color) bg-slate-50"
        />
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(ROLE_LABELS) as UserRole[]).map(r => (
          <div key={r} className="flex items-center gap-1.5">
            <RoleBadge role={r} />
            <span className="text-[11px] text-slate-500">
              ({users.filter(u => u.role === r).length})
            </span>
          </div>
        ))}
      </div>

      {/* Users table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mr-3" />
          Loading users…
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider hidden md:table-cell">Permissions</th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    {search ? 'No users match your search.' : 'No users found.'}
                  </td>
                </tr>
              ) : (
                filtered.map(u => {
                  const effectivePerms = getEffectivePermissions(u.role, u.customPermissions);
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className={`hover:bg-slate-50/60 transition-colors ${!u.isActive ? 'opacity-50' : ''}`}>
                      {/* User info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-(--accent-color) text-white font-bold flex items-center justify-center text-sm shrink-0">
                            {(u.name || u.username).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {u.name || u.username}
                              {isSelf && (
                                <span className="text-[10px] font-bold text-(--accent-color) bg-(--accent-color-light) px-1.5 py-0.5 rounded-full">YOU</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">@{u.username}{u.email ? ` · ${u.email}` : ''}</p>
                          </div>
                        </div>
                      </td>
                      {/* Role */}
                      <td className="px-4 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      {/* Permissions count */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-700">{effectivePerms.length}</span>
                          <span className="text-xs text-slate-400">permissions</span>
                          {u.customPermissions.length > 0 && (
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                              +{u.customPermissions.length} extra
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400 text-xs font-semibold">
                            <XCircle className="w-3.5 h-3.5" /> Inactive
                          </span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setChangePwUser(u)}
                            className="p-2 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                            title="Change password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => { setEditingUser(u); setShowForm(true); }}
                                className="p-2 rounded-lg hover:bg-(--accent-color-light) text-slate-400 hover:text-(--accent-color-dark) transition-colors"
                                title="Edit user"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {!isSelf && (
                                <button
                                  onClick={() => setDeleteConfirm(u)}
                                  className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <UserFormModal
          existing={editingUser}
          onClose={() => { setShowForm(false); setEditingUser(null); }}
          onSaved={() => { setShowForm(false); setEditingUser(null); loadUsers(); }}
        />
      )}

      {changePwUser && (
        <ChangePasswordModal
          user={changePwUser}
          onClose={() => setChangePwUser(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Delete User?</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 mb-5">
              Are you sure you want to delete <strong>@{deleteConfirm.username}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
