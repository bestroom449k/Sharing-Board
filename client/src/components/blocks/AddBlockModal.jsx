import { useState } from 'react';
import ImageUploader from './ImageUploader.jsx';

const BLOCK_TYPES = [
  {
    value: 'link',
    label: '링크',
    iconColor: '#ff6b35',
    iconBg: '#fff3ee',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    value: 'video',
    label: '동영상',
    iconColor: '#b45309',
    iconBg: '#fffbeb',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <rect x="2" y="7" width="20" height="14" rx="3" />
        <path d="M16 3H8" />
      </svg>
    ),
  },
  {
    value: 'text',
    label: '텍스트',
    iconColor: '#15803d',
    iconBg: '#f0fdf4',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    ),
  },
];

const EMPTY = { title: '', url: '', content: '', imageUrl: null };

export default function AddBlockModal({ onCreate, onClose, disabled }) {
  const [step, setStep] = useState('type');
  const [selectedType, setSelectedType] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const selectType = (value) => {
    setSelectedType(value);
    setForm(EMPTY);
    setError('');
    setStep('form');
  };

  const goBack = () => {
    setStep('type');
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if ((selectedType === 'link' || selectedType === 'video') && !form.url.trim()) {
      return setError(selectedType === 'link' ? '링크 URL을 입력해 주세요.' : '동영상 URL을 입력해 주세요.');
    }
    if (selectedType === 'text' && !form.content.trim()) {
      return setError('텍스트 내용을 입력해 주세요.');
    }

    setSubmitting(true);
    try {
      await onCreate({
        type: selectedType,
        title: form.title.trim() || null,
        url: form.url.trim() || null,
        content: selectedType === 'text' ? form.content : null,
        imageUrl: form.imageUrl || null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const typeInfo = BLOCK_TYPES.find((t) => t.value === selectedType);
  const charCount = form.content.length;

  const canSubmit = !submitting && !disabled && (
    selectedType === 'text' ? form.content.trim().length > 0 : form.url.trim().length > 0
  );

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-head">
          <div className="modal-head-left">
            {step === 'form' && (
              <button className="modal-back-btn" type="button" onClick={goBack} aria-label="뒤로">
                ←
              </button>
            )}
            <span className="modal-title">
              {step === 'type' ? '블록 선택하기' : `${typeInfo?.label} 블록`}
            </span>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        {step === 'type' && (
          <div className="modal-body">
            <p className="modal-subtitle">블록 타입</p>
            <div className="block-type-grid">
              {BLOCK_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className="block-type-cell"
                  onClick={() => selectType(t.value)}
                >
                  <div
                    className="block-type-icon-wrap"
                    style={{ background: t.iconBg, color: t.iconColor }}
                  >
                    {t.icon}
                  </div>
                  <span className="block-type-cell-label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'form' && (
          <form className="modal-body modal-form" onSubmit={submit}>
            {error && <div className="form-error">{error}</div>}

            {selectedType === 'link' && (
              <>
                <div className="mf-field">
                  <label className="mf-label">연결할 주소 <span className="mf-req">*</span></label>
                  <input
                    className="mf-input"
                    name="url"
                    type="url"
                    placeholder="연결하고 싶은 링크 주소를 입력해주세요"
                    value={form.url}
                    onChange={onChange}
                    autoFocus
                  />
                </div>
                <div className="mf-field">
                  <label className="mf-label">타이틀 <span className="mf-req">*</span></label>
                  <textarea
                    className="mf-textarea"
                    name="title"
                    placeholder="링크를 잘 나타낼 수 있는 이름으로 입력해주세요"
                    value={form.title}
                    onChange={onChange}
                    rows={3}
                  />
                </div>
                <div className="mf-field">
                  <label className="mf-label">이미지 <span className="mf-req">*</span></label>
                  <ImageUploader
                    value={form.imageUrl}
                    onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                  />
                </div>
              </>
            )}

            {selectedType === 'video' && (
              <div className="mf-field">
                <label className="mf-label">동영상 URL <span className="mf-req">*</span></label>
                <input
                  className="mf-input"
                  name="url"
                  type="url"
                  placeholder="유튜브, 틱톡 등 좋아하는 동영상을 공유하세요"
                  value={form.url}
                  onChange={onChange}
                  autoFocus
                />
              </div>
            )}

            {selectedType === 'text' && (
              <div className="mf-field">
                <div className="mf-field-head">
                  <label className="mf-label">내용 입력 <span className="mf-req">*</span></label>
                  <span className="mf-char-count">{charCount} / 500</span>
                </div>
                <textarea
                  className="mf-textarea mf-textarea--tall"
                  name="content"
                  placeholder="줄바꿈을 포함하여 원하는 내용을 자유롭게 입력해주세요."
                  value={form.content}
                  onChange={onChange}
                  maxLength={500}
                  rows={8}
                  autoFocus
                />
              </div>
            )}

            <button
              type="submit"
              className={`mf-submit ${canSubmit ? 'mf-submit--active' : ''}`}
              disabled={!canSubmit}
            >
              {submitting ? '추가 중…' : '추가 완료'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
