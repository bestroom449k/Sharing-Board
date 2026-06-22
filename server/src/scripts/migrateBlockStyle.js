// blocks 테이블에 link_style 컬럼을 추가하는 마이그레이션(멱등).
//   실행: node src/scripts/migrateBlockStyle.js
import { pool } from '../db.js';

const [cols] = await pool.query(
  `SELECT COLUMN_NAME FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blocks'`,
);
const have = new Set(cols.map((c) => c.COLUMN_NAME));

if (have.has('link_style')) {
  console.log('[migrateBlockStyle] link_style 컬럼이 이미 있습니다. 변경 없음.');
} else {
  await pool.query(
    `ALTER TABLE blocks
       ADD COLUMN link_style ENUM('thumbnail','simple','card','background')
       NOT NULL DEFAULT 'thumbnail' AFTER image_url`,
  );
  console.log('[migrateBlockStyle] blocks.link_style 추가됨');
}
await pool.end();
