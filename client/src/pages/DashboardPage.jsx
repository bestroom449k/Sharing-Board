import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import AddBlockModal from '../components/blocks/AddBlockModal.jsx';
import BlockCard from '../components/blocks/BlockCard.jsx';
import PhonePreview from '../components/blocks/PhonePreview.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [max, setMax] = useState(200);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('design');
  const [showModal, setShowModal] = useState(false);

  const publicUrl = `${window.location.origin}/p/${user.shortLink}`;

  const load = useCallback(async () => {
    try {
      const { blocks: list, max: limit } = await api.getBlocks();
      setBlocks(list);
      setMax(limit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (payload) => {
    const { block } = await api.createBlock(payload);
    setBlocks((prev) => [...prev, block]);
    setShowModal(false);
  };

  const handleUpdate = async (id, payload) => {
    const { block } = await api.updateBlock(id, payload);
    setBlocks((prev) => prev.map((b) => (b.id === id ? block : b)));
  };

  const handleDelete = async (id) => {
    await api.deleteBlock(id);
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleMove = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
    try {
      await api.reorderBlocks(next.map((b) => b.id));
    } catch (err) {
      setError(err.message);
      load();
    }
  };

  const nickname = user.nickname || user.shortLink || 'user';
  const initial = nickname[0].toUpperCase();

  return (
    <div className="ipd-wrap">
      {/* Profile + Stats Header */}
      <div className="ipd-header">
        <div className="ipd-profile-row">
          <div className="ipd-avatar">{initial}</div>
          <div className="ipd-profile-info">
            <div className="ipd-username">{nickname}</div>
            <a className="ipd-link-url" href={publicUrl} target="_blank" rel="noreferrer">
              {`${window.location.host}/p/${user.shortLink}`}
            </a>
          </div>
        </div>
        <div className="ipd-stats-row">
          <div className="ipd-stat-item">
            <span className="ipd-stat-label">실시간</span>
            <span className="ipd-stat-val">0</span>
          </div>
          <div className="ipd-stat-item">
            <span className="ipd-stat-label">오늘</span>
            <span className="ipd-stat-val">0</span>
          </div>
          <div className="ipd-stat-item">
            <span className="ipd-stat-label">전체</span>
            <span className="ipd-stat-val">{blocks.length}</span>
          </div>
          <div className="ipd-stat-divider" />
          <div className="ipd-stat-item">
            <span className="ipd-stat-label">소식받기</span>
            <span className="ipd-stat-val">0</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="ipd-tabs">
        <button
          className={`ipd-tab ${activeTab === 'stats' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          통계
        </button>
        <button
          className={`ipd-tab ${activeTab === 'design' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('design')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          디자인
        </button>
      </div>

      {/* Main Content */}
      <div className="ipd-body">
        {/* Left: block list */}
        <div className="ipd-left">
          <div className="ipd-section-head">
            <span className="ipd-section-title">블록 리스트</span>
            <button className="ipd-help-badge" aria-label="도움말">?</button>
            <button className="ipd-archive-btn">보관함</button>
          </div>

          {error && <div className="form-error" style={{ margin: '0 0 12px' }}>{error}</div>}

          <div className="ipd-block-area">
            {loading ? (
              <div className="ipd-empty-state">
                <p className="ipd-empty-text">블록을 불러오는 중…</p>
              </div>
            ) : blocks.length === 0 ? (
              <div className="ipd-empty-state">
                <p className="ipd-empty-text">표시할 블록이 없습니다.</p>
                <p className="ipd-empty-sub">
                  + 버튼을 눌러서<br />블록을 추가해보세요!
                </p>
                <div className="ipd-empty-hint">
                  <span className="ipd-empty-preview-btn">미리보기</span>
                  <button className="ipd-fab-mini" onClick={() => setShowModal(true)} aria-label="블록 추가">
                    +
                  </button>
                </div>
              </div>
            ) : (
              <div className="block-list">
                {blocks.map((b, i) => (
                  <BlockCard
                    key={b.id}
                    block={b}
                    index={i}
                    isFirst={i === 0}
                    isLast={i === blocks.length - 1}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onMove={handleMove}
                  />
                ))}
              </div>
            )}
          </div>

          {/* FAB */}
          <div className="ipd-fab-row">
            <button
              className="ipd-fab"
              onClick={() => setShowModal(true)}
              disabled={blocks.length >= max}
              aria-label="블록 추가"
            >
              +
            </button>
          </div>
        </div>

        {/* Right: phone preview */}
        <div className="ipd-right">
          <PhonePreview user={user} blocks={blocks} />
        </div>
      </div>

      {showModal && (
        <AddBlockModal
          onCreate={handleCreate}
          onClose={() => setShowModal(false)}
          disabled={blocks.length >= max}
        />
      )}
    </div>
  );
}
