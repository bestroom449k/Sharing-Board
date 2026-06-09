export default function PhonePreview({ user, blocks }) {
  const nickname = user.nickname || user.shortLink || 'user';
  const activeBlocks = blocks.filter((b) => b.isActive !== false);

  return (
    <div className="phone-frame">
      <div className="phone-screen">
        {/* Status bar area */}
        <div className="phone-topbar">
          <button className="phone-icon-btn" aria-label="공유">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
          <span className="phone-brand">INPOCK</span>
          <button className="phone-icon-btn" aria-label="알림">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
        </div>

        <div className="phone-content">
          <p className="phone-username">{nickname}</p>
          <button className="phone-biz-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            비즈니스 제안
          </button>

          {activeBlocks.length === 0 ? (
            <div className="phone-empty-card">
              <span className="phone-empty-emoji">🐣</span>
              <p className="phone-empty-msg">
                지금은 공개된 링크가 없지만…
              </p>
              <p className="phone-empty-sub">
                <span className="phone-subscribe-text">소식받기 버튼</span>을 눌러주세요
              </p>
              <p className="phone-empty-sub">새로운 링크가 생기면 알려드릴게요</p>
            </div>
          ) : (
            <div className="phone-blocks">
              {activeBlocks.map((b) => (
                <div key={b.id} className="phone-block-item">
                  {b.imageUrl && (
                    <img src={b.imageUrl} alt="" className="phone-block-thumb" />
                  )}
                  <div className="phone-block-text">
                    <div className="phone-block-title">
                      {b.title || b.url || '(내용 없음)'}
                    </div>
                    {b.type === 'text' && b.content && (
                      <div className="phone-block-sub">{b.content}</div>
                    )}
                    {(b.type === 'link' || b.type === 'video') && b.url && (
                      <div className="phone-block-url">{b.url}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom scroll indicator */}
        <div className="phone-bottom-bar" />
      </div>
    </div>
  );
}
