// 디자인 설정 컬럼을 기존 users 테이블에 추가하는 마이그레이션(멱등).
//   실행: node src/scripts/migrateDesign.js
// 이미 있는 컬럼은 건너뛰고 없는 것만 ADD COLUMN 한다(MySQL 8 은 ADD COLUMN IF NOT EXISTS 미지원).
import { pool } from '../db.js';

const COLUMNS = [
  ['cover_image_url', 'VARCHAR(512) NULL'],
  ['profile_layout', "VARCHAR(20) NOT NULL DEFAULT 'classic'"],
  ['profile_align', "ENUM('left','center') NOT NULL DEFAULT 'center'"],
  ['profile_font_size', "ENUM('small','normal','large') NOT NULL DEFAULT 'normal'"],
  ['sns_links', 'JSON NULL'],
  ['block_shape', "ENUM('square','round','pill') NOT NULL DEFAULT 'round'"],
  ['block_align', "ENUM('left','center') NOT NULL DEFAULT 'left'"],
  ['block_color', "CHAR(7) NOT NULL DEFAULT '#FFFFFF'"],
  ['bg_type', "ENUM('color','image') NOT NULL DEFAULT 'color'"],
  ['bg_color', "CHAR(7) NOT NULL DEFAULT '#F4F4F6'"],
  ['bg_image_url', 'VARCHAR(512) NULL'],
  ['notice_text', 'VARCHAR(100) NULL'],
  ['notice_text_color', "CHAR(7) NOT NULL DEFAULT '#1C1C28'"],
  ['notice_bg_color', "CHAR(7) NOT NULL DEFAULT '#FFFFFF'"],
  ['business_enabled', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['business_url', 'VARCHAR(2048) NULL'],
  ['search_enabled', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['block_text_color', 'CHAR(7) NULL'],
  ['profile_text_color', 'CHAR(7) NULL'],
  ['business_text_color', 'CHAR(7) NULL'],
];

const [existing] = await pool.query(
  `SELECT COLUMN_NAME FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`,
);
const have = new Set(existing.map((r) => r.COLUMN_NAME));
const toAdd = COLUMNS.filter(([name]) => !have.has(name));

if (toAdd.length === 0) {
  console.log('[migrateDesign] 이미 모든 디자인 컬럼이 있습니다. 변경 없음.');
} else {
  const clause = toAdd.map(([name, ddl]) => `ADD COLUMN ${name} ${ddl}`).join(', ');
  await pool.query(`ALTER TABLE users ${clause}`);
  console.log('[migrateDesign] 추가된 컬럼:', toAdd.map(([n]) => n).join(', '));
}
await pool.end();
