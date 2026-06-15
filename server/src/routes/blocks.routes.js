// 블록 라우트: 링크/텍스트/동영상 블록의 목록·생성·수정·삭제·순서변경
// 모든 라우트는 로그인 필요(requireAuth)하며, 자신의 블록만 다룰 수 있도록
// 항상 WHERE user_id = ? 로 소유권을 검증한다(IDOR 방지, CLAUDE.md 규칙 5).
import { Router } from 'express';
import { pool } from '../db.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// 한 사용자가 만들 수 있는 블록 최대 개수(스펙: 최대 200개).
const MAX_BLOCKS = 200;
const BLOCK_TYPES = ['link', 'text', 'video'];

// 스키마 컬럼 길이에 맞춘 제한.
const LIMITS = { title: 100, url: 2048, imageUrl: 512 };

// DB 행(snake_case) → 프론트 친화적 객체(camelCase) 변환.
function toBlock(row) {
  return {
    id: row.id,
    type: row.block_type,
    title: row.title,
    url: row.url,
    content: row.content,
    imageUrl: row.image_url,
    position: row.position,
    clickCount: row.click_count,
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 생성/수정 시 타입별 필수값과 길이를 검증한다.
// 반환: { ok:true, value:{...} } 또는 { ok:false, error:'...' }
function validateBlockInput(type, body, { partial = false } = {}) {
  const title = body.title != null ? String(body.title).trim() : null;
  const url = body.url != null ? String(body.url).trim() : null;
  const content = body.content != null ? String(body.content) : null;
  const imageUrl = body.imageUrl != null ? String(body.imageUrl).trim() : null;

  if (title && title.length > LIMITS.title) return { ok: false, error: `제목은 ${LIMITS.title}자 이하여야 합니다.` };
  if (url && url.length > LIMITS.url) return { ok: false, error: 'URL이 너무 깁니다.' };
  if (imageUrl && imageUrl.length > LIMITS.imageUrl) return { ok: false, error: '이미지 URL이 너무 깁니다.' };

  // partial(수정)일 때는 전달된 값만 검증하고 필수 검사는 건너뛴다.
  if (!partial) {
    if (type === 'link' || type === 'video') {
      if (!url) return { ok: false, error: type === 'link' ? '링크 URL을 입력해 주세요.' : '동영상 URL을 입력해 주세요.' };
    }
    if (type === 'text') {
      if (!content || content.trim().length === 0) return { ok: false, error: '텍스트 내용을 입력해 주세요.' };
    }
  }

  return { ok: true, value: { title, url, content, imageUrl } };
}

// ---------------------------------------------------------------------
// GET /api/blocks : 내 블록 목록(순서대로)
// ---------------------------------------------------------------------
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      'SELECT * FROM blocks WHERE user_id = ? ORDER BY position ASC, id ASC',
      [req.session.userId],
    ); //내 블록 목록 조회
    res.json({ blocks: rows.map(toBlock), max: MAX_BLOCKS });
  }),
);

