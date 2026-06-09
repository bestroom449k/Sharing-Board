# Sharing Board

인포드링크 스타일의 링크인바이오(link-in-bio) 서비스. 회원이 자신만의 공개 프로필 페이지(`/p/{short_link}`)에 링크·텍스트·동영상 블록을 모아 공유하고, 방문/클릭 통계를 확인할 수 있다.

## 기술 스택
- **백엔드**: Node.js + Express, `mysql2`, `bcrypt`, `express-session`(MySQL 세션 저장)
- **프론트엔드**: React + Vite (예정)
- **DB**: MySQL 8 (전용)
- **외부 연동**: EmailListVerify(이메일 유효성), 클라우드 스토리지(이미지 업로드, 예정)

## 프로젝트 구조
```
.
├── server/                 # Express 백엔드
│   ├── sql/schema.sql      # DB 스키마(MySQL 8)
│   └── src/
│       ├── config.js       # 환경 변수 중앙화
│       ├── db.js           # mysql2 커넥션 풀
│       ├── app.js          # Express 앱 구성(helmet/cors/session/라우트)
│       ├── server.js       # 진입점
│       ├── middleware/     # 인증 가드, 에러 핸들러
│       ├── routes/         # auth.routes.js (회원가입/로그인/로그아웃/me)
│       ├── services/       # emailVerify, shortLink
│       └── scripts/initDb.js  # DB 초기화(부트스트랩)
└── client/                 # React 프론트엔드 (예정)
```

## 시작하기 (백엔드)
사전 준비: Node 20+, 실행 중인 MySQL 8.

```bash
cd server
npm install

# 1) server/.env 의 DB_ROOT_PASSWORD 에 MySQL root 비밀번호 입력
# 2) DB/테이블/앱 계정 생성
npm run db:init

# 3) 서버 실행
npm run dev      # 또는 npm start
```

서버 기본 주소: `http://localhost:4000`

## 인증 API (1단계)
| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| POST | `/api/auth/signup` | 회원가입(`email`, `password`, `nickname`) → 세션 발급 |
| POST | `/api/auth/login` | 로그인(`email`, `password`) → 세션 발급 |
| POST | `/api/auth/logout` | 로그아웃(세션 파기) |
| GET | `/api/auth/me` | 현재 로그인 사용자 정보 |
| GET | `/api/health` | 헬스 체크 |

## 보안 원칙 (CLAUDE.md)
- 비밀번호는 bcrypt(SALT_ROUNDS=12) 해싱 저장, `password_hash` 는 응답에 미포함
- 모든 SQL 은 prepared statement(`?`)
- 사용자 자원 접근 시 `WHERE user_id = ?` 로 소유권 검증(IDOR 방지)
- 로그인은 계정 열거 방지를 위해 동일한 실패 메시지 + 더미 해시 비교

SELECT 
INSERT
DELETE
UPDATE

## 실행 
백엔드 npm run dev

프론트 cd "c:\Users\bestr\My_class\shcool\DB_project\Sharing Board\client"
npm run dev
