import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// 상단 네비게이션. 로그인 상태에 따라 메뉴가 달라진다.
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="brand-logo">
          <span className="dot" />
          Sharing Board
        </Link>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="nav-user">{user.nickname}님</span>
              <Link to="/dashboard" className="btn btn-outline">
                대시보드
              </Link>
              <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                로그인
              </Link>
              <Link to="/signup" className="btn btn-primary">
                무료로 시작하기
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
