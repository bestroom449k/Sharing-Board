// 문의함 라우트(로그인 필요): 문의 작성 + 내 문의 목록.
//  GET  /api/inquiries : 내가 작성한 문의 목록
//  POST /api/inquiries : 문의 작성(inquiries 테이블에 저장)
import { Router } from 'express';
import { pool } from '../db.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function toInquiry(r) {
  return {
    id: r.id,
    email: r.email,
    subject: r.subject,
    message: r.message,
    status: r.status,
    createdAt: r.created_at,
  };
}

// ---------------------------------------------------------------------
// GET /api/inquiries : 내 문의 목록(최신순)
// ---------------------------------------------------------------------
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      'SELECT * FROM inquiries WHERE user_id = ? ORDER BY created_at DESC, id DESC',
      [req.session.userId],
    ); //내 문의 목록 조회
    res.json({ inquiries: rows.map(toInquiry) });
  }),
);

// ---------------------------------------------------------------------
// POST /api/inquiries : 문의 작성
// ---------------------------------------------------------------------
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { subject, message, email } = req.body ?? {};
    const subj = typeof subject === 'string' ? subject.trim() : '';
    const msg = typeof message === 'string' ? message.trim() : '';

    if (subj.length < 2 || subj.length > 150) {
      return res.status(400).json({ error: '제목은 2~150자여야 합니다.' });
    }
    if (msg.length < 5) {
      return res.status(400).json({ error: '문의 내용을 5자 이상 입력해 주세요.' });
    }

    // 회신받을 이메일: 입력값이 있으면 사용, 없으면 로그인 계정 이메일로.
    const [[u]] = await pool.query('SELECT email FROM users WHERE id = ?', [req.session.userId]); //회신 이메일 조회
    const mail = typeof email === 'string' && email.trim() ? email.trim() : u.email;
    if (mail.length > 254) return res.status(400).json({ error: '이메일이 너무 깁니다.' });

    const [result] = await pool.query(
      'INSERT INTO inquiries (user_id, email, subject, message) VALUES (?, ?, ?, ?)',
      [req.session.userId, mail, subj, msg],
    ); //문의 작성
    const [rows] = await pool.query('SELECT * FROM inquiries WHERE id = ?', [result.insertId]); //작성된 문의 조회
    res.status(201).json({ inquiry: toInquiry(rows[0]) });
  }),
);

export default router;
