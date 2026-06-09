import { useState } from 'react';
import ImageUploader from './ImageUploader.jsx';

// 블록 타입 정의(아이콘/라벨/필요 필드).
const TYPES = [
  { value: 'link', label: '링크', icon: '🔗' },
  { value: 'text', label: '텍스트', icon: '📝' },
  { value: 'video', label: '동영상', icon: '🎬' },
];

const EMPTY = { title: '', url: '', content: '', imageUrl: null };

// 새 블록 추가 폼. 선택한 타입에 따라 입력 필드가 달라진다.
export default function AddBlockForm({ onCreate, disabled }) {
  const [type, setType] = useState('link');
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    // 타입별 필수값 1차 검증(서버에서도 재검증).
    if ((type === 'link' || type === 'video') && !form.url.trim()) {
      return setError(type === 'link' ? '링크 URL을 입력해 주세요.' : '동영상 URL을 입력해 주세요.');
    }
    if (type === 'text' && !form.content.trim()) {
      return setError('텍스트 내용을 입력해 주세요.');
    }

    setSubmitting(true);
    try {
      await onCreate({
        type,
        title: form.title.trim() || null,
        url: form.url.trim() || null,
        content: type === 'text' ? form.content : null,
        imageUrl: form.imageUrl || null,
      });
      setForm(EMPTY); // 성공 시 폼 초기화
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="card add-block" onSubmit={submit}>
      <div className="add-block__types">
        {TYPES.map((t) => (
          <button
            type="button"
            key={t.value}
            className={`type-chip ${type === t.value ? 'is-active' : ''}`}
            onClick={() => {
              setType(t.value);
              setError('');
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {error && <div className="form-error">{error}</div>}

      {/* 제목은 모든 타입 공통(선택). */}
      <div className="field">
        <input
          name="title"
          placeholder={type === 'text' ? '제목 (선택)' : '버튼에 표시할 제목 (선택)'}
          value={form.title}
          onChange={onChange}
        />
      </div>

      {(type === 'link' || type === 'video') && (
        <div className="field">
          <input
            name="url"
            type="url"
            placeholder={type === 'link' ? 'https://example.com' : 'https://youtu.be/...'}
            value={form.url}
            onChange={onChange}
          />
        </div>
      )}

      {type === 'text' && (
        <div className="field">
          <textarea
            name="content"
            rows={3}
            placeholder="표시할 텍스트를 입력하세요."
            value={form.content}
            onChange={onChange}
          />
        </div>
      )}

      {/* 모든 블록은 이미지 1장을 첨부할 수 있다. */}
      <ImageUploader
        value={form.imageUrl}
        onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
      />

      <button type="submit" className="btn btn-primary btn-block" disabled={submitting || disabled}>
        {disabled ? '블록이 가득 찼습니다 (최대 200개)' : submitting ? '추가 중…' : '+ 블록 추가'}
      </button>
    </form>
  );
}
