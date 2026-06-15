import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';

// 공개 프로필 페이지 (/p/:shortLink). 로그인 없이 누구나 볼 수 있고,
// 열릴 때 서버가 조회수를 +1 한다. 링크 클릭 시 클릭수도 트래킹한다.
export default function PublicProfilePage() {
  const { shortLink } = useParams();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    api
      .getPublicProfile(shortLink)
      .then((res) => {
        if (!alive) return;
        setData(res);
        setStatus('ready');
      })
      .catch((err) => {
        if (!alive) return;
        setStatus(err.status === 404 ? 'notfound' : 'error');
      });
    return () => {
      alive = false;
    };
  }, [shortLink]);

  if (status === 'loading') return <div className="pp-state">불러오는 중…</div>;
  if (status === 'notfound') return <div className="pp-state">존재하지 않는 프로필입니다.</div>;
  if (status === 'error') return <div className="pp-state">프로필을 불러오지 못했습니다.</div>;

  const { profile, blocks } = data;
  const theme = profile.themeColor || '#6d5efc';
  const nickname = profile.nickname || profile.shortLink || 'user';
  const initial = nickname[0].toUpperCase();

  // 링크/동영상 클릭 시 클릭수 트래킹(fire-and-forget). 실패해도 이동은 그대로 진행.
  const handleClick = (block) => {
    api.trackClick(shortLink, block.id).catch(() => {});
  };

  return (
    <div className="pp-page">
      <div className="pp-card" style={{ '--pp-theme': theme }}>
        <div className="pp-header">
          {profile.profileImageUrl ? (
            <img className="pp-avatar-img" src={profile.profileImageUrl} alt="" />
          ) : (
            <div className="pp-avatar" style={{ background: theme }}>
              {initial}
            </div>
          )}
          <h1 className="pp-nickname">{nickname}</h1>
          {profile.bio && <p className="pp-bio">{profile.bio}</p>}
        </div>

        {blocks.length === 0 ? (
          <p className="pp-empty">아직 공개된 링크가 없어요 🐣</p>
        ) : (
          <div className="pp-blocks">
            {blocks.map((b) => {
              if (b.type === 'text') {
                return (
                  <div key={b.id} className="pp-block pp-block--text">
                    {b.imageUrl && <img src={b.imageUrl} alt="" className="pp-block-img" />}
                    {b.title && <div className="pp-block-title">{b.title}</div>}
                    {b.content && <div className="pp-block-content">{b.content}</div>}
                  </div>
                );
              }
              return (
                <a
                  key={b.id}
                  className="pp-block pp-block--link"
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => handleClick(b)}
                >
                  {b.imageUrl && <img src={b.imageUrl} alt="" className="pp-block-thumb" />}
                  <span className="pp-block-label">{b.title || b.url}</span>
                  <span className="pp-block-arrow" aria-hidden>
                    ↗
                  </span>
                </a>
              );
            })}
          </div>
        )}

        <div className="pp-foot">
          <span className="pp-foot-brand">Sharing Board</span>
        </div>
      </div>
    </div>
  );
}
