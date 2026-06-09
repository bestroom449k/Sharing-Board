import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 개발 서버 설정.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // '/api' 요청을 Express 백엔드(4000)로 프록시한다.
      // 브라우저 입장에서는 동일 출처(5173)로 보이므로 세션 쿠키가 그대로 유지되어
      // CORS/SameSite 쿠키 문제를 피할 수 있다.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
