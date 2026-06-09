-- =====================================================================
--  Sharing Board - 데이터베이스 스키마 (MySQL 8 전용)
--  - 모든 테이블 InnoDB / utf8mb4(한글·이모지 보존)
--  - 비밀번호는 password_hash(bcrypt)로만 저장하며 평문 저장 금지
-- =====================================================================

-- 데이터베이스 생성. utf8mb4_0900_ai_ci 는 MySQL 8 기본 콜레이션
CREATE DATABASE IF NOT EXISTS sharing_board
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE sharing_board;

-- ---------------------------------------------------------------------
-- users : 회원 + 공개 프로필 디자인 설정
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email             VARCHAR(254) NOT NULL,
  -- bcrypt 해시 전용 컬럼. 어떤 API 응답에도 포함하지 않는다(CLAUDE.md 규칙 3).
  password_hash     VARCHAR(255) NOT NULL,
  nickname          VARCHAR(30)  NOT NULL,
  -- 공개 프로필 URL(/p/{short_link})에 쓰이는 고유 식별자. 가입 시 자동 생성.
  short_link        VARCHAR(16)  NOT NULL,
  profile_image_url VARCHAR(512) NULL,
  bio               VARCHAR(500) NULL,                       -- 소개글
  theme_color       CHAR(7)      NOT NULL DEFAULT '#3B82F6', -- HEX 테마 색상
  -- 비정규화 누적 조회수. 공개 페이지 방문마다 +1 하여 통계 조회 비용을 낮춘다.
  total_views       BIGINT UNSIGNED NOT NULL DEFAULT 0,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- 이메일·닉네임·short_link 는 모두 고유. DB 레벨에서 중복을 최종 차단한다.
  UNIQUE KEY uq_users_email      (email),
  UNIQUE KEY uq_users_nickname   (nickname),
  UNIQUE KEY uq_users_short_link (short_link)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- blocks : 링크/텍스트/동영상 블록 (한 사용자당 최대 200개, 앱 로직에서 제한)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blocks (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  block_type  ENUM('link','text','video') NOT NULL,
  title       VARCHAR(100)  NULL,
  url         VARCHAR(2048) NULL,   -- link / video 타입에서 사용
  content     TEXT          NULL,   -- text 타입 본문
  image_url   VARCHAR(512)  NULL,   -- 블록 첨부 이미지(클라우드 스토리지 URL)
  position    INT NOT NULL DEFAULT 0, -- 대시보드에서의 표시 순서
  -- 비정규화 클릭수. '인기 링크 TOP 5' 집계를 단순 정렬로 처리하기 위함.
  click_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- (user_id, position) 인덱스로 소유자별 순서 정렬 조회를 빠르게 한다.
  KEY idx_blocks_user_position (user_id, position),
  -- 사용자 삭제 시 블록도 함께 삭제(CASCADE).
  CONSTRAINT fk_blocks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- profile_view_daily : 일별 조회수 집계 (최근 7일 차트용)
--   - 방문 1건마다 INSERT 하지 않고 (user_id, view_date) 단위로 누적 증가시켜
--     로우 수를 최소화한다(UPSERT).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profile_view_daily (
  user_id   BIGINT UNSIGNED NOT NULL,
  view_date DATE NOT NULL,
  views     BIGINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, view_date),
  CONSTRAINT fk_pvd_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- inquiries : 문의함 (서비스 오류·문의 접수)
--   - user_id NULL 허용: 비로그인 사용자도 문의 가능.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiries (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NULL,
  email      VARCHAR(254) NOT NULL,
  subject    VARCHAR(150) NOT NULL,
  message    TEXT NOT NULL,
  status     ENUM('open','closed') NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inquiries_user (user_id),
  -- 작성자 탈퇴 시 문의는 남기되 연결만 끊는다(SET NULL).
  CONSTRAINT fk_inquiries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 참고: 세션 저장 테이블(sessions)은 express-mysql-session 이 기동 시 자동 생성한다.
