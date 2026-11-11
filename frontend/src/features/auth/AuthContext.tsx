import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../../types';
import { api } from '../../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  role: Role | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('civic_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('civic_access_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = sessionStorage.getItem('civic_access_token');
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res: any = await api.request('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        sessionStorage.setItem('civic_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      setUser(null);
      sessionStorage.removeItem('civic_access_token');
      sessionStorage.removeItem('civic_user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handleAuthChange = () => {
      setToken(sessionStorage.getItem('civic_access_token'));
      const savedUser = sessionStorage.getItem('civic_user');
      setUser(savedUser ? JSON.parse(savedUser) : null);
    };

    window.addEventListener('auth_state_changed', handleAuthChange);
    return () => window.removeEventListener('auth_state_changed', handleAuthChange);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res: any = await api.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const loggedUser = res.data.user;
    const accessToken = res.data.access_token;

    sessionStorage.setItem('civic_access_token', accessToken);
    sessionStorage.setItem('civic_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    setToken(accessToken);
    return loggedUser;
  };

  const register = async (payload: any): Promise<User> => {
    const res: any = await api.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const newUser = res.data.user;
    const accessToken = res.data.access_token;

    sessionStorage.setItem('civic_access_token', accessToken);
    sessionStorage.setItem('civic_user', JSON.stringify(newUser));
    setUser(newUser);
    setToken(accessToken);
    return newUser;
  };

  const logout = () => {
    try {
      api.request('/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      sessionStorage.removeItem('civic_access_token');
      sessionStorage.removeItem('civic_user');
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user && !!token,
        role: user ? user.role : null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
