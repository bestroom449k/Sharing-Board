import ProfileView from '../ProfileView.jsx';
import NoticeBar from '../NoticeBar.jsx';

// 대시보드 우측 휴대폰 미리보기. 배경(색/이미지)을 적용하고 ProfileView 를 그대로 렌더한다.
// 한줄 공지가 있으면 INPOCK 위치(맨 위 바)에 흐르는 공지 마퀴를 표시한다.
export default function PhonePreview({ user, blocks }) {
  const activeBlocks = blocks.filter((b) => b.isActive !== false);

  const bgStyle =
    user.bgType === 'image' && user.bgImageUrl
      ? { backgroundImage: `url(${user.bgImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: user.bgColor || '#f7f7fa' };

  return (
    <div className="phone-frame">
      <div className="phone-screen" style={bgStyle}>
        {user.noticeText ? (
          <NoticeBar text={user.noticeText} textColor={user.noticeTextColor} bgColor={user.noticeBgColor} />
        ) : (
          <div className="phone-topbar phone-topbar--overlay">
            <span className="phone-brand">INPOCK</span>
          </div>
        )}
        <div className="phone-scroll">
          <ProfileView profile={user} blocks={activeBlocks} />
        </div>
        <div className="phone-bottom-bar" />
      </div>
    </div>
  );
}
