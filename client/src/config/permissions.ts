/**
 * Nexus ERP — Roles & Permissions Configuration
 *
 * ROLES:
 *  - admin    : Full access to everything, including Settings, User Management, Database
 *  - manager  : Full operational access. Cannot touch Settings/Database/User Management
 *  - invoice  : Limited to Sales, POS, Quotations, Clients (view), Payments
 *  - cashier  : POS terminal + view-only Sales
 *  - viewer   : Read-only access to Dashboard, Sales, Inventory
 *
 * PERMISSIONS: each is a dot-separated string: "<module>.<action>"
 */

export type UserRole = 'admin' | 'administration' | 'manager' | 'invoice' | 'cashier' | 'viewer';

export type Permission =
  // Dashboard
  | 'dashboard.view'
  // POS Terminal
  | 'pos.access'
  // Inventory
  | 'inventory.view'
  | 'inventory.create'      // add new products
  | 'inventory.edit'        // edit products, restock, categories
  | 'inventory.delete'      // delete products
  // Sales & Invoices
  | 'sales.view'
  | 'sales.create'
  | 'sales.delete'
  // Returns & Refunds
  | 'returns.view'
  | 'returns.create'
  // Quotations & Estimates
  | 'quotations.view'
  | 'quotations.create'
  // Clients
  | 'clients.view'
  | 'clients.create'        // add new clients
  | 'clients.edit'          // edit clients
  | 'clients.delete'        // delete clients
  // Suppliers & Purchase Orders
  | 'suppliers.view'
  | 'suppliers.edit'
  // Payments & Receivables
  | 'payments.view'
  | 'payments.record'       // record new payment transactions
  // Expense Tracker
  | 'expenses.view'
  | 'expenses.create'
  // Reports & Analytics
  | 'reports.view'
  // Stock Movement Logs
  | 'stock_logs.view'
  // Settings (admin only)
  | 'settings.view'
  | 'settings.edit'
  // User Management (admin only)
  | 'users.view'
  | 'users.edit';

/** All permissions a given role receives by default */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
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
  ],

  administration: [
    'inventory.view', 'inventory.create', 'inventory.delete',
    'clients.view', 'clients.create', 'clients.delete',
    'sales.view', 'sales.create', 'sales.delete',
  ],

  manager: [
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
  ],

  invoice: [
    'dashboard.view',
    'pos.access',
    'sales.view', 'sales.create',
    'quotations.view', 'quotations.create',
    'clients.view',
    'payments.view', 'payments.record',
    'returns.view',
  ],

  cashier: [
    'dashboard.view',
    'pos.access',
    'sales.view', 'sales.create',
    'clients.view',
    'payments.view',
  ],

  viewer: [
    'dashboard.view',
    'inventory.view',
    'sales.view',
    'clients.view',
    'suppliers.view',
    'reports.view',
  ],
};

/** Human-readable role labels */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  administration: 'Administration',
  manager: 'Manager',
  invoice: 'Invoice / Sales Agent',
  cashier: 'Cashier',
  viewer: 'Read-Only Viewer',
};

/** Role badge colors for UI */
export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; ring: string }> = {
  admin: { bg: 'bg-indigo-100', text: 'text-indigo-800', ring: 'ring-indigo-300/60' },
  administration: { bg: 'bg-rose-100', text: 'text-rose-800', ring: 'ring-rose-300/60' },
  manager: { bg: 'bg-violet-100', text: 'text-violet-800', ring: 'ring-violet-300/60' },
  invoice: { bg: 'bg-emerald-100', text: 'text-emerald-800', ring: 'ring-emerald-300/60' },
  cashier: { bg: 'bg-amber-100', text: 'text-amber-800', ring: 'ring-amber-300/60' },
  viewer: { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-300/60' },
};

/** Description of each role for admin UI */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full system access including Settings, User Management, and Database controls.',
  administration: 'Create and delete products, customers, and invoices only. All deletions visible to Admin only.',
  manager: 'Full operational access to all modules. Cannot change system settings or manage users.',
  invoice: 'Access to POS, Sales, Quotations, Clients (view-only), and Payments. No inventory or reports.',
  cashier: 'POS terminal access and viewing sales. Minimal permissions.',
  viewer: 'Read-only access to Dashboard, Inventory, Sales, Clients, Suppliers, and Reports.',
};

/**
 * Utility: get effective permissions for a user.
 * Merges role defaults with any custom overrides stored on the user record.
 */
export function getEffectivePermissions(
  role: UserRole,
  customPermissions?: Permission[]
): Permission[] {
  const roleDefaults = ROLE_PERMISSIONS[role] || [];
  if (!customPermissions || customPermissions.length === 0) return roleDefaults;

  // Union of role defaults + custom grants (admin can grant extra perms)
  const merged = new Set([...roleDefaults, ...customPermissions]);
  return Array.from(merged);
}

/**
 * Utility: check if a permission set includes a specific permission
 */
export function hasPermission(
  permissions: Permission[],
  required: Permission
): boolean {
  return permissions.includes(required);
}

/**
 * Utility: check if a permission set includes all required permissions
 */
export function hasAllPermissions(
  permissions: Permission[],
  required: Permission[]
): boolean {
  return required.every(p => permissions.includes(p));
}

/**
 * Map from NavTab → required permission to VIEW that tab
 */
export const TAB_PERMISSIONS: Record<string, Permission> = {
  dashboard:   'dashboard.view',
  pos:         'pos.access',
  inventory:   'inventory.view',
  sales:       'sales.view',
  returns:     'returns.view',
  quotations:  'quotations.view',
  clients:     'clients.view',
  suppliers:   'suppliers.view',
  payments:    'payments.view',
  expenses:    'expenses.view',
  reports:     'reports.view',
  stock_logs:  'stock_logs.view',
  settings:    'settings.view',
};
