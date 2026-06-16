import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import AddBlockModal from '../components/blocks/AddBlockModal.jsx';
import BlockCard from '../components/blocks/BlockCard.jsx';
import PhonePreview from '../components/blocks/PhonePreview.jsx';
import StatsPanel from '../components/StatsPanel.jsx';
import DashboardMenu from '../components/DashboardMenu.jsx';
import DesignEditor from '../components/DesignEditor.jsx';
import InquiriesPanel from '../components/InquiriesPanel.jsx';

const SECTION_TITLES = {
  stats: '통계',
  design: '디자인',
  links: '링크 관리',
  inquiries: '문의함',
};

export default function DashboardPage() {
  const { user, updateUser } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [max, setMax] = useState(200);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // null = 카드 메뉴 화면, 그 외 = 해당 섹션(stats/design/links/inquiries)
  const [section, setSection] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  // 디자인 편집 중인 미리보기 초안(저장 전 실시간 반영용)
  const [designDraft, setDesignDraft] = useState(null);

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

  // 통계는 헤더 숫자 + 통계 섹션에서 쓰며, 섹션 진입 시 최신값으로 다시 불러온다.
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      setStats(await api.getStats());
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadStats();
  }, [load, loadStats]);

  const openSection = (key) => {
    setSection(key);
    setDesignDraft(null);
    if (key === 'stats') loadStats();
  };

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
  const todayViews = stats?.daily?.[stats.daily.length - 1]?.views ?? 0;
  const totalViews = stats?.totalViews ?? 0;

  // 링크(블록) 관리 화면 — 기존 디자인 탭 내용.
  const linksSection = (
    <div className="ipd-body">
      <div className="ipd-left">
        <div className="ipd-section-head">
          <span className="ipd-section-title">블록 리스트</span>
          <button className="ipd-help-badge" aria-label="도움말">?</button>
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

      <div className="ipd-right">
        <PhonePreview user={user} blocks={blocks} />
      </div>
    </div>
  );

  return (
    <div className="ipd-wrap">
      {/* Profile + Stats Header */}
      <div className="ipd-header">
        <div className="ipd-profile-row">
          {user.profileImageUrl ? (
            <img className="ipd-avatar-img" src={user.profileImageUrl} alt="" />
          ) : (
            <div className="ipd-avatar">{initial}</div>
          )}
          <div className="ipd-profile-info">
            <div className="ipd-username">{nickname}</div>
            <a className="ipd-link-url" href={publicUrl} target="_blank" rel="noreferrer">
              {`${window.location.host}/p/${user.shortLink}`}
            </a>
          </div>
        </div>
        <div className="ipd-stats-row">
          <div className="ipd-stat-item">
            <span className="ipd-stat-label">오늘</span>
            <span className="ipd-stat-val">{todayViews.toLocaleString()}</span>
          </div>
          <div className="ipd-stat-item">
            <span className="ipd-stat-label">전체 조회수</span>
            <span className="ipd-stat-val">{totalViews.toLocaleString()}</span>
          </div>
          <div className="ipd-stat-divider" />
          <div className="ipd-stat-item">
            <span className="ipd-stat-label">블록</span>
            <span className="ipd-stat-val">{blocks.length}</span>
          </div>
        </div>
      </div>

      {/* 카드 메뉴 또는 선택한 섹션 */}
      {section === null ? (
        <div className="ipd-menu-area">
          <DashboardMenu onSelect={openSection} />
        </div>
      ) : (
        <div className="ipd-section-area">
          <div className="ipd-section-bar">
            <button className="ipd-back-btn" onClick={() => setSection(null)}>
              ← 도구
            </button>
            <h2 className="ipd-section-heading">{SECTION_TITLES[section]}</h2>
          </div>

          {section === 'stats' && <StatsPanel stats={stats} loading={statsLoading} />}

          {section === 'design' && (
            <div className="ipd-design-grid">
              <DesignEditor
                user={user}
                onDraft={setDesignDraft}
                onSaved={(u) => {
                  updateUser(u);
                  setDesignDraft(null);
                }}
              />
              <div className="ipd-design-preview">
                <PhonePreview user={designDraft || user} blocks={blocks} />
              </div>
            </div>
          )}

          {section === 'links' && linksSection}

          {section === 'inquiries' && <InquiriesPanel />}
        </div>
      )}

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
