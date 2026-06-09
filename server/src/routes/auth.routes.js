// 인증 라우트: 회원가입 / 로그인 / 로그아웃 / 내 정보(me)
import { Router } from 'express';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';
import { config } from '../config.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { isValidEmailFormat, verifyEmailDeliverable } from '../services/emailVerify.js';
import { generateUniqueShortLink } from '../services/shortLink.js';

const router = Router();

// API 응답에 절대 포함하면 안 되는 password_hash 를 제외하고 안전한 사용자 객체만 만든다.
function toPublicUser(row) {
  return {
    id: row.id,
    email: row.email,
    nickname: row.nickname,
    shortLink: row.short_link,
    profileImageUrl: row.profile_image_url,
    bio: row.bio,
    themeColor: row.theme_color,
    createdAt: row.created_at,
  };
}

// 무차별 대입(brute-force) 로그인 시도를 완화하기 위한 속도 제한.
// IP 기준 15분 동안 최대 20회. 초과 시 429 반환.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
});

// ---------------------------------------------------------------------
// POST /api/auth/signup : 회원가입
// ---------------------------------------------------------------------
router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const { email, password, nickname } = req.body ?? {};

    // 1) 입력값 1차 검증
    if (!isValidEmailFormat(email)) {
      return res.status(400).json({ error: '올바른 이메일 형식이 아닙니다.' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
    }
    const trimmedNickname = typeof nickname === 'string' ? nickname.trim() : '';
    if (trimmedNickname.length < 2 || trimmedNickname.length > 30) {
      return res.status(400).json({ error: '닉네임은 2~30자여야 합니다.' });
    }

    // 2) EmailListVerify 서버사이드 도달성 검증(스팸·비활성 이메일 차단)
    const verify = await verifyEmailDeliverable(email);
    if (!verify.ok) {
      return res
        .status(400)
        .json({ error: '사용할 수 없는 이메일입니다. 유효한 이메일을 입력해 주세요.' });
    }

    // 3) 트랜잭션 안에서 중복 확인 → 해싱 → 고유 링크 생성 → INSERT 를 원자적으로 처리.
    //    여러 단계가 모두 성공해야 회원이 생성되도록 트랜잭션 경계를 둔다.
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 닉네임 중복 확인. (이메일 중복은 아래 UNIQUE 제약 충돌로 최종 판정)
      const [dupNick] = await conn.query(
        'SELECT 1 FROM users WHERE nickname = ? LIMIT 1',
        [trimmedNickname],
      );
      if (dupNick.length > 0) {
        await conn.rollback();
        return res.status(409).json({ error: '이미 사용 중인 닉네임입니다.' });
      }

      // 비밀번호 해싱(bcrypt, SALT_ROUNDS=12). 평문은 어디에도 저장하지 않는다.
      const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

      // 가입 완료 시 고유 short_link 자동 생성.
      const shortLink = await generateUniqueShortLink();

      const [result] = await conn.query(
        `INSERT INTO users (email, password_hash, nickname, short_link)
         VALUES (?, ?, ?, ?)`,
        [email, passwordHash, trimmedNickname, shortLink],
      );

      await conn.commit();

      // 가입 직후 자동 로그인 처리(세션 발급).
      req.session.userId = result.insertId;

      return res.status(201).json({
        user: {
          id: result.insertId,
          email,
          nickname: trimmedNickname,
          shortLink,
          profileImageUrl: null,
          bio: null,
          themeColor: '#3B82F6',
        },
      });
    } catch (err) {
      await conn.rollback();
      // 동시 가입 등으로 UNIQUE 제약(이메일/닉네임/short_link)이 충돌하면 409로 응답.
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: '이미 가입된 이메일이거나 닉네임입니다.' });
      }
      throw err;
    } finally {
      conn.release();
    }
  }),
);

// ---------------------------------------------------------------------
// POST /api/auth/login : 로그인
// ---------------------------------------------------------------------
router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해 주세요.' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email],
    );
    const user = rows[0];

    // 계정 열거(account enumeration) 방지:
    //  - 사용자가 없어도 더미 해시와 bcrypt.compare 를 수행해 응답 시간을 일정하게 유지한다.
    //  - 이메일 존재 여부와 무관하게 실패 메시지를 동일하게("이메일 또는 비밀번호가 올바르지 않습니다") 반환한다.
    const hashToCompare =
      user?.password_hash ||
      '$2b$12$0000000000000000000000000000000000000000000000000000a';
    const passwordMatches = await bcrypt.compare(password, hashToCompare);

    if (!user || !passwordMatches) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 인증 성공 → 세션 발급.
    // 세션 고정(session fixation) 공격 방지를 위해 로그인 시 세션 ID를 재발급한다.
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다.' });
      }
      req.session.userId = user.id;
      return res.json({ user: toPublicUser(user) });
    });
  }),
);

// ---------------------------------------------------------------------
// POST /api/auth/logout : 로그아웃(세션 파기)
// ---------------------------------------------------------------------
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    // 클라이언트의 세션 쿠키도 무효화한다.
    res.clearCookie('sb.sid');
    res.json({ ok: true });
  });
});

// ---------------------------------------------------------------------
// GET /api/auth/me : 현재 로그인 사용자 정보(로그인 상태 복원용)
// ---------------------------------------------------------------------
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [req.session.userId],
    );
    if (rows.length === 0) {
      // 세션은 있으나 사용자가 삭제된 경우: 세션을 정리하고 401.
      req.session.destroy(() => {});
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }
    res.json({ user: toPublicUser(rows[0]) });
  }),
);

export default router;
