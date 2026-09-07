import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import { reconnectSocket, getSocket } from '../lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem('qp_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      reconnectSocket();
    } catch (e) {
      localStorage.removeItem('qp_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshMe(); }, [refreshMe]);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('qp_token', data.token);
    setUser(data.user);
    reconnectSocket();
    return data.user;
  };

  const register = async (username, password, displayName) => {
    const { data } = await api.post('/auth/register', { username, password, displayName });
    localStorage.setItem('qp_token', data.token);
    setUser(data.user);
    reconnectSocket();
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('qp_token');
    setUser(null);
    getSocket().disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
