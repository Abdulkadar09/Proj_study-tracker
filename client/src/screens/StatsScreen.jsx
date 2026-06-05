import StatBar from '../components/StatBar';
import { getStartOfWeek, formatDuration } from '../utils';

export default function StatsScreen({ subjectStats, dailyTotals }) {
  const weekStart = getStartOfWeek();
  const weekDays = [];
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(weekStart + i * 24 * 60 * 60 * 1000);
    const label = date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    const dateKey = date.toISOString().slice(0, 10);
    const total = dailyTotals.find((item) => item.date === dateKey)?.total_seconds || 0;
    weekDays.push({ label, total });
  }

  const maxSeconds = Math.max(...subjectStats.map((subject) => subject.total_seconds), 0);
  const last7dayMap = dailyTotals.reduce((acc, day) => {
    day.subjects.forEach((item) => {
      acc[item.subject_id] = (acc[item.subject_id] || 0) + item.total_seconds;
    });
    return acc;
  }, {});

  const lowSubjectId = subjectStats.length
    ? subjectStats.reduce((current, next) => {
        const currentValue = last7dayMap[current.subject_id] ?? 0;
        const nextValue = last7dayMap[next.subject_id] ?? 0;
        return nextValue < currentValue ? next : current;
      }).subject_id
    : null;

  const sortedSubjects = [...subjectStats].sort((a, b) => b.total_seconds - a.total_seconds);

  return (
    <div>
      <div className="topbar">
        <h1 className="title">Statistics</h1>
      </div>

      <p className="section-title">Hours per subject — all time</p>
      <div className="list-panel">
        {sortedSubjects.length ? (
          sortedSubjects.map((subject) => (
            <StatBar
              key={subject.subject_id}
              subject={subject}
              maxSeconds={maxSeconds}
              low={lowSubjectId === subject.subject_id}
            />
          ))
        ) : (
          <p className="empty-state">No subjects recorded yet.</p>
        )}
      </div>

      <p className="section-title" style={{ marginTop: '24px' }}>Daily totals — this week</p>
      <div className="list-panel">
        {weekDays.map((day) => (
          <div className="daily-row" key={day.label}>
            <div>{day.label}</div>
            <div>{formatDuration(day.total)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
