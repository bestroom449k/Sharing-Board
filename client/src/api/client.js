// API 호출 공통 래퍼.
// - 세션 쿠키 전송을 위해 credentials: 'include' 사용
// - 개발 환경에서는 Vite 프록시가 '/api' 를 백엔드(4000)로 전달
const BASE = '/api';

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  // 본문이 비어 있을 수 있으므로 파싱 실패는 빈 객체로 처리.
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // 서버가 내려준 한국어 에러 메시지를 그대로 사용한다.
    const err = new Error(data.error || '요청 처리 중 오류가 발생했습니다.');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // 인증
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // 블록
  getBlocks: () => request('/blocks'),
  createBlock: (payload) => request('/blocks', { method: 'POST', body: payload }),
  updateBlock: (id, payload) => request(`/blocks/${id}`, { method: 'PUT', body: payload }),
  deleteBlock: (id) => request(`/blocks/${id}`, { method: 'DELETE' }),
  reorderBlocks: (orderedIds) => request('/blocks/reorder', { method: 'PUT', body: { orderedIds } }),

  // 이미지 업로드(멀티파트). FormData 사용 시 Content-Type 은 브라우저가 설정하므로 직접 지정하지 않는다.
  uploadImage: async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch(`${BASE}/upload/image`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || '이미지 업로드에 실패했습니다.');
      err.status = res.status;
      throw err;
    }
    return data; // { url }
  },
};
