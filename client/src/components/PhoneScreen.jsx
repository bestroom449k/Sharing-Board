import ProfileView from './ProfileView.jsx';
import NoticeBar from './NoticeBar.jsx';

// 휴대폰 프레임 + 화면(공용). 대시보드 미리보기와 공개 페이지가 '똑같은 모습'으로 렌더되도록
// 프레임/배경/공지바/스크롤 구조를 한곳에 둔다.
//   profile     : 프로필 + 디자인 필드
//   blocks      : 블록 목록(isActive!==false 만 표시)
//   onBlockClick: (선택) 링크 클릭 트래킹
//   className   : 프레임 변형(예: 'phone-frame--live' = 공개 페이지용 큰 사이즈)
export default function PhoneScreen({ profile, blocks, onBlockClick, className = '' }) {
  const activeBlocks = blocks.filter((b) => b.isActive !== false);

  const bgStyle =
    profile.bgType === 'image' && profile.bgImageUrl
      ? { backgroundImage: `url(${profile.bgImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: profile.bgColor || '#f7f7fa' };

  return (
    <div className={`phone-frame ${className}`}>
      <div className="phone-screen" style={bgStyle}>
        {profile.noticeText ? (
          <NoticeBar text={profile.noticeText} textColor={profile.noticeTextColor} bgColor={profile.noticeBgColor} />
        ) : (
          <div className="phone-topbar phone-topbar--overlay">
            <span className="phone-brand">INPOCK</span>
          </div>
        )}
        <div className="phone-scroll">
          <ProfileView profile={profile} blocks={activeBlocks} onBlockClick={onBlockClick} />
        </div>
        <div className="phone-bottom-bar" />
      </div>
    </div>
  );
}
