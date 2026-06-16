import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import ProfileView from '../components/ProfileView.jsx';
import NoticeBar from '../components/NoticeBar.jsx';

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

  // 링크/동영상 클릭 시 클릭수 트래킹(fire-and-forget). 실패해도 이동은 그대로 진행.
  const handleClick = (block) => {
    api.trackClick(shortLink, block.id).catch(() => {});
  };

  const bgStyle =
    profile.bgType === 'image' && profile.bgImageUrl
      ? { backgroundImage: `url(${profile.bgImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: profile.bgColor || '#f4f4f6' };

  return (
    <div className="pp-page" style={bgStyle}>
      <NoticeBar text={profile.noticeText} textColor={profile.noticeTextColor} bgColor={profile.noticeBgColor} />
      <div className="pp-center">
        <div className="pp-col">
          <ProfileView profile={profile} blocks={blocks} onBlockClick={handleClick} />
          <div className="pp-foot">
            <span className="pp-foot-brand">Sharing Board</span>
          </div>
        </div>
      </div>
    </div>
  );
}
