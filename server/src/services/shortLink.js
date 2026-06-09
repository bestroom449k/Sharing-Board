// 공개 프로필용 고유 short_link 생성 유틸.
import { randomBytes } from 'node:crypto';
import { pool } from '../db.js';

// 혼동되는 문자(0/O, 1/l/I)를 제외한 URL-safe 문자 집합.
// 7자리면 32^7 ≈ 340억 조합이라 충돌 확률이 매우 낮다.
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
const DEFAULT_LENGTH = 7;

// 무작위 short_link 문자열 1개 생성.
// randomBytes(암호학적 난수)를 사용해 예측 가능성을 줄인다.
function randomCode(length = DEFAULT_LENGTH) {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

// DB에서 중복되지 않는 short_link 를 확보해 반환한다.
// short_link 컬럼이 UNIQUE 이므로 최종 보증은 DB가 하지만,
// INSERT 충돌을 줄이기 위해 사전에 미사용 코드를 골라 둔다.
export async function generateUniqueShortLink(maxTries = 5) {
  for (let i = 0; i < maxTries; i += 1) {
    const code = randomCode();
    // 존재 여부만 확인하는 가벼운 조회(prepared statement).
    const [rows] = await pool.query(
      'SELECT 1 FROM users WHERE short_link = ? LIMIT 1',
      [code],
    );
    if (rows.length === 0) return code;
  }
  // 극히 드문 연속 충돌 시 길이를 늘려 한 번 더 시도.
  return randomCode(DEFAULT_LENGTH + 2);
}
