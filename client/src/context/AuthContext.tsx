import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from '../services/api';
import {
  UserRole,
  Permission,
  getEffectivePermissions,
  hasPermission as checkPerm,
  hasAllPermissions as checkAllPerms,
  ROLE_PERMISSIONS,
} from '../config/permissions';

interface User {
  id: string;
  username: string;
  role: UserRole;
  name?: string;
  email?: string;
  /** Custom per-user permission overrides (stored in DB, merged on top of role defaults) */
  customPermissions?: Permission[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  /** Effective resolved permissions for the current user */
  permissions: Permission[];
  /** Quick check: does current user have this single permission? */
  hasPermission: (p: Permission) => boolean;
  /** Quick check: does current user have ALL of these permissions? */
  hasAllPermissions: (perms: Permission[]) => boolean;
  /** True if the current user is an admin */
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('erp_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('erp_token');
      if (!savedToken) {
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const userData = await api.getCurrentUser();
        setUser(userData as User);
        setToken(savedToken);
      } catch (err) {
        console.warn('Saved token is invalid, clearing session:', err);
        localStorage.removeItem('erp_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      localStorage.removeItem('erp_token');
      setToken(null);
      setUser(null);
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await api.login(username, password);
    localStorage.setItem('erp_token', data.token);
    setToken(data.token);
    setUser(data.user as User);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('erp_token');
    setToken(null);
    setUser(null);
  }, []);

  // Resolve effective permissions from role + custom overrides
  const permissions: Permission[] = user
    ? getEffectivePermissions(user.role, user.customPermissions)
    : [];

  const hasPermission = useCallback(
    (p: Permission) => checkPerm(permissions, p),
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (perms: Permission[]) => checkAllPerms(permissions, perms),
    [permissions]
  );

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        permissions,
        hasPermission,
        hasAllPermissions,
        isAdmin,
        login,
        logout,
        isAuthenticated: !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export type { User, UserRole, Permission };
