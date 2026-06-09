import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// 클라이언트 1차 이메일 형식 검증(서버에서 EmailListVerify 로 최종 검증).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', nickname: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 서버 호출 전 가벼운 클라이언트 검증으로 불필요한 요청을 줄인다.
    if (!EMAIL_REGEX.test(form.email)) return setError('올바른 이메일 형식이 아닙니다.');
    if (form.password.length < 8) return setError('비밀번호는 8자 이상이어야 합니다.');
    if (form.nickname.trim().length < 2) return setError('닉네임은 2자 이상이어야 합니다.');

    setSubmitting(true);
    try {
      await signup({
        email: form.email.trim(),
        password: form.password,
        nickname: form.nickname.trim(),
      });
      // 가입 시 서버가 세션을 발급하므로 곧바로 대시보드로 이동.
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1>회원가입</h1>
        <p className="sub">나만의 링크 페이지를 무료로 만들어 보세요.</p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={onChange}
            />
          </div>
          <div className="field">
            <label htmlFor="nickname">닉네임</label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              placeholder="공개 페이지에 표시될 이름"
              value={form.nickname}
              onChange={onChange}
            />
          </div>
          <div className="field">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="8자 이상"
              value={form.password}
              onChange={onChange}
            />
            <div className="hint">8자 이상 입력해 주세요.</div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? '가입 중…' : '회원가입'}
          </button>
        </form>

        <div className="auth-foot">
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </div>
      </div>
    </div>
  );
}
