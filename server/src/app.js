// Express 애플리케이션 구성.
// 보안 헤더(helmet) → CORS → JSON 파서 → 세션 → 라우트 → 에러 핸들러 순서로 둔다.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import expressMySQLSession from 'express-mysql-session';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import blockRoutes from './routes/blocks.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import publicRoutes from './routes/public.routes.js';
import statsRoutes from './routes/stats.routes.js';
import inquiriesRoutes from './routes/inquiries.routes.js';
import { UPLOADS_LOCAL_DIR, STORAGE_PREFIX } from './services/storage.js';

const MySQLStore = expressMySQLSession(session);

// 빌드된 React 정적 파일 경로(<repo>/client/dist). 존재하면 같은 서버에서 서빙한다.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.join(__dirname, '..', '..', 'client', 'dist');
const SERVE_CLIENT = existsSync(path.join(CLIENT_DIST, 'index.html'));

export function createApp() {
  const app = express();

  // 리버스 프록시(예: 운영 환경) 뒤에서 secure 쿠키/IP 인식이 동작하도록 신뢰 설정.
  app.set('trust proxy', 1);

  // 보안 관련 HTTP 헤더 기본 적용.
  // crossOriginResourcePolicy 를 cross-origin 으로 두어, 프론트(:5173)에서
  // 로컬 폴백 이미지(:4000/uploads)를 <img> 로 불러올 수 있게 한다(공개 이미지라 허용).
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // 프론트엔드(React/Vite)와 도메인이 다르므로 자격증명(쿠키) 포함 CORS 허용.
  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
    }),
  );

  // JSON 본문 파싱. 과도한 페이로드를 막기 위해 크기 제한.
  app.use(express.json({ limit: '1mb' }));

  // 세션 저장소를 MySQL 에 둔다(DB 단일화 + 서버 재시작 후에도 로그인 유지).
  // sessions 테이블이 없으면 자동 생성한다.
  const sessionStore = new MySQLStore({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    createDatabaseTable: true,
  });

  app.use(
    session({
      name: 'sb.sid',
      secret: config.session.secret,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true, // JS에서 쿠키 접근 불가 → XSS로 인한 세션 탈취 완화
        sameSite: 'lax', // CSRF 완화(다른 사이트의 교차 요청에 쿠키 미전송)
        secure: config.nodeEnv === 'production', // 운영에서는 HTTPS 에서만 전송
        maxAge: config.session.maxAge,
      },
    }),
  );

  // 헬스 체크.
  app.get('/api/health', (req, res) => res.json({ ok: true }));

  // 로컬 폴백으로 저장된 업로드 이미지 정적 서빙(R2 사용 시에는 R2 도메인에서 직접 제공).
  app.use(`/${STORAGE_PREFIX}`, express.static(UPLOADS_LOCAL_DIR));

  // 기능별 라우트.
  app.use('/api/auth', authRoutes);
  app.use('/api/blocks', blockRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/p', publicRoutes); // 공개 프로필(로그인 불필요) + 조회수/클릭 트래킹
  app.use('/api/stats', statsRoutes); // 내 통계(로그인 필요)
  app.use('/api/inquiries', inquiriesRoutes); // 문의함(로그인 필요)

  // 운영(통합 배포): 빌드된 React 를 같은 서버에서 서빙하여 단일 도메인으로 동작.
  // /api, /uploads, /images 외의 GET 요청은 SPA(index.html)로 폴백 → React Router 가 처리.
  if (SERVE_CLIENT) {
    app.use(express.static(CLIENT_DIST));
    app.get('*', (req, res, next) => {
      if (
        req.path.startsWith('/api/') ||
        req.path.startsWith('/uploads/') ||
        req.path.startsWith(`/${STORAGE_PREFIX}/`)
      ) {
        return next();
      }
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    });
  }

  // 일치하는 라우트가 없을 때 404(주로 /api/* 미존재 경로).
  app.use((req, res) => res.status(404).json({ error: '요청한 경로를 찾을 수 없습니다.' }));

  // 마지막에 중앙 에러 핸들러.
  app.use(errorHandler);

  return app;
}
