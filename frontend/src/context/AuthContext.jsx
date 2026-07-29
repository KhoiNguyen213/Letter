import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, setAuthToken, getAuthToken } from '../utils/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyTokenOnLoad = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await apiFetch('/auth/verify');
        if (res.valid) {
          setIsAuthenticated(true);
        } else {
          setAuthToken(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Token validation failed', err);
        setAuthToken(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyTokenOnLoad();
  }, []);

  const login = async (password) => {
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      if (res.token) {
        setAuthToken(res.token);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
