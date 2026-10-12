/**
 * Auth context — holds the logged-in user, exposes login/register/logout,
 * and silently refreshes the session on first load (cookies are httpOnly,
 * so the frontend can't read the token; it asks the backend).
 */
'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const data = await api.get('/api/auth/me');
      setUser(data.user);
      setAccount(data.account);
      return data;
    } catch {
      setUser(null);
      setAccount(null);
      return null;
    }
  }, []);

  // On mount: try /auth/me (cookies auto-send). If 401, try /auth/refresh.
  useEffect(() => {
    (async () => {
      try {
        await refreshMe();
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshMe]);

  const login = async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password });
    setUser(data.user);
    const me = await refreshMe();
    return me || data;
  };

  const register = async (body) => {
    const data = await api.post('/api/auth/register', body);
    setUser(data.user);
    await refreshMe();
    return data;
  };

  const completeKyc = async (body) => {
    const data = await api.post('/api/auth/kyc', body);
    setUser(data.user);
    return data;
  };

  const updateProfile = async (body) => {
    const data = await api.put('/api/auth/profile', body);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout', {});
    } catch {}
    setUser(null);
    setAccount(null);
  };

  const refreshAccount = async () => {
    try {
      const data = await api.get('/api/accounts/primary');
      setAccount(data.account);
      return data;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        account,
        loading,
        login,
        register,
        completeKyc,
        updateProfile,
        logout,
        refreshMe,
        refreshAccount,
        setUser,
        setAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