// ---------------------------------------------------------------------
// POST /api/blocks : 블록 생성(맨 뒤에 추가)
// ---------------------------------------------------------------------
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { type } = req.body ?? {};
    if (!BLOCK_TYPES.includes(type)) {
      return res.status(400).json({ error: '블록 종류가 올바르지 않습니다.' });
    }
    const v = validateBlockInput(type, req.body ?? {});
    if (!v.ok) return res.status(400).json({ error: v.error });

    const userId = req.session.userId;

    // 개수 제한 검사와 INSERT 를 한 트랜잭션으로 묶어 동시 요청에도 200개를 넘지 않게 한다.
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[{ cnt }]] = await conn.query(
        'SELECT COUNT(*) AS cnt FROM blocks WHERE user_id = ? FOR UPDATE',
        [userId],
      ); //블록 개수 확인
      if (cnt >= MAX_BLOCKS) {
        await conn.rollback();
        return res.status(400).json({ error: `블록은 최대 ${MAX_BLOCKS}개까지 만들 수 있습니다.` });
      }

      // 새 블록은 맨 마지막 순서로.
      const [[{ pos }]] = await conn.query(
        'SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM blocks WHERE user_id = ?',
        [userId],
      ); //마지막 순서 조회

      const [result] = await conn.query(
        `INSERT INTO blocks (user_id, block_type, title, url, content, image_url, position)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, type, v.value.title, v.value.url, v.value.content, v.value.imageUrl, pos],
      );  // 블록 생성

      await conn.commit();

      const [rows] = await pool.query('SELECT * FROM blocks WHERE id = ?', [result.insertId]); //생성된 블록 조회
      return res.status(201).json({ block: toBlock(rows[0]) });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }),
);

// ---------------------------------------------------------------------
// PUT /api/blocks/reorder : 순서 일괄 변경
//   body: { orderedIds: [블록ID, ...] }  ← 새 순서대로 나열
//   (':id' 라우트보다 먼저 선언해야 'reorder' 가 id로 해석되지 않는다)
// ---------------------------------------------------------------------
router.put(
  '/reorder',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { orderedIds } = req.body ?? {};
    if (!Array.isArray(orderedIds) || orderedIds.some((x) => !Number.isInteger(x))) {
      return res.status(400).json({ error: 'orderedIds 는 정수 ID 배열이어야 합니다.' });
    }
    const userId = req.session.userId;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 내 블록 ID 집합을 잠금과 함께 조회.
      const [own] = await conn.query(
        'SELECT id FROM blocks WHERE user_id = ? FOR UPDATE',
        [userId],
      ); //내 블록 ID 조회
      const ownIds = new Set(own.map((r) => r.id));

      // 전달된 ID가 내 블록 전체와 정확히 일치하는 순열인지 검증(남의 블록/누락 차단).
      const sameSize = orderedIds.length === ownIds.size;
      const allMine = orderedIds.every((id) => ownIds.has(id));
      const noDup = new Set(orderedIds).size === orderedIds.length;
      if (!sameSize || !allMine || !noDup) {
        await conn.rollback();
        return res.status(400).json({ error: '순서 목록이 현재 블록과 일치하지 않습니다.' });
      }

      // 인덱스를 position 으로 반영.
      for (let i = 0; i < orderedIds.length; i += 1) {
        await conn.query(
          'UPDATE blocks SET position = ? WHERE id = ? AND user_id = ?',
          [i, orderedIds[i], userId],
        ); //순서 변경
      }

      await conn.commit();
      return res.json({ ok: true });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }),
);

// ---------------------------------------------------------------------
// PUT /api/blocks/:id : 블록 수정(전달된 필드만)
// ---------------------------------------------------------------------
router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: '잘못된 블록 ID 입니다.' });

    const userId = req.session.userId;

    // 대상 블록의 타입을 확인하며 소유권도 함께 검증.
    const [rows] = await pool.query(
      'SELECT block_type FROM blocks WHERE id = ? AND user_id = ?',
      [id, userId],
    ); //블록 타입/소유권 확인
    if (rows.length === 0) return res.status(404).json({ error: '블록을 찾을 수 없습니다.' });

    const v = validateBlockInput(rows[0].block_type, req.body ?? {}, { partial: true });
    if (!v.ok) return res.status(400).json({ error: v.error });

    // 수정 가능한 컬럼 화이트리스트(키는 코드에서 고정 → 인젝션 불가, 값만 ? 바인딩).
    const map = {
      title: v.value.title,
      url: v.value.url,
      content: v.value.content,
      image_url: v.value.imageUrl,
    };
    if (typeof req.body?.isActive === 'boolean') map.is_active = req.body.isActive ? 1 : 0;

    // 요청에 실제로 포함된 키만 갱신한다.
    const fields = Object.keys(map).filter((k) => {
      if (k === 'title') return 'title' in req.body;
      if (k === 'url') return 'url' in req.body;
      if (k === 'content') return 'content' in req.body;
      if (k === 'image_url') return 'imageUrl' in req.body;
      if (k === 'is_active') return 'isActive' in req.body;
      return false;
    });
    if (fields.length === 0) return res.status(400).json({ error: '수정할 내용이 없습니다.' });

    const setClause = fields.map((k) => `${k} = ?`).join(', ');
    const values = fields.map((k) => map[k]);

    await pool.query(
      `UPDATE blocks SET ${setClause} WHERE id = ? AND user_id = ?`,
      [...values, id, userId],
    ); //블록 수정

    const [updated] = await pool.query('SELECT * FROM blocks WHERE id = ?', [id]); //수정된 블록 조회
    res.json({ block: toBlock(updated[0]) });
  }),
);

// ---------------------------------------------------------------------
// DELETE /api/blocks/:id : 블록 삭제
// ---------------------------------------------------------------------
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: '잘못된 블록 ID 입니다.' });

    const [result] = await pool.query(
      'DELETE FROM blocks WHERE id = ? AND user_id = ?',
      [id, req.session.userId],
    ); //	블록 삭제 (WHERE id=? AND user_id=? 로 소유권 검증)

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '블록을 찾을 수 없습니다.' });
    }
    res.json({ ok: true });
  }),
);

export default router;
