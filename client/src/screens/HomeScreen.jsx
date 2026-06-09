import SubjectChip from '../components/SubjectChip';
import { getWeekLabel } from '../utils';

export default function HomeScreen({
  subjects,
  selectedSubjectId,
  selectedSubject,
  onSelectSubject,
  onStartSession,
  summary,
  loading
}) {
  const weekLabel = getWeekLabel();
  return (
    <div className="home-screen">

      <div className="home-screen-content">
        <div className="card-row">
        <div className="card">
          <label>Today</label>
          <strong>{loading ? '—' : `${Math.floor(summary.today_seconds / 3600)}h ${Math.floor((summary.today_seconds % 3600) / 60)}m`}</strong>
        </div>
        <div className="card">
          <label>This week</label>
          <div className="card-note">{weekLabel}</div>
          <strong>{loading ? '—' : `${Math.floor(summary.week_seconds / 3600)}h ${Math.floor((summary.week_seconds % 3600) / 60)}m`}</strong>
        </div>
      </div>

      <div className="selection-area">
        <p className="section-title">Select subject</p>
        <div className="chip-list">
          {subjects.length ? (
            subjects.map((subject) => (
              <SubjectChip
                key={subject.id}
                subject={subject}
                selected={subject.id === selectedSubjectId}
                onSelect={onSelectSubject}
              />
            ))
          ) : (
            <p className="cards-none">No subjects yet. Add one on the Subjects tab.</p>
          )}
        </div>
      </div>

      <button
        type="button"
        className="primary-button"
        disabled={!selectedSubject}
        onClick={onStartSession}
      >
        ▶ Start session
      </button>
      </div>
    </div>
  );
}
