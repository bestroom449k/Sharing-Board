import { useState } from 'react';
import ImageUploader from './ImageUploader.jsx';

const ICONS = { link: '🔗', text: '📝', video: '🎬' };
const TYPE_LABELS = { link: '링크', text: '텍스트', video: '동영상' };

// 블록 1개의 표시 + 인라인 편집 + 삭제 + 순서 이동.
export default function BlockCard({ block, index, isFirst, isLast, onUpdate, onDelete, onMove }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: block.title ?? '',
    url: block.url ?? '',
    content: block.content ?? '',
    imageUrl: block.imageUrl ?? null,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async () => {
    setError('');
    setBusy(true);
    try {
      // 타입별로 의미 있는 필드만 서버에 보낸다. 이미지는 모든 타입 공통.
      const payload = { title: form.title.trim() || null, imageUrl: form.imageUrl ?? null };
      if (block.type === 'link' || block.type === 'video') payload.url = form.url.trim() || null;
      if (block.type === 'text') payload.content = form.content;
      await onUpdate(block.id, payload);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async () => {
    setBusy(true);
    try {
      await onUpdate(block.id, { isActive: !block.isActive });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('이 블록을 삭제할까요?')) return;
    setBusy(true);
    try {
      await onDelete(block.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`block-card ${block.isActive ? '' : 'is-hidden'}`}>
      {/* 순서 이동 화살표 */}
      <div className="block-move">
        <button type="button" disabled={isFirst || busy} onClick={() => onMove(index, -1)} aria-label="위로">
          ▲
        </button>
        <button type="button" disabled={isLast || busy} onClick={() => onMove(index, 1)} aria-label="아래로">
          ▼
        </button>
      </div>

      <div className="block-body">
        <div className="block-type">
          <span className="block-ico">{ICONS[block.type]}</span>
          <span className="block-type-label">{TYPE_LABELS[block.type]}</span>
          {!block.isActive && <span className="badge-off">숨김</span>}
          {block.type !== 'text' && (
            <span className="block-clicks">클릭 {block.clickCount ?? 0}</span>
          )}
        </div>

        {editing ? (
          <div className="block-edit">
            {error && <div className="form-error">{error}</div>}
            <input
              name="title"
              placeholder="제목"
              value={form.title}
              onChange={onChange}
            />
            {(block.type === 'link' || block.type === 'video') && (
              <input name="url" type="url" placeholder="URL" value={form.url} onChange={onChange} />
            )}
            {block.type === 'text' && (
              <textarea name="content" rows={3} value={form.content} onChange={onChange} />
            )}
            <ImageUploader
              value={form.imageUrl}
              onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
            />
            <div className="block-edit-actions">
              <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>
                저장
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy}
                onClick={() => {
                  setEditing(false);
                  setError('');
                  setForm({
                    title: block.title ?? '',
                    url: block.url ?? '',
                    content: block.content ?? '',
                    imageUrl: block.imageUrl ?? null,
                  });
                }}
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="block-view">
            {block.imageUrl && <img src={block.imageUrl} alt="" className="block-img" />}
            <div className="block-title">{block.title || <em>(제목 없음)</em>}</div>
            {block.type === 'text' ? (
              <div className="block-sub">{block.content}</div>
            ) : (
              <a className="block-sub link" href={block.url} target="_blank" rel="noreferrer">
                {block.url}
              </a>
            )}
          </div>
        )}
      </div>

      {!editing && (
        <div className="block-actions">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={toggleActive}>
            {block.isActive ? '숨기기' : '보이기'}
          </button>
          <button type="button" className="btn btn-outline" disabled={busy} onClick={() => setEditing(true)}>
            편집
          </button>
          <button type="button" className="btn btn-ghost danger" disabled={busy} onClick={remove}>
            삭제
          </button>
        </div>
      )}
    </div>
  );
}
