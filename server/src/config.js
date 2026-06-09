// 환경 변수 로딩 및 설정 중앙화 모듈.
// 다른 모듈은 직접 process.env 를 읽지 않고 이 config 만 참조하여 일관성을 유지한다.
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  // React(Vite) 개발 서버. CORS 허용 출처 및 쿠키 전송 대상.
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'sharing_app',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sharing_board',
    // db:init 스크립트 전용 관리자 자격증명(데이터베이스/앱 계정 생성용).
    rootUser: process.env.DB_ROOT_USER || 'root',
    rootPassword: process.env.DB_ROOT_PASSWORD || '',
  },

  session: {
    secret: process.env.SESSION_SECRET || 'dev-only-insecure-secret',
    // 로그인 유지 기간(밀리초). 기본 7일.
    maxAge: Number(process.env.SESSION_MAX_AGE_MS || 7 * 24 * 60 * 60 * 1000),
  },

  bcrypt: {
    // CLAUDE.md 규칙 3: SALT_ROUNDS 는 12로 고정한다.
    saltRounds: 12,
  },

  emailVerify: {
    // 비어 있으면 EmailListVerify 호출을 건너뛰고 정규식 형식 검증만 수행한다.
    apiKey: process.env.EMAILLISTVERIFY_API_KEY || '',
  },

  // 백엔드 외부 접근 URL. 로컬 디스크 폴백 이미지의 절대 URL 생성에 사용.
  backendPublicUrl: process.env.BACKEND_PUBLIC_URL || `http://localhost:${Number(process.env.PORT || 4000)}`,

  // Cloudflare R2 (S3 호환). 아래 값이 모두 채워지면 R2 업로드를 사용하고,
  // 비어 있으면 서버 로컬 디스크(uploads/)에 저장하는 폴백으로 동작한다.
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET || '',
    // 공개 접근 URL(R2.dev 공개 버킷 또는 연결한 커스텀 도메인). 끝의 / 는 제거.
    publicBaseUrl: (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/+$/, ''),
  },
};

// R2 사용 가능 여부(필수 값이 모두 있는지). storage 서비스가 모드 판단에 사용.
export const isR2Configured = Boolean(
  config.r2.accountId &&
    config.r2.accessKeyId &&
    config.r2.secretAccessKey &&
    config.r2.bucket &&
    config.r2.publicBaseUrl,
);
