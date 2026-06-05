export function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function getStartOfDay(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

export function getStartOfWeek(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const offset = day === 0 ? 6 : day - 1;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - offset);
  return copy.getTime();
}

export function getWeekLabel(date = new Date()) {
  const start = getStartOfWeek(date);
  const end = start + 6 * 24 * 60 * 60 * 1000;
  const options = { day: 'numeric', month: 'short' };
  const startLabel = new Date(start).toLocaleDateString(undefined, options);
  const endLabel = new Date(end).toLocaleDateString(undefined, options);
  return `${startLabel} – ${endLabel}`;
}

export function groupSessionsByDate(sessions) {
  const groups = {};
  sessions.forEach((session) => {
    const date = new Date(session.started_at);
    const dateKey = date.toISOString().slice(0, 10);
    const dateLabel = date.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateKey,
        label: dateLabel,
        totalSeconds: 0,
        sessions: [],
        subjectMap: {}
      };
    }
    const group = groups[dateKey];
    const subjectKey = session.subject_id;
    if (group.subjectMap[subjectKey]) {
      const existing = group.subjectMap[subjectKey];
      existing.duration_seconds += session.duration_seconds;
      existing.count += 1;
      existing.session_ids.push(session.id);
    } else {
      group.subjectMap[subjectKey] = {
        id: session.id,
        subject_id: session.subject_id,
        subject_name: session.subject_name,
        subject_color: session.subject_color,
        duration_seconds: session.duration_seconds,
        count: 1,
        session_ids: [session.id]
      };
      group.sessions.push(group.subjectMap[subjectKey]);
    }
    group.totalSeconds += session.duration_seconds;
  });
  return Object.values(groups)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((group) => ({
      date: group.date,
      label: group.label,
      totalSeconds: group.totalSeconds,
      sessions: group.sessions
    }));
}

export function getNeglectedSubject(subjectStats, last7daysMap) {
  if (!subjectStats.length) {
    return null;
  }
  let lowest = subjectStats[0];
  subjectStats.forEach((subject) => {
    const last7 = last7daysMap[subject.subject_id] ?? 0;
    const lowestLast7 = last7daysMap[lowest.subject_id] ?? 0;
    if (last7 < lowestLast7) {
      lowest = subject;
    }
  });
  return lowest.subject_id;
}
