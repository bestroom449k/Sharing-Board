// 문의함 패널: 문의 작성 폼 + 내 문의 내역 목록.
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

function fmtDate(iso) {
  if (!iso) return '';
  // 'YYYY-MM-DD HH:MM' 형태로 표기(서버는 dateStrings 로 문자열을 준다).
  return String(iso).slice(0, 16).replace('T', ' ');
}

export default function InquiriesPanel() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    api
      .getInquiries()
      .then((d) => setList(d.inquiries))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setOk(false);
    setBusy(true);
    try {
      const { inquiry } = await api.createInquiry({
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setList((prev) => [inquiry, ...prev]);
      setForm({ subject: '', message: '' });
      setOk(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="iq-wrap">
      <form className="iq-form" onSubmit={submit}>
        <h3 className="iq-section-title">문의하기</h3>
        {error && <div className="form-error">{error}</div>}
        {ok && <div className="form-success">문의가 접수되었어요. 빠르게 답변드릴게요.</div>}
        <input
          className="mf-input"
          placeholder="제목 (2~150자)"
          value={form.subject}
          maxLength={150}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
        />
        <textarea
          className="mf-textarea"
          rows={4}
          placeholder="문의 내용을 입력해 주세요"
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          style={{ marginTop: 10 }}
        />
        <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} disabled={busy}>
          {busy ? '보내는 중…' : '문의 보내기'}
        </button>
      </form>

      <div className="iq-list-section">
        <h3 className="iq-section-title">내 문의 내역</h3>
        {loading ? (
          <p className="iq-empty">불러오는 중…</p>
        ) : list.length === 0 ? (
          <p className="iq-empty">아직 문의 내역이 없어요.</p>
        ) : (
          <ul className="iq-list">
            {list.map((q) => (
              <li key={q.id} className="iq-item">
                <div className="iq-item-head">
                  <span className="iq-item-subject">{q.subject}</span>
                  <span className={`iq-badge ${q.status === 'closed' ? 'is-closed' : ''}`}>
                    {q.status === 'closed' ? '답변완료' : '접수됨'}
                  </span>
                </div>
                <p className="iq-item-msg">{q.message}</p>
                <span className="iq-item-date">{fmtDate(q.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
