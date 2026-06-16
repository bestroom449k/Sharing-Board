// 디자인 설정이 적용된 프로필 화면(공용).
// 대시보드 휴대폰 미리보기(PhonePreview)와 공개 페이지(PublicProfilePage)가 동일하게 사용한다.
// props: profile(디자인 필드 포함), blocks, onBlockClick(선택, 링크 클릭 트래킹)
import { useState } from 'react';

const SHAPE_RADIUS = { square: '8px', round: '14px', pill: '999px' };
const FONT_SCALE = { small: 0.9, normal: 1, large: 1.15 };

// 배경색 밝기에 따라 읽기 쉬운 글자색(어두운/밝은) 선택.
function readableText(hex, fallback = '#1c1c28') {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return fallback;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? '#1c1c28' : '#ffffff';
}

export default function ProfileView({ profile, blocks, onBlockClick }) {
  const theme = profile.themeColor || '#6d5efc';
  const nickname = profile.nickname || profile.shortLink || 'user';
  const initial = nickname[0].toUpperCase();

  const align = profile.profileAlign === 'left' ? 'left' : 'center';
  const fontScale = FONT_SCALE[profile.profileFontSize] || 1;
  const layout = profile.profileLayout || 'classic';

  const radius = SHAPE_RADIUS[profile.blockShape] || '14px';
  const blockAlign = profile.blockAlign === 'center' ? 'center' : 'left';
  const blockColor = profile.blockColor || '#ffffff';
  // 글씨 색상: 사용자가 지정하면 그 값, 없으면(NULL) 배경 대비로 자동 결정.
  const blockText = profile.blockTextColor || readableText(blockColor);

  const pageText =
    profile.profileTextColor || (profile.bgType === 'color' ? readableText(profile.bgColor) : '#1c1c28');
  const bizColor = profile.businessTextColor || theme;
  const sns = Array.isArray(profile.snsLinks) ? profile.snsLinks : [];

  // 검색 기능: 켜져 있고 검색어가 있으면 제목/URL/내용으로 블록을 거른다.
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shownBlocks =
    profile.searchEnabled && q
      ? blocks.filter((b) => [b.title, b.url, b.content].some((f) => (f || '').toLowerCase().includes(q)))
      : blocks;

  const avatar = profile.profileImageUrl ? (
    <img className="pv-avatar-img" src={profile.profileImageUrl} alt="" />
  ) : (
    <div className="pv-avatar" style={{ background: theme }}>
      {initial}
    </div>
  );

  const cover = profile.coverImageUrl ? (
    <div className="pv-cover" style={{ backgroundImage: `url(${profile.coverImageUrl})` }} />
  ) : (
    <div className="pv-cover pv-cover--empty" />
  );

  return (
    <div
      className={`pv-root pv-align-${align}`}
      style={{ '--pv-theme': theme, fontSize: `${fontScale}em`, color: pageText }}
    >
      <div className={`pv-profile pv-layout-${layout}`}>
        {layout === 'cover' && cover}
        {layout === 'overlap' && (
          <div className="pv-overlap">
            {cover}
            <div className="pv-overlap-avatar">{avatar}</div>
          </div>
        )}
        {layout === 'hero' && <div className="pv-hero">{avatar}</div>}
        {layout === 'classic' && <div className="pv-classic-avatar">{avatar}</div>}

        <div className="pv-meta">
          <div className="pv-name">{nickname}</div>
          {profile.bio && <div className="pv-bio">{profile.bio}</div>}
          {sns.length > 0 && (
            <div className="pv-sns">
              {sns.map((s, i) => (
                <a
                  key={i}
                  className="pv-sns-link"
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ borderColor: theme, color: theme }}
                >
                  {s.platform || '🔗'}
                </a>
              ))}
            </div>
          )}
          {profile.businessEnabled &&
            (profile.businessUrl ? (
              <a
                href={profile.businessUrl}
                target="_blank"
                rel="noreferrer"
                className="pv-biz-btn"
                style={{ borderColor: bizColor, color: bizColor }}
              >
                ✉ 비즈니스 제안
              </a>
            ) : (
              <span className="pv-biz-btn" style={{ borderColor: bizColor, color: bizColor }}>
                ✉ 비즈니스 제안
              </span>
            ))}
        </div>
      </div>

      {profile.searchEnabled && (
        <input
          className="pv-search"
          type="search"
          placeholder="검색어를 입력해주세요"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {shownBlocks.length === 0 ? (
        <div className="pv-empty">
          {profile.searchEnabled && q ? '검색 결과가 없어요' : '아직 공개된 링크가 없어요 🐣'}
        </div>
      ) : (
        <div className={`pv-blocks pv-balign-${blockAlign}`}>
          {shownBlocks.map((b) => {
            if (b.type === 'text') {
              return (
                <div
                  key={b.id}
                  className="pv-block pv-block--text"
                  style={{ background: blockColor, borderRadius: radius, color: blockText }}
                >
                  {b.imageUrl && <img className="pv-block-img" src={b.imageUrl} alt="" />}
                  {b.title && <div className="pv-block-title">{b.title}</div>}
                  {b.content && <div className="pv-block-text">{b.content}</div>}
                </div>
              );
            }
            return (
              <a
                key={b.id}
                className="pv-block pv-block--link"
                href={b.url}
                target="_blank"
                rel="noreferrer"
                style={{ background: blockColor, borderRadius: radius, color: blockText }}
                onClick={() => onBlockClick && onBlockClick(b)}
              >
                {b.imageUrl && <img className="pv-block-thumb" src={b.imageUrl} alt="" />}
                <span className="pv-block-label">{b.title || b.url}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
