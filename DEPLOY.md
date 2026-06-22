# 배포 가이드 — Railway 통합 배포

프론트(React)와 백엔드(Express)를 **한 서버**에서 서빙합니다. Express 가 빌드된
React(`client/dist`)를 함께 내려주므로 **도메인 1개**로 동작하고 CORS·쿠키 문제가 없습니다.
이미지는 이미 **Cloudflare R2**에 저장됩니다.

## 1. 준비
- GitHub 에 코드 푸시 (`.env` 는 커밋되지 않음 — 정상)
- Railway 계정(https://railway.app) — GitHub 로그인

## 2. Railway 프로젝트 생성
1. **New Project → Deploy from GitHub repo** → 이 저장소 선택
2. **New → Database → Add MySQL** (같은 프로젝트에 MySQL 추가)

## 3. 환경변수 설정 (앱 서비스 → Variables)
MySQL 서비스의 연결정보를 앱에 연결한다. (Railway 변수 참조 문법: `${{MySQL.MYSQLHOST}}` 등)

```
NODE_ENV=production
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
SESSION_SECRET=<무작위 64자 hex>   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 이미지 스토리지(R2) — 로컬 .env 의 값 그대로
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=sharingboard-image
R2_PUBLIC_BASE_URL=https://pub-xxxx.r2.dev
```

> 참고
> - `PORT` 는 Railway 가 자동 주입하므로 직접 설정하지 않는다.
> - `CLIENT_ORIGIN` 은 같은 도메인이라 불필요(통합 배포).
> - `DB_ROOT_*` 도 불필요(Railway MySQL 은 권한 있는 계정/DB 를 이미 제공).

## 4. 빌드/실행 설정
루트 [package.json](package.json) 에 이미 정의됨 (Railway 가 자동 인식):
- **Build**: `npm run build` → server·client 의존성 설치 + React 빌드(`client/dist`)
- **Start**: `npm start` → `node server/src/server.js` (빌드 결과를 함께 서빙)

## 5. DB 테이블 생성 (1회)
배포 후 앱 서비스의 **Shell/Run command** 또는 로컬에서 Railway DB 를 가리키게 한 뒤 실행:
```
npm --prefix server run db:setup
```
- `server/src/scripts/setupDb.js` 가 `schema.sql` 의 테이블을 현재 DB 에 생성한다(멱등).
- 세션 테이블은 앱 기동 시 자동 생성된다.

## 6. 확인
- 배포 도메인 접속 → 홈/로그인/대시보드 동작
- 회원가입 → 블록 추가 → `/p/{short_link}` 공개 페이지 확인
- 헬스 체크: `https://<도메인>/api/health` → `{"ok":true}`

## 로컬에서 "통합 배포" 미리 보기(선택)
```
cd client && npm run build      # client/dist 생성
cd ../server && npm start       # http://localhost:4000 에서 프론트+API 함께 서빙
```
(개발 중에는 평소처럼 `client: npm run dev` + `server: npm run dev` 사용)
