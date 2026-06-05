import { formatDuration } from '../utils';

export default function StatBar({ subject, maxSeconds, low }) {
  const width = maxSeconds ? Math.max((subject.total_seconds / maxSeconds) * 100, 6) : 6;
  return (
    <div className="stat-row">
      <div className="stat-label">
        <span className="chip-dot" style={{ background: subject.subject_color }} />
        <span>{subject.subject_name}</span>
      </div>
      <div style={{ flex: 1, margin: '0 12px' }}>
        <div className="bar-shell">
          <div className="bar-fill" style={{ width: `${width}%`, background: subject.subject_color }} />
        </div>
      </div>
      <div>{formatDuration(subject.total_seconds)} {low ? <span className="low-badge">low</span> : null}</div>
    </div>
  );
}
