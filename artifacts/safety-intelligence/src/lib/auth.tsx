import React, { createContext, useContext, useEffect, useState } from 'react';

export type Role = 'operator' | 'safety_manager' | 'administrator';

export interface AuthUser {
  username: string;
  name: string;
  role: Role;
  initials: string;
}

interface Credential {
  username: string;
  password: string;
  name: string;
  role: Role;
  initials: string;
}

// Demo-only credential set for the three operator roles. No real backend auth
// exists for this scaffold — this simply gates the UI client-side.
export const DEMO_CREDENTIALS: Credential[] = [
  { username: 'operator', password: 'operator123', name: 'Operator_01', role: 'operator', initials: 'OP' },
  { username: 'safetymgr', password: 'safety123', name: 'J. Alvarez', role: 'safety_manager', initials: 'SM' },
  { username: 'admin', password: 'admin123', name: 'R. Chen', role: 'administrator', initials: 'AD' },
];

export const ROLE_LABELS: Record<Role, string> = {
  operator: 'Operator',
  safety_manager: 'Safety Manager',
  administrator: 'Administrator',
};

const STORAGE_KEY = 'isis-sys.auth-user';

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string, role: Role) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = (username: string, password: string, role: Role) => {
    const match = DEMO_CREDENTIALS.find(
      (c) =>
        c.username.toLowerCase() === username.trim().toLowerCase() &&
        c.password === password &&
        c.role === role,
    );
    if (!match) return false;
    setUser({ username: match.username, name: match.name, role: match.role, initials: match.initials });
    return true;
  };

  const logout = () => setUser(null);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
