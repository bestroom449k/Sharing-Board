// 통계 라우트(로그인 필요): 내 프로필 통계.
//  GET /api/stats : 총 조회수 + 최근 7일 일별 조회수 + 인기 링크 TOP5
// 모두 비정규화 집계 컬럼을 단순 조회/정렬해서 만든다(집계 비용 최소화).
import { Router } from 'express';
import { pool } from '../db.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// 로컬 시간 기준 YYYY-MM-DD 문자열. MySQL CURDATE()(서버 로컬)와 키를 맞추기 위함.
function localDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.session.userId;

    const [[u]] = await pool.query('SELECT total_views FROM users WHERE id = ?', [userId]); //총 조회수 조회

    // 최근 7일 일별 조회수. 행이 없는 날은 0으로 채워 7개를 항상 반환한다.
    const [rows] = await pool.query(
      `SELECT view_date, views FROM profile_view_daily
       WHERE user_id = ? AND view_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)`,
      [userId],
    ); //최근 7일 일별 조회수 조회
    // dateStrings:true 이므로 view_date 는 'YYYY-MM-DD' 문자열.
    const viewsByDate = new Map(rows.map((r) => [String(r.view_date), Number(r.views)]));
    const daily = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = localDateKey(d);
      daily.push({ date: key, views: viewsByDate.get(key) || 0 });
    }

    // 인기 링크 TOP5: 클릭이 1회 이상 있는 블록을 클릭수 내림차순으로.
    const [top] = await pool.query(
      `SELECT id, block_type, title, url, click_count
       FROM blocks
       WHERE user_id = ? AND click_count > 0
       ORDER BY click_count DESC, id ASC
       LIMIT 5`,
      [userId],
    ); //인기 링크 TOP5 조회

    res.json({
      totalViews: Number(u?.total_views || 0),
      daily,
      topLinks: top.map((b) => ({
        id: b.id,
        type: b.block_type,
        title: b.title,
        url: b.url,
        clickCount: Number(b.click_count),
      })),
    });
  }),
);

export default router;
