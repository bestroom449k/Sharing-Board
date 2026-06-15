// 공개 프로필 라우트(로그인 불필요).
//  - GET  /api/p/:shortLink                      : 공개 프로필 + 활성 블록 조회 + 조회수 +1
//  - POST /api/p/:shortLink/blocks/:blockId/click : 링크 클릭수 +1(인기 링크 집계용)
// 비정규화 집계 컬럼(users.total_views, profile_view_daily.views, blocks.click_count)을
// 실제로 채워 주는 곳이다.
import { Router } from 'express';
import { pool } from '../db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// 공개 응답에는 email/password_hash 등 민감/내부 정보를 절대 포함하지 않는다.
function toPublicProfile(u) {
  return {
    nickname: u.nickname,
    bio: u.bio,
    themeColor: u.theme_color,
    profileImageUrl: u.profile_image_url,
    shortLink: u.short_link,
  };
}

// 공개 페이지 렌더에 필요한 최소 필드만(클릭수/활성여부 등 내부값 제외).
function toPublicBlock(b) {
  return {
    id: b.id,
    type: b.block_type,
    title: b.title,
    url: b.url,
    content: b.content,
    imageUrl: b.image_url,
  };
}

// ---------------------------------------------------------------------
// GET /api/p/:shortLink : 공개 프로필 보기 (+ 조회수 트래킹)
// ---------------------------------------------------------------------
router.get(
  '/:shortLink',
  asyncHandler(async (req, res) => {
    const { shortLink } = req.params;

    const [users] = await pool.query(
      'SELECT * FROM users WHERE short_link = ? LIMIT 1',
      [shortLink],
    ); //공개 프로필 조회
    if (users.length === 0) {
      return res.status(404).json({ error: '존재하지 않는 프로필입니다.' });
    }
    const user = users[0];

    // 본인이 자기 프로필을 보는 경우는 조회수에 넣지 않는다(셀프 인플레 방지).
    const isOwner = req.session?.userId === user.id;
    if (!isOwner) {
      try {
        // 같은 (유저, 날짜) 행이 있으면 누적, 없으면 새로 생성(UPSERT).
        await pool.query(
          `INSERT INTO profile_view_daily (user_id, view_date, views)
           VALUES (?, CURDATE(), 1)
           ON DUPLICATE KEY UPDATE views = views + 1`,
          [user.id],
        ); //일별 조회수 

        // 누적 총 조회수 캐시도 함께 증가.
        await pool.query(
          'UPDATE users SET total_views = total_views + 1 WHERE id = ?',
          [user.id],
        ); //총 조회수 +1
      } catch {
        // 트래킹 실패가 프로필 조회 자체를 막지 않도록 무시한다.
      }
    }

    const [blocks] = await pool.query(
      'SELECT * FROM blocks WHERE user_id = ? AND is_active = 1 ORDER BY position ASC, id ASC',
      [user.id],
    ); //활성 블록 조회

    res.json({ profile: toPublicProfile(user), blocks: blocks.map(toPublicBlock) });
  }),
);

// ---------------------------------------------------------------------
// POST /api/p/:shortLink/blocks/:blockId/click : 링크 클릭수 +1
// ---------------------------------------------------------------------
router.post(
  '/:shortLink/blocks/:blockId/click',
  asyncHandler(async (req, res) => {
    const { shortLink } = req.params;
    const blockId = Number(req.params.blockId);
    if (!Number.isInteger(blockId)) {
      return res.status(400).json({ error: '잘못된 블록 ID 입니다.' });
    }

    // short_link 소유자의 블록일 때만 증가시켜 타 유저 블록 오염을 막는다.
    await pool.query(
      `UPDATE blocks b
         JOIN users u ON u.id = b.user_id
         SET b.click_count = b.click_count + 1
       WHERE b.id = ? AND u.short_link = ?`,
      [blockId, shortLink],
    ); //클릭수 +1

    // 트래킹 성격상 대상이 없어도 조용히 200(페이지 이동을 막지 않음).
    res.json({ ok: true });
  }),
);

export default router;
