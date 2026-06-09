// MySQL 8 커넥션 풀.
// 모든 쿼리는 prepared statement(? 자리표시자)로 실행한다(CLAUDE.md 규칙 4).
// 문자열 결합으로 쿼리를 만드는 것은 SQL Injection 의 직접 원인이므로 금지.
import mysql from 'mysql2/promise';
import { config } from './config.js';

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  // DATETIME 을 JS Date 가 아닌 문자열로 받아 타임존 변환으로 인한 혼선을 피한다.
  dateStrings: true,
  // 보안상 멀티 스테이트먼트는 비활성(기본값) 유지. 초기화 스크립트만 별도 연결에서 허용.
});

// 애플리케이션 시작 시 DB 연결을 한 번 점검한다.
export async function assertDbConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}
