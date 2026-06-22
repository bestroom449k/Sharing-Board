import PhoneScreen from '../PhoneScreen.jsx';

// 대시보드 우측 휴대폰 미리보기. 공개 페이지와 동일한 PhoneScreen 을 사용한다.
export default function PhonePreview({ user, blocks }) {
  return <PhoneScreen profile={user} blocks={blocks} />;
}
