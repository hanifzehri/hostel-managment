import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hostel_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('hostel_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate or load fresh profile on mount
  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('hostel_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('[AUTH_FETCH_FAIL]', err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, [token]);

  const login = (authToken, authUser) => {
    localStorage.setItem('hostel_token', authToken);
    localStorage.setItem('hostel_user', JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem('hostel_token');
    localStorage.removeItem('hostel_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('hostel_user', JSON.stringify(updatedUser));
  };

  const hasRole = (allowedRoles = []) => {
    if (!user) return false;
    if (user.role === 'superadmin') return true;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        role: user ? user.role : null,
        login,
        logout,
        updateUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
