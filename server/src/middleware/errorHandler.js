// 중앙 에러 핸들러.
// 내부 오류 메시지(스택/DB 오류 등)를 그대로 노출하면 정보 노출 위험이 있으므로,
// 사용자에게는 일반화된 메시지만 반환하고 상세 내용은 서버 로그로만 남긴다.
export function errorHandler(err, req, res, _next) {
  console.error('[error]', err);
  const status = err.status || 500;
  const message = err.publicMessage || '서버 오류가 발생했습니다.';
  res.status(status).json({ error: message });
}

// 라우트 핸들러의 async 예외를 errorHandler 로 넘겨주는 래퍼.
// try/catch 반복을 줄이고 누락으로 인한 미처리 예외를 방지한다.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
