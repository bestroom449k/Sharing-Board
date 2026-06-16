// 한줄 공지 바(마퀴). 휴대폰의 INPOCK 위치(맨 위)에 표시되며 좌우로 계속 흐른다.
// 끊김 없는 무한 스크롤을 위해 같은 문구를 두 벌 두고 트랙을 -50% 만큼 이동시킨다.
export default function NoticeBar({ text, textColor, bgColor }) {
  if (!text) return null;
  return (
    <div className="notice-bar" style={{ background: bgColor || '#fff', color: textColor || '#1c1c28' }}>
      <div className="notice-track">
        <span className="notice-item">{text}</span>
        <span className="notice-item" aria-hidden>
          {text}
        </span>
      </div>
    </div>
  );
}
