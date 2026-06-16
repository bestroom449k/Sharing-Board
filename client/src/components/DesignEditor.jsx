// 디자인 편집기: 프로필 / 블록 / 배경 / 설정(한줄 공지) 4개 하위 탭.
// 편집 중 form 변경을 onDraft 로 부모에 전달해 휴대폰 미리보기에 실시간 반영하고,
// '저장하기'를 누르면 PATCH /api/auth/me 로 모든 디자인 필드를 한 번에 저장한다.
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import ImageUploader from './blocks/ImageUploader.jsx';

const PRESETS = [
  '#ffffff', '#f4f4f6', '#1c1c28', '#6d5efc', '#3B82F6',
  '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6',
];

const TABS = [
  { key: 'profile', label: '프로필' },
  { key: 'block', label: '블록' },
  { key: 'bg', label: '색상' },
  { key: 'settings', label: '설정' },
];

function Seg({ value, onChange, options }) {
  return (
    <div className="de-seg">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`de-seg-btn ${value === o.value ? 'is-active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ColorRow({ value, onChange, allowAuto }) {
  return (
    <div className="de-colors">
      {allowAuto && (
        <button
          type="button"
          className={`de-auto ${!value ? 'is-active' : ''}`}
          onClick={() => onChange(null)}
        >
          자동
        </button>
      )}
      {PRESETS.map((c) => (
        <button
          key={c}
          type="button"
          className={`de-color ${(value || '').toLowerCase() === c.toLowerCase() ? 'is-active' : ''}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          aria-label={c}
        />
      ))}
      <input
        type="color"
        className="de-color-picker"
        value={value || '#ffffff'}
        onChange={(e) => onChange(e.target.value)}
        aria-label="직접 색상 선택"
      />
    </div>
  );
}

