// 디자인(프로필) 편집 패널: 프로필 이미지 / 닉네임 / 소개글 / 테마색.
// 저장 시 PATCH /api/auth/me 호출 후, 갱신된 user 를 전역 상태에 반영한다.
import { useState } from 'react';
import { api } from '../api/client.js';
import ImageUploader from './blocks/ImageUploader.jsx';

const PRESET_COLORS = [
  '#6d5efc', '#3B82F6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#14b8a6', '#1c1c28',
];

export default function ProfileEditor({ user, onSaved }) {
  const [form, setForm] = useState({
    nickname: user.nickname || '',
    bio: user.bio || '',
    themeColor: user.themeColor || '#6d5efc',
    profileImageUrl: user.profileImageUrl || null,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setOk(false);
  };

  const save = async () => {
    setError('');
    setOk(false);
    setBusy(true);
    try {
      const { user: updated } = await api.updateProfile({
        nickname: form.nickname.trim(),
        bio: form.bio,
        themeColor: form.themeColor,
        profileImageUrl: form.profileImageUrl,
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
    <div className="pe-wrap">
      {error && <div className="form-error">{error}</div>}
      {ok && <div className="form-success">프로필이 저장되었어요.</div>}

      <div className="pe-field">
        <label className="pe-label">프로필 이미지</label>
        <ImageUploader value={form.profileImageUrl} onChange={(url) => set('profileImageUrl', url)} />
      </div>

      <div className="pe-field">
        <label className="pe-label">닉네임</label>
        <input
          className="mf-input"
          value={form.nickname}
          maxLength={30}
          onChange={(e) => set('nickname', e.target.value)}
          placeholder="닉네임 (2~30자)"
        />
      </div>

      <div className="pe-field">
        <label className="pe-label">소개글</label>
        <textarea
          className="mf-textarea"
          rows={3}
          value={form.bio}
          maxLength={500}
          onChange={(e) => set('bio', e.target.value)}
          placeholder="자기소개를 입력해 주세요 (최대 500자)"
        />
      </div>

      <div className="pe-field">
        <label className="pe-label">테마 색상</label>
        <div className="pe-colors">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`pe-color ${form.themeColor.toLowerCase() === c.toLowerCase() ? 'is-active' : ''}`}
              style={{ background: c }}
              onClick={() => set('themeColor', c)}
              aria-label={c}
            />
          ))}
          <input
            type="color"
            className="pe-color-picker"
            value={form.themeColor}
            onChange={(e) => set('themeColor', e.target.value)}
            aria-label="직접 색상 선택"
          />
        </div>
      </div>

      <button className="btn btn-primary btn-block" disabled={busy} onClick={save}>
        {busy ? '저장 중…' : '저장하기'}
      </button>
    </div>
  );
}
