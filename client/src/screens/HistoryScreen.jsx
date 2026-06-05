import { useEffect, useMemo, useState } from 'react';
import { groupSessionsByDate } from '../utils';
import DayGroup from '../components/DayGroup';

function toLocalDateTime(date, time) {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export default function HistoryScreen({ sessions, subjects, onAddSession, onUpdateSession, onDeleteSession }) {
  const groups = groupSessionsByDate(sessions);
  const [showForm, setShowForm] = useState(false);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('09:00');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('30');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editHours, setEditHours] = useState('0');
  const [editMinutes, setEditMinutes] = useState('0');

  useEffect(() => {
    if (!subjectId && subjects.length) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  const canSubmit = subjectId && date && time && (Number(hours) > 0 || Number(minutes) > 0);

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }
    const start = toLocalDateTime(date, time);
    const durationSeconds = Math.max(0, Number(hours) * 3600 + Number(minutes) * 60);
    const endedAt = start.getTime() + durationSeconds * 1000;
    await onAddSession({
      subject_id: Number(subjectId),
      started_at: start.getTime(),
      ended_at: endedAt,
      duration_seconds: durationSeconds
    });
    setShowForm(false);
    setHours('0');
    setMinutes('30');
    setTime('09:00');
  };

  const handleStartEdit = (session) => {
    setEditingSessionId(session.session_ids?.[0] ?? session.id);
    const secs = session.duration_seconds;
    setEditHours(String(Math.floor(secs / 3600)));
    setEditMinutes(String(Math.floor((secs % 3600) / 60)));
  };

  const handleSaveEdit = async (session) => {
    const durationSeconds = Math.max(0, Number(editHours) * 3600 + Number(editMinutes) * 60);
    if (!session.count || session.count > 1 || durationSeconds <= 0) {
      return;
    }
    await onUpdateSession(session.session_ids[0], durationSeconds);
    setEditingSessionId(null);
  };

  return (
    <div>
      <div className="topbar">
        <h1 className="title">History</h1>
        <button type="button" className="primary-button" style={{ width: 'auto', padding: '10px 16px' }} onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? 'Close' : 'Add session'}
        </button>
      </div>

      {showForm && (
        <div className="list-panel" style={{ marginBottom: '18px' }}>
          <div className="form-row">
            <label>
              Subject
              <select value={subjectId ?? ''} onChange={(event) => setSubjectId(event.target.value)}>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label>
              Start time
              <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                Hours
                <input type="number" min="0" value={hours} onChange={(event) => setHours(event.target.value)} />
              </label>
              <label>
                Minutes
                <input type="number" min="0" max="59" value={minutes} onChange={(event) => setMinutes(event.target.value)} />
              </label>
            </div>
            <button type="button" className="primary-button" disabled={!canSubmit} onClick={handleSubmit}>
              Save session
            </button>
          </div>
        </div>
      )}

      {groups.length ? (
        <div className="list-panel">
          <div className="history-list">
            {groups.map((group) => (
              <DayGroup
                key={group.date}
                group={group}
                editingSessionId={editingSessionId}
                editHours={editHours}
                editMinutes={editMinutes}
                onStartEdit={handleStartEdit}
                onChangeHours={(value) => setEditHours(value)}
                onChangeMinutes={(value) => setEditMinutes(value)}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={() => setEditingSessionId(null)}
                onDeleteSession={onDeleteSession}
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="empty-state">No saved sessions yet. Start a session from the Home tab or add one manually.</p>
      )}
    </div>
  );
}