export default function DesignEditor({ user, onDraft, onSaved }) {
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState(() => ({
    nickname: user.nickname || '',
    bio: user.bio || '',
    profileImageUrl: user.profileImageUrl || null,
    coverImageUrl: user.coverImageUrl || null,
    profileLayout: user.profileLayout || 'classic',
    profileAlign: user.profileAlign || 'center',
    profileFontSize: user.profileFontSize || 'normal',
    snsLinks: Array.isArray(user.snsLinks) ? user.snsLinks : [],
    blockShape: user.blockShape || 'round',
    blockAlign: user.blockAlign || 'left',
    blockColor: user.blockColor || '#ffffff',
    bgType: user.bgType || 'color',
    bgColor: user.bgColor || '#f4f4f6',
    bgImageUrl: user.bgImageUrl || null,
    noticeText: user.noticeText || '',
    noticeTextColor: user.noticeTextColor || '#1c1c28',
    noticeBgColor: user.noticeBgColor || '#ffffff',
    businessEnabled: !!user.businessEnabled,
    businessUrl: user.businessUrl || '',
    searchEnabled: !!user.searchEnabled,
    blockTextColor: user.blockTextColor || null,
    profileTextColor: user.profileTextColor || null,
    businessTextColor: user.businessTextColor || null,
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  // 미리보기 실시간 반영: 편집 중인 값을 user 위에 덮어 부모로 전달.
  useEffect(() => {
    onDraft({ ...user, ...form });
  }, [form, user, onDraft]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setOk(false);
  };

  const addSns = () => set('snsLinks', [...form.snsLinks, { platform: '', url: '' }]);
  const setSns = (i, key, value) =>
    set('snsLinks', form.snsLinks.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)));
  const removeSns = (i) => set('snsLinks', form.snsLinks.filter((_, idx) => idx !== i));

  const save = async () => {
    setError('');
    setOk(false);
    setBusy(true);
    try {
      const { user: updated } = await api.updateProfile({
        nickname: form.nickname.trim(),
        bio: form.bio,
        profileImageUrl: form.profileImageUrl,
        coverImageUrl: form.coverImageUrl,
        profileLayout: form.profileLayout,
        profileAlign: form.profileAlign,
        profileFontSize: form.profileFontSize,
        snsLinks: form.snsLinks.filter((s) => s.url && s.url.trim()),
        blockShape: form.blockShape,
        blockAlign: form.blockAlign,
        blockColor: form.blockColor,
        bgType: form.bgType,
        bgColor: form.bgColor,
        bgImageUrl: form.bgImageUrl,
        noticeText: form.noticeText,
        noticeTextColor: form.noticeTextColor,
        noticeBgColor: form.noticeBgColor,
        businessEnabled: form.businessEnabled,
        businessUrl: form.businessUrl,
        searchEnabled: form.searchEnabled,
        blockTextColor: form.blockTextColor,
        profileTextColor: form.profileTextColor,
        businessTextColor: form.businessTextColor,
      });
      onSaved(updated);
      setOk(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="de-wrap">
      <div className="de-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`de-tab ${tab === t.key ? 'is-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="form-error">{error}</div>}
      {ok && <div className="form-success">디자인이 저장되었어요.</div>}

      <div className="de-body">
        {tab === 'profile' && (
          <>
            <div className="de-field">
              <label className="de-label">레이아웃</label>
              <div className="de-layouts">
                {[
                  { v: 'classic', t: '기본' },
                  { v: 'cover', t: '커버' },
                  { v: 'overlap', t: '겹침' },
                  { v: 'hero', t: '히어로' },
                ].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    className={`de-layout ${form.profileLayout === o.v ? 'is-active' : ''}`}
                    onClick={() => set('profileLayout', o.v)}
                  >
                    <span className={`de-layout-ico de-layout-ico--${o.v}`} />
                    <span className="de-layout-label">{o.t}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="de-field">
              <label className="de-label">프로필 이미지</label>
              <ImageUploader value={form.profileImageUrl} onChange={(u) => set('profileImageUrl', u)} />
            </div>

            <div className="de-field">
              <label className="de-label">
                커버 이미지 <span className="de-hint">(커버·겹침 레이아웃에서 사용)</span>
              </label>
              <ImageUploader value={form.coverImageUrl} onChange={(u) => set('coverImageUrl', u)} />
            </div>

            <div className="de-field">
              <label className="de-label">타이틀</label>
              <input
                className="mf-input"
                value={form.nickname}
                maxLength={30}
                onChange={(e) => set('nickname', e.target.value)}
                placeholder="닉네임 (2~30자)"
              />
            </div>

            <div className="de-field">
              <label className="de-label">설명</label>
              <textarea
                className="mf-textarea"
                rows={3}
                value={form.bio}
                maxLength={500}
                onChange={(e) => set('bio', e.target.value)}
                placeholder="자기소개 (최대 500자)"
              />
            </div>

            <div className="de-field">
              <label className="de-label">SNS</label>
              {form.snsLinks.map((s, i) => (
                <div key={i} className="de-sns-row">
                  <input
                    className="mf-input"
                    placeholder="이름(예: 인스타)"
                    value={s.platform}
                    maxLength={20}
                    onChange={(e) => setSns(i, 'platform', e.target.value)}
                  />
                  <input
                    className="mf-input"
                    placeholder="https://..."
                    value={s.url}
                    onChange={(e) => setSns(i, 'url', e.target.value)}
                  />
                  <button type="button" className="de-sns-del" onClick={() => removeSns(i)} aria-label="삭제">
                    ×
                  </button>
                </div>
              ))}
              <button type="button" className="de-add-btn" onClick={addSns}>
                + SNS 추가
              </button>
            </div>

            <div className="de-field">
              <label className="de-label">정렬</label>
              <Seg
                value={form.profileAlign}
                onChange={(v) => set('profileAlign', v)}
                options={[{ value: 'left', label: '왼쪽' }, { value: 'center', label: '가운데' }]}
              />
            </div>

            <div className="de-field">
              <label className="de-label">프로필 글꼴 크기</label>
              <Seg
                value={form.profileFontSize}
                onChange={(v) => set('profileFontSize', v)}
                options={[
                  { value: 'small', label: '작게' },
                  { value: 'normal', label: '보통' },
                  { value: 'large', label: '크게' },
                ]}
              />
            </div>
          </>
        )}

        {tab === 'block' && (
          <>
            <div className="de-field">
              <label className="de-label">모양</label>
              <Seg
                value={form.blockShape}
                onChange={(v) => set('blockShape', v)}
                options={[
                  { value: 'square', label: '각지게' },
                  { value: 'round', label: '둥글게' },
                  { value: 'pill', label: '알약' },
                ]}
              />
            </div>
            <div className="de-field">
              <label className="de-label">정렬</label>
              <Seg
                value={form.blockAlign}
                onChange={(v) => set('blockAlign', v)}
                options={[{ value: 'left', label: '왼쪽' }, { value: 'center', label: '가운데' }]}
              />
            </div>
            <div className="de-field">
              <label className="de-label">블록 색상</label>
              <ColorRow value={form.blockColor} onChange={(v) => set('blockColor', v)} />
            </div>
          </>
        )}

        {tab === 'bg' && (
          <>
            <div className="de-field">
              <label className="de-label">배경 종류</label>
              <Seg
                value={form.bgType}
                onChange={(v) => set('bgType', v)}
                options={[{ value: 'color', label: '색상' }, { value: 'image', label: '이미지' }]}
              />
            </div>
            {form.bgType === 'color' ? (
              <div className="de-field">
                <label className="de-label">배경 색상</label>
                <ColorRow value={form.bgColor} onChange={(v) => set('bgColor', v)} />
              </div>
            ) : (
              <div className="de-field">
                <label className="de-label">배경 이미지</label>
                <ImageUploader value={form.bgImageUrl} onChange={(u) => set('bgImageUrl', u)} />
              </div>
            )}

            <div className="de-field">
              <label className="de-label">
                블록 글씨 색상 <span className="de-hint">(자동: 블록색 대비로 자동)</span>
              </label>
              <ColorRow allowAuto value={form.blockTextColor} onChange={(v) => set('blockTextColor', v)} />
            </div>
            <div className="de-field">
              <label className="de-label">
                프로필 글씨 색상 <span className="de-hint">(이름·소개글)</span>
              </label>
              <ColorRow allowAuto value={form.profileTextColor} onChange={(v) => set('profileTextColor', v)} />
            </div>
            <div className="de-field">
              <label className="de-label">비즈니스 문의 글씨 색상</label>
              <ColorRow allowAuto value={form.businessTextColor} onChange={(v) => set('businessTextColor', v)} />
            </div>
          </>
        )}

        {tab === 'settings' && (
          <>
            <div className="de-field">
              <label className="de-label">한줄 공지</label>
              <input
                className="mf-input"
                value={form.noticeText}
                maxLength={100}
                onChange={(e) => set('noticeText', e.target.value)}
                placeholder="예) 새 영상 업로드했어요!"
              />
            </div>
            <div className="de-field">
              <label className="de-label">글씨색</label>
              <ColorRow value={form.noticeTextColor} onChange={(v) => set('noticeTextColor', v)} />
            </div>
            <div className="de-field">
              <label className="de-label">배경색</label>
              <ColorRow value={form.noticeBgColor} onChange={(v) => set('noticeBgColor', v)} />
            </div>

            <div className="de-toggle-row">
              <div className="de-toggle-text">
                <div className="de-toggle-title">비즈니스 문의</div>
                <div className="de-hint">방문자에게 '비즈니스 제안' 버튼을 보여줍니다</div>
              </div>
              <button
                type="button"
                className={`de-switch ${form.businessEnabled ? 'is-on' : ''}`}
                onClick={() => set('businessEnabled', !form.businessEnabled)}
                aria-pressed={form.businessEnabled}
                aria-label="비즈니스 문의 사용"
              >
                <span />
              </button>
            </div>

            {form.businessEnabled && (
              <div className="de-field">
                <label className="de-label">
                  비즈니스 제안 링크 <span className="de-hint">(버튼을 누르면 이 주소로 이동)</span>
                </label>
                <input
                  className="mf-input"
                  type="url"
                  value={form.businessUrl}
                  onChange={(e) => set('businessUrl', e.target.value)}
                  placeholder="https://forms.gle/... 또는 mailto:you@email.com"
                />
              </div>
            )}

            <div className="de-toggle-row">
              <div className="de-toggle-text">
                <div className="de-toggle-title">검색 기능</div>
                <div className="de-hint">방문자가 블록(링크)을 검색할 수 있습니다</div>
              </div>
              <button
                type="button"
                className={`de-switch ${form.searchEnabled ? 'is-on' : ''}`}
                onClick={() => set('searchEnabled', !form.searchEnabled)}
                aria-pressed={form.searchEnabled}
                aria-label="검색 기능 사용"
              >
                <span />
              </button>
            </div>
          </>
        )}
      </div>

      <button className="btn btn-primary btn-block" disabled={busy} onClick={save}>
        {busy ? '저장 중…' : '저장하기'}
      </button>
    </div>
  );
}
