// 대시보드 카드형 메뉴('크리에이터 도구' 스타일).
// 각 카드를 누르면 해당 섹션(통계/디자인/링크/문의함)으로 이동한다.
const TOOLS = [
  { key: 'links', emoji: '🔗', title: '링크 관리하기', desc: '링크·텍스트·동영상 블록을 추가하고 정렬해요' },
  { key: 'design', emoji: '🎨', title: '디자인 설정', desc: '프로필 사진·소개글·테마색을 꾸며요' },
  { key: 'stats', emoji: '📊', title: '내 링크 분석 보기', desc: '조회수·인기 링크를 확인해요' },
  { key: 'inquiries', emoji: '✉️', title: '문의함', desc: '궁금한 점을 문의하고 내역을 확인해요' },
];

export default function DashboardMenu({ onSelect }) {
  return (
    <div className="cm-wrap">
      <h2 className="cm-title">크리에이터 도구</h2>
      <div className="cm-list">
        {TOOLS.map((t) => (
          <button key={t.key} type="button" className="cm-card" onClick={() => onSelect(t.key)}>
            <span className="cm-card-emoji">{t.emoji}</span>
            <span className="cm-card-text">
              <span className="cm-card-title">{t.title}</span>
              <span className="cm-card-desc">{t.desc}</span>
            </span>
            <span className="cm-card-arrow" aria-hidden>
              ›
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
