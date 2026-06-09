// 서버 진입점. DB 연결을 확인한 뒤 HTTP 서버를 기동한다.
import { createApp } from './app.js';
import { config } from './config.js';
import { assertDbConnection } from './db.js';

async function start() {
  try {
    // 잘못된 DB 설정으로 서버가 절반만 동작하는 상황을 막기 위해 기동 전 연결을 점검한다.
    await assertDbConnection();
    console.log('[db] MySQL 연결 확인 완료');
  } catch (err) {
    console.error('[db] MySQL 연결 실패. .env 설정과 DB 초기화(npm run db:init)를 확인하세요.');
    console.error(err.message);
    process.exit(1);
  }

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[server] http://localhost:${config.port} (env=${config.nodeEnv})`);
  });
}

start();
