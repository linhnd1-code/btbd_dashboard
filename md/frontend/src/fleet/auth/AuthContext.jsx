import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearSession, getStoredUser, getToken, setSession } from '../httpClient';
import { changeMyPassword, fetchMe, login as loginApi, register as registerApi } from '../authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  // "ready" tách biệt với "user" vì lúc mới tải trang, ta có sẵn user cũ trong localStorage
  // nhưng CHƯA biết token đó còn hợp lệ hay không (có thể đã hết hạn/bị Admin khoá) — phải chờ
  // gọi /me xác nhận rồi mới cho ProtectedRoute quyết định redirect hay không, tránh nháy màn hình.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setReady(true);
      return;
    }
    fetchMe()
      .then((freshUser) => {
        setUser(freshUser);
        setSession(token, freshUser);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    function onSessionExpired() {
      setUser(null);
    }
    window.addEventListener('fleet:session-expired', onSessionExpired);
    return () => window.removeEventListener('fleet:session-expired', onSessionExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const { access_token, user: loggedInUser } = await loginApi(email, password);
    setSession(access_token, loggedInUser);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback((payload) => registerApi(payload), []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    const updated = await changeMyPassword(oldPassword, newPassword);
    setUser(updated);
    setSession(getToken(), updated);
    return updated;
  }, []);

  const hasRole = useCallback((...roles) => !!user && roles.includes(user.role), [user]);

  const value = { user, ready, login, register, logout, changePassword, hasRole };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
