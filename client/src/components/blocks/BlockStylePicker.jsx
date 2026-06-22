// 링크/동영상 블록 표시 스타일 선택기(썸네일/심플/카드/배경).
// 각 옵션은 CSS로 그린 미니 미리보기 아이콘을 가진다.
const STYLES = [
  { value: 'thumbnail', label: '썸네일' },
  { value: 'simple', label: '심플' },
  { value: 'card', label: '카드' },
  { value: 'background', label: '배경' },
];

export default function BlockStylePicker({ value, onChange }) {
  return (
    <div className="bsp-grid">
      {STYLES.map((s) => (
        <button
          key={s.value}
          type="button"
          className={`bsp-cell ${value === s.value ? 'is-active' : ''}`}
          onClick={() => onChange(s.value)}
        >
          <span className={`bsp-ico bsp-ico--${s.value}`} aria-hidden />
          <span className="bsp-label">{s.label}</span>
        </button>
      ))}
    </div>
  );
}
