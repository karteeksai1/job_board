import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage or refresh token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const storedAccessToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (storedAccessToken && storedUser) {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedAccessToken);
      } else if (storedRefreshToken) {
        // Try to refresh
        try {
          const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: storedRefreshToken }),
          });
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem('accessToken', data.accessToken);
            setAccessToken(data.accessToken);

            // Fetch user info
            const userRes = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${data.accessToken}` },
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              setUser(userData.user);
              localStorage.setItem('user', JSON.stringify(userData.user));
            }
          } else {
            // Refresh token expired or invalid
            logout();
          }
        } catch (err) {
          console.error('Auth initialization error:', err);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, name, role, companyName) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role, companyName }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setAccessToken(null);
    setUser(null);
  };

  // Helper fetch wrapper that automatically handles token refresh on 401
  const authFetch = async (url, options = {}) => {
    let currentToken = accessToken || localStorage.getItem('accessToken');
    
    const headers = {
      ...options.headers,
    };
    
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    let response = await fetch(url, { ...options, headers });

    // Handle token expiration
    if (response.status === 401) {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (storedRefreshToken) {
        try {
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: storedRefreshToken }),
          });

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            localStorage.setItem('accessToken', data.accessToken);
            setAccessToken(data.accessToken);

            // Retry original request with new token
            headers['Authorization'] = `Bearer ${data.accessToken}`;
            response = await fetch(url, { ...options, headers });
          } else {
            // Refresh token expired or revoked
            logout();
          }
        } catch (err) {
          console.error('Auto refresh token failed:', err);
          logout();
        }
      }
    }

    return response;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, authFetch, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
