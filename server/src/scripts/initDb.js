// 데이터베이스 초기화 스크립트(1회성 부트스트랩).
//  1) root(관리자)로 접속해 schema.sql 적용(데이터베이스/테이블 생성)
//  2) 앱 전용 계정 생성 및 sharing_board 권한 부여
// 실행: npm run db:init  (server/.env 의 DB_ROOT_PASSWORD 필요)
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, '..', '..', 'sql', 'schema.sql');

async function main() {
  const schemaSql = await readFile(SCHEMA_PATH, 'utf8');

  // root(관리자)로 접속. multipleStatements 는 schema.sql 의 여러 문장을 한 번에
  // 실행하기 위해 이 부트스트랩 연결에서만 한시적으로 허용한다(앱 런타임 풀은 비활성).
  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.rootUser,
    password: config.db.rootPassword,
    multipleStatements: true,
  });

  try {
    console.log('[db:init] 스키마 적용 중...');
    await conn.query(schemaSql);

    // 앱 전용 계정 생성 + 권한 부여.
    // 주의: CREATE USER / GRANT 는 ? 자리표시자를 지원하지 않는 DDL 이다.
    //       비밀번호는 사용자 입력이 아니라 신뢰된 .env 값이며, conn.escape() 로 안전하게 인용한다.
    const appUser = config.db.user;
    const dbName = config.db.database;
    const escPass = conn.escape(config.db.password);

    // 127.0.0.1(TCP) 과 localhost(소켓) 양쪽에서 접속 가능하도록 두 호스트 모두 등록.
    for (const host of ['localhost', '127.0.0.1']) {
      await conn.query(
        `CREATE USER IF NOT EXISTS '${appUser}'@'${host}' IDENTIFIED BY ${escPass}`,
      );
      await conn.query(
        `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${appUser}'@'${host}'`,
      );
    }
    await conn.query('FLUSH PRIVILEGES');

    console.log(`[db:init] 완료 ✔  데이터베이스 '${dbName}', 앱 계정 '${appUser}' 준비됨`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('[db:init] 실패:', err.message);
  process.exit(1);
});
