// 대시보드 '통계' 탭 패널.
// - 요약 카드(전체/오늘/최근7일 조회수)
// - 최근 7일 일별 막대 차트(별도 차트 라이브러리 없이 CSS 막대로)
// - 인기 링크 TOP5(클릭수 기준)
function formatDay(iso) {
  const [, m, d] = iso.split('-');
  return `${Number(m)}/${Number(d)}`;
}

export default function StatsPanel({ stats, loading }) {
  if (loading) {
    return <div className="stats-loading">통계를 불러오는 중…</div>;
  }
  if (!stats) {
    return <div className="stats-loading">통계를 불러오지 못했습니다.</div>;
  }

  const recent7 = stats.daily.reduce((sum, d) => sum + d.views, 0);
  const today = stats.daily[stats.daily.length - 1]?.views ?? 0;
  // 막대 높이 비율 계산용 최댓값(최소 1로 0 나눗셈 방지).
  const maxViews = Math.max(1, ...stats.daily.map((d) => d.views));

  return (
    <div className="stats-panel">
      <div className="stats-cards">
        <div className="stats-card">
          <span className="stats-card-label">전체 조회수</span>
          <span className="stats-card-value">{stats.totalViews.toLocaleString()}</span>
        </div>
        <div className="stats-card">
          <span className="stats-card-label">오늘</span>
          <span className="stats-card-value">{today.toLocaleString()}</span>
        </div>
        <div className="stats-card">
          <span className="stats-card-label">최근 7일</span>
          <span className="stats-card-value">{recent7.toLocaleString()}</span>
        </div>
      </div>

      <div className="stats-section">
        <h3 className="stats-section-title">최근 7일 조회수</h3>
        <div className="stats-chart">
          {stats.daily.map((d) => (
            <div key={d.date} className="stats-bar-col">
              <div className="stats-bar-wrap">
                <div
                  className="stats-bar"
                  style={{ height: `${(d.views / maxViews) * 100}%` }}
                >
                  {d.views > 0 && <span className="stats-bar-val">{d.views}</span>}
                </div>
              </div>
              <span className="stats-bar-label">{formatDay(d.date)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-section">
        <h3 className="stats-section-title">인기 링크 TOP 5</h3>
        {stats.topLinks.length === 0 ? (
          <p className="stats-empty">아직 클릭된 링크가 없어요.</p>
        ) : (
          <ol className="stats-top-list">
            {stats.topLinks.map((b, i) => (
              <li key={b.id} className="stats-top-item">
                <span className="stats-top-rank">{i + 1}</span>
                <span className="stats-top-title">{b.title || b.url || '(제목 없음)'}</span>
                <span className="stats-top-clicks">{b.clickCount.toLocaleString()} 클릭</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
