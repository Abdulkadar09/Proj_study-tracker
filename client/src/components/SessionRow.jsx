import { formatDuration } from '../utils';

export default function SessionRow({ session }) {
  return (
    <div className="session-row">
      <div className="session-label">
        <span className="chip-dot" style={{ background: session.subject_color }} />
        <strong>{session.subject_name}</strong>
      </div>
      <div>{formatDuration(session.duration_seconds)}</div>
    </div>
  );
}
