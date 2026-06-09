// DB 중간 점검(읽기 전용) 스크립트.
//   실행: node src/scripts/inspectDb.js
//   - 테이블 행 수, 외래키/삭제규칙, 컬럼·인덱스 요약, 문자셋, 간단한 무결성 점검
import mysql from 'mysql2/promise';
import { config } from '../config.js';

const conn = await mysql.createConnection({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
});

const db = config.db.database;
const line = (s) => console.log(s);
const hr = () => console.log('-'.repeat(64));

// 1) 행 수
line('===== 1. 테이블별 행 수 =====');
for (const t of ['users', 'blocks', 'profile_view_daily', 'inquiries', 'sessions']) {
  const [r] = await conn.query(`SELECT COUNT(*) AS c FROM \`${t}\``);
  line(`${t.padEnd(20)} ${r[0].c} 행`);
}

// 2) 외래키
line('\n===== 2. 외래키(참조 무결성) =====');
const [fks] = await conn.query(
  `SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
   FROM information_schema.KEY_COLUMN_USAGE
   WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
   ORDER BY TABLE_NAME`,
  [db],
);
for (const f of fks) {
  line(`${f.TABLE_NAME}.${f.COLUMN_NAME} -> ${f.REFERENCED_TABLE_NAME}.${f.REFERENCED_COLUMN_NAME}`);
}

// 3) 삭제 규칙
line('\n===== 3. 삭제 규칙(ON DELETE) =====');
const [rc] = await conn.query(
  `SELECT TABLE_NAME, CONSTRAINT_NAME, DELETE_RULE
   FROM information_schema.REFERENTIAL_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = ?`,
  [db],
);
for (const r of rc) {
  line(`${r.TABLE_NAME.padEnd(20)} ON DELETE ${r.DELETE_RULE}`);
}

// 4) 인덱스 요약
line('\n===== 4. 인덱스 =====');
const [idx] = await conn.query(
  `SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
   FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = ?
   GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE
   ORDER BY TABLE_NAME, INDEX_NAME`,
  [db],
);
for (const i of idx) {
  const kind = i.NON_UNIQUE === 0 ? 'UNIQUE' : 'INDEX ';
  line(`${i.TABLE_NAME.padEnd(20)} ${kind} ${i.INDEX_NAME.padEnd(26)} (${i.cols})`);
}

// 5) 엔진/문자셋
line('\n===== 5. 엔진 / 문자셋 =====');
const [tbl] = await conn.query(
  `SELECT TABLE_NAME, ENGINE, TABLE_COLLATION
   FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`,
  [db],
);
for (const t of tbl) {
  line(`${t.TABLE_NAME.padEnd(20)} ${String(t.ENGINE).padEnd(8)} ${t.TABLE_COLLATION}`);
}

// 6) 간단 무결성 점검
line('\n===== 6. 무결성 점검 =====');
const checks = [
  ['고아 blocks(소유자 없음)', 'SELECT COUNT(*) c FROM blocks b LEFT JOIN users u ON b.user_id=u.id WHERE u.id IS NULL'],
  ['users.total_views 와 일별합 불일치', `SELECT COUNT(*) c FROM (
      SELECT u.id FROM users u
      LEFT JOIN (SELECT user_id, SUM(views) s FROM profile_view_daily GROUP BY user_id) p ON p.user_id=u.id
      WHERE u.total_views <> COALESCE(p.s,0)) x`],
  ['position 음수/중복 가능성(사용자별 중복)', `SELECT COUNT(*) c FROM (
      SELECT user_id, position, COUNT(*) n FROM blocks GROUP BY user_id, position HAVING n>1) y`],
  ['block_type별 분포', null],
];
for (const [label, sql] of checks) {
  if (!sql) continue;
  const [r] = await conn.query(sql);
  line(`${label.padEnd(36)} ${r[0].c}`);
}
const [dist] = await conn.query('SELECT block_type, COUNT(*) c FROM blocks GROUP BY block_type');
line('block_type 분포: ' + (dist.map((d) => `${d.block_type}=${d.c}`).join(', ') || '(없음)'));

hr();
line('점검 완료');
await conn.end();
