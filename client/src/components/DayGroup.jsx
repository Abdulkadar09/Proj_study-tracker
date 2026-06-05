import { formatDuration } from '../utils';

export default function DayGroup({
  group,
  editingSessionId,
  editHours,
  editMinutes,
  onStartEdit,
  onChangeHours,
  onChangeMinutes,
  onSaveEdit,
  onCancelEdit,
  onDeleteSession
}) {
  return (
    <div className="day-group">
      <span className="timeline-dot" />
      <div className="day-group-content">
        <div className="date-header">
          <span>{group.label || group.date}</span>
          <span className="date-subtotal">{formatDuration(group.totalSeconds)}</span>
        </div>
        {group.sessions.map((session) => {
          const sessionId = session.session_ids?.[0] ?? session.id;
          const isEditing = editingSessionId === sessionId;
          return (
            <div className="session-row" key={`${group.date}-${session.subject_id}`}>
              <div className="session-label">
                <span className="chip-dot" style={{ background: session.subject_color }} />
                <strong>{session.subject_name}</strong>
                {session.count > 1 ? (
                  <span style={{ color: '#7c7c92', fontSize: '0.85rem' }}>{session.count} sessions</span>
                ) : null}
              </div>
              {isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    min="0"
                    value={editHours}
                    onChange={(event) => onChangeHours(event.target.value)}
                    style={{ width: '60px', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px' }}
                  />
                  h
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={editMinutes}
                    onChange={(event) => onChangeMinutes(event.target.value)}
                    style={{ width: '60px', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px' }}
                  />
                  m
                  <button type="button" className="primary-button" style={{ width: 'auto', padding: '10px 14px' }} onClick={() => onSaveEdit(session)}>
                    Save
                  </button>
                  <button type="button" className="secondary-button" style={{ width: 'auto', padding: '10px 14px', background: '#f2f2f7', color: '#1b1b1f', border: '1px solid var(--border)' }} onClick={onCancelEdit}>
                    Cancel
                  </button>
                  <button type="button" className="secondary-button" style={{ width: 'auto', padding: '10px 14px', background: '#ffecec', color: '#a50f0f', border: '1px solid #f2dede' }} onClick={() => onDeleteSession(session)}>
                    Delete
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>{formatDuration(session.duration_seconds)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {session.count === 1 ? (
                      <button type="button" onClick={() => onStartEdit(session)} style={{ border: 'none', background: 'transparent', color: '#1b1b1f', fontSize: '0.95rem' }}>
                        Edit
                      </button>
                    ) : null}
                    <button type="button" className="secondary-button" style={{ width: 'auto', padding: '10px 14px', background: '#ffecec', color: '#a50f0f', border: '1px solid #f2dede' }} onClick={() => onDeleteSession(session)}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
