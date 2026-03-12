import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import type { AuthUser } from '../types/api';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['auth-me'],
    queryFn: authApi.me,
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (error) {
      handleLogout();
    }
  }, [error]);

  const handleLogin = (newToken: string) => {
    localStorage.setItem('access_token', newToken);
    setToken(newToken);
    queryClient.invalidateQueries({ queryKey: ['auth-me'] });
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch (e) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('access_token');
      setToken(null);
      queryClient.setQueryData(['auth-me'], null);
      queryClient.clear();
      window.location.href = '/login';
    }
  };

  const isAdmin = user?.role?.name === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: token ? isLoading : false,
        isAuthenticated: !!user,
        isAdmin,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
