// 세션 기반 인증 가드.
// 로그인 시 req.session.userId 를 설정하고, 보호된 라우트는 이 미들웨어로 검사한다.
export function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }
  next();
}
