import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nexus-erp-secret-key-change-in-production';

/**
 * Role → default permissions mapping (mirrors client-side config/permissions.ts)
 * Kept here so the server can enforce permissions without the frontend config.
 */
const ROLE_PERMISSIONS = {
  admin: [
    'dashboard.view', 'pos.access',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
    'sales.view', 'sales.create', 'sales.delete',
    'returns.view', 'returns.create',
    'quotations.view', 'quotations.create',
    'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
    'suppliers.view', 'suppliers.edit',
    'payments.view', 'payments.record',
    'expenses.view', 'expenses.create',
    'reports.view', 'stock_logs.view',
    'settings.view', 'settings.edit',
    'users.view', 'users.edit',
  ],
  administration: [
    'inventory.view', 'inventory.create', 'inventory.delete',
    'clients.view', 'clients.create', 'clients.delete',
    'sales.view', 'sales.create', 'sales.delete',
  ],
  manager: [
    'dashboard.view', 'pos.access',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
    'sales.view', 'sales.create', 'sales.delete',
    'returns.view', 'returns.create',
    'quotations.view', 'quotations.create',
    'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
    'suppliers.view', 'suppliers.edit',
    'payments.view', 'payments.record',
    'expenses.view', 'expenses.create',
    'reports.view', 'stock_logs.view',
  ],
  invoice: [
    'dashboard.view', 'pos.access',
    'sales.view', 'sales.create',
    'quotations.view', 'quotations.create',
    'clients.view',
    'payments.view', 'payments.record',
    'returns.view',
  ],
  cashier: [
    'dashboard.view', 'pos.access',
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

/**
 * Resolve the effective permissions for a user (role defaults + custom overrides).
 */
function getEffectivePermissions(role, customPermissions = []) {
  const roleDefaults = ROLE_PERMISSIONS[role] || [];
  const merged = new Set([...roleDefaults, ...customPermissions]);
  return Array.from(merged);
}

// ─────────────────────────────────────────────────────────────
// Middleware: Verify JWT and attach req.user
// ─────────────────────────────────────────────────────────────
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
    // Attach decoded payload + effective permissions to req.user
    req.user = {
      ...decoded,
      effectivePermissions: getEffectivePermissions(decoded.role, decoded.customPermissions),
    };
    next();
  });
};

// ─────────────────────────────────────────────────────────────
// Middleware: Require admin role
// ─────────────────────────────────────────────────────────────
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

// ─────────────────────────────────────────────────────────────
// Middleware factory: Require a specific permission
// Usage: router.post('/create', authenticateToken, requirePermission('sales.create'), handler)
// ─────────────────────────────────────────────────────────────
export const requirePermission = (permission) => (req, res, next) => {
  const perms = req.user?.effectivePermissions || [];
  if (!perms.includes(permission)) {
    return res.status(403).json({
      success: false,
      error: `Access denied. Required permission: ${permission}`,
    });
  }
  next();
};

// ─────────────────────────────────────────────────────────────
// Middleware factory: Require ALL of the listed permissions
// ─────────────────────────────────────────────────────────────
export const requirePermissions = (permissions) => (req, res, next) => {
  const perms = req.user?.effectivePermissions || [];
  const missing = permissions.filter(p => !perms.includes(p));
  if (missing.length > 0) {
    return res.status(403).json({
      success: false,
      error: `Access denied. Missing permissions: ${missing.join(', ')}`,
    });
  }
  next();
};

export { JWT_SECRET, ROLE_PERMISSIONS, getEffectivePermissions };
