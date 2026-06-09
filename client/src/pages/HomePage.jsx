import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// 랜딩(홈) 페이지. 서비스 소개 + 가입 유도.
export default function HomePage() {
  const { user } = useAuth();

  return (
    <main>
      <section className="container hero">
        <span className="badge">✨ 내 모든 링크를 하나로</span>
        <h1>
          흩어진 링크를 <span className="accent">한 페이지</span>에
          <br />
          모아서 공유하세요
        </h1>
        <p>
          링크·텍스트·동영상 블록으로 나만의 프로필을 꾸미고, 방문자 통계까지 한눈에.
          나만의 주소(/p/내링크)로 어디에나 공유하세요.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">
              내 대시보드로 가기
            </Link>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary">
                무료로 시작하기
              </Link>
              <Link to="/login" className="btn btn-outline">
                로그인
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="container features">
        <article className="card feature">
          <div className="ico">🔗</div>
          <h3>블록형 편집</h3>
          <p>링크·텍스트·동영상 블록을 자유롭게 추가하고 순서를 바꿔 나만의 페이지를 완성하세요.</p>
        </article>
        <article className="card feature">
          <div className="ico">📊</div>
          <h3>방문 통계</h3>
          <p>총 조회수와 최근 7일 추이, 클릭이 가장 많은 인기 링크 TOP 5를 확인하세요.</p>
        </article>
        <article className="card feature">
          <div className="ico">🎨</div>
          <h3>커스텀 디자인</h3>
          <p>프로필 이미지·소개글·테마 색상을 설정해 브랜드에 맞는 공개 페이지를 만드세요.</p>
        </article>
      </section>
    </main>
  );
}
