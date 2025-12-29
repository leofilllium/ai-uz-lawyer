/**
 * Auth Context
 * Provides authentication state and methods throughout the app.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  type User, 
  login as apiLogin, 
  register as apiRegister, 
  logout as apiLogout,
  getMe,
  getToken,
  getStoredUser 
} from '../api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on mount
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const userData = await getMe();
          setUser(userData);
        } catch {
          // Token invalid, use stored user or clear
          const storedUser = getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          } else {
            apiLogout();
          }
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiLogin(email, password);
    setUser(response.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await apiRegister(name, email, password);
    setUser(response.user);
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
