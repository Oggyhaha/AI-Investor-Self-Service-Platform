'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  getToken,
  setToken,
  removeToken,
  getStoredUser,
  setStoredUser,
  isTokenExpired,
  type StoredUser,
} from '@/lib/auth';
import { authAPI } from '@/lib/api';

interface AuthContextType {
  user: StoredUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: StoredUser) => void;
  logout: () => void;
  role: StoredUser['role'] | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();

    if (token && storedUser && !isTokenExpired(token)) {
      setUser(storedUser);
    } else if (token && isTokenExpired(token)) {
      removeToken();
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((token: string, userData: StoredUser) => {
    setToken(token);
    setStoredUser(userData);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        role: user?.role ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
