// 업로드 라우트: 이미지 1장을 받아 스토리지(R2 또는 로컬 폴백)에 저장하고 공개 URL을 돌려준다.
// 블록/프로필은 이 URL 문자열을 image_url 로 저장한다.
import { Router } from 'express';
import multer from 'multer';
import { pool } from '../db.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadImage, isAllowedImageMime } from '../services/storage.js';
import { compressImage } from '../services/imageCompress.js';

const router = Router();

// 파일을 디스크가 아닌 메모리로 받아 스토리지 서비스로 그대로 전달한다.
// 5MB 제한 + 이미지 MIME 만 허용(서버사이드 1차 방어).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (isAllowedImageMime(file.mimetype)) return cb(null, true);
    cb(new Error('이미지 파일(JPG/PNG/GIF/WEBP)만 업로드할 수 있습니다.'));
  },
});

// POST /api/upload/image  (multipart/form-data, 필드명: image)
router.post(
  '/image',
  requireAuth,
  // multer 에러(파일 크기 초과/형식 위반)를 JSON 으로 변환해 응답한다.
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        const msg = err.code === 'LIMIT_FILE_SIZE' ? '이미지는 5MB 이하만 업로드할 수 있습니다.' : err.message;
        return res.status(400).json({ error: msg });
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: '이미지 파일이 필요합니다.' });

    // 로그인한 유저의 닉네임을 폴더명으로 사용한다(images/{유저이름}/...).
    const [rows] = await pool.query('SELECT nickname FROM users WHERE id = ? LIMIT 1', [
      req.session.userId,
    ]); //파일 업로드 시 닉네임을 가져오는 조회
    if (rows.length === 0) return res.status(401).json({ error: '로그인이 필요합니다.' });

    // 업로드 전 압축(리사이즈·재인코딩). 실패 시 내부에서 원본을 그대로 돌려준다.
    const { buffer, mime } = await compressImage(req.file.buffer, req.file.mimetype);

    const url = await uploadImage(buffer, mime, rows[0].nickname);
    res.status(201).json({ url });
  }),
);

export default router;
