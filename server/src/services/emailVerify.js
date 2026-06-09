// 이메일 검증 서비스.
// 1) 정규식으로 기본 형식 검증
// 2) EmailListVerify API로 서버사이드 유효성 검증(스팸/비활성/오타 도메인 차단)
import { config } from '../config.js';

// 실무에서 충분히 통용되는 보수적인 이메일 형식 정규식.
// 완벽한 RFC 준수는 불가능하므로 형식은 1차 필터로만 쓰고, 실제 도달성은 API로 확인한다.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailFormat(email) {
  return typeof email === 'string' && email.length <= 254 && EMAIL_REGEX.test(email);
}

// EmailListVerify 단건 검증.
// 반환: { ok: boolean, result: string, skipped?: boolean }
//  - ok=true  : 가입 허용
//  - ok=false : 도달 불가/위험 이메일 → 가입 차단
// API 키가 없으면(개발 초기) 검증을 건너뛴다(형식 검증은 라우트에서 이미 수행).
export async function verifyEmailDeliverable(email) {
  if (!config.emailVerify.apiKey) {
    console.warn('[emailVerify] API 키 미설정 → 도달성 검증을 건너뜁니다(형식 검증만 적용).');
    return { ok: true, result: 'skipped', skipped: true };
  }

  // EmailListVerify 단건 검증 엔드포인트. 키/이메일은 반드시 URL 인코딩한다.
  const url =
    'https://apps.emaillistverify.com/api/verifyEmail' +
    `?secret=${encodeURIComponent(config.emailVerify.apiKey)}` +
    `&email=${encodeURIComponent(email)}`;

  try {
    const res = await fetch(url, { method: 'GET' });
    // API는 'ok' | 'fail' | 'unknown' | 'incorrect' 등 평문 문자열을 반환한다.
    const result = (await res.text()).trim();
    return { ok: result === 'ok', result };
  } catch (err) {
    // 외부 API 장애가 가입 전체를 막지 않도록, 네트워크 오류 시에는 통과 처리하고 로그만 남긴다.
    console.error('[emailVerify] 외부 API 호출 실패:', err.message);
    return { ok: true, result: 'error', skipped: true };
  }
}
