import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// 로그인하지 않은 사용자의 보호 라우트 접근을 차단한다.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // /me 동기화가 끝나기 전에는 판단을 미룬다(새로고침 시 잘못된 리다이렉트 방지).
  if (loading) return <div className="page-loading">불러오는 중…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
