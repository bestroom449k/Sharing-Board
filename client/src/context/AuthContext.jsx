// 인증 상태 전역 관리.
// - 실제 인증은 서버의 세션 쿠키가 담당한다.
// - localStorage 는 새로고침 시 화면 깜빡임을 줄이기 위한 캐시 용도이며,
//   마운트 시 /me 호출로 서버 세션과 항상 동기화한다(스펙: localStorage 기반 로그인 유지).
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'sb.user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
    } catch {
      return null;
    }
  });
  // 최초 /me 동기화 전까지 true. 보호 라우트가 깜빡 로그아웃되는 것을 막는다.
  const [loading, setLoading] = useState(true);

  const persist = useCallback((nextUser) => {
    setUser(nextUser);
    if (nextUser) localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    // 앱 로드 시 서버 세션 확인. 유효하면 사용자 갱신, 아니면 로그아웃 상태로.
    api
      .me()
      .then((d) => persist(d.user))
      .catch(() => persist(null))
      .finally(() => setLoading(false));
  }, [persist]);

  const login = useCallback(
    async (payload) => {
      const { user: u } = await api.login(payload);
      persist(u);
      return u;
    },
    [persist],
  );

  const signup = useCallback(
    async (payload) => {
      const { user: u } = await api.signup(payload);
      persist(u);
      return u;
    },
    [persist],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      persist(null);
    }
  }, [persist]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 는 AuthProvider 내부에서만 사용할 수 있습니다.');
  return ctx;
}
