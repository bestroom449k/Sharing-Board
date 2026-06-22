// 운영용 DB 초기화: 관리형 MySQL(이미 DB가 만들어져 있고 앱 계정에 권한이 있는 환경, 예: Railway)에
// 테이블을 생성한다. schema.sql 에서 CREATE DATABASE / USE 구문을 제거하고 현재 연결된 DB 에 적용한다.
// CREATE TABLE IF NOT EXISTS 라서 여러 번 실행해도 안전(멱등). 세션 테이블은 앱 기동 시 자동 생성됨.
//   실행: npm run db:setup   (server/.env 또는 호스트 환경변수의 DB_* 사용)
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, '..', '..', 'sql', 'schema.sql');

const raw = await readFile(SCHEMA_PATH, 'utf8');
// 관리형 MySQL 에서는 DB 가 이미 있고 CREATE DATABASE 권한이 없을 수 있으므로 두 구문을 제거.
const sql = raw.replace(/CREATE\s+DATABASE[\s\S]*?;/i, '').replace(/USE\s+[^;]+;/i, '');

const conn = await mysql.createConnection({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  multipleStatements: true,
});

try {
  await conn.query(sql);
  console.log(`[db:setup] 스키마 적용 완료 (DB: ${config.db.database})`);
} finally {
  await conn.end();
}
